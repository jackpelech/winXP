import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import useElementResize from './useElementResize';

let container, titleBar, frame;
function Harness() {
  const ref = useRef(null);
  const dragRef = useRef(null);
  const { offset } = useElementResize(ref, {
    dragRef,
    defaultOffset: { x: 900, y: 900 },
    defaultSize: { width: 200, height: 200 },
    resizable: false,
    boundary: { top: 1, left: 1, right: 389, bottom: 599 },
  });
  return (
    <div ref={ref} data-offset={`${offset.x},${offset.y}`}>
      <header ref={dragRef}>
        Window title<button>Close</button>
      </header>
    </div>
  );
}
function pointer(target, type, x, y, pointerType = 'touch') {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
  });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: pointerType },
    isPrimary: { value: true },
  });
  act(() => {
    target.dispatchEvent(event);
  });
}
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(<Harness />, container);
  });
  frame = container.firstElementChild;
  titleBar = frame.querySelector('header');
  container.getBoundingClientRect = () => ({ left: 0, top: 0 });
  frame.getBoundingClientRect = () => ({
    left: 40,
    top: 80,
    width: 200,
    height: 200,
  });
  titleBar.setPointerCapture = jest.fn();
  titleBar.hasPointerCapture = () => true;
  titleBar.releasePointerCapture = jest.fn();
});
afterEach(() => {
  act(() => {
    ReactDOM.unmountComponentAtNode(container);
  });
  container.remove();
});

test.each(['touch', 'mouse'])(
  '%s drags from the displayed position without a jump',
  pointerType => {
    pointer(titleBar, 'pointerdown', 60, 90, pointerType);
    pointer(window, 'pointermove', 110, 140, pointerType);
    expect(frame.dataset.offset).toBe('90,130');
    pointer(window, 'pointerup', 110, 140, pointerType);
    expect(titleBar.setPointerCapture).toHaveBeenCalledWith(1);
    expect(titleBar.releasePointerCapture).toHaveBeenCalledWith(1);
  },
);

test('dragging keeps the whole window reachable within the desktop', () => {
  pointer(titleBar, 'pointerdown', 60, 90);
  pointer(window, 'pointermove', 1000, 1000);
  expect(frame.dataset.offset).toBe('184,394');
});

test('a cancelled touch stops dragging and releases capture', () => {
  pointer(titleBar, 'pointerdown', 60, 90);
  pointer(window, 'pointermove', 110, 140);
  pointer(window, 'pointercancel', 110, 140);
  pointer(window, 'pointermove', 150, 180);
  expect(frame.dataset.offset).toBe('90,130');
  expect(titleBar.releasePointerCapture).toHaveBeenCalledWith(1);
});

test('window buttons do not start a drag', () => {
  pointer(titleBar.querySelector('button'), 'pointerdown', 60, 90);
  pointer(window, 'pointermove', 110, 140);
  expect(frame.dataset.offset).toBe('900,900');
  expect(titleBar.setPointerCapture).not.toHaveBeenCalled();
});
