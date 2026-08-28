# Repair handoff — Code Lesson Replay

## Result: repository repair complete; production billing registration remains blocked externally

Repair commit: `67303e46d05d232501f3a4c6f3d297117b2ea75c` (pushed to `origin/main`).

The independent verifier's sole remaining release blocker was reproduced on 2026-08-28 UTC: production checkout for `remote-code-lesson-replay` returns `404 application/json` with `{"error":"enabled factory product","status":404}`. The public production catalog at `https://api.sociobot.in/api/v1/products` also does not contain this slug, while the invalid-token verification endpoint remains healthy (`200`, `Cache-Control: no-store`, `valid:false`). This proves the root cause is missing factory billing registration, not an incorrect site or extension URL.

The factory contract reserves billing registration to the factory; this repository contains no registration tool or billing credential. I did not alter the researched product, its production API URL, or its already-passing local replay behavior.

## What changed

- Added `npm run verify:billing`, a non-mutating live release gate. It requires the exact product catalog record (`$19` / `1900 USD`, canonical product URL, canonical production checkout URL) and a secure hosted-checkout redirect.
- Added exact regression tests for both failure modes: an absent catalog product and the verifier's HTTP 404 checkout response. A redirect without an HTTPS `Location` is also rejected.
- Documented the release gate in the README.

This turns the former silent external dependency into an explicit, repeatable release check. It intentionally fails until the factory registers/enables the paid product.

## Verification evidence

Clean install and local production verification were run from this worktree:

- `npm ci` — passed; 184 packages; 0 audit vulnerabilities.
- `npm test` — passed: 9 Vitest tests; Playwright 13 passed with 3 intentional cross-project skips. This includes the packaged MV3 student capture/export/tutor import journey, keyboard tabs/playback, 390 px target/overflow checks, axe serious/critical checks, service-worker offline reload, and license return/restore behavior.
- `npm run typecheck` — passed.
- `npm audit --audit-level=high` — passed, 0 vulnerabilities.
- `npm run build` — passed. `dist/site/downloads/code-lesson-replay.zip` is valid (`unzip -t`) and is 163,005 bytes. Initial site JS is 4,193 bytes, home CSS 9,899 bytes, and the AVIF hero 45,932 bytes.
- `/opt/fleet/lib/verify-url.sh` against the local production preview — passed: title, `lang=en`, one `h1`, `main`, complete image alternatives, labelled controls, and no console errors.
- Playwright axe checks found no serious or critical violations. The standalone axe CLI could not launch in this container because its Selenium runner cannot discover the Playwright-only Chromium binary; the project’s pinned Playwright/axe integration is the authoritative passing check.
- Local Lighthouse 12.8.2 — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.4 s, TBT 0 ms, CLS 0.

## Deployment and live evidence

Deployed `dist/site` with the static work-order configuration on 2026-08-28 UTC. Azure Static Web Apps deployment `e8200410-fa6a-4793-9663-b03fcc55457f` succeeded; `https://remote-code-lesson-replay.sociobot.in/` is reachable.

- Live `verify-url.sh` passed at 886 ms with no console errors and the same title/lang/landmark/image/label checks.
- Live hashed JavaScript returns `200 text/javascript` with `Cache-Control: public, max-age=31536000, immutable`.
- Live downloadable extension returns `200 application/zip`, `Content-Disposition: attachment`, and 163,005 bytes.
- Live headers retain HSTS, `nosniff`, strict-origin referrer policy, self-only CSP with the production Sociobot API allowed only for connect/forms, `frame-ancestors 'none'`, and camera/microphone/geolocation denial.
- `npm run verify:billing` currently fails as designed: `production catalog does not contain remote-code-lesson-replay`.

## Required factory action before release acceptance

Register and enable the live Sociobot/Dodo product with slug `remote-code-lesson-replay`, price `$19 USD`, and return/product URL `https://remote-code-lesson-replay.sociobot.in/`. Then run:

```bash
npm run verify:billing
```

It must pass before retesting a real purchase, return-token storage, extension restore/verification, and refund/revocation. No safe repository-only change can make that live checkout exist.
