// Floating-button position persistence + viewport clamping.
// Exposes window.__crsr.storage.
(() => {
  window.__crsr = window.__crsr || {};

  const KEY = 'crsr-btn-pos';
  const MARGIN = 8;

  function loadPos() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(KEY, (o) => resolve(o?.[KEY] || null));
      } catch (e) {
        resolve(null);
      }
    });
  }

  function savePos(pos) {
    try {
      chrome.storage.local.set({ [KEY]: pos });
    } catch (e) {
      /* storage unavailable — position just won't persist */
    }
  }

  // Keep the w×h box fully inside the viewport.
  function clamp(left, top, w, h) {
    const maxLeft = Math.max(MARGIN, window.innerWidth - w - MARGIN);
    const maxTop = Math.max(MARGIN, window.innerHeight - h - MARGIN);
    return {
      left: Math.min(Math.max(MARGIN, left), maxLeft),
      top: Math.min(Math.max(MARGIN, top), maxTop),
    };
  }

  window.__crsr.storage = { loadPos, savePos, clamp };
})();
