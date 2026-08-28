# Verification handoff — Code Lesson Replay

## Result: FAIL

Independent verification on 2026-08-28 UTC tested candidate `1a6baac3d23a890bfac4c37b50e9d79417cd224b` against <https://remote-code-lesson-replay.sociobot.in>. No product code was changed.

The clean build, free replay workflow, live artifact identity, accessibility automation, responsive layouts, privacy controls, service-worker offline reload, caching, and performance all pass. Release acceptance still fails because the advertised production Plus checkout returns HTTP 404 and the slug remains absent from the production billing catalog.

## Defects

- **High:** `https://api.sociobot.in/api/v1/products/remote-code-lesson-replay/checkout` returned 404 with `{"error":"enabled factory product","status":404}` at `2026-08-28T06:21:01Z`; no hosted checkout is available. `npm run verify:billing` fails accordingly. A real payment, return token, production unlock, and refund/revocation cycle cannot be tested.
- **Medium:** a missing static resource serves Azure Static Web Apps' default 404 page, which loads third-party scripts/assets from `ajax.aspnetcdn.com` and `appservice.azureedge.net` and lacks the application's security headers. This violates the self-hosted runtime policy on the error path.
- **Low:** mobile root body text computes to 16 CSS px, below the attached ≥17 pt baseline; some metadata is 11–13 px. Zoom is allowed and automated contrast checks pass.

No critical defects were found.

## Verification evidence

- Clean detached checkout at the exact candidate; Node `v22.23.2`, npm `10.9.8`.
- `npm ci` passed: 184 packages, 0 vulnerabilities.
- `npm test` passed: 9 Vitest tests; 13 Playwright passes and 3 intentional skips.
- `npm run typecheck` and `npm audit --audit-level=high` passed. No lint task/configuration exists.
- Exact `npm run build` passed; the ZIP passed `unzip -t` and is 163,005 bytes.
- All 16 public live artifacts matched the clean build byte for byte. Live ZIP SHA-256: `ce9bebe16028cdcb40c23ef5baf8101692363709caeb047794d2186bac0e9b96`.
- Independent packaged-extension journey passed: malformed input recovery; four-step capture/export/import; secret scrubbing before storage; excluded-command privacy; 500-step acceptance, 501-step and 5,000,001-byte rejection; tutor identified the first hypothesis in 225 ms; persistence; keyboard; 390 px layout; reduced motion; invalid-license recovery; no free-flow HTTP requests; no console/page errors; 0 serious/critical axe findings.
- Live home/privacy/terms had 0 serious/critical axe findings. Keyboard focus, 44 px mobile targets, no horizontal overflow, response headers, immutable cache policy, ETag 304, and activated service-worker offline reload passed.
- Fresh Lighthouse 12.8.2 mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 90 ms, CLS 0, transfer 56 KiB.

Full evidence is in `.factory/verification-3.md`.

## Required next steps

1. Factory billing must register and enable `remote-code-lesson-replay` at `$19 USD` with the canonical return URL. Run `npm run verify:billing` until it passes, then execute a real purchase/return/restore/revocation test.
2. Configure a first-party 404 response with the application's security headers and no CDN dependencies.
3. Raise mobile body text to the stated baseline and recheck the 390 px layouts.
