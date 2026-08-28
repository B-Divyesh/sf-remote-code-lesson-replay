# Independent verification — FAIL

Verified on 2026-08-28 UTC for candidate commit `252675ad663f7d980007b5e715c6cbc791f94b6f` and <https://remote-code-lesson-replay.sociobot.in>.

## Verdict

**FAIL.** The candidate repository builds a functional extension package, but the live product cannot be installed because every download control points to a missing deployment artifact. `GET /downloads/code-lesson-replay.zip` returns an Azure Static Web Apps `404` HTML page. The live PWA also fails a first-install offline reload, and the production URL still routes purchases and verification to the pilot billing API.

The live home page, legal pages, hashed JavaScript/CSS, hero AVIF, and service worker are byte-for-byte matches for the candidate build. This is therefore an incomplete/misconfigured deployment of the candidate rather than evidence that a different site revision is live.

## Defects

### Critical

1. **The live extension download is missing.** All three download controls target `/downloads/code-lesson-replay.zip`; a fresh HTTPS request returned `404`, `Content-Type: text/html`, and the 2,400-byte Azure “404: Not Found” page. The exact candidate build contains a valid 162.24 KB ZIP at that path locally (`SHA-256 37c8c641d5db50e9728c1ae913fb2f283757429e00f87990bf5edb34bd10e4f4`). Users cannot install the product from the product URL, so the primary job cannot begin.

### High

1. **First-install offline reload is broken.** After one online visit and service-worker activation, I cleared the ordinary browser HTTP cache, switched Chromium offline, and opened a new page. The cached HTML loaded, but the precache contained only `/`, legal pages, the WebP, and one icon—not the hashed CSS or JS. The service worker returned cached `/` HTML for those failed asset requests. Chromium rejected the CSS and module script for `text/html` MIME mismatches; the page was unstyled, the offline banner did not run, and console errors were emitted. `registration.update()` itself completed and the worker remained activated, but the offline shell was not usable.
2. **The production site uses the pilot billing service.** The live Buy link is `https://pilot-api.sociobot.in/api/v1/products/remote-code-lesson-replay/checkout`, and an explicit restore attempt requests the pilot `/verify` endpoint. The privacy page says billing goes to `api.sociobot.in`. A release build must use the production Sociobot API; the currently advertised $19 purchase flow is still configured for staging.

### Medium

1. **A malformed bundle fails silently on a fresh extension install.** Importing `{bad` through “Open a tutor bundle” leaves the untouched empty screen with no error or recovery guidance. The parser does produce “This is not valid JSON…”, but `renderEmpty()` does not render the notice. The same invalid import does show an error once a session exists. This affects a core tutor entry path and contradicts the claimed import-error state.
2. **The extension tab widget is incomplete for keyboard users.** With focus on the selected Command tab, Right Arrow does nothing. Tabbing to File diff and activating it with Enter changes the panel but moves focus to `<body>` because the UI is re-rendered. All controls remain eventually reachable, but this does not meet the expected arrow-key tab behavior or preserve keyboard position.
3. **Several 390 px mobile targets are below the 44 × 44 px contract.** Measured visible targets include the 40 × 40 brand link, 33 × 15 Terms link, 77 × 15 privacy-policy link, and footer links between 35–43 × 20 px.
4. **Deployment caching does not use immutable caching for hashed assets.** The hashed JS/CSS and AVIF all return `Cache-Control: public, must-revalidate, max-age=30`, rather than long-lived immutable caching. Conditional requests do work (`If-None-Match` returned `304`). The AVIF is also served as `application/octet-stream` rather than `image/avif`, although Chromium decoded it successfully.

### Low

1. **Whitespace-only replay titles are accepted.** Entering three spaces satisfies native `required`, is trimmed to an empty stored title, and produces an empty `<h1>`. A blank title is correctly blocked.

## Clean-checkout and build evidence

- Initial worktree: clean `main`, exactly `252675ad663f7d980007b5e715c6cbc791f94b6f`; `origin/main` also resolved to that commit before reporting.
- `npm ci`: passed; 184 packages installed; 0 vulnerabilities.
- `npm test`: passed. Vitest: 1 file, 6 tests. Playwright 1.58.2: 10 passed, 2 expected skips (the extension journey is intentionally desktop-only in the authored suite).
- `npm run typecheck`: passed.
- No lint script or lint configuration is present in `package.json`.
- `npm audit --audit-level=high`: passed with 0 vulnerabilities.
- Exact `npm run build`: passed and produced `dist/site/`, `.output/chrome-mv3/`, and `dist/site/downloads/code-lesson-replay.zip`.
- Candidate sizes: site JS 4.19 KB, site CSS 9.67 KB, hero AVIF 45.93 KB; extension main JS 22.21 KB plus 0.76/0.19 KB chunks, extension CSS 15.00 KB, packaged ZIP 162.24 KB.

## Packaged-extension exercise

I extracted the exact ZIP from `dist/site/downloads/` into a clean temporary directory and loaded that extracted MV3 package in a fresh Chromium profile.

