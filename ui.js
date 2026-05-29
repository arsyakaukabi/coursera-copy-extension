// Floating button + toast. Exposes window.__crsr.ui (no extraction logic).
(() => {
  window.__crsr = window.__crsr || {};

  const LABELS = {
    transcript: 'Copy Transcript',
    quiz: 'Copy Quiz',
    reading: 'Copy Reading',
    plugin: 'Copy Video Link',
  };

  const COPY_SVG =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  const GRIP_SVG =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1.3"/><circle cx="10" cy="4" r="1.3"/><circle cx="6" cy="8" r="1.3"/><circle cx="10" cy="8" r="1.3"/><circle cx="6" cy="12" r="1.3"/><circle cx="10" cy="12" r="1.3"/></svg>';

  const BLUE = '#0056d3';
  const BLUE_DARK = '#003e9b';
  const GREEN = '#0a7d2f';
  const RED = '#c0392b';

  function toast(msg, ok) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = [
      'position:fixed', 'top:20px', 'right:20px', 'z-index:2147483647',
      'padding:12px 18px', 'border-radius:6px',
      'font:14px system-ui,-apple-system,sans-serif',
      'color:#fff', `background:${ok ? GREEN : RED}`,
      'box-shadow:0 4px 14px rgba(0,0,0,.25)', 'transition:opacity .3s',
    ].join(';');
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  // onCopy: async callback invoked when the left (copy) half is clicked.
  // Pill layout: [ copy icon │ drag grip ].
  function makeButton(onCopy) {
    const root = document.createElement('div');
    root.id = 'crsr-copy-root';
    // Off-screen until the orchestrator measures + positions it.
    root.style.cssText = [
      'position:fixed', 'top:0', 'left:-9999px', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'height:40px',
      `background:${BLUE}`, 'border-radius:999px', 'color:#fff',
      'box-shadow:0 4px 14px rgba(0,0,0,.25)',
      'transition:background .15s', 'overflow:hidden',
    ].join(';');

    // Left half — click to copy.
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.innerHTML = COPY_SVG;
    copy.style.cssText = [
      'height:100%', 'border:none', 'background:transparent', 'color:#fff',
      'cursor:pointer', 'padding:0 14px', 'display:flex', 'align-items:center',
      'justify-content:center', 'transition:background .15s',
    ].join(';');
    copy.addEventListener('mouseenter', () => {
      if (!copy.disabled) copy.style.background = BLUE_DARK;
    });
    copy.addEventListener('mouseleave', () => {
      copy.style.background = 'transparent';
    });
    copy.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (copy.disabled) return;
      await onCopy();
    });

    // Divider.
    const divider = document.createElement('div');
    divider.style.cssText = 'width:1px;height:60%;background:rgba(255,255,255,.35)';

    // Right half — drag grip.
    const grip = document.createElement('div');
    grip.innerHTML = GRIP_SVG;
    grip.title = 'Geser tombol';
    grip.style.cssText = [
      'height:100%', 'cursor:grab', 'user-select:none', 'touch-action:none',
      'padding:0 10px', 'display:flex', 'align-items:center',
      'justify-content:center', 'color:rgba(255,255,255,.8)',
    ].join(';');

    root.append(copy, divider, grip);

    function setType(type) {
      copy.title = LABELS[type] || 'Copy';
    }
    function show() {
      root.style.display = 'flex';
    }
    function hide() {
      root.style.display = 'none';
    }
    function flash(ok) {
      copy.disabled = true;
      copy.innerHTML = ok ? '✓' : '✗';
      copy.style.font = '700 20px/1 system-ui,sans-serif';
      root.style.background = ok ? GREEN : RED;
      setTimeout(() => {
        copy.innerHTML = COPY_SVG;
        copy.style.font = '';
        root.style.background = BLUE;
        copy.disabled = false;
      }, 1800);
    }

    return { root, grip, setType, show, hide, flash };
  }

  window.__crsr.ui = { makeButton, toast };
})();
