chrome.action.onClicked.addListener((tab) => triggerCopy(tab));

async function triggerCopy(tab) {
  if (!tab.id || !tab.url || !tab.url.includes('coursera.org')) {
    await flashBadge(tab.id, '!', '#c0392b');
    return;
  }

  let resp;
  try {
    resp = await chrome.tabs.sendMessage(tab.id, { type: 'COPY' });
  } catch (e) {
    // Content script not present yet (e.g. page loaded before reload) — inject and retry.
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['extract.js', 'storage.js', 'drag.js', 'ui.js', 'content.js'],
      });
      resp = await chrome.tabs.sendMessage(tab.id, { type: 'COPY' });
    } catch (e2) {
      await flashBadge(tab.id, '✗', '#c0392b');
      console.error(e2);
      return;
    }
  }

  if (resp?.ok) {
    await flashBadge(tab.id, '✓', '#0a7d2f');
  } else {
    await flashBadge(tab.id, '✗', '#c0392b');
    console.warn('Copy failed:', resp?.reason);
  }
}

async function flashBadge(tabId, text, color) {
  if (!tabId) return;
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
  await chrome.action.setBadgeText({ text, tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), 2000);
}
