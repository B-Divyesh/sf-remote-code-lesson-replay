# Independent verification 4 — FAIL

Verified 2026-08-28 UTC against candidate commit `b1342bbee05c5ef493896ab0218d97526dabdbc2` and <https://remote-code-lesson-replay.sociobot.in>.

## Verdict

**FAIL.** The deployed landing site and extension ZIP are byte-for-byte the fresh candidate build, and the local-first free replay workflow passes. Two release-required production services do not: the advertised $19 checkout is not registered/enabled, and the license-verification API did not rate-limit a rapid 80-request burst. These are factory/deployment dependencies, but they prevent acceptance of the paid product as shipped.

## Defects by severity

### High

1. **Production checkout is unavailable.** `npm run verify:billing` fails with `production catalog does not contain remote-code-lesson-replay`. At 2026-08-28 UTC, `GET https://api.sociobot.in/api/v1/products/remote-code-lesson-replay/checkout` returned `404 application/json`, body `{"error":"enabled factory product","status":404}`, rather than a hosted-checkout redirect. The public site and MV3 package both advertise this $19 one-time purchase, so it cannot be completed. An invalid-token request to the adjacent verification endpoint is otherwise healthy (`200`, `valid:false`, `Cache-Control: no-store`, correct product-origin CORS).

2. **The product-unlock verification endpoint did not enforce observable rate limiting.** A single invalid-license verify request returned `200`. A subsequent burst of 80 requests in about five seconds (20 concurrent) all returned `200`; none returned `429` or a `Retry-After` header. Thus the observed threshold is **greater than 80 requests per burst / not observed**, which does not satisfy the work-order rate-limit requirement. This concerns `https://api.sociobot.in/api/v1/products/remote-code-lesson-replay/verify` and requires factory API remediation.

### Medium

None.

### Low

1. **Unknown document routes are successful landing-page responses.** `/does-not-exist` returns the home document with HTTP `200`, whereas excluded missing resources correctly return the self-hosted security-header-protected 404. This follows the configured navigation fallback, but is misleading for this static, non-client-routed site; use a genuine document 404 fallback if that behavior is not intentional.

## Clean candidate evidence

- Started from clean `main` at exactly `b1342bbee05c5ef493896ab0218d97526dabdbc2`; worktree was clean before verification.
- `npm ci` passed (184 packages, 0 audit vulnerabilities).
- `npm test` passed: Vitest **9/9** and Playwright **16/16** (desktop/mobile projects; the authored desktop-only checks are intentionally skipped only in the duplicate mobile project).
- `npm run typecheck` passed. There is no lint script or lint configuration; TypeScript is the available static check.
- Exact `npm run build` passed and produced `dist/site/`, `.output/chrome-mv3/`, and `dist/site/downloads/code-lesson-replay.zip`; `unzip -t` passed.
- `npm run verify:billing` failed for the High checkout defect above.

Build budgets pass: initial site JS 4,220 B, site CSS 10,079 B, no downloaded fonts, hero AVIF 45,932 B, extension entry JS 23,125 B, extension CSS 15,457 B, and downloadable ZIP 163,172 B. All are within the stated budgets.

## Independent product exercise

The exact ZIP downloaded from production was extracted and loaded into a clean persistent Chromium profile (not the repository directory).

- Fresh malformed JSON gives the announced recovery error. Whitespace-only titles are rejected with the visible-character validation message.
- Created a replay with a failed command/output and hypothesis, an explicitly excluded private command, a named before/after file diff, and a reasoning note. Export was a `code-lesson-replay/v1` bundle in order.
- `API_TOKEN=qa-secret` and a Bearer token were masked before extension storage and export. Neither those strings nor unique excluded command/output strings occurred in persisted storage or export. The free flow made no HTTP(S) request; only extension-origin resources loaded.
- Boundary exercise: an import with exactly 500 valid steps opened; 501 steps was rejected while retaining the current 500-step replay; a 5,000,001-byte input was rejected; a valid one-step bundle then imported successfully.
- The populated extension had 0 axe serious/critical findings and no console/page errors. It supports keyboard tab movement/playback and local reload persistence.

## Live deployment, browser, policy, and performance evidence

Production matches the fresh candidate exactly:

| Artifact | SHA-256 |
| --- | --- |
| `/` | `5add472fbe168f8a73c06e4368b951860d08ff3b6fd7181ca624345319d5277d` |
| `/assets/home-BE6J7CbI.js` | `e7e6b5e04b9b5d4022e113608b5c7a2862b00f56a361c52cf7fc68b312eda4e5` |
| `/downloads/code-lesson-replay.zip` | `b5e90d89422c74a99c82841b4b51dd72f3330ac0288081248fd0a9c96b4cf456` |

- Desktop and 390 × 844 mobile live pages had one title/language/main/h1, no horizontal overflow, a 17 px mobile body, 3 px visible blue focus outline, no console/page errors, and 0 axe serious/critical findings. Keyboard activation opened the restore form and focused its token field.
- Reduced motion computed `scroll-behavior: auto` and 0.01 ms animation/transition durations. A production service worker activated; a fully offline reload remained interactive with no errors.
- Normal live loads requested only the product origin. There are no external fonts, analytics, trackers, or runtime third-party scripts. The manifest has only `storage` plus its documented Sociobot API host permission; no content scripts, camera, microphone, screen, tab, or arbitrary-key capture permissions exist. There is no sign-in flow.
- Live application responses have self-only CSP (except documented Sociobot API connection/form use), `frame-ancestors 'none'`, `base-uri 'self'`, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation denial. Hashed assets are immutable for one year; HTML and `sw.js` revalidate at 30 seconds; ZIP is `application/zip`, attachment, one-hour cached. Missing excluded assets return first-party `404` with the same policies.
- Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 0 ms, CLS 0, total transfer 56 KiB. Lighthouse emitted a final browser-tab-crash warning after producing the complete report; the metrics JSON was written and no page/browser errors occurred in the independent Playwright runs.

## Required retest

Factory operations must register and enable the exact production product at $19 with return URL `https://remote-code-lesson-replay.sociobot.in/`, then make `npm run verify:billing` pass and verify a real checkout, return token, extension restore, and revocation/refund cycle. Add API rate limiting that returns `429` with `Retry-After`, then repeat the burst test. If document-route 404s are required, remove or narrow the current navigation fallback and retest.
