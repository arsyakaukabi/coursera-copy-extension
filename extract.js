// Content extraction for every supported Coursera page type.
// Exposes window.__crsr.extract — pure DOM reads + clipboard, no UI.
(() => {
  window.__crsr = window.__crsr || {};

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

  // userId + courseId live in the inline window.App JSON (the isolated world
  // can't read window.App directly); itemId comes from the URL.
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

  function buildText(type) {
    switch (type) {
      case 'transcript':
        return extractTranscript();
      case 'quiz':
        return extractQuiz();
      case 'reading':
        return extractReading();
      case 'plugin':
        return extractPlugin();
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

  window.__crsr.extract = { detectPageType, doCopy };
})();
