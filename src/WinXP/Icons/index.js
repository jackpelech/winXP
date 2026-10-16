import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

function Icons({
  icons,
  onMouseDown,
  onDoubleClick,
  displayFocus,
  mouse,
  selecting,
  setSelectedIcons,
}) {
  const [iconsRect, setIconsRect] = useState([]);
  const measure = useCallback(rect => {
    setIconsRect(current => {
      const old = current.find(item => item.id === rect.id);
      if (old && Object.keys(rect).every(key => old[key] === rect[key]))
        return current;
      return [...current.filter(item => item.id !== rect.id), rect];
    });
  }, []);
  useEffect(() => {
    if (!selecting) return;
    const sx = Math.min(selecting.x, mouse.docX);
    const sy = Math.min(selecting.y, mouse.docY);
    const sw = Math.abs(selecting.x - mouse.docX);
    const sh = Math.abs(selecting.y - mouse.docY);
    const selectedIds = iconsRect
      .filter(rect => {
        const { x, y, w, h } = rect;
        return x - sx < sw && sx - x < w && y - sy < sh && sy - y < h;
      })
      .map(icon => icon.id);
    setSelectedIcons(selectedIds);
  }, [iconsRect, setSelectedIcons, selecting, mouse.docX, mouse.docY]);
  return (
    <IconsContainer>
      {icons.map(icon => (
        <StyledIcon
          key={icon.id}
          {...icon}
          displayFocus={displayFocus}
          onMouseDown={onMouseDown}
          onDoubleClick={onDoubleClick}
          measure={measure}
        />
      ))}
    </IconsContainer>
  );
}

function Icon({
  title,
  onMouseDown,
  onDoubleClick,
  icon,
  imageRendering,
  className,
  id,
  component,
  measure,
}) {
  const ref = useRef(null);
  const inputType = useRef('mouse');
  function _onMouseDown() {
    onMouseDown(id);
  }
  function _onDoubleClick() {
    onDoubleClick(component);
  }
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const workArea = target.closest('.desktop__work-area');
    function update() {
      const { left, top, width, height } = target.getBoundingClientRect();
      const origin = workArea.getBoundingClientRect();
      measure({
        id,
        x: left - origin.left,
        y: top - origin.top,
        w: width,
        h: height,
      });
    }
    update();
    const observer = window.ResizeObserver ? new ResizeObserver(update) : null;
    if (observer) observer.observe(workArea);
    window.addEventListener('resize', update);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [id, measure]);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      className={className}
      onPointerDown={event => {
        inputType.current = event.pointerType;
      }}
      onClick={() => {
        if (inputType.current === 'touch') _onDoubleClick();
      }}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          _onDoubleClick();
        }
      }}
      onMouseDown={_onMouseDown}
      onDoubleClick={_onDoubleClick}
      ref={ref}
    >
      <div className={`${className}__img__container`}>
        <img
          src={icon}
          alt={title}
          className={`${className}__img`}
          style={{ imageRendering }}
        />
      </div>
      <div className={`${className}__text__container`}>
        <div className={`${className}__text`}>{title}</div>
      </div>
    </div>
  );
}

const IconsContainer = styled.div`
  position: absolute;
  margin-top: 40px;
  margin-left: 40px;
  @media (max-width: 767px), (max-height: 500px) {
    top: 16px;
    bottom: 16px;
    left: 16px;
    margin: 0;
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(auto-fill, 68px);
    grid-auto-columns: 70px;
    gap: 8px 12px;
    align-items: start;
  }
`;

const StyledIcon = styled(Icon)`
  width: 70px;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  touch-action: manipulation;
  &:focus-visible {
    outline: 1px dotted white;
    outline-offset: 2px;
  }
  @media (max-width: 767px), (max-height: 500px) {
    margin-bottom: 0;
    min-height: 58px;
  }
  &__text__container {
    width: 100%;
    font-size: 10px;
    color: white;
    text-shadow: 0 1px 1px black;
    margin-top: 5px;
    display: flex;
    justify-content: center;

    &:before {
      content: '';
      display: block;
      flex-grow: 1;
    }
    &:after {
      content: '';
      display: block;
      flex-grow: 1;
    }
  }
  &__text {
    padding: 0 3px 2px;
    background-color: ${({ isFocus, displayFocus }) =>
      isFocus && displayFocus ? '#0b61ff' : 'transparent'};
    text-align: center;
    flex-shrink: 1;
  }
  &__img__container {
    width: 30px;
    height: 30px;
    filter: ${({ isFocus, displayFocus }) =>
      isFocus && displayFocus ? 'drop-shadow(0 0 blue)' : ''};
  }
  &__img {
    width: 30px;
    height: 30px;
    opacity: ${({ isFocus, displayFocus }) =>
      isFocus && displayFocus ? 0.5 : 1};
  }
`;

export default Icons;
