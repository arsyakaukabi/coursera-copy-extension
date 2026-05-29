<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="Coursera Copy Extension logo">
</p>

<h1 align="center">Coursera Copy Extension</h1>

Chrome extension that adds a one-click **copy to clipboard** button to Coursera, formatted clean and paste-ready for notes, AI prompts, or anywhere else.

Supports:

- **Video transcripts** — joins all phrases into one clean paragraph (no timestamps, no accessibility boilerplate)
- **Quiz questions** — extracts all questions with options, auto-labels type (Single Choice / Multiple Choice)
- **Readings** — copies the reading body text plus any external source link
- **Video plugins** — resolves the embedded YouTube video to a plain `youtube.com/watch?v=...` link

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

Open any Coursera **video lecture**, **quiz**, **reading**, or **video plugin** page. There are three ways to copy:

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

### Reading

```
[Common Ground for Agriculture and Solar Energy: Federal Funding Supports Research and Development in Agrivoltaics]
Common Ground for Agriculture and Solar Energy...

Maguire, K. (2024, April). Common ground for agriculture and solar energy: Federal funding supports research and development in agrivoltaics. U.S. Department of Agriculture, Economic Research Service. Retrieved January 9, 2025, from https://www.ers.usda.gov/amber-waves/2024/april/...
```

If the reading links to an external source that isn't already in the body text, it's appended under a `Source:` heading.

### Video plugin (YouTube embed)

```
[Illinois Extension: Regenerative Agriculture: A Family Tradition (Illinois Extension)]
https://www.youtube.com/watch?v=qIfWFFdumeo
```

## Permissions

- `activeTab`, `scripting` — required to read the current Coursera page when you trigger a copy
- Host permission `https://*.coursera.org/*` — limits the extension to Coursera only

**No data leaves your browser.** No analytics, no external requests, no tracking.

## How it works

Page type is auto-detected, then the matching extractor runs:

- **Title** → `h1`
- **Transcript** → `.rc-Phrase` (joined with spaces, normalized whitespace)
- **Quiz** → `[data-testid="part-Submission_MultipleChoiceQuestion"]`; question text from `[data-testid="cml-viewer"]`; type inferred from `input[type="radio"]` vs `input[type="checkbox"]`; options from `label` elements
- **Reading** → `[data-testid="cml-viewer"]` body text + external `<a>` links
- **Plugin** → the YouTube video ID lives in a cross-origin iframe, so it's fetched from Coursera's `onDemandWidgetSessions.v1` API (`{userId}~{courseId}~{itemId}`). `userId`/`courseId` are parsed from the inline `window.App` JSON in the page; `itemId` comes from the URL.

A `MutationObserver` watches for SPA navigation and re-injects the floating button when the page changes. The toolbar icon and keyboard shortcut message the content script (injecting it first if needed).

## Known limitations

Tested on:

- Video lecture pages with the transcript tab loaded
- Quiz pages using multiple choice (radio) and multiple-answer (checkbox) questions
- Reading (supplement) pages
- Video plugin (`ungradedWidget`) pages with a YouTube embed

Not yet supported:

- Free-text input / dropdown / matching / ordering quiz questions
- Non-YouTube plugins (falls back to the raw embed `src` URL)
- Readings that are pure PDF embeds with no extractable body text

If you hit one of these, open an issue with the URL pattern.

Selectors target Coursera's current DOM. If they redesign, things may break — file an issue and I'll update.

## Development

The whole thing is three files, no build step:

```
manifest.json    # MV3 manifest
background.js    # Service worker — handles icon click & shortcut
content.js       # Injected on coursera.org — floating button + extraction
icon.svg         # Source logo (vector)
icons/           # Rasterized icons (16/48/128) used by the extension
```

To iterate: edit, then click the reload icon in `chrome://extensions/`. Refresh the Coursera tab.

## License

[MIT](LICENSE)
