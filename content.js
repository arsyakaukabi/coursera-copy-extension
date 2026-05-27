(() => {
  const BUTTON_ID = 'crsr-copy-btn';

  function extractTranscript() {
    const title = document.querySelector('h1')?.innerText?.trim();
    const phrases = document.querySelectorAll('.rc-Phrase');
    if (!title) throw new Error('Title tidak ditemukan');
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
    const title = document.querySelector('h1')?.innerText?.trim();
    const questions = document.querySelectorAll(
      '[data-testid="part-Submission_MultipleChoiceQuestion"]'
    );
    if (!title) throw new Error('Title tidak ditemukan');
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

  function detectPageType() {
    if (document.querySelectorAll('.rc-Phrase').length > 0) return 'transcript';
    if (
      document.querySelectorAll('[data-testid="part-Submission_MultipleChoiceQuestion"]')
        .length > 0
    )
      return 'quiz';
    return null;
  }

  async function doCopy(type) {
    const text = type === 'transcript' ? extractTranscript() : extractQuiz();
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

  function makeButton(type) {
    const labelMap = { transcript: '📋 Copy Transcript', quiz: '📋 Copy Quiz' };
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.dataset.type = type;
    btn.type = 'button';
    btn.textContent = labelMap[type];
    btn.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:2147483647',
      'padding:10px 18px',
      'border-radius:999px',
      'border:1px solid #0056d3',
      'background:#0056d3',
      'color:#fff',
      'font:600 14px/1.2 system-ui,-apple-system,sans-serif',
      'cursor:pointer',
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
})();
