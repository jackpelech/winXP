import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the actual vendored canvas handlers, not a second drawing implementation.
const source = readFileSync(
  process.env.PAINT_INPUT_SOURCE ||
    new URL('../public/paint/src/app.js', import.meta.url),
  'utf8',
);
const interaction = source.slice(
  source.indexOf('// #region Primary Canvas Interaction'),
  source.indexOf('// #region Deselection / Selection Prevention'),
);
const blur = source.match(/\$G\.on\("blur", \(\) => \{[\s\S]*?\n\}\);/)[0];
class Events {
  listeners = new Map();
  on(types, fn) {
    for (const type of types.split(' '))
      this.listeners.set(type, [...(this.listeners.get(type) || []), { fn }]);
    return this;
  }
  one(types, fn) {
    const once = (...args) => {
      this.off(types, once);
      fn(...args);
    };
    return this.on(types, once);
  }
  off(types, fn) {
    for (const type of types.split(' '))
      this.listeners.set(
        type,
        (this.listeners.get(type) || []).filter(item => item.fn !== fn),
      );
    return this;
  }
  emit(event, args = []) {
    for (const { fn } of [...(this.listeners.get(event.type) || [])])
      fn(event, ...args);
  }
  triggerHandler(type, args = []) {
    this.emit({ type }, args);
  }
}
function fixture() {
  const canvas = new Events(),
    area = new Events(),
    global = new Events();
  const strokes = [],
    captures = new Set();
  let pending = null,
    cancellations = 0;
  const tool = {
    id: 'pencil',
    pointerdown(_ctx, x, y) {
      pending = [[x, y]];
    },
    paint(_ctx, x, y) {
      pending?.push([x, y]);
    },
    pointerup() {
      if (pending) strokes.push(pending);
      pending = null;
    },
  };
  const context = vm.createContext({
    $canvas: canvas,
    $canvas_area: area,
    $G: global,
    $status_position: { text() {} },
    main_canvas: {
      setPointerCapture(id) {
        captures.add(id);
      },
      hasPointerCapture(id) {
        return captures.has(id);
      },
      releasePointerCapture(id) {
        captures.delete(id);
      },
    },
    main_ctx: {},
    selected_tool: tool,
    selected_tools: [tool],
    TOOL_PENCIL: 'pencil',
    TOOL_BRUSH: 'brush',
    TOOL_ERASER: 'eraser',
    TOOL_LINE: 'line',
    TOOL_CURVE: 'curve',
    document: { activeElement: null },
    HTMLElement: class {},
    pointers: [],
    pointer: { x: 0, y: 0 },
    pointer_previous: { x: 0, y: 0 },
    pointer_start: { x: 0, y: 0 },
    pointer_active: false,
    pointer_over_canvas: false,
    update_helper_layer_on_pointermove_active: false,
    pointer_type: null,
    pointer_buttons: 0,
    button: undefined,
    reverse: false,
    ctrl: false,
    shift: false,
    current_history_node: {},
    history_node_to_cancel_to: null,
    magnification: 1,
    TAU: Math.PI * 2,
    performance: { now: () => 10 },
    setInterval,
    clearInterval,
    update_fill_and_stroke_colors_and_lineWidth() {},
    update_canvas_rect() {},
    update_helper_layer() {},
    select_tools() {},
    set_magnification() {},
    to_canvas_coords: e => ({ x: e.clientX, y: e.clientY }),
    cancel(_history, discard) {
      cancellations++;
      global.triggerHandler('pointerup', ['canceling', discard]);
      pending = null;
    },
  });
  vm.runInContext(interaction + '\n' + blur, context);
  function emit(type, changes = {}) {
    const event = {
      type,
      pointerId: 1,
      pointerType: 'pen',
      isPrimary: true,
      button: type === 'pointermove' ? -1 : 0,
      buttons: /up|cancel|lost/.test(type) ? 0 : 1,
      clientX: 10,
      clientY: 10,
      ctrlKey: false,
      shiftKey: false,
      preventDefault() {},
      ...changes,
    };
    if (type === 'pointerdown' || type === 'pointermove') canvas.emit(event);
    if (type === 'pointerdown') area.emit(event);
    global.emit(event);
  }
  return {
    emit,
    strokes,
    captures,
    context,
    cancellations: () => cancellations,
  };
}

