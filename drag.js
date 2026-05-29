// Makes an element draggable by a handle. Exposes window.__crsr.drag.
(() => {
  window.__crsr = window.__crsr || {};
  const { clamp } = window.__crsr.storage;

  // el: the positioned element to move (uses left/top).
  // handle: the grip the user grabs.
  // onDrop({left, top}): called when the drag finishes.
  function makeDraggable(el, handle, onDrop) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;
    let overlay = null;

    handle.style.touchAction = 'none';

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = true;
      const r = el.getBoundingClientRect();
      origLeft = r.left;
      origTop = r.top;
      startX = e.clientX;
      startY = e.clientY;
      handle.setPointerCapture(e.pointerId);
      handle.style.cursor = 'grabbing';
      // Transparent overlay catches pointermove even over cross-origin
      // iframes (e.g. the YouTube embed) that would otherwise swallow it.
      overlay = document.createElement('div');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:2147483646;cursor:grabbing';
      document.body.appendChild(overlay);
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const { left, top } = clamp(
        origLeft + dx,
        origTop + dy,
        el.offsetWidth,
        el.offsetHeight
      );
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    });

    function end() {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = 'grab';
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
      const r = el.getBoundingClientRect();
      onDrop({ left: r.left, top: r.top });
    }

    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  window.__crsr.drag = { makeDraggable };
})();
