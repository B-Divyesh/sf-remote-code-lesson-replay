# Independent verification 3 — FAIL

Verified on 2026-08-28 UTC for candidate commit `1a6baac3d23a890bfac4c37b50e9d79417cd224b` and <https://remote-code-lesson-replay.sociobot.in>.

## Verdict

**FAIL.** The candidate builds reproducibly, the deployed application and downloadable extension match the clean build byte for byte, and the free student-to-tutor workflow passes. The advertised production one-time purchase remains unavailable: its checkout returns HTTP 404 and the product is absent from the production billing catalog. A second deployment defect causes missing static-resource pages to load third-party CDN scripts, contrary to the self-hosted privacy contract.

## Defects by severity

### Critical

None found.

### High

1. **The advertised production Plus checkout cannot be completed.**
   - At `2026-08-28T06:20:59Z`, the production catalog returned zero records for `remote-code-lesson-replay`.
   - `GET https://api.sociobot.in/api/v1/products/remote-code-lesson-replay/checkout` returned HTTP 404, no redirect, and `{"error":"enabled factory product","status":404}`.
   - The live page and extension both advertise Plus for `$19` one-time and point to that canonical production URL. A buyer reaches an API error instead of hosted checkout.
   - `npm run verify:billing` fails from the clean candidate checkout with `production catalog does not contain remote-code-lesson-replay`.
   - The adjacent verification service is healthy: a fresh invalid token returned HTTP 200, `Cache-Control: no-store`, correct CORS for the product origin, and `{"expires_at":null,"reason":"invalid","valid":false}`. The site and extension both recovered visibly from an invalid token while leaving free features available.
   - Because checkout cannot start, a real payment return, production license unlock, and refund/revocation cycle cannot be tested.

### Medium

1. **The deployed 404 error path violates the no-third-party-script policy.**
   - A fresh browser navigation to `/assets/qa-definitely-missing.js` correctly returned HTTP 404, but served Azure Static Web Apps' default HTML error page.
   - That page made requests to `https://ajax.aspnetcdn.com` and `https://appservice.azureedge.net`, including third-party jQuery, Bootstrap, localization JavaScript, CSS, and images. The response also lacked the product's CSP, HSTS, referrer, `nosniff`, and permissions headers.
   - Normal product loads remain clean and self-hosted; this defect is confined to the host-generated error response. Configure a first-party 404 response carrying the same security headers and no remote assets.

### Low

1. **Mobile body text does not meet the attached ≥17 pt baseline.** The site and extension set their root body text to 16 CSS px at 390 px, and some metadata is 11–13 px. The layouts remain usable, zoom is not disabled, contrast passes, and axe reports no serious/critical findings, but this misses the work order's stated mobile typography baseline.

## Clean-checkout gates

The candidate was checked out as detached HEAD in a new temporary Git worktree before installation.

- Commit: exactly `1a6baac3d23a890bfac4c37b50e9d79417cd224b`; clean before and after the build.
- Runtime: Node `v22.23.2`; npm `10.9.8`.
- `npm ci`: passed; 184 packages installed; 0 vulnerabilities.
- `npm test`: passed. Vitest: 9/9. Playwright 1.58.2: 13 passed, 3 intentional cross-project skips.
- `npm run typecheck`: passed.
- No lint script or lint configuration exists; TypeScript is the repository's available static-analysis gate.
- `npm audit --audit-level=high`: passed with 0 vulnerabilities.
- Exact production command `npm run build`: passed and produced `dist/site/`, the MV3 extension, versioned service worker, and downloadable ZIP.
- `unzip -t dist/site/downloads/code-lesson-replay.zip`: every member passed.

Build budgets:

| Artifact | Uncompressed size | Budget/result |
| --- | ---: | --- |
| Initial site JavaScript | 4,193 B | ≤ 200 KB, pass |
| Home CSS | 9,899 B | ≤ 50 KB, pass |
| Fonts | 0 B | ≤ 120 KB, pass |
| Hero AVIF | 45,932 B | ≤ 300 KB, pass |
| Extension entry JavaScript | 23.13 KB | pass |
| Extension CSS | 15.23 KB | pass |
| Packaged extension ZIP | 163,005 B | valid |

## Independent end-to-end exercise

The exact clean-build MV3 ZIP was extracted and loaded into isolated Chromium profiles for a student and tutor.