test('rapid consecutive Pencil strokes all commit, including short strokes with no move event', () => {
  const f = fixture();
  for (let i = 0; i < 100; i++) {
    f.emit('pointerdown', { pointerId: i + 1, clientX: i });
    f.emit('pointerup', { pointerId: i + 1, clientX: i + 5 });
  }
  assert.equal(f.strokes.length, 100);
  f.strokes.forEach((stroke, i) =>
    assert.deepEqual(stroke.at(-1), [i + 5, 10]),
  );
  assert.equal(f.context.pointers.length, 0);
  assert.equal(f.captures.size, 0);
});
test('palm down, movement, and release cannot cancel, move, or finish the owned pen stroke', () => {
  const f = fixture();
  f.emit('pointerdown');
  f.emit('pointerdown', { pointerId: 8, pointerType: 'touch' });
  f.emit('pointermove', { pointerId: 8, pointerType: 'touch', clientX: 999 });
  f.emit('pointerup', { pointerId: 8, pointerType: 'touch' });
  assert.equal(f.strokes.length, 0);
  assert.equal(f.cancellations(), 0);
  f.emit('pointermove', { clientX: 20 });
  f.emit('pointerup', { clientX: 30 });
  assert.equal(f.strokes.length, 1);
  assert.equal(
    f.strokes[0].some(p => p[0] === 999),
    false,
  );
  assert.deepEqual(f.strokes[0].at(-1), [30, 10]);
});
test('pen takes over an existing touch contact and still draws on that first stroke', () => {
  const f = fixture();
  f.emit('pointerdown', { pointerId: 8, pointerType: 'touch' });
  f.emit('pointerdown');
  f.emit('pointermove', { clientX: 22 });
  f.emit('pointerup', { clientX: 30 });
  assert.equal(f.strokes.length, 1);
  assert.deepEqual(f.strokes[0].at(-1), [30, 10]);
});
test('cancel and lost capture finish once and never leave the next stroke blank', () => {
  for (const end of ['pointercancel', 'lostpointercapture']) {
    const f = fixture();
    for (let i = 1; i <= 20; i++) {
      f.emit('pointerdown', { pointerId: i });
      f.emit('pointermove', { pointerId: i, clientX: 20 });
      f.emit(end, { pointerId: i });
    }
    assert.equal(f.strokes.length, 20, end);
    assert.equal(f.context.pointers.length, 0);
    assert.equal(f.captures.size, 0);
    assert.equal(
      (f.context.$G.listeners.get('pointermove') || []).filter(
        item => item.fn.name === 'canvas_pointer_move',
      ).length,
      0,
    );
  }
});
test('a missed pen-up is recovered before the next pen-down', () => {
  const f = fixture();
  f.emit('pointerdown');
  f.emit('pointermove', { clientX: 20 });
  f.emit('pointerdown', { pointerId: 2 });
  f.emit('pointerup', { pointerId: 2, clientX: 30 });
  assert.equal(f.strokes.length, 2);
  assert.equal(f.context.pointers.length, 0);
});
test('all coalesced Pencil positions are consumed in order, then the release position', () => {
  const f = fixture();
  f.emit('pointerdown');
  f.emit('pointermove', {
    clientX: 40,
    originalEvent: {
      getCoalescedEvents: () => [
        { clientX: 20, clientY: 12 },
        { clientX: 30, clientY: 15 },
      ],
    },
  });
  f.emit('pointerup', { clientX: 45 });
  assert.deepEqual(f.strokes[0], [
    [10, 10],
    [10, 10],
    [20, 12],
    [30, 15],
    [40, 10],
    [45, 10],
  ]);
});
test('blur ends the drawing and clears stale contacts', () => {
  const f = fixture();
  f.emit('pointerdown');
  f.emit('pointermove', { clientX: 20 });
  f.emit('blur');
  assert.equal(f.strokes.length, 1);
  assert.equal(f.context.pointers.length, 0);
  f.emit('pointerdown', { pointerId: 2 });
  f.emit('pointerup', { pointerId: 2 });
  assert.equal(f.strokes.length, 2);
});
test('ordinary mouse strokes and two-finger touch gestures retain their original paths', () => {
  const f = fixture();
  f.emit('pointerdown', { pointerType: 'mouse' });
  f.emit('pointermove', { pointerType: 'mouse', clientX: 20 });
  f.emit('pointerup', { pointerType: 'mouse' });
  assert.equal(f.strokes.length, 1);
  f.emit('pointerdown', { pointerType: 'touch', pointerId: 8 });
  f.emit('pointerdown', { pointerType: 'touch', pointerId: 9 });
  assert.ok(f.cancellations() >= 1);
  assert.equal(f.context.pointers.length, 2);
  assert.equal(f.strokes.length, 1);
  f.emit('pointerup', { pointerType: 'touch', pointerId: 8 });
  f.emit('pointerup', { pointerType: 'touch', pointerId: 9 });
  assert.equal(f.context.pointers.length, 0);
});
