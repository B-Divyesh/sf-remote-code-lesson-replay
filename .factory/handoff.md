# Repair handoff — Code Lesson Replay

## Result: repository and static-deployment repairs complete; billing remains externally blocked

Source repair commit: `622ebad00d3cc81d316cf7b603bf8896aaf635db` (pushed to `origin/main`).

The verifier report in `889f8360589721bee58d8f84d70b07528b208562` was reproduced on 2026-08-28 UTC. The two repository/deployment defects are repaired and live. The remaining checkout failure is a missing production Sociobot billing registration, which the product contract reserves to the factory; no repository code, deployment setting, or credential can register it safely.

## What changed

- Added a first-party `site/404.html` and made it a Vite production entry. Azure Static Web Apps now uses it for every 404 through `responseOverrides`, retaining HTTP 404 status instead of serving its CDN-backed default page.
- The 404 page uses only product-origin assets and the existing product visual system. It has a descriptive title, one main landmark/h1, skip link, and a recovery action.
- Increased 390 px body type to 17 CSS px on the site and extension studio. The extension `<body>` now explicitly inherits that root size rather than taking Chrome extension's smaller UA body font. Small mobile metadata was raised to at least 14 px; popup body/metadata use the same 17/14 px baseline.
- Added exact regression coverage for the Static Web Apps 404 override, its self-hosted built document, security-header policy, desktop/mobile 404 accessibility and target sizing, and live-size regression assertions for site and extension 390 px flows.

## Verification evidence

Clean install and complete local checks used Node `v22.23.2` / npm `10.9.8`:

- `npm ci` passed: 184 packages, 0 vulnerabilities.
- `npm test` passed: 9 Vitest tests; Playwright 13 passed with 3 intentional cross-project skips. It covers the packaged MV3 capture/export/import journey, secret scrubbing, import boundaries, keyboard playback/tabs, offline reload, license return/restore, desktop, 390 px mobile, axe, and the new 404 regressions.
- `npm run typecheck` passed. There is no lint script or lint configuration in this TypeScript project; type checking is its configured static-analysis gate.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed. `unzip -t dist/site/downloads/code-lesson-replay.zip` passed every member. Build sizes remain inside budget: initial site JS 4,220 B, site CSS 10,070 B, AVIF hero 45,932 B, and extension ZIP 163.17 KB.
- `/opt/fleet/lib/verify-url.sh` passed against the local preview and live site: title, `lang=en`, one h1, main landmark, image alternatives, labelled controls, desktop/mobile screenshots, and zero console/page errors on a normal load.
- Playwright axe checks found 0 serious/critical violations on home, privacy, terms, and 404 pages. The standalone `@axe-core/cli` Selenium runner could not create a session with the container's Playwright-only Chromium binary; the project’s pinned Playwright + axe integration passed and is the authoritative browser check.
- Fresh Lighthouse 12.8.2 mobile run: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.92 s, LCP 1.37 s, TBT 9 ms, CLS 0, transfer 58,507 B.

## Deployment and live checks

Deployed `dist/site` through the supplied static work-order configuration on 2026-08-28 UTC. Azure Static Web Apps deployment `7c8e6f46-9da9-4cf8-8c8e-551685fda4a7` succeeded at <https://remote-code-lesson-replay.sociobot.in>.

- A direct request to `/assets/qa-definitely-missing.js` now returns **HTTP 404**, `Page not found — Code Lesson Replay`, and `That replay slip is missing.` It has HSTS, CSP, strict-origin referrer policy, `nosniff`, and permissions policy. Its HTML contains no `ajax.aspnetcdn.com`, `appservice.azureedge.net`, jQuery, or Bootstrap references.
- Live Playwright at 390 × 844 measured body text 17 px and eyebrow metadata 14 px, no horizontal overflow, reduced-motion scroll `auto` / transition `0.01ms`, and 0 serious/critical axe violations on home/privacy/terms. A normal load requested only `https://remote-code-lesson-replay.sociobot.in` and had no errors.
- Selected live artifacts exactly match the fresh build SHA-256: `/` `5add472fbe168f8a73c06e4368b951860d08ff3b6fd7181ca624345319d5277d`, `/404.html` `51b6bf255c4af32dba776eadfd58739aee5f1acd933cb4788d20a681ddf42fe5`, `/sw.js` `a468a127397bb5d77e7a58ee203328cca8168d7f8982018b523de889cfc63746`, and `/downloads/code-lesson-replay.zip` `b5e90d89422c74a99c82841b4b51dd72f3330ac0288081248fd0a9c96b4cf456`.
- Live hashed JS retains `Cache-Control: public, max-age=31536000, immutable`. The existing offline/reload service-worker test continues to pass from the clean production build.

## Remaining release hold: factory billing registration

`npm run verify:billing` still fails at the live production gate with `Billing release check failed: production catalog does not contain remote-code-lesson-replay`. Direct checkout reproduction remains `404 {"error":"enabled factory product","status":404}`. The adjacent invalid-token verification service remains healthy, so this is not a site/extension URL or license-code failure.

Before release acceptance, the factory must register and enable `remote-code-lesson-replay` at `$19 USD`, with product/return URL `https://remote-code-lesson-replay.sociobot.in/`. Then run:

```sh
npm run verify:billing
```

It must pass before a real hosted checkout, payment-return token storage, extension restore, and refund/revocation cycle can be executed. This is the only remaining known gap.
