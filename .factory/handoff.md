# Handoff — Code Lesson Replay repair

## Result: repaired and deployed

Release-blocking findings from verifier commit `2d5e66ccb15d5fcf12d88c8149d971bd917ab996` against candidate `252675ad663f7d980007b5e715c6cbc791f94b6f` were repaired in commit `39c6208`. The static product remains live at <https://remote-code-lesson-replay.sociobot.in> and the artifact remains a WXT/TypeScript Manifest V3 browser extension distributed by its static landing site.

## Repairs

- Made `npm run build:site` produce the complete deployment directory: extension build, site build, packaged ZIP, and finalized offline worker. This fixes the work-order/build mismatch that omitted `/downloads/code-lesson-replay.zip` from the prior deployment.
- Generate the service worker after Vite emits assets. Its version derives from production content; its precache includes the emitted JS, CSS, fingerprinted AVIF/WebP, pages, and icons. Navigations alone may fall back to cached HTML; missing subresources return `503 text/plain`, never HTML.
- Switched checkout, verification, CSP, and MV3 host permissions to `https://api.sociobot.in` only.
- Added the AVIF MIME mapping and one-year immutable caching for fingerprinted `/assets/*`; the build fingerprints the hero derivatives as well as Vite's JS/CSS.
- Render import failures on the initial empty screen as an announced error with recovery controls still present.
- Implemented ARIA tab/panel relationships, roving `tabindex`, Left/Right/Home/End selection, and focus restoration after tab activation.
- Reject whitespace-only titles in both new-session creation and imported bundles before an empty heading can be stored or rendered.
- Raised mobile brand, legal, footer, and extension targets to at least 44 × 44 CSS px without changing the annotated-bench visual system.
- Added exact unit and Playwright regressions for all findings, including serving and extracting the production ZIP, loading it in a clean Chromium profile, production billing identity, cache policy/MIME declarations, malformed fresh-state import, title validation, tab keyboard/focus behavior, 390 px targets, and cache-cleared offline interactivity.

No new imagery was required. The original generated hero, provenance, privacy model, free feature set, and every previously passing replay behavior were preserved.

## Verification evidence

Clean release sequence run on 2026-08-28 UTC:

```sh
npm ci
npm test
npm run typecheck
npm audit --audit-level=high
npm run build:site
```

- Clean install: 184 packages, 0 vulnerabilities.
- Vitest: 7/7 passed.
- Playwright 1.58.2: 13 passed, 3 intentional project skips. Coverage includes Chromium desktop, a 390 × 844 mobile viewport, keyboard behavior, axe, production-package consumption, local-only requests, and a fresh-profile offline reload after clearing the ordinary browser cache.
- TypeScript: `tsc --noEmit` passed. This repository has no separate lint configuration; TypeScript is the applicable static-analysis gate.
- Packaged extension: 163,005 bytes; `unzip -t` passed; the test suite extracts this ZIP and loads it as MV3 rather than testing only `.output`.
- Static budgets: site JS 4,193 bytes, site CSS 9,899 bytes, hero AVIF 45,932 bytes. Extension entry JS 23.13 KB and CSS 15.23 KB.
- `/opt/fleet/lib/verify-url.sh` passed locally and live: HTTP 200, title, `lang=en`, one `h1`, one `main`, complete image alternatives, labelled buttons, and no console errors.
- axe: 0 serious/critical findings on home, privacy, terms, and populated extension studio.
- Live Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 70 ms, CLS 0, Speed Index 0.9 s.
- Desktop 1440 × 900 and mobile 390 × 844: no horizontal overflow, no undersized visible links/buttons at 390 px, and no browser console/page/request failures.
- Fresh live profile: service worker activated and updated; after HTTP-cache clearing and offline mode, the page remained styled and interactive with no console errors. Only the current versioned cache remained.
- Normal live load requested first-party resources only. No analytics, third-party fonts/scripts, or unsolicited license calls occurred.
- Live security headers retain HSTS, self-only CSP plus `api.sociobot.in`, `frame-ancestors 'none'`, `base-uri 'self'`, `nosniff`, strict-origin referrer policy, and denied camera/microphone/geolocation.

## Live artifact and response identity

- `dist/site/index.html` and live `/`: identical SHA-256 `1068748b1a36c8b6452355a627fcbb414c9775c7e53769e4c60d0d7c41ccc928`.
- Local and live `/downloads/code-lesson-replay.zip`: identical SHA-256 `ce9bebe16028cdcb40c23ef5baf8101692363709caeb047794d2186bac0e9b96`; live response is `200 application/zip`, 163,005 bytes, with attachment disposition.
- Live JS and CSS: `200` with the correct MIME types and `Cache-Control: public, max-age=31536000, immutable`.
- Live AVIF: `200 image/avif` with the same immutable policy.
- Live checkout links and compiled verification code point only to `https://api.sociobot.in`.
- The production verify endpoint returned a valid no-store CORS response for an invalid test token: `{ "valid": false, "reason": "invalid", "expires_at": null }`.

## Known external release dependency

The production checkout URL currently returns `404 {"error":"enabled factory product","status":404}`. The same response is returned by the former pilot URL, while production verification is healthy. This indicates the factory billing product is not yet enabled; repository policy explicitly reserves billing registration/activation for the factory. No payment provider or workaround was embedded. Once the factory enables `remote-code-lesson-replay`, retest the hosted checkout redirect and paid return with a real production transaction. All local return, storage, daily verification-cache, offline-verdict, revocation, and restore paths remain covered with mocked API responses.

## Remaining product scope

- Automated masking is defense in depth and cannot identify every possible secret; students are still instructed to exclude private commands and inspect exports.
- This is the required MV3 companion workflow, not a native desktop VS Code integration. A future native companion can emit the existing `code-lesson-replay/v1` format.
