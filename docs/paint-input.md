# Embedded Paint input

Paint keeps the original JS Paint tools, menus, canvas renderer, and history.
The application source in `public/paint/src/` and the page in `public/paint/index.html`
come from [1j01/jspaint](https://github.com/1j01/jspaint) commit
`53be67ab8c47cc0d2168899e7481bc04839c4c81`, under its retained MIT license.
Unchanged styles, libraries, icons, and help assets load from jsDelivr at that
same pinned commit. Application modules are all local so their shared state
and module instances stay consistent.

The local changes in `app.js` give a drawing stroke a pointer owner, prioritize
pen contact over palm/touch contact, process coalesced freehand pen samples,
include the pen-up position, capture the pen, and finish on cancellation,
capture loss, or blur. A new pen-down recovers a missing prior release.
Mouse quick-undo and two-finger touch pan/zoom remain in place.

The React wrapper focuses its XP window directly from the frame's document.
It has no transparent activation overlay that could swallow a first stroke.
The local page uses `/paint/` as its base. Missing visual/library assets in
known directories redirect to the pinned CDN, which the upstream CSP permits. The Discord module's optional library import uses the same pinned CDN.

`node --test scripts/paint-input.test.mjs` exercises the actual patched canvas
event handlers with a drawing-tool fixture, including palm contact, repeated
strokes, cancel/capture loss, coalesced points, and final pen-up coordinates.
Physical Apple Pencil and iPadOS behavior still requires a device check.

## Shape snapping and iPad text

Pencil and Brush now recognize a held line, circle/ellipse, or rectangle after
650 ms near the end of a stroke. Recognition resamples ink by distance, rejects
partial/ambiguous paths, and tolerates small resting-Pencil jitter. Moving away
resumes freehand ink. Image > Draw and Hold to Snap toggles a browser-local
preference. Eraser and the other Paint tools keep their original behavior.

Shape previews use the same brush mask, size, and color as freehand drawing.
On release, history stores the freehand stroke followed by the corrected shape;
one Undo restores the original ink, and a second removes the stroke. Replacing
a stroke restores the exact pre-stroke image, including transparent pixels,
so the rough outline does not remain underneath the corrected shape.

The Text tool retains its standard native textarea for iPadOS Scribble (with
Scribble enabled in the device's Apple Pencil settings). The field allows native
Pencil/text selection gestures. Size and automatic scrolling wait until Pencil
contact, input, or IME composition settles; desktop typing remains immediate.
This uses system handwriting-to-text, not recognition of ink already painted on
the canvas. Shape recognition and text-field coordination run locally.

Additional automated checks:
- `node --test scripts/paint-shapes.test.mjs`: geometry, hold timing, jitter,
  continuation, zoom, cancellation, and setting behavior.
- `node --test scripts/paint-scribble.test.mjs`: native text input, stable field
  layout during handwriting/composition, release/blur cleanup.

Physical iPad Scribble recognition and Pencil feel require a device check.

Browser integration checks dispatched pen input through the real Paint handlers
and verified Circle, Ellipse, Rectangle, and Line previews, distinct freehand
and corrected image states, Undo to the original, a second Undo to the exact
background, Redo, and committing text to the canvas. This uses synthetic browser
pen events; it does not substitute for physical Pencil testing. Portrait tablet
windows now use the existing window bounds clamp through 1024 px width.
