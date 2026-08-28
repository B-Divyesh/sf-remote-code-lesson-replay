# Independent verification 2 — FAIL

Verified on 2026-08-28 UTC for candidate commit `8a1ac97185a4a120718e7d7df512227cf13a9673` and <https://remote-code-lesson-replay.sociobot.in>.

## Verdict

**FAIL.** The candidate is reproducibly buildable, the deployed free product matches it byte for byte, and the core student-to-tutor replay workflow passes. However, the advertised production one-time purchase cannot be completed: the live **Buy Plus once** destination returns HTTP 404 rather than a hosted checkout. This is a release-blocking failure of the required monetization path.

The builder's previously recorded billing dependency is still present in fresh evidence; it was not treated as resolved merely because it is external to this repository.

## Defects by severity

### Critical

None found.

### High

1. **The production Plus checkout is not enabled.**
   - Both the live site and packaged extension point to `https://api.sociobot.in/api/v1/products/remote-code-lesson-replay/checkout`, as required.
   - A fresh direct GET at 2026-08-28 05:29 UTC returned HTTP `404`, `Content-Type: application/json`, and `{"error":"enabled factory product","status":404}`. It did not redirect to hosted checkout.
   - The site advertises a `$19` one-time purchase, so a user cannot buy the advertised Plus unlock.
   - The adjacent production verification endpoint is healthy: an invalid test token returned HTTP 200, `Cache-Control: no-store`, correct CORS for the product origin, and `{"expires_at":null,"reason":"invalid","valid":false}`.
   - Required remediation is outside repository scope: enable/register this product in the factory billing system, then retest a real production checkout, return token, verification, and refund/revocation cycle.

### Medium

None found.

### Low

None found.

## Clean-checkout gates

The candidate was checked out as detached HEAD in a new temporary Git worktree before installation.

- `git rev-parse HEAD`: exactly `8a1ac97185a4a120718e7d7df512227cf13a9673`.
- Node `v22.23.2`; npm `10.9.8`.
- `npm ci`: passed; 184 packages installed; 0 vulnerabilities.
- `npm test`: passed.
  - Vitest: 7/7 passed.
  - Playwright 1.58.2: 13 passed, 3 intentional cross-project skips. The skipped duplicates are exercised in the applicable desktop or mobile project.
- `npm run typecheck`: passed (`tsc --noEmit`).
- No lint script or lint configuration exists; TypeScript is the available static-analysis gate.
- `npm audit --audit-level=high`: passed with 0 vulnerabilities.
- Exact production command `npm run build`: passed and produced `dist/site/`, the MV3 build, finalized service worker, and downloadable ZIP.
- `unzip -t dist/site/downloads/code-lesson-replay.zip`: every member passed.

Build sizes:

| Artifact | Uncompressed size |
| --- | ---: |
| Initial site JS | 4,193 B |
| Home CSS | 9,899 B |
| Hero AVIF | 45,932 B |
| Extension entry JS | 23.13 KB |
| Extension CSS | 15.23 KB |
| Packaged extension ZIP | 163,005 B |

The static JS, CSS, font (none), and hero-image budgets all pass.

## End-to-end product exercise

The exact packaged MV3 artifact was extracted and loaded in a clean Chromium profile. A second clean profile acted as the tutor.

- Popup: correct title and `lang=en`, one `h1`, one `main`, visible 3 px focus ring, 0 serious/critical axe findings, no console errors, and keyboard activation opened the replay studio.
- Fresh-state malformed JSON produced an announced, actionable error.
- A whitespace-only title was rejected; a valid titled replay was created.
- Recorded a failed command/output with a hypothesis and extreme negative exit code, an explicitly excluded private command, a named before/after file diff, and a reasoning note.
- Assignment, URL credential, Bearer, AWS-style, and custom-word secrets were replaced before persistence. None of the original secret values or excluded command/output appeared in `chrome.storage.local` or the exported JSON.
- Export produced `boundary-recovery-lesson.lesson-replay.json`, schema `code-lesson-replay/v1`, with all four ordered steps and preserved file snapshots. The excluded step contained no command field.
- A fresh tutor profile imported that exported file, immediately showed the first masked hypothesis, and reached the explicit private-command gap with Right Arrow. Measured import-to-identification time was 1,297 ms, well under the brief's three-minute success measure.
- Reload preserved the local replay.
- Import boundaries: exactly 500 steps accepted; 501 steps rejected; 5,000,001 bytes rejected; a valid bundle imported successfully after both errors.
- Populated studio: 0 serious/critical axe findings, no console/page errors, no failed requests.

## Accessibility, responsive behavior, and visual review

