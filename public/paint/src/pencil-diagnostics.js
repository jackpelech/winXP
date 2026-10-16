// A local report of the latest Pencil gesture. No ink, coordinates, or text.
export const PENCIL_INPUT_BUILD = 'pencil-capture-3';
export function createPencilDiagnostics(now = () => performance.now()) {
	let last;
	return {
		native(event) {
			if (event.type === 'pointerdown' && event.target?.closest?.('.main-canvas') &&
				!(last?.outcome === 'Drawing' && last.input === 'pen' && event.pointerType !== 'pen')) {
				last = { id: event.pointerId, input: event.pointerType, downButton: event.button, downButtons: event.buttons, start: now(), native: {}, appMoves: 0, attempts: 0, outcome: 'Not started', tool: 'Not reached' };
			}
			if (!last || event.pointerId !== last.id) return;
			// Opening Help with the same Pencil must not count as part of the stroke.
			if (last.released && !(event.type === 'lostpointercapture' && event.target?.closest?.('.main-canvas'))) return;
			last.native[event.type] = (last.native[event.type] || 0) + 1;
			if (!last.released) last.duration = Math.round(now() - last.start);
			if (event.type === 'pointerup' || event.type === 'pointercancel') last.released = true;
		},
		start(event, tool, enabled) {
			if (!last || (event.originalEvent || event).pointerId !== last.id) return;
			last.tool = tool.name || tool.id;
			last.enabled = enabled;
			last.outcome = 'Drawing';
		},
		move() { if (last?.outcome === 'Drawing') last.appMoves++; },
		state(state) { if (last?.outcome === 'Drawing') Object.assign(last, state); },
		finish(type, snapped) {
			if (!last || last.outcome !== 'Drawing') return;
			last.end = type;
			last.released = true;
			last.duration = Math.round(now() - last.start);
			last.outcome = snapped ? `Snapped ${snapped.shape.name}` : 'Freehand';
		},
		report(browser = typeof navigator === 'undefined' ? 'Unknown' : navigator.userAgent) {
			return [
				`Paint ${PENCIL_INPUT_BUILD}`, `Browser: ${browser}`,
				...(last ? [
					`Native input: ${last.input}; button=${last.downButton}; buttons=${last.downButtons}`, `Tool: ${last.tool}`, `Shape snapping: ${last.enabled ?? 'Not reached'}`,
					`Duration: ${last.duration || 0} ms`,
					`Native events: ${Object.entries(last.native).map(([key, count]) => `${key}=${count}`).join(', ')}`,
					`Drawing moves: ${last.appMoves}`, `Recognition attempts: ${last.attempts}`,
					`Recognition: ${last.recognition || 'Not attempted'}`, `Hold: ${last.holdMs ?? 0} ms`,
					`Ended by: ${last.end || 'Still active'}`, `Result: ${last.outcome}`,
				] : ['No Pencil gesture received yet. Draw on the canvas with Pencil or Brush, then open this report again.']),
				'Local report only. No drawing, handwriting, or coordinates included.',
			].join('\n');
		},
	};
}
export const pencilDiagnostics = createPencilDiagnostics();
if (typeof document !== 'undefined') {
	for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture']) {
		document.addEventListener(type, event => pencilDiagnostics.native(event), true);
	}
}
