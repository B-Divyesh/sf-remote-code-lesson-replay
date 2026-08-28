# Handoff — Code Lesson Replay

## What was built

- A WXT + TypeScript Manifest V3 extension with a small popup and a full-tab local replay studio.
- End-to-end student flow: start a session; record an opt-in command/output, file snapshot diff, or note; attach hypotheses and learning annotations; replay by timeline or arrow keys; import/export a versioned JSON bundle.
- Privacy controls: common secret redaction before persistence, temporary per-step custom masks, explicit private-command gaps, no page/content-script access, no audio/video/screen/keystroke capture, and browser-local storage only.
- Tutor handling: preserved before/after snapshots, result labels, text playback, invalid/oversized bundle errors, empty states, delete confirmation, and local-save quota feedback.
- $19 one-time Plus flow through the Sociobot test billing API: hosted checkout, URL token capture/stripping, once-per-day cached verification, offline cached verdict, invalid/revoked state, purchase restoration, and token transfer from the return page to the extension. Core capture, masking, playback, and export are free.
- Responsive static launch site with `/privacy/`, `/terms/`, offline service worker, CSP/security headers, sitemap, robots file, and the packaged extension at `/downloads/code-lesson-replay.zip`.
- Product-specific neo-brutalist “annotated bench sheet” design. The original hero was generated with the Factory Azure image deployment; the source, prompt metadata, and 46 KB AVIF / 91 KB WebP derivatives are included.

## Scope decision

The researched smallest product named a native VS Code extension, while the binding work order required WXT + MV3. A browser extension cannot use documented desktop VS Code APIs. This build therefore implements the closest honest, useful version: a student-controlled capture studio that can sit beside any editor (including `vscode.dev`) and never claims automatic IDE capture. A future native VS Code companion can emit the same `code-lesson-replay/v1` bundle without changing tutor playback.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm audit --audit-level=high
```

`npm run build` is the work-order build command. Static deployment output is exactly `dist/site`, with `index.html` at its root. The same command packages the extension at `dist/site/downloads/code-lesson-replay.zip`.

Verification completed on 2026-08-28:

- Unit tests: replay schema/validation, secret masking, filename safety, and diff behavior pass.
- Playwright 1.58.2: desktop Chromium and 390 × 844 mobile site journeys pass; the unpacked MV3 journey creates a replay, removes test secrets before rendering/storage, creates a file diff, verifies a mocked license, and reports zero console errors.
- axe 4.10.2: zero serious or critical findings on home, privacy, terms, and populated extension studio.
- Production build: extension JavaScript 23.7 KB total, extension CSS 15.0 KB, site JavaScript 4.2 KB, site CSS 9.7 KB, hero AVIF 45.9 KB, hero WebP 90.9 KB, packaged ZIP 162.2 KB.
- Lighthouse mobile on the final production preview: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.3 s, CLS 0, total blocking time 0 ms, speed index 1.0 s.
- `npm audit --audit-level=high`: 0 vulnerabilities.

## Known gaps / next steps

- The factory still needs to register the billing product and set `VITE_BILLING_BASE=https://api.sociobot.in` for release; staging intentionally defaults to `pilot-api.sociobot.in`.
- Chrome Web Store signing/publishing and DNS deployment are outside this repository.
- Automated masking cannot identify every secret. The UI and policy tell students to exclude private commands and inspect exports.
- A future native VS Code companion could capture opt-in task/terminal events through documented IDE APIs and write the existing bundle schema. No DOM scraping workaround was added.
- The JSON schema is documented in TypeScript but not yet published as a standalone JSON Schema file.
