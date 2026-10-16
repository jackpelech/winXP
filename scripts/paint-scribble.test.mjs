import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../public/paint/src/scribble-text.js', import.meta.url), 'utf8');
const { prepareScribbleTextField } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function fixture(isTablet = true) {
  const listeners = new Map(), attributes = {}, style = {};
  let pending, settled = 0;
  const editor = { style, setAttribute(key, value) { attributes[key] = value; }, addEventListener(type, fn) { listeners.set(type, fn); }, removeEventListener(type) { listeners.delete(type); } };
  const input = prepareScribbleTextField(editor, () => settled++, { isTablet, setTimer(fn) { pending = fn; return 1; }, clearTimer() { pending = null; } });
  return { input, attributes, style, listeners, settled: () => settled, emit(type, event = {}) { listeners.get(type)?.(event); }, wait() { const fn = pending; pending = null; fn?.(); } };
}
test('normal text field remains editable, accessible, and does not intercept Pencil gestures', () => {
  const f = fixture();
  assert.equal(f.attributes['aria-label'], 'Paint text');
  assert.equal(f.style.userSelect, 'text');
  assert.equal(f.style.touchAction, 'auto');
  f.emit('pointerdown', { pointerType: 'pen', preventDefault() { assert.fail('must allow native Scribble'); } });
  assert.equal(f.input.isWriting(), true);
  f.emit('input'); f.wait(); assert.equal(f.settled(), 0);
  f.emit('pointerup'); f.wait(); assert.equal(f.input.isWriting(), false);
  assert.equal(f.settled(), 1);
});
test('Scribble input with no DOM pen events still holds field size until recognition settles', () => {
  const f = fixture(); f.emit('beforeinput'); f.emit('input');
  assert.equal(f.input.isWriting(), true);
  f.wait(); assert.equal(f.input.isWriting(), false);
  assert.equal(f.settled(), 1);
});
test('IME composition is stable while desktop typing can resize immediately', () => {
  const f = fixture(false); f.emit('input'); assert.equal(f.input.isWriting(), false);
  f.emit('compositionstart'); f.emit('input'); f.wait(); assert.equal(f.input.isWriting(), true);
  f.emit('compositionend'); f.wait(); assert.equal(f.input.isWriting(), false);
});
test('cancellation, blur, and destroying the text box clean up pending writing state', () => {
  const f = fixture(); f.emit('pointerdown', { pointerType: 'pen' }); f.emit('pointercancel'); f.wait();
  assert.equal(f.input.isWriting(), false);
  f.emit('input'); f.emit('blur'); assert.equal(f.input.isWriting(), false);
  f.input.destroy(); const before = f.settled(); f.wait();
  assert.equal(f.listeners.size, 0); assert.equal(f.settled(), before);
});