- Popup had a title, `lang=en`, one `<h1>`, one `<main>`, no serious/critical axe findings or console errors, and opened the studio.
- Blank required title was blocked with “Please fill out this field.”
- Created a replay, stored a private excluded-command gap, and confirmed unique command/output test strings never appeared in `chrome.storage.local` or the export.
- Tested assignment, Bearer, URL credential, AWS-style, and custom-term masking. None of the five secret values appeared in storage; masked markers and the scrub report did.
- Added and rendered a named before/after file diff with preserved snapshots.
- Left/Right Arrow playback selected the expected prior/next replay steps.
- Export produced `boundary-recovery-lesson.lesson-replay.json`, schema `code-lesson-replay/v1`, source `manual-opt-in`, and all three steps; reload preserved the replay.
- The parser accepted exactly 500 steps, rejected 501, rejected a payload over 5,000,000 bytes, and used the safe two-line summary when the diff matrix boundary was exceeded while retaining full snapshots.
- After a rejected 501-step import, a valid tutor bundle imported successfully and displayed its hypothesis/note.
- Desktop and 390 × 844 extension studio had no horizontal overflow; reduced-motion media reduced animation/transition durations to 0.01 ms.
- Populated studio axe result: 0 serious/critical findings. Online console errors, page errors, failed requests, and unsolicited outbound requests: 0.
- Manifest permissions are limited to `storage`; host permissions are limited to the pilot and production Sociobot API origins. There are no content scripts or camera/audio/screen/page-capture permissions.

## Live deployment evidence

### Candidate identity

SHA-256 equality was confirmed between live responses and candidate `dist/site` files for:

- `/` — `7384646c352dd86688700a3b77fc55d79e26d06c4082015ba467c0fdd136518e`
- `/privacy/` — `bb8809493ca109a5c4afce9e7bfc0f8d9d5cbe3acbc752bafadb582bfd58e032`
- `/terms/` — `f741d5200b7a8f508c9592e53521e960d501d2061966ccaf0726f3a2007db9f1`
- `/assets/home-BKnu0utZ.js` — `aff1bf36e7280a187dd3f52f6f8129954260dd2672521f1d0a49a7638594e05f`
- `/assets/home-BJ7vvron.css` — `c2c85a603cad1f3872554b5969ae20015ce30803b4e13a906961074d2a5949b1`
- `/assets/replay-bench.avif` — `cedf2dcd3cf811b170c6cd36c516a613e50da9bdd5132c8c1f38e6fcfb66e9f2`
- `/sw.js` — `30168b175eff814b11e5d3a93306f900ff06925fea3293790e687f930d6acabd`

The installable ZIP is the exception: candidate output exists locally, but the live path is absent.

### Browser, accessibility, and responsive checks

- `/opt/fleet/lib/verify-url.sh`: passed (`200`, title, `lang=en`, one `<h1>`, `<main>`, no missing alt attributes, no unlabeled buttons, no console errors).
- Independent Playwright + axe on live home, privacy, and terms: 0 serious/critical findings. Populated packaged extension: 0 serious/critical findings.
- Desktop 1440 × 900 and mobile 390 × 844: no horizontal overflow; meaningful hero image decoded at 1280 × 853; visual inspection found the intended annotated-bench-sheet presentation intact.
- Keyboard traversal started at the visible skip link, reached navigation, downloads, purchase, and restore controls, and showed a 3 px blue focus outline. Restore opened with focus in the token input; empty submission announced native validation.
- Reduced-motion media matched and reduced the tested animation/transition durations to 0.01 ms.
- Normal online loads produced no console errors, page errors, or failed requests.

### Performance and budgets

Fresh Lighthouse 12.8.2 mobile run against the live URL:

- Performance 97, Accessibility 100, Best Practices 100, SEO 100.
- FCP 0.9 s, LCP 1.1 s, TBT 190 ms, CLS 0, Speed Index 1.2 s, TTI 1.3 s.
- Total transfer reported by Lighthouse: 56 KiB.
- Observed initial decoded resources: JS 4,199 bytes, CSS 9,678 bytes, AVIF 45,932 bytes. All stated JS/CSS/image budgets pass.

### Privacy, requests, and response policy

- A normal live page load used first-party resources only. There are no analytics, external fonts, or third-party runtime scripts.
- The only product runtime `fetch` is license verification; it occurs only when a license token exists. An explicit invalid-token check received `{valid:false, reason:"invalid"}` with `Cache-Control: no-store` and allowed CORS for the product origin.
- Replay data stayed in extension-local storage during testing. The exported JSON contained only explicitly entered, already-masked data.
- Live responses include HTTPS/HSTS, a self-only CSP with only Sociobot API connections, `frame-ancestors 'none'`, `base-uri 'self'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a camera/microphone/geolocation-denying Permissions Policy.
- `/privacy/`, `/terms/`, MIT `LICENSE`, README usage/build/deploy documentation, the visual thesis, and generated-image provenance are present.

## Retest required

At minimum, deploy the candidate ZIP at the exact advertised path, build the public release with `VITE_BILLING_BASE=https://api.sociobot.in`, and precache the built CSS/JS with a non-HTML fallback for asset failures. Then repeat the live download hash/install test, real production checkout handoff, and a fresh-profile offline reload with the ordinary HTTP cache cleared.
