// Keep a normal, accessible textarea so iPadOS can provide native Scribble.
// Do not intercept Pencil gestures or implement handwriting recognition here.
export function prepareScribbleTextField(editor, onSettled, {
	isTablet = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
	setTimer = setTimeout, clearTimer = clearTimeout,
} = {}) {
	editor.setAttribute('aria-label', 'Paint text');
	editor.setAttribute('autocomplete', 'off');
	editor.setAttribute('autocapitalize', 'sentences');
	editor.setAttribute('spellcheck', 'false');
	editor.setAttribute('placeholder', isTablet ? 'Type or write with Apple Pencil' : 'Type here');
	editor.style.touchAction = 'auto';
	editor.style.userSelect = 'text';
	editor.style.webkitUserSelect = 'text';
	let pen = false, penId, composing = false, quiet = false, timer;
	const settle = () => {
		clearTimer(timer);
		quiet = true;
		timer = setTimer(() => {
			if (pen || composing) return;
			quiet = false;
			onSettled();
		}, 900);
	};
	const handlers = {
		pointerdown(event) { if (event.pointerType === 'pen') { pen = true; penId = event.pointerId; quiet = true; clearTimer(timer); } },
		pointerup(event) { if (pen && (event.pointerId === undefined || event.pointerId === penId)) { pen = false; settle(); } },
		pointercancel(event) { handlers.pointerup(event); },
		beforeinput() { if (isTablet || composing) settle(); },
		input() { if (isTablet || composing) settle(); },
		compositionstart() { composing = true; quiet = true; clearTimer(timer); },
		compositionend() { composing = false; settle(); },
		blur() { pen = composing = quiet = false; clearTimer(timer); onSettled(); },
	};
	for (const [type, handler] of Object.entries(handlers)) editor.addEventListener(type, handler);
	// A Pencil can lift outside the text field; a palm release must not end writing.
	const doc = editor.ownerDocument;
	doc?.addEventListener('pointerup', handlers.pointerup, true);
	doc?.addEventListener('pointercancel', handlers.pointercancel, true);
	return {
		isWriting: () => pen || composing || quiet,
		destroy() {
			clearTimer(timer);
			doc?.removeEventListener('pointerup', handlers.pointerup, true);
			doc?.removeEventListener('pointercancel', handlers.pointercancel, true);
			for (const [type, handler] of Object.entries(handlers)) editor.removeEventListener(type, handler);
		},
	};
}
