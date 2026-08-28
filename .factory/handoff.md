# Handoff — independent verification

## Result: FAIL

Candidate `252675ad663f7d980007b5e715c6cbc791f94b6f` was independently tested on 2026-08-28 UTC against <https://remote-code-lesson-replay.sociobot.in>.

The repository is cleanly buildable and the locally packaged extension completes the core replay job, but the live release is not acceptable:

- **Critical:** `/downloads/code-lesson-replay.zip` returns `404 text/html`, so users cannot install the product. The candidate build does produce the expected 162.24 KB ZIP locally.
- **High:** a fresh-install offline reload lacks the hashed CSS/JS; the service worker returns HTML for those asset failures, leaving an unstyled, non-interactive page with MIME console errors.
- **High:** the production site and extension package still use `pilot-api.sociobot.in` for the advertised $19 checkout and license verification.
- **Medium:** malformed import on the extension's initial empty screen fails silently.
- **Medium:** extension tabs do not implement arrow-key movement and lose focus after keyboard activation.
- **Medium:** several mobile links/brand targets are smaller than 44 × 44 px.
- **Medium:** hashed live assets use 30-second revalidation rather than long-lived immutable caching; AVIF is served as `application/octet-stream`.
- **Low:** whitespace-only replay titles create an empty stored title and empty `<h1>`.

Full evidence, checksums, reproduction details, accessibility/performance results, and retest criteria are in [`.factory/verification.md`](verification.md).

## What passed

- `npm ci`
- `npm test`: 6 unit tests and 10 Playwright cases passed; 2 expected mobile-extension skips
- `npm run typecheck`
- `npm audit --audit-level=high`: 0 vulnerabilities
- exact `npm run build`: produced `dist/site` and the extension ZIP
- extracted production ZIP loaded in a clean Chromium profile; popup-to-studio launch, local persistence, masking, command exclusion, diffs, playback, export, import recovery, 5 MB/500-step limits, mobile layout, and reduced motion were exercised
- axe: 0 serious/critical findings on live pages, popup, and populated studio
- Lighthouse mobile: 97 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.1 s, TBT 190 ms, CLS 0
- normal online live load: no console/page errors, no unsolicited third-party requests
- security/privacy headers and local-first extension permissions are appropriately constrained
- live home/legal pages, JS, CSS, AVIF, and service worker match the candidate build byte-for-byte

## Required next steps

1. Correct the static deployment so the built ZIP is available at `/downloads/code-lesson-replay.zip` with the proper MIME type, then download, extract, and load that live artifact in a clean browser.
2. Release-build with `VITE_BILLING_BASE=https://api.sociobot.in` and verify the production checkout return/restore flow.
3. Version and precache built CSS/JS; do not fall back to HTML for missing asset requests. Retest offline in a fresh profile after clearing the ordinary browser cache.
4. Render import errors in the empty state, repair tab keyboard/focus behavior, enlarge mobile targets, reject trimmed-empty titles, and configure immutable caching/MIME metadata.

No product code was modified during verification; only these factory reports were changed.
