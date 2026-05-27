# Coursera Copy Extension

Chrome extension that adds a one-click **copy to clipboard** button to Coursera, formatted clean and paste-ready for notes, AI prompts, or anywhere else.

Supports:

- **Video transcripts** — joins all phrases into one clean paragraph (no timestamps, no accessibility boilerplate)
- **Quiz questions** — extracts all questions with options, auto-labels type (Single Choice / Multiple Choice)

## Installation

Not on the Chrome Web Store. Install manually as an unpacked extension:

1. **Download** this repo (`Code → Download ZIP`) or clone it:
   ```
   git clone https://github.com/arsyakaukabi/coursera-copy-extension.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Toggle **Developer mode** on (top-right)
4. Click **Load unpacked** → select the extension folder
5. Pin the icon to your toolbar (click the puzzle icon → pin)

## Usage

Open any Coursera **video lecture** or **quiz** page. There are three ways to copy:

| Method                            | When                                                              |
| --------------------------------- | ----------------------------------------------------------------- |
| 📋 Floating button (bottom-right) | Always visible while on a transcript / quiz page                  |
| Toolbar icon                      | Click the extension icon                                          |
| Keyboard shortcut                 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Y</kbd> (Mac: <kbd>⌘</kbd>) |

A toast notification confirms success with the character count.

## Output format

### Video transcript

```
[Q&A: Property Level Financing Institutions]
Greetings. I'm here today with Professor Nick Paulson of the Department of Agriculture and Consumer Economics. We're going to talk today about agricultural credit from the perspective of the typical farm operator...
```

### Quiz

```
[Final Assessment | Quiz]

1. (Single Choice) Which document would you refer to for information on a company's profitability?
- Balance sheet
- Income statement
- Cash flow statement
- Statement of retained earnings

2. (Single Choice) Which of the following represents the largest portion of the assets side of the farm balance sheet?
- Farmland
- Farm Equipment
- Intellectual property
- Growing Crops

...
```

## Permissions

- `activeTab`, `scripting` — required to read the current Coursera page when you trigger a copy
- Host permission `https://*.coursera.org/*` — limits the extension to Coursera only

**No data leaves your browser.** No analytics, no external requests, no tracking.

## How it works

The extension uses these DOM selectors:

- **Video title** → `h1`
- **Transcript phrases** → `.rc-Phrase` (joined with spaces, normalized whitespace)
- **Quiz questions** → `[data-testid="part-Submission_MultipleChoiceQuestion"]`
- **Question text** → `[data-testid="cml-viewer"]`
- **Question type** → counts `input[type="radio"]` vs `input[type="checkbox"]` per question
- **Options** → `label` elements within each question container

A `MutationObserver` watches for SPA navigation and re-injects the floating button when the page changes.

## Known limitations

Tested on:

- Video lecture pages with the transcript tab loaded
- Quiz pages using multiple choice (radio) and multiple-answer (checkbox) questions

Not yet supported:

- Free-text input questions
- Dropdown / matching / ordering questions
- Reading items (article-style content)

If you hit one of these, open an issue with the URL pattern.

Selectors target Coursera's current DOM. If they redesign, things may break — file an issue and I'll update.

## Development

The whole thing is three files, no build step:

```
manifest.json    # MV3 manifest
background.js    # Service worker — handles icon click & shortcut
content.js       # Injected on coursera.org — floating button + extraction
```

To iterate: edit, then click the reload icon in `chrome://extensions/`. Refresh the Coursera tab.

## License

[MIT](LICENSE)
