import React, { useEffect, useRef } from 'react';

function Paint({ onFocus }) {
  const iframe = useRef(null);
  const focus = useRef(onFocus);
  const cleanup = useRef(() => {});
  focus.current = onFocus;
  useEffect(() => () => cleanup.current(), []);
  function onLoad() {
    cleanup.current();
    const doc = iframe.current.contentDocument;
    if (!doc) return;
    const activate = () => focus.current && focus.current();
    // Focus the XP window without putting a click-catching layer over the canvas.
    doc.addEventListener('pointerdown', activate, true);
    doc.addEventListener('focusin', activate);
    cleanup.current = () => {
      doc.removeEventListener('pointerdown', activate, true);
      doc.removeEventListener('focusin', activate);
    };
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <iframe
        ref={iframe}
        src="/paint/"
        onLoad={onLoad}
        frameBorder="0"
        title="paint"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgb(192,192,192)',
          touchAction: 'auto',
        }}
      />
    </div>
  );
}

export default Paint;
