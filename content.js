// Orchestrator: wires extract + storage + drag + ui together, watches the
// SPA for navigation, and handles the toolbar/shortcut COPY message.
(() => {
  if (window.__crsrLoaded) return;
  window.__crsrLoaded = true;

  const { extract, storage, drag, ui } = window.__crsr;

  const btn = ui.makeButton(handleCopy);
  document.body.appendChild(btn.root);

  bootstrap();

  async function bootstrap() {
    const w = btn.root.offsetWidth;
    const h = btn.root.offsetHeight;
    const saved = await storage.loadPos();
    const start = saved || {
      left: window.innerWidth - w - 24,
      top: window.innerHeight - h - 24,
    };
    const pos = storage.clamp(start.left, start.top, w, h);
    btn.root.style.left = `${pos.left}px`;
    btn.root.style.top = `${pos.top}px`;

    drag.makeDraggable(btn.root, btn.grip, storage.savePos);
    update();

    let debounce;
    new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(update, 250);
    }).observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', () => {
      const r = btn.root.getBoundingClientRect();
      const c = storage.clamp(r.left, r.top, btn.root.offsetWidth, btn.root.offsetHeight);
      btn.root.style.left = `${c.left}px`;
      btn.root.style.top = `${c.top}px`;
    });
  }

  function update() {
    const type = extract.detectPageType();
    if (!type) {
      btn.hide();
      return;
    }
    btn.show();
    btn.setType(type);
  }

  async function handleCopy() {
    try {
      const len = await extract.doCopy();
      btn.flash(true);
      ui.toast(`Tersalin (${len} chars)`, true);
      return { ok: true, length: len };
    } catch (err) {
      btn.flash(false);
      ui.toast(err.message, false);
      return { ok: false, reason: err.message };
    }
  }

  // Toolbar icon click + keyboard shortcut both route here via background.js.
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type !== 'COPY') return;
    handleCopy().then(sendResponse);
    return true; // async response
  });
})();
