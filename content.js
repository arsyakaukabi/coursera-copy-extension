(() => {
  if (window.__crsrCopyLoaded) return;
  window.__crsrCopyLoaded = true;

  const BUTTON_ID = 'crsr-copy-btn';
  const LABELS = {
    transcript: '📋 Copy Transcript',
    quiz: '📋 Copy Quiz',
    reading: '📋 Copy Reading',
    plugin: '📋 Copy Video Link',
  };

  // ---------- extraction ----------

  function getTitle() {
    const t = document.querySelector('h1')?.innerText?.trim();
    if (!t) throw new Error('Title tidak ditemukan');
    return t;
  }

  function extractTranscript() {
    const title = getTitle();
    const phrases = document.querySelectorAll('.rc-Phrase');
    if (phrases.length === 0) throw new Error('Transkrip tidak ditemukan');
    const transcript = Array.from(phrases)
      .map((p) => p.innerText.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `[${title}]\n${transcript}`;
  }

  function extractQuiz() {
    const title = getTitle();
    const questions = document.querySelectorAll(
      '[data-testid="part-Submission_MultipleChoiceQuestion"]'
    );
    if (questions.length === 0) throw new Error('Quiz tidak ditemukan');
    const parts = [`[${title}]`, ''];
    questions.forEach((q, i) => {
      const qText =
        q.querySelector('[data-testid="cml-viewer"]')?.innerText?.trim() ||
        '(no text)';
      const radios = q.querySelectorAll('input[type="radio"]').length;
      const checkboxes = q.querySelectorAll('input[type="checkbox"]').length;
      const type =
        checkboxes > 0 ? 'Multiple Choice' : radios > 0 ? 'Single Choice' : 'Unknown';
      const labels = Array.from(q.querySelectorAll('label'))
        .map((l) => l.innerText.trim())
        .filter(Boolean);
      parts.push(`${i + 1}. (${type}) ${qText}`);
      labels.forEach((opt) => parts.push(`- ${opt}`));
      parts.push('');
    });
    return parts.join('\n').trim();
  }

  function extractReading() {
    const title = getTitle();
    const cml = document.querySelector('[data-testid="cml-viewer"]');
    if (!cml) throw new Error('Konten reading tidak ditemukan');

    const body = cml.innerText.trim().replace(/^Read\s*\n/, '');

    // External (non-Coursera-nav) links inside the reading body.
    const links = Array.from(cml.querySelectorAll('a[href]'))
      .map((a) => a.href)
      .filter((h) => h && !h.startsWith(location.origin + '/learn'));
    const extra = [...new Set(links)].filter(
      (h) => !body.includes(h.replace(/\/$/, ''))
    );

    let out = `[${title}]\n${body}`;
    if (extra.length) out += `\n\nSource:\n${extra.join('\n')}`;
    return out;
  }

  // Parse userId + courseId from the inline window.App JSON in the DOM
  // (content scripts run in an isolated world and can't read window.App directly).
  function getCourseParams() {
    let userId = null;
    let courseId = null;
    for (const s of document.querySelectorAll('script')) {
      const t = s.textContent;
      if (!t) continue;
      if (userId == null) {
        const m = t.match(/"userData"\s*:\s*\{[^}]*?"id"\s*:\s*(\d+)/);
        if (m) userId = m[1];
      }
      if (courseId == null) {
        const m = t.match(/"courseId"\s*:\s*"([\w-]{20,})"/);
        if (m) courseId = m[1];
      }
      if (userId && courseId) break;
    }
    const itemMatch = location.pathname.match(
      /\/(?:ungradedWidget|supplement|lecture)\/([^/]+)\//
    );
    return { userId, courseId, itemId: itemMatch ? itemMatch[1] : null };
  }

  async function extractPlugin() {
    const title = getTitle();
    const { userId, courseId, itemId } = getCourseParams();
    if (!userId || !courseId || !itemId)
      throw new Error('Parameter course tidak lengkap');

    const url = `${location.origin}/api/onDemandWidgetSessions.v1/${userId}~${courseId}~${itemId}?fields=session,sessionId`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`Gagal fetch widget session (${res.status})`);

    const json = await res.json();
    const session = json?.elements?.[0]?.session;
    const rawVideoId = session?.configuration?.videoId;

    if (rawVideoId) {
      const id = rawVideoId.split(/[?&]/)[0];
      return `[${title}]\nhttps://www.youtube.com/watch?v=${id}`;
    }
    if (session?.src) return `[${title}]\n${session.src}`;
    throw new Error('Video/embed tidak ditemukan');
  }

  function detectPageType() {
    if (document.querySelectorAll('.rc-Phrase').length > 0) return 'transcript';
    if (
      document.querySelectorAll('[data-testid="part-Submission_MultipleChoiceQuestion"]')
        .length > 0
    )
      return 'quiz';
    if (/\/ungradedWidget\//.test(location.pathname)) return 'plugin';
    if (
      /\/supplement\//.test(location.pathname) &&
      document.querySelector('[data-testid="cml-viewer"]')
    )
      return 'reading';
    return null;
  }

  async function buildText(type) {
    switch (type) {
      case 'transcript':
        return extractTranscript();
      case 'quiz':
        return extractQuiz();
      case 'reading':
        return extractReading();
      case 'plugin':
        return await extractPlugin();
      default:
        throw new Error('Tipe halaman tidak didukung');
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (!ok) throw e;
    }
    return text.length;
  }

  async function doCopy(type) {
    const t = type || detectPageType();
    if (!t) throw new Error('Tidak ada konten yang bisa dicopy di halaman ini');
    const text = await buildText(t);
    return copyToClipboard(text);
  }

  // ---------- UI ----------

  function toast(msg, ok) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = [
      'position:fixed', 'top:20px', 'right:20px', 'z-index:2147483647',
      'padding:12px 18px', 'border-radius:6px',
      'font:14px system-ui,-apple-system,sans-serif',
      'color:#fff', `background:${ok ? '#0a7d2f' : '#c0392b'}`,
      'box-shadow:0 4px 14px rgba(0,0,0,.25)', 'transition:opacity .3s',
    ].join(';');
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  function makeButton(type) {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.dataset.type = type;
    btn.type = 'button';
    btn.textContent = LABELS[type];
    btn.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:2147483647',
      'padding:10px 18px', 'border-radius:999px',
      'border:1px solid #0056d3', 'background:#0056d3', 'color:#fff',
      'font:600 14px/1.2 system-ui,-apple-system,sans-serif', 'cursor:pointer',
      'box-shadow:0 4px 14px rgba(0,0,0,.2)',
      'transition:background .15s,border-color .15s,transform .1s',
      'white-space:nowrap',
    ].join(';');

    btn.addEventListener('mouseenter', () => {
      if (!btn.disabled) {
        btn.style.background = '#003e9b';
        btn.style.transform = 'translateY(-1px)';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.disabled) {
        btn.style.background = '#0056d3';
        btn.style.transform = 'translateY(0)';
      }
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      const original = btn.textContent;
      try {
        const len = await doCopy(btn.dataset.type);
        btn.textContent = `✓ Copied (${len})`;
        btn.style.background = '#0a7d2f';
        btn.style.borderColor = '#0a7d2f';
      } catch (err) {
        btn.textContent = `✗ ${err.message}`;
        btn.style.background = '#c0392b';
        btn.style.borderColor = '#c0392b';
      }
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '#0056d3';
        btn.style.borderColor = '#0056d3';
        btn.disabled = false;
      }, 1800);
    });

    return btn;
  }

  function tryInject() {
    const type = detectPageType();
    const existing = document.getElementById(BUTTON_ID);
    if (!type) {
      if (existing) existing.remove();
      return;
    }
    if (existing) {
      if (existing.dataset.type === type) return;
      existing.remove();
    }
    document.body.appendChild(makeButton(type));
  }

  tryInject();

  let debounce;
  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(tryInject, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ---------- messaging (toolbar icon + keyboard shortcut) ----------

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type !== 'COPY') return;
    doCopy()
      .then((len) => {
        toast(`Tersalin (${len} chars)`, true);
        sendResponse({ ok: true, length: len });
      })
      .catch((err) => {
        toast(err.message, false);
        sendResponse({ ok: false, reason: err.message });
      });
    return true; // keep channel open for async response
  });
})();
