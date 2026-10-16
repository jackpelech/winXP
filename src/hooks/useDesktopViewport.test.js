import { canScrollWithin } from './useDesktopViewport';

function createScroller({ axis = 'y', position = 0, extent = 200 } = {}) {
  const desktop = document.createElement('div');
  const scroller = document.createElement('div');
  const content = document.createElement('p');
  scroller.style[axis === 'y' ? 'overflowY' : 'overflowX'] = 'auto';
  Object.defineProperties(
    scroller,
    axis === 'y'
      ? {
          clientHeight: { value: 100 },
          scrollHeight: { value: 100 + extent },
          scrollTop: { value: position, writable: true },
        }
      : {
          clientWidth: { value: 100 },
          scrollWidth: { value: 100 + extent },
          scrollLeft: { value: position, writable: true },
        },
  );
  desktop.appendChild(scroller);
  scroller.appendChild(content);
  document.body.appendChild(desktop);
  return { desktop, scroller, content };
}

afterEach(() => {
  document.body.innerHTML = '';
});

test('swiping the wallpaper cannot scroll or refresh the page', () => {
  const { desktop } = createScroller();
  expect(canScrollWithin(desktop, desktop, 0, 40)).toBe(false);
});

test('an app can scroll its content in either direction away from an edge', () => {
  const { desktop, content } = createScroller({ position: 50 });
  expect(canScrollWithin(content, desktop, 0, 40)).toBe(true);
  expect(canScrollWithin(content, desktop, 0, -40)).toBe(true);
});

test('a downward gesture at the top cannot turn into pull-to-refresh', () => {
  const { desktop, content } = createScroller();
  expect(canScrollWithin(content, desktop, 0, 40)).toBe(false);
  expect(canScrollWithin(content, desktop, 0, -40)).toBe(true);
});

test('a gesture past the bottom stops while scrolling back up still works', () => {
  const { desktop, content } = createScroller({ position: 200 });
  expect(canScrollWithin(content, desktop, 0, -40)).toBe(false);
  expect(canScrollWithin(content, desktop, 0, 40)).toBe(true);
});

test('horizontal app scrolling cannot accidentally release a vertical page gesture', () => {
  const { desktop, content } = createScroller({ axis: 'x', position: 50 });
  expect(canScrollWithin(content, desktop, -40, 0)).toBe(true);
  expect(canScrollWithin(content, desktop, 0, 40)).toBe(false);
});

test('short app content does not release gestures to the page', () => {
  const { desktop, content } = createScroller({ extent: 0 });
  expect(canScrollWithin(content, desktop, 0, -40)).toBe(false);
});