- `/opt/fleet/lib/verify-url.sh` passed against both the clean local production build and live URL: HTTP 200, title, `lang=en`, one `h1`, one `main`, complete image alternatives, labelled buttons, and no console errors.
- Independent Playwright + axe checks found 0 serious/critical findings on live home, privacy, terms, extension popup, and populated extension studio.
- Keyboard-only checks reached the skip link first, then navigation, download, purchase, restore, and legal controls. The skip link had a visible `3px rgb(23, 70, 180)` outline. Extension tabs support Left/Right/Home and retain focus.
- At 390 × 844, home, privacy, terms, and the populated extension had no horizontal overflow and no visible link/button target below 44 × 44 CSS px.
- Desktop 1440 × 900 and 390 × 844 screenshots were visually inspected. Content remained legible, hierarchy and annotated-bench-sheet identity were intact, and controls did not overlap or clip.
- With `prefers-reduced-motion: reduce`, the site used automatic scrolling and the extension reduced animation/transition durations to `0.01ms`.
- The documented single-mode palette is explicit; no unclaimed dark treatment was expected.

## Live deployment identity

The following live responses were byte-for-byte identical to the fresh candidate build:

| Path | SHA-256 |
| --- | --- |
| `/` | `1068748b1a36c8b6452355a627fcbb414c9775c7e53769e4c60d0d7c41ccc928` |
| `/privacy/` | `f8b149bb8b77fbd510485bf6f9fbedd7c9314581c5dffaf9f988a1a592a1cc7a` |
| `/terms/` | `c3e1452c889f1bbecf36d6be7a66643a6238cfd6e6412eab871bde68df3607a7` |
| `/assets/home-CXhQgx1y.js` | `38a59b669b19ce93ab8c7bf946c794cf63064c28cbc1063ab1a192352a04841a` |
| `/assets/home-Dc217WCh.css` | `4c336d85921782e8e6d4befeacd467cdcadcef9bc9859e4328b1fbfa22b3e99b` |
| `/assets/replay-bench-cedf2dcd3c.avif` | `cedf2dcd3cf811b170c6cd36c516a613e50da9bdd5132c8c1f38e6fcfb66e9f2` |
| `/sw.js` | `c9994e2ad1b320aa45e44c446069db5f4a1604b6b27f1d20ceeca58d356edfc6` |
| `/downloads/code-lesson-replay.zip` | `ce9bebe16028cdcb40c23ef5baf8101692363709caeb047794d2186bac0e9b96` |

The live ZIP returned `200 application/zip`, was 163,005 bytes, had attachment disposition, passed `unzip -t`, and was the package used for the popup smoke test. The live deployment therefore matches the candidate for all executable/public product artifacts checked.

## Privacy, networking, response policy, and offline behavior

- A fresh normal live load made six requests, all to the product's own origin. No analytics, trackers, third-party fonts, or third-party runtime scripts loaded.
- The extension made no HTTP request during free capture/import/export. Its manifest permissions are only `storage`; its sole host permission is `https://api.sociobot.in/*`. There are no content scripts or camera, microphone, screen, tab-capture, or arbitrary page-read permissions.
- License verification occurs only after a token is supplied. Invalid-token UI recovery was clear and kept the free product usable.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, denied camera/microphone/geolocation, and CSP limited to self plus `api.sociobot.in` for connections/forms, with `frame-ancestors 'none'` and `base-uri 'self'`.
- Hashed JS/CSS/AVIF responses use `Cache-Control: public, max-age=31536000, immutable`; a matching ETag request returned 304. The ZIP uses a one-hour public cache. HTML and `sw.js` use 30-second revalidation. A missing asset returned 404 rather than an HTML success fallback.
- The live service worker updated successfully, was `activated`, and left only cache `lesson-replay-site-2fcdd7008402`. After clearing the normal browser HTTP cache and switching fully offline, a new navigation remained styled and interactive with no MIME, module, stylesheet, console, page, or failed-request errors.
- `/privacy/`, `/terms/`, MIT `LICENSE`, README operations/deployment documentation, the visual thesis, and generated-image provenance are present.

## Live performance

Fresh Lighthouse 12.8.2 mobile result:

- Performance 97
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.0 s
- LCP 1.1 s
- TBT 180 ms
- CLS 0
- Speed Index 1.0 s
- Total transfer 56 KiB

## Scope note

The researched brief says “VS Code extension,” while the factory work order explicitly selects a deployed browser-extension artifact. This verification assessed the delivered MV3, manual opt-in companion under that explicit stack decision. It does not claim native desktop VS Code API integration, and the README states that limitation plainly.

## Retest required

After the factory enables the production billing product, verify that the exact Buy links redirect to hosted checkout and complete one real production purchase through return-token storage, license verification, extension restore, and refund/revocation. All other acceptance areas passed in this run.
