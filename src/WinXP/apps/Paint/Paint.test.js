import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import Paint from './index';

let host;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
});
afterEach(() => {
  act(() => {
    ReactDOM.unmountComponentAtNode(host);
  });
  host.remove();
});
function loadFrame(frame) {
  const doc = frame.contentDocument;
  if (!doc.documentElement) doc.appendChild(doc.createElement('html'));
  if (!doc.body) doc.documentElement.appendChild(doc.createElement('body'));
  act(() => {
    frame.dispatchEvent(new Event('load'));
  });
  return doc;
}

test('the first contact activates an unfocused Paint window without replacing its canvas', () => {
  function App() {
    const [focused, setFocused] = useState(false);
    return (
      <>
        <output>{focused ? 'active' : 'inactive'}</output>
        <Paint isFocus={focused} onFocus={() => setFocused(true)} />
      </>
    );
  }
  act(() => {
    ReactDOM.render(<App />, host);
  });
  const frame = host.querySelector('iframe');
  const doc = loadFrame(frame);
  const canvas = doc.createElement('canvas');
  doc.body.appendChild(canvas);
  let contacts = 0;
  canvas.addEventListener('pointerdown', () => contacts++);
  act(() => {
    canvas.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  });
  expect(host.querySelector('output').textContent).toBe('active');
  expect(contacts).toBe(1);
  expect(host.querySelector('iframe')).toBe(frame);
  expect(frame.contentDocument.querySelector('canvas')).toBe(canvas);
});

test('frame reloads do not duplicate focus handlers and closing Paint removes them', () => {
  const focus = jest.fn();
  act(() => {
    ReactDOM.render(<Paint onFocus={focus} />, host);
  });
  const frame = host.querySelector('iframe');
  const doc = loadFrame(frame);
  act(() => {
    frame.dispatchEvent(new Event('load'));
  });
  act(() => {
    doc.dispatchEvent(new Event('pointerdown'));
  });
  expect(focus).toHaveBeenCalledTimes(1);
  act(() => {
    ReactDOM.unmountComponentAtNode(host);
  });
  doc.dispatchEvent(new Event('pointerdown'));
  expect(focus).toHaveBeenCalledTimes(1);
});
