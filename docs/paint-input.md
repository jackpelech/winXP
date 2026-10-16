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