- Verified popup title/language/landmarks, one `h1`, visible 3 px focus ring, keyboard activation, no console errors, and 0 serious/critical axe findings.
- Recovered from malformed JSON and a whitespace-only title, then created a valid replay.
- Added a failed command with an extreme negative exit code, an excluded private command, a named before/after file diff, and a reasoning note.
- Assignment, URL credential, Bearer, AWS-style, and custom-word secrets were masked before persistence. None of the original secrets or excluded command/output appeared in `chrome.storage.local` or exported JSON.
- Exported a valid `code-lesson-replay/v1` bundle with four ordered steps and preserved snapshots. The excluded step had no command field.
- A fresh tutor profile imported the bundle and exposed the first wrong hypothesis in 225 ms, well below the brief's three-minute target. Arrow-key playback reached the explicit private gap; reload preserved the replay.
- Import boundaries: 500 steps accepted; 501 rejected without replacing current work; 5,000,001 bytes rejected; a valid import succeeded after both failures.
- Before license use, the free extension made zero HTTP(S) requests. Supplying an invalid license made exactly one request to the documented Sociobot verification endpoint, returned an actionable alert, and preserved the free replay.
- The manifest requests only `storage`, with host access limited to `https://api.sociobot.in/*`; it contains no content scripts or capture permissions.

## Accessibility, responsive behavior, and visual review

- `/opt/fleet/lib/verify-url.sh` passed for both the clean local production preview and live URL: HTTP 200, correct title and `lang=en`, one `h1`, `main`, complete image alternatives, labelled buttons, and no console errors.
- Playwright with axe found 0 serious/critical findings on live home, privacy, and terms pages and on the populated extension.
- Keyboard-only checks reached the skip link first and opened the restore-license UI with Enter. The skip link's focus outline computed to `rgb(23, 70, 180) solid 3px`; the extension's modal initially focused its close button, and tabs/playback support arrow keys.
- At 390 × 844, the live pages and populated extension had no horizontal overflow and no visible link, button, or input target below 44 × 44 CSS px.
- At `prefers-reduced-motion: reduce`, scroll behavior was `auto` and animation/transition durations computed to `0.01ms` (`1e-05s`).
- Desktop and 390 px full-page screenshots were inspected. Hierarchy, content, controls, and the annotated-bench-sheet identity remained legible without clipping or overlap.
- The visual thesis documents its single-mode palette, typography, spacing, motion, original generated-image prompt, provenance, and footer disclosure.

## Live deployment identity

All 16 public build artifacts were downloaded from production and matched the fresh candidate build byte for byte. Representative SHA-256 values:

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

The candidate itself changes only `.factory/handoff.md` relative to its parent, so executable output is expected to remain identical. Production `Last-Modified` was `2026-08-28 05:56:44 GMT` during this run.

## Privacy, response policy, caching, and offline behavior

- A fresh normal home load requested only the product origin. The only expected external request during testing was an explicitly initiated license verification to `api.sociobot.in`.
- Live application responses include HSTS, `nosniff`, strict-origin referrer policy, camera/microphone/geolocation denial, and CSP restricted to self plus the Sociobot API for connections/forms, with `frame-ancestors 'none'` and `base-uri 'self'`.
- Hashed JS/CSS/images use `Cache-Control: public, max-age=31536000, immutable`; an ETag revalidation returned 304. HTML and `sw.js` use 30-second revalidation. The ZIP uses a one-hour public cache, `application/zip`, and attachment disposition.
- The service worker updated successfully, reached `activated`, and retained only `lesson-replay-site-2fcdd7008402`. After clearing the HTTP cache and switching fully offline, a new navigation remained styled and interactive with the offline status visible and no failed requests, console errors, or page errors.
- Privacy and terms pages, MIT license, README run/test/deploy instructions, and local-first disclosures are present.

## Live performance

Fresh Lighthouse 12.8.2 mobile result at `2026-08-28T06:23:54Z`:

- Performance 99
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.0 s; LCP 1.1 s; TBT 90 ms; CLS 0; Speed Index 1.1 s
- Total transfer 56 KiB

## Scope note and required retest

The researched brief says “VS Code extension,” while the factory work order explicitly selects a deployed browser-extension artifact. This verification assessed the delivered MV3 manual opt-in companion; the README accurately states that it does not provide native desktop VS Code API integration.

Before release acceptance, register and enable the product in production billing, then require `npm run verify:billing` to pass and complete a real checkout, return-token, verification, extension restore, and refund/revocation test. Replace the platform default 404 with a self-hosted, policy-header-protected error response and raise the mobile base text to the stated baseline.
