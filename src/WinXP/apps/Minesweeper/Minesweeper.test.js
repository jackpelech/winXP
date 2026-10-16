import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import Minesweeper, { getInitState, reducer } from './index';

let container;
beforeEach(() => {
  window.matchMedia = jest.fn(() => ({
    matches: true,
    addListener() {},
    removeListener() {},
  }));
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  act(() => {
    ReactDOM.unmountComponentAtNode(container);
  });
  container.remove();
});
function click(element) {
  act(() => {
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, buttons: 0 }),
    );
  });
}
function renderGame() {
  act(() => {
    ReactDOM.render(<Minesweeper onClose={() => {}} />, container);
  });
}

function pointer(target, type, x = 20, y = 20) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
  Object.defineProperties(event, {
    pointerType: { value: 'touch' },
    pointerId: { value: 1 },
    isPrimary: { value: true },
  });
  act(() => {
    target.dispatchEvent(event);
  });
}

test('touch release reveals a square without relying on synthetic mouse events', () => {
  renderGame();
  const cell = container.querySelector('.mine__ceil');
  pointer(cell, 'pointerdown');
  pointer(cell, 'pointerup', 22, 22);
  expect(cell.dataset.state).toBe('open');
});

test('a touch flag followed by compatibility mouse events changes the square only once', () => {
  renderGame();
  click(
    Array.from(container.querySelectorAll('.mine__touch-controls button')).find(
      button => button.textContent === 'Flag',
    ),
  );
  const cell = container.querySelector('.mine__ceil');
  pointer(cell, 'pointerdown');
  pointer(cell, 'pointerup');
  act(() => {
    cell.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, buttons: 0 }),
    );
    cell.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, buttons: 0 }),
    );
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  });
  expect(cell.dataset.state).toBe('flag');
});

test('swiping the board cancels a press instead of revealing a square', () => {
  renderGame();
  const cell = container.querySelector('.mine__ceil');
  pointer(cell, 'pointerdown');
  pointer(cell, 'pointermove', 20, 80);
  pointer(cell, 'pointercancel', 20, 80);
  expect(
    container.querySelectorAll('.mine__ceil[data-state="open"]'),
  ).toHaveLength(0);
});

test('a tap/click with no held mouse buttons reveals a safe first square', () => {
  renderGame();
  click(container.querySelector('.mine__ceil'));
  expect(
    container.querySelectorAll('.mine__ceil[data-state="open"]').length,
  ).toBeGreaterThan(0);
  expect(
    container.querySelectorAll('.mine__ceil[data-state="die"]').length,
  ).toBe(0);
});

test('touch flag mode marks a square without revealing it', () => {
  renderGame();
  click(
    Array.from(container.querySelectorAll('.mine__touch-controls button')).find(
      button => button.textContent === 'Flag',
    ),
  );
  click(container.querySelector('.mine__ceil'));
  expect(container.querySelector('.mine__ceil').dataset.state).toBe('flag');
  expect(
    container.querySelectorAll('.mine__ceil[data-state="open"]').length,
  ).toBe(0);
  click(
    Array.from(container.querySelectorAll('.mine__touch-controls button')).find(
      button => button.textContent === 'Reveal',
    ),
  );
  click(container.querySelector('.mine__ceil'));
  expect(container.querySelector('.mine__ceil').dataset.state).toBe('flag');
});

test.each([
  ['Intermediate', 32, 8, 256, 40],
  ['Expert', 40, 12, 480, 99],
])(
  '%s keeps its portrait geometry and mine count when the game starts',
  (difficulty, rows, columns, count, mines) => {
    const initial = getInitState(difficulty, true);
    const started = reducer(initial, { type: 'START_GAME', payload: 0 });
    expect([
      started.rows,
      started.columns,
      started.ceils.length,
      started.mines,
    ]).toEqual([rows, columns, count, mines]);
    expect(started.ceils.filter(cell => cell.minesAround < 0)).toHaveLength(
      mines,
    );
    expect(started.ceils[0].minesAround).toBeGreaterThanOrEqual(0);
    const open = reducer(started, { type: 'OPEN_CEIL', payload: 0 });
    expect(open.ceils[0].state).toBe('open');
  },
);

test('new games use the current screen layout, while existing boards stay unchanged', () => {
  const desktop = getInitState('Expert');
  expect([desktop.rows, desktop.columns]).toEqual([16, 30]);
  const mobile = reducer(desktop, {
    type: 'CLEAR_MAP',
    payload: { difficulty: 'Expert', mobile: true },
  });
  expect([mobile.rows, mobile.columns]).toEqual([40, 12]);
  const started = reducer(mobile, { type: 'START_GAME', payload: 0 });
  expect([started.rows, started.columns]).toEqual([40, 12]);
});
