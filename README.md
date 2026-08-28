# Code Lesson Replay

Code Lesson Replay is a local-first browser extension for remote programming lessons. A student deliberately records a short sequence of commands, selected output, named file snapshots/diffs, and hypotheses. A tutor opens the exported text bundle and replays the decision trail without a screen recording, shared IDE, or account.

Live site: <https://remote-code-lesson-replay.sociobot.in>

## Who it is for

- Students who want control over exactly what leaves their machine.
- Independent tutors who need to find the first wrong hypothesis between calls.
- Lessons where a final Git commit does not explain the attempts that led to it.

This v1 is a WXT Manifest V3 browser extension, as required by the factory work order. It does not claim native VS Code access: browser extensions cannot use the desktop VS Code extension API. Capture is an explicit paste/snapshot flow that also works beside `vscode.dev`, Codespaces, Replit, or a local editor.

## What ships

- Opt-in command, output, hypothesis, learning note, and exit-result capture.
- Explicit “exclude this command” gaps that never persist command text or output.
- Common credential masking plus temporary, per-step custom mask words; masking runs before browser storage.
- Named before/after file snapshots with a local line diff. Both originals remain in the bundle.
- Keyboard-friendly text playback, JSON import/export, and clear empty/error/offline states.
- Free unlimited capture, playback, masking, import, and export.
- Optional $19 one-time Plus unlock for Tutor Lens and print debriefs, verified through the Sociobot billing API.
- Static landing site, privacy policy, terms, service worker, and downloadable packaged extension.

No analytics, third-party runtime scripts, remote lesson storage, camera, microphone, screen capture, page scraping, or arbitrary keystroke capture are included.

## Develop

Requirements: Node.js 20.19 or newer and npm.

```sh
npm ci
npm run dev       # WXT extension development
npm run dev:site  # landing site
```

For Chrome-family browsers, run `npm run build:extension`, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `.output/chrome-mv3`.

## Test and build

```sh
npm test          # Vitest + Chromium desktop/mobile + axe + extension journey
npm run typecheck
npm run build
```

The exact production build command is `npm run build`. It produces:

- `dist/site/index.html` — deploy root for the static site.
- `dist/site/privacy/index.html` and `dist/site/terms/index.html`.
- `dist/site/downloads/code-lesson-replay.zip` — installable MV3 extension package.
- `.output/chrome-mv3/` — unpacked extension for local testing.

Release builds use `https://api.sociobot.in` for checkout and license verification. No payment-provider credentials are embedded in the site or extension.

The product slug is used in the checkout and verification paths; no billing product ID or provider secret is embedded.

Before a production release, run `npm run verify:billing`. It checks the public Sociobot production catalog for this exact $19 product and confirms that the Buy link returns a secure hosted-checkout redirect. This is deliberately a live release gate: it fails when factory billing registration is missing rather than allowing an advertised purchase flow to ship broken.

## Replay bundle

Exports use the versioned `code-lesson-replay/v1` JSON schema and cap imports at 5 MB / 500 steps. The bundle preserves full masked before/after file snapshots alongside the computed diff. Treat a bundle like source code: inspect it before sharing and delete copies when no longer needed.

Automated masking is defense in depth, not a complete secret scanner. Keep private commands excluded and use the one-step mask field for project-specific values.

## Project map

- `entrypoints/` — WXT popup, full replay studio, and service worker.
- `src/replay.ts` — bundle model, validation, secret masking, and diff logic.
- `src/license.ts` — cached one-time license unlock contract.
- `site/` — landing, privacy, and terms pages.
- `public/` — generated derivatives, icons, caching, and deploy headers.
- `tests/` — unit, end-to-end extension, mobile, and accessibility checks.
- `.factory/design.md` — product-specific visual thesis and asset provenance.

## Deployment

Deploy `dist/site` as a static site. Do not deploy the repository root. Both `npm run build` and the work-order-facing `npm run build:site` create the complete directory, including the extension ZIP and a versioned offline worker. The included `staticwebapp.config.json` sets the navigation fallback, security headers, immutable asset caching, and AVIF/ZIP MIME types. The factory owns DNS and billing registration.

## License

[MIT](LICENSE)
