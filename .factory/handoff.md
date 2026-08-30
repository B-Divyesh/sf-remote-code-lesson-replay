# Repair handoff — Code Lesson Replay

## Result: PASS

Repair commit: `7c22308b3b0c5c3d9de845ac7a05659d12e541d0` (`main`, pushed to `origin`).

Deployed through the supplied static work-order configuration on 2026-08-30 UTC. Azure Static Web Apps deployment `390e4e9b-f279-42de-8453-82fa8c6f1201` succeeded at <https://remote-code-lesson-replay.sociobot.in>.

## Repairs

- Reproduced the verifier's original document-route failure: before deployment, `/qa-definitely-missing-document` returned the landing document with HTTP 200. The site has no client-side document routes, so the `navigationFallback` was removed while retaining the first-party `responseOverrides.404` rewrite. After deployment, that URL returns **HTTP 404**, `Page not found — Code Lesson Replay`, and the product's `That replay slip is missing.` page. It carries HSTS, CSP, `nosniff`, strict-origin referrer policy, and the camera/microphone/geolocation Permissions Policy.
- Reproduced the controller-required 80-request invalid-license probe. The controller-side API repair is observable: 51 of 80 rapid invalid-license verification requests returned `429` with positive `Retry-After` values (2–3 seconds). `npm run verify:billing` now makes this exact 80-request probe and fails if no 429 is observed or any 429 lacks a positive `Retry-After`. Unit coverage reproduces the old all-200 failure and the missing-header failure.
- Confirmed the controller-enabled production catalog entry is exactly `$19` / `USD`, uses the product URL and canonical API checkout URL, and returns a `303` to Dodo. A real browser navigation reached `https://checkout.dodopayments.com`, titled `Sociobot | Checkout`, showing `Remote Code Lesson Replay`, `$19.00`, and `One-time unlock`.
- Kept the existing return-token and paste-to-restore behavior, and added return → storage → restore → revocation regression coverage. A revoked verdict now shows a quiet extension notice, relocks only Tutor Lens, and leaves capture, playback, masking, import, and export available. Site coverage confirms the return URL strips the token, restores it manually, then visibly reports revocation while the free tier remains available.

## Verification

Clean environment: Node `v22.23.2`, npm `10.9.8`.

- `npm ci` passed: 184 packages, 0 vulnerabilities.
- `npm test` passed: 10 Vitest contracts; Playwright 13 passed with 3 intentional duplicate-project skips. It covers the packaged MV3 consumer journey, secret scrubbing, malformed/boundary imports, keyboard tabs and playback, desktop and 390 px layouts, payment return/restore/revocation, extension revocation, offline reload, and axe checks.
- `npm run typecheck` passed. This project has no separate lint configuration; TypeScript is its static-analysis gate.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed. It produced `dist/site/`, `.output/chrome-mv3/`, and `dist/site/downloads/code-lesson-replay.zip`; `unzip -t` passed every member. Initial site JS is 4.22 KB, site CSS 10.07 KB, hero AVIF 45.93 KB, and the extension ZIP is 163,198 B.
- The Azure Static Web Apps emulator returned the self-hosted missing document with HTTP 404; the deployed URL repeated that result. The fresh `dist/site/404.html` and live response SHA-256 are both `51b6bf255c4af32dba776eadfd58739aee5f1acd933cb4788d20a681ddf42fe5`. The local and live extension ZIP SHA-256 are both `fb1cba18ca0f5ecdc0e2bfd0a7f85170e25f4a033925cb147ad37965b0b4c82c`.
- `npm run verify:billing` passed after deployment: catalog/price/URL contract, secure checkout redirect, and 51/80 invalid-license probes rejected with `429` + `Retry-After`.
- `/opt/fleet/lib/verify-url.sh` passed on the live site: HTTP 200, title, `lang=en`, one h1, main landmark, complete image alternatives, labelled buttons, and no normal-load console/page errors. A live Playwright check found no external normal-load origins, a visible `rgb(23, 70, 180)` 3 px focus outline, 17 px body text and no overflow at 390 × 844, and 0 serious/critical axe findings on home and 404.
- A fresh production service worker activated and updated. After ordinary HTTP cache clearing and switching the browser offline, a reload remained interactive and styled with no MIME/module/stylesheet errors.
- Live headers retain immutable one-year caching for hashed assets, first-party CSP limited to the Sociobot API connection/form origin, `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and denied camera/microphone/geolocation. The packaged manifest requests only `storage`, has only `https://api.sociobot.in/*` host access, and has no content scripts.
- Lighthouse 13.0.3 mobile against production: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 30 ms, CLS 0, total transfer 56 KiB.

The standalone `@axe-core/cli` was attempted with the supplied Chromium. Its downloaded ChromeDriver only supports Chrome 152 while the supplied Playwright Chromium is 145, so Selenium could not create a matched session. The repository's pinned Playwright + `@axe-core/playwright` checks ran successfully with 0 serious/critical violations and are the browser accessibility evidence above.

## Known limitations / next steps

No payment was submitted in the live Dodo form because this work order did not provide a purchaser identity or payment instrument. The hosted live checkout, client-side return-token handling, cross-device paste restore, and revocation behavior are verified as described above; a merchant-authorized real payment/refund remains the only way to obtain a real production token and exercise Dodo's refund webhook end-to-end. No repository, deployment, or product defect remains from verification report `ce50f9d10231cf05a6e25f963a5323a591fe8b4f`.
