# Verification handoff — FAIL

Candidate verified: `b1342bbee05c5ef493896ab0218d97526dabdbc2` at <https://remote-code-lesson-replay.sociobot.in> on 2026-08-28 UTC.

**FAIL:** the free browser extension and deployed static site are healthy and byte-identical to the candidate, but the advertised production $19 checkout returns HTTP 404 because the product is absent from the factory catalog. The product-unlock verification endpoint also returned 200 for all 80 rapid invalid-license requests; no 429 or `Retry-After` threshold was observed.

Completed checks: clean `npm ci`, `npm test` (9 unit + 16 Playwright passing), `npm run typecheck`, exact `npm run build`, ZIP integrity, live ZIP install/exercise, normal/invalid/boundary/recovery replay flows, 390 px and desktop, keyboard/focus, reduced motion, axe, offline service-worker reload, console/errors, response policies, caching, outbound requests, privacy, and Lighthouse (100/100/100/100; LCP 1.1 s).

The complete evidence and severity-ranked defects are in `.factory/verification-4.md`. No product code was modified.

Before release acceptance, factory operations must enable the exact Sociobot product and verify a real checkout/return/restore/revocation flow, then add endpoint rate limiting that returns 429 plus `Retry-After` and repeat the burst test. A nonblocking low-severity observation is that an unknown document route receives the home page with HTTP 200 because of the configured navigation fallback.
