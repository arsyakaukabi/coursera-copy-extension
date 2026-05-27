chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !tab.url.includes('coursera.org')) {
    await flashBadge(tab.id, '!', '#c0392b');
    return;
  }

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractAndCopy,
    });

    if (result?.ok) {
      await flashBadge(tab.id, '✓', '#0a7d2f');
    } else {
      await flashBadge(tab.id, '✗', '#c0392b');
      console.warn('Copy failed:', result?.reason);
    }
  } catch (e) {
    await flashBadge(tab.id, '✗', '#c0392b');
    console.error(e);
  }
});

async function flashBadge(tabId, text, color) {
  if (!tabId) return;
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
  await chrome.action.setBadgeText({ text, tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), 2000);
}

function extractAndCopy() {
  function toast(msg, ok) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = [
      'position:fixed', 'top:20px', 'right:20px', 'z-index:2147483647',
      'padding:12px 18px', 'border-radius:6px',
      'font-family:system-ui,-apple-system,sans-serif', 'font-size:14px',
      'color:#fff', `background:${ok ? '#0a7d2f' : '#c0392b'}`,
      'box-shadow:0 4px 14px rgba(0,0,0,.25)', 'transition:opacity .3s',
    ].join(';');
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  function buildText() {
    const title = document.querySelector('h1')?.innerText?.trim();
    if (!title) throw new Error('Title (h1) tidak ditemukan');

    const phrases = document.querySelectorAll('.rc-Phrase');
    if (phrases.length > 0) {
      const transcript = Array.from(phrases)
        .map((p) => p.innerText.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      return `[${title}]\n${transcript}`;
    }

    const questions = document.querySelectorAll(
      '[data-testid="part-Submission_MultipleChoiceQuestion"]'
    );
    if (questions.length > 0) {
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

    throw new Error('Tidak ada transkrip atau quiz di halaman ini');
  }

  let text;
  try {
    text = buildText();
  } catch (e) {
    toast(e.message, false);
    return { ok: false, reason: e.message };
  }

  const writePromise = navigator.clipboard?.writeText
    ? navigator.clipboard.writeText(text)
    : Promise.reject(new Error('clipboard API unavailable'));

  return writePromise
    .then(() => {
      toast(`Tersalin (${text.length} chars)`, true);
      return { ok: true, length: text.length };
    })
    .catch((e) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const fallbackOk = document.execCommand('copy');
      ta.remove();
      if (fallbackOk) {
        toast(`Tersalin (${text.length} chars)`, true);
        return { ok: true, length: text.length, fallback: true };
      }
      toast(`Gagal copy: ${e.message}`, false);
      return { ok: false, reason: e.message };
    });
}
