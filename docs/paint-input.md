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
include the pen-up position, capture the pen, and finish on cancellation or blur. Capture loss keeps the active Pencil stroke
alive until a real release. A new pen-down recovers a missing prior release.
Mouse quick-undo and two-finger touch pan/zoom remain in place.

The React wrapper focuses its XP window directly from the frame's document.
It has no transparent activation overlay that could swallow a first stroke.
The local page uses `/paint/` as its base. Missing visual/library assets in
known directories redirect to the pinned CDN, which the upstream CSP permits. The Discord module's optional library import uses the same pinned CDN.

`node --test scripts/paint-input.test.mjs` exercises the actual patched canvas
event handlers with a drawing-tool fixture, including palm contact, repeated
strokes, cancel/capture routing, coalesced points, and final pen-up coordinates.
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

## Pencil hold and Scribble follow-up

A high-frequency stylus trace with small resting movements reproduced the
reported snapping failure: the old 3 px movement threshold repeatedly restarted
the timer, and the extra resting path also distorted recognition. Pen holds now
use a 12 screen-pixel resting region (independent of zoom), exclude the resting
tail from recognition, and tolerate small motion after snapping. A release-time
hold check covers browsers that defer the hold callback during input. Original
ink remains available in Undo. Regression traces at 120 samples/second and a
delayed-callback case failed before this change and pass afterwards.

The canvas area's generic pointer-down handler also blurred the active text
editor and registered text input as a pan contact. It now leaves native editable
fields alone. The live textarea displays its own text instead of an invisible
text overlay; its bitmap remains for export, thumbnail, and history. The helper
layer skips duplicate live text, while editor and frame allow native text
interaction. Drawing canvas and resize handles retain touch-action: none.

This fixes reproducible input/layout problems; actual iPadOS handwriting
recognition still requires a physical iPad with Scribble enabled. Browser
integration tests use synthetic pen events and cannot prove OS recognition.


## Capture and lift-off correction

Pencil capture loss no longer removes its active contact or finishes its stroke.
Capture can change without the tip being lifted; global move/up listeners keep
handling the owned Pencil until release, cancellation, blur, or a replacement
contact. Also, shape assist resolves the hold before the pen-up coordinates are
processed. A lift-off coordinate change cannot revert a corrected preview.
Regression tests cover capture loss mid-stroke followed by a hold, and a snapped
line followed by a widely displaced release point.

Help > Pencil Diagnostics shows a local-only summary of the latest canvas
gesture: build, browser, reported input type, button state, native event counts,
Paint's handler/recognition counts, hold duration, completion event, and outcome.
The report excludes positions, drawn ink, text, images, and document contents.
It is neither stored nor transmitted; Copy report is a user-invoked clipboard
action. This allows real-device failures to be diagnosed without treating
synthetic pen-event checks as physical Apple Pencil verification.
