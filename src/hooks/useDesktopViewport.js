import { useLayoutEffect, useState } from 'react';

// Allow app content to scroll, but stop a gesture at its edge from pulling
// the desktop into Safari's page refresh or rubber-band scrolling.
export function canScrollWithin(target, desktop, deltaX, deltaY) {
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
  for (let node = target; node && node !== desktop; node = node.parentElement) {
    if (node.nodeType !== 1) continue;
    const style = window.getComputedStyle(node);
    const overflow = horizontal ? style.overflowX : style.overflowY;
    if (!/auto|scroll/.test(overflow)) continue;
    const position = horizontal ? node.scrollLeft : node.scrollTop;
    const extent = horizontal
      ? node.scrollWidth - node.clientWidth
      : node.scrollHeight - node.clientHeight;
    const delta = horizontal ? deltaX : deltaY;
    if (
      extent > 0 &&
      ((delta > 0 && position > 0) || (delta < 0 && position < extent - 1))
    )
      return true;
  }
  return false;
}

export default function useDesktopViewport(desktopRef, workAreaRef) {
  const [bounds, setBounds] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 30,
    left: 0,
    top: 0,
  });
  useLayoutEffect(() => {
    const desktop = desktopRef.current;
    const workArea = workAreaRef.current;
    const viewport = window.visualViewport;
    const style = document.documentElement.style;
    let frame;
    let touch;

    function measure() {
      const rect = workArea.getBoundingClientRect();
      const next = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      };
      setBounds(previous =>
        Object.keys(next).every(key => previous[key] === next[key])
          ? previous
          : next,
      );
    }
    function updateViewport() {
      // Keep pinch zoom available without resizing the desktop under the user.
      if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
      style.setProperty(
        '--desktop-viewport-height',
        `${viewport ? viewport.height : window.innerHeight}px`,
      );
      style.setProperty(
        '--desktop-viewport-top',
        `${viewport ? viewport.offsetTop : 0}px`,
      );
      measure();
    }
    function scheduleUpdate() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateViewport);
    }
    function onTouchStart(event) {
      touch = event.touches.length === 1 ? event.touches[0] : null;
    }
    function onTouchMove(event) {
      if (
        !touch ||
        event.touches.length !== 1 ||
        (viewport && Math.abs(viewport.scale - 1) > 0.01)
      )
        return;
      const next = event.touches[0];
      const deltaX = next.clientX - touch.clientX;
      const deltaY = next.clientY - touch.clientY;
      touch = next;
      if (
        event.cancelable &&
        !canScrollWithin(event.target, desktop, deltaX, deltaY)
      ) {
        event.preventDefault();
      }
    }
    function onTouchEnd() {
      touch = null;
    }

    updateViewport();
    const observer = window.ResizeObserver ? new ResizeObserver(measure) : null;
    if (observer) observer.observe(workArea);
    window.addEventListener('resize', scheduleUpdate);
    if (viewport) {
      viewport.addEventListener('resize', scheduleUpdate);
      viewport.addEventListener('scroll', scheduleUpdate);
    }
    desktop.addEventListener('touchstart', onTouchStart, { passive: true });
    desktop.addEventListener('touchmove', onTouchMove, { passive: false });
    desktop.addEventListener('touchend', onTouchEnd, { passive: true });
    desktop.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      if (viewport) {
        viewport.removeEventListener('resize', scheduleUpdate);
        viewport.removeEventListener('scroll', scheduleUpdate);
      }
      desktop.removeEventListener('touchstart', onTouchStart);
      desktop.removeEventListener('touchmove', onTouchMove);
      desktop.removeEventListener('touchend', onTouchEnd);
      desktop.removeEventListener('touchcancel', onTouchEnd);
      style.removeProperty('--desktop-viewport-height');
      style.removeProperty('--desktop-viewport-top');
    };
  }, [desktopRef, workAreaRef]);
  return bounds;
}
