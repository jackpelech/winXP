// Local-only geometry recognition. No ink, images, or text leave the browser.
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rms = values => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);

// Resampling by distance makes recognition independent of Pencil event frequency.
function resample(points, spacing) {
	const result = [points[0]];
	let remainder = 0;
	for (let i = 1; i < points.length; i++) {
		let a = points[i - 1];
		const b = points[i];
		let length = distance(a, b);
		while (length + remainder >= spacing) {
			const t = (spacing - remainder) / length;
			a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
			result.push(a);
			length = distance(a, b);
			remainder = 0;
		}
		remainder += length;
	}
	result.push(points[points.length - 1]);
	return result;
}

export function recognizeShape(ink, minimumSpan = 18) {
	if (ink.length < 2 || ink.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;
	const xs = ink.map(p => p.x), ys = ink.map(p => p.y);
	const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
	const width = right - left, height = bottom - top, diagonal = Math.hypot(width, height);
	if (diagonal < minimumSpan) return null;
	const inkLength = ink.slice(1).reduce((sum, p, i) => sum + distance(ink[i], p), 0);
	if (inkLength > diagonal * 6) return null;
	const points = resample(ink, Math.max(diagonal / 100, 0.5));
	const first = points[0], last = points[points.length - 1];
	const chord = distance(first, last);
	const length = points.slice(1).reduce((sum, p, i) => sum + distance(points[i], p), 0);
	if (chord >= minimumSpan && length / chord < 1.18) {
		const errors = points.map(p => Math.abs((last.y - first.y) * (p.x - first.x) - (last.x - first.x) * (p.y - first.y)) / chord);
		if (rms(errors) < Math.max(1.5, chord * 0.045) && Math.max(...errors) < Math.max(3, chord * 0.1)) {
			let end = { ...last };
			// Nearly horizontal/vertical strokes feel more intentional when exactly aligned.
			if (Math.abs(end.y - first.y) < chord * 0.10) end.y = first.y;
			if (Math.abs(end.x - first.x) < chord * 0.10) end.x = first.x;
			return { name: 'Line', points: [{ ...first }, end] };
		}
	}
	if (width < minimumSpan * 0.65 || height < minimumSpan * 0.65 || chord > diagonal * 0.22) return null;
	const corners = [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
	const edgeErrors = points.map(p => Math.min(Math.abs(p.x - left), Math.abs(p.x - right), Math.abs(p.y - top), Math.abs(p.y - bottom)));
	const perimeter = 2 * (width + height);
	if (rms(edgeErrors) < diagonal * 0.032 && Math.max(...edgeErrors) < diagonal * 0.085 &&
		corners.every(corner => points.some(p => distance(p, corner) < diagonal * 0.12)) &&
		length / perimeter > 0.8 && length / perimeter < 1.2) {
		return { name: 'Rectangle', points: [...corners, corners[0]] };
	}
	const cx = (left + right) / 2, cy = (top + bottom) / 2;
	let rx = width / 2, ry = height / 2;
	const errors = points.map(p => Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1));
	let sweep = 0;
	for (let i = 1; i < points.length; i++) {
		const a = Math.atan2((points[i - 1].y - cy) / ry, (points[i - 1].x - cx) / rx);
		const b = Math.atan2((points[i].y - cy) / ry, (points[i].x - cx) / rx);
		sweep += Math.atan2(Math.sin(b - a), Math.cos(b - a));
	}
	const ellipseLength = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
	if (rms(errors) > 0.13 || Math.max(...errors) > 0.34 || Math.abs(sweep) < Math.PI * 1.65 ||
		Math.abs(sweep) > Math.PI * 2.4 || length / ellipseLength < 0.75 || length / ellipseLength > 1.35) return null;
	const circle = rx / ry > 0.8 && rx / ry < 1.25;
	if (circle) rx = ry = (rx + ry) / 2;
	const count = Math.min(720, Math.max(64, Math.ceil(ellipseLength / 2)));
	const outline = Array.from({ length: count }, (_, i) => ({ x: cx + Math.cos(i / count * Math.PI * 2) * rx, y: cy + Math.sin(i / count * Math.PI * 2) * ry }));
	return { name: circle ? 'Circle' : 'Ellipse', points: [...outline, outline[0]] };
}

export const shapeSnapSettings = {
	enabled: true,
	toggle() {
		this.enabled = !this.enabled;
		try { localStorage.setItem('paint.draw-and-hold', String(this.enabled)); } catch { /* Private browsing can disable storage. */ }
	},
};
try { shapeSnapSettings.enabled = localStorage.getItem('paint.draw-and-hold') !== 'false'; } catch { /* Use the default. */ }

export function createShapeAssist({ start, scale = 1, pointerType = "mouse", render, status = () => {}, enabled = () => shapeSnapSettings.enabled,
	setTimer = setTimeout, clearTimer = clearTimeout, now = () => performance.now() }) {
	const ink = [{ ...start }];
	// A resting Pencil still reports many tiny moves. Treat these as a hold,
	// and keep their accumulated path length out of geometry recognition.
	const restingRadius = (pointerType === "pen" ? 12 : pointerType === "touch" ? 9 : 4) / scale;
	const releaseRadius = (pointerType === "pen" ? 18 : 10) / scale;
	let anchor = { ...start }, stableIndex = 0, stableSince = null;
	let timer, snapped = null, active = true;
	const clear = () => { clearTimer(timer); timer = undefined; };
	const snap = () => {
		if (!active || !enabled() || snapped) return;
		const geometry = ink.slice(0, stableIndex + 1);
		geometry.push(ink[ink.length - 1]);
		const shape = recognizeShape(geometry, 18 / scale);
		if (!shape) return;
		snapped = shape;
		anchor = { ...ink[ink.length - 1] };
		render(shape.points);
		status(`${shape.name} snapped. Lift to keep it; Undo restores your drawing.`);
	};
	const arm = () => {
		clear();
		if (!enabled()) return;
		stableSince = now();
		timer = setTimer(snap, 650);
	};
	return {
		move(point) {
			if (!active) return false;
			if (!enabled()) {
				clear(); stableSince = null;
				if (snapped) { snapped = null; render(ink); }
			}
			if (snapped && distance(anchor, point) <= releaseRadius) return true;
			const restoring = !!snapped;
			if (snapped) { snapped = null; status('Keep drawing. Hold at the end to snap.'); }
			if (distance(ink[ink.length - 1], point) > 0.1 / scale) ink.push({ ...point });
			// Bound memory for long freehand strokes; abandon recognition instead of dropping ink.
			if (ink.length > 12000) { active = false; clear(); return false; }
			if (restoring) render(ink);
			if (restoring || distance(anchor, point) > restingRadius) {
				anchor = { ...point };
				stableIndex = ink.length - 1;
				arm();
			}
			return restoring;
		},
		finish(keep = true) {
			// iPad can postpone a timer during native input. Check the hold duration
			// on release too, instead of silently discarding an otherwise valid hold.
			if (keep && !snapped && stableSince !== null && now() - stableSince >= 650) snap();
			clear(); active = false;
			if (!keep && snapped) render(ink);
			return keep && snapped ? { shape: snapped, original: ink } : null;
		},
	};
}
