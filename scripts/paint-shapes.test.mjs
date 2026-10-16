import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../public/paint/src/shape-assist.js', import.meta.url), 'utf8');
const { recognizeShape, createShapeAssist } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const circle = (rx = 70, ry = rx, turns = 1) => Array.from({ length: 151 }, (_, i) => {
  const angle = i / 150 * Math.PI * 2 * turns;
  const wobble = 1 + Math.sin(angle * 7) * 0.025;
  return { x: 150 + Math.cos(angle) * rx * wobble, y: 130 + Math.sin(angle) * ry * wobble };
});
const rectangle = [{ x: 30, y: 30 }, { x: 90, y: 32 }, { x: 150, y: 31 }, { x: 151, y: 80 }, { x: 149, y: 130 }, { x: 90, y: 129 }, { x: 31, y: 131 }, { x: 29, y: 80 }, { x: 30, y: 30 }];
const line = [{ x: 20, y: 60 }, { x: 50, y: 62 }, { x: 100, y: 58 }, { x: 160, y: 61 }];
function fixture() {
  let pending, enabled = true;
  const rendered = [], messages = [];
  const assist = createShapeAssist({ start: line[0], render: points => rendered.push(points), status: message => messages.push(message), enabled: () => enabled,
    setTimer: fn => { pending = fn; return 1; }, clearTimer: () => { pending = null; } });
  return { assist, rendered, messages, hold() { const fn = pending; pending = null; fn?.(); }, disable() { enabled = false; } };
}
test('rough circles, ellipses, rectangles, and lines become clean geometry', () => {
  assert.equal(recognizeShape(circle()).name, 'Circle');
  assert.equal(recognizeShape(circle(100, 45)).name, 'Ellipse');
  assert.equal(recognizeShape(rectangle).name, 'Rectangle');
  const snapped = recognizeShape(line);
  assert.equal(snapped.name, 'Line');
  assert.equal(snapped.points[0].y, snapped.points[1].y);
});
test('recognition is insensitive to point frequency and canvas zoom', () => {
  assert.equal(recognizeShape(circle().filter((_, i) => i % 5 === 0)).name, 'Circle');
  assert.equal(recognizeShape(circle().map(p => ({ x: p.x / 10, y: p.y / 10 })), 1.8).name, 'Circle');
});
test('dots, partial arcs, loops and handwriting-like strokes stay freehand', () => {
  for (const points of [[], [{ x: 1, y: 1 }], line.map(p => ({ x: p.x / 100, y: p.y / 100 })), circle().slice(0, 80), circle(70, 70, 2),
    [{ x: 0, y: 0 }, { x: 0, y: 60 }, { x: 30, y: 0 }, { x: 30, y: 60 }, { x: 60, y: 0 }, { x: 60, y: 60 }]]) assert.equal(recognizeShape(points), null);
});
test('snaps only after a hold, preserves original ink, and tolerates resting Pencil jitter', () => {
  const f = fixture(); line.slice(1).forEach(p => f.assist.move(p));
  assert.equal(f.rendered.length, 0);
  f.hold(); assert.equal(f.rendered.length, 1);
  assert.equal(f.assist.move({ x: 161, y: 62 }), true);
  const result = f.assist.finish();
  assert.equal(result.shape.name, 'Line');
  assert.deepEqual(result.original, line);
  f.hold(); assert.equal(f.rendered.length, 1);
});
test('moving away after a snap returns to freehand without losing ink', () => {
  const f = fixture(); line.slice(1).forEach(p => f.assist.move(p)); f.hold();
  assert.equal(f.assist.move({ x: 170, y: 85 }), true);
  assert.equal(f.rendered.at(-1).at(-1).y, 85);
  assert.equal(f.assist.finish(), null);
});
test('release, cancellation, and a disabled setting cannot leave a delayed snap', () => {
  for (const mode of ['release', 'cancel', 'disable']) {
    const f = fixture(); line.slice(1).forEach(p => f.assist.move(p));
    if (mode === 'disable') f.disable(); else f.assist.finish(mode === 'release');
    f.hold(); assert.equal(f.rendered.length, 0, mode);
  }
  const f = fixture(); line.slice(1).forEach(p => f.assist.move(p)); f.hold();
  assert.equal(f.assist.finish(false), null);
  assert.deepEqual(f.rendered.at(-1), line);
});
