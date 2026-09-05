# Verify private coding lesson replays — independent verification 5

Verified on 2026-09-05 UTC against implementation commit `7c2230825302a194bacf235efc191ec0f892c47a`, documentation commit `dc56e5a4b182b0b019265719eecff9db552d83d0`, and <https://remote-code-lesson-replay.sociobot.in>.

## Job, audience, and first action

- Job: record selected coding attempts, results, file changes, and hypotheses so a tutor can review the student's reasoning later.
- Audience: students and remote programming tutors.
- First action before scrolling: **Download for Chrome**. There is no **Try it with sample data** action.

## Verdict

**FAIL — 4 findings and 24 untested public claims.**

The repaired build, live site, hosted checkout, rate limit, offline shell, and installed extension all work in the tested normal, invalid, boundary, and recovery paths. Acceptance still fails because the required one-click demo does not exist, no public claim is registered through the required claims contract, the public wording does not meet the supplied first-screen/plain-words contract, and the site metadata and shared route skeleton are incomplete.

## Findings

### High

1. **The required one-click sample and isolated demo do not exist.** The live first screen, the installed popup, and the installed studio contain no **Try it with sample data** action. `GET /demo` returns the product's valid HTTP 404 page. There is no persistent **Demo — sample data, nothing is saved** label, **Reset demo**, or **Start for real** control. `.factory/demo.md` is absent, and the repository contains no `demo:` storage namespace. A verifier therefore cannot enter a realistic populated sample in one click or prove that sample actions leave real data unchanged. Creating and clearing a verifier-owned replay worked, but that real workflow is not a demo-sandbox substitute.

### Medium

1. **All 24 public product claims are outside the required claims gate.** `.factory/claims.json` is absent and the repository has zero `@claim:<id>` tags. There are consequently no declared claim commands to run from the clean checkout. The table below lists the unique operational claims found on the live site, legal pages, extension, or README. Under the supplied contract, all 24 are untested claims even where the general test suite or this ad hoc verification overlaps the behavior.

   | # | Unregistered public claim | Public location |
   | ---: | --- | --- |
   | 1 | The download is an installable Manifest V3 extension. | Home, README |
   | 2 | Students explicitly capture chosen commands and output. | Home, extension, README |
   | 3 | Replays capture hypotheses, learning notes, and results. | Home, extension, README |
   | 4 | Named before/after snapshots produce a diff and both originals remain available. | Home, extension, README |
   | 5 | Excluded commands persist neither command text nor output. | Extension, README |
   | 6 | Common credentials and custom mask words are replaced before storage. | Home, privacy, README |
   | 7 | Lesson data stays local without an account or remote lesson store. | Home, privacy, extension, README |
   | 8 | The product does not automatically capture pages, keys, screens, camera, audio, or remote control. | Home, privacy, README |
   | 9 | Replays export as readable JSON. | Home, extension, README |
   | 10 | Tutor bundles import with actionable invalid-file recovery. | Home, extension, README |
   | 11 | Left and right keys move through playback. | Home, extension, README |
   | 12 | The site works offline after installation. | Home, README |
   | 13 | Capture, playback, masking, import, and export are unlimited and free. | Home, terms, README |
   | 14 | Plus costs exactly $19 USD as a one-time purchase. | Home, terms, README |
   | 15 | Plus provides a hypothesis-only review map. | Home, extension |
   | 16 | Plus provides a failure jump list. | Home |
   | 17 | Plus provides a print-ready lesson debrief. | Home, extension, README |
   | 18 | Purchase return, restore on another browser, and refund/revocation handling control the Plus license. | Home, terms, extension |
   | 19 | The extension supports Chrome, Edge, and Brave. | Home |
   | 20 | Capture works beside vscode.dev, Codespaces, Replit, or a local editor. | README |
   | 21 | Imports accept at most 5 MB and 500 steps. | README |
   | 22 | There are no analytics or third-party runtime scripts. | Home, privacy, extension, README |
   | 23 | A user can install the extension in under a minute. | Home |
   | 24 | A tutor can review the decisions in minutes. | Home |

   This also leaves quantitative terms such as **unlimited**, **under a minute**, and **in minutes**, plus named Edge/Brave compatibility, without the mandatory measured sandbox evidence. A clean `npm test` pass does not satisfy the one-command-per-claim rule because none of its tests is registered or tagged as a claim.

2. **The first screen and several headings do not meet the supplied plain-words contract.** The 23-word lead exceeds the 22-word hard cap. The three product facts start below the first viewport at 1440 × 900 (`top 934 px`) and 390 × 844 (`top 1129 px`), so they are not available before scrolling. The page and extension also use the prohibited metaphor or mood-heading style, including “A useful trail, not a data exhaust,” “the exact first wrong turn,” “Privacy is the architecture,” “That replay slip is missing,” and “Move the replay, not your workspace.” `.factory/copy-audit.md` is absent. The page title itself passes: `Code Lesson Replay — private coding reasoning replays` is descriptive and 53 characters.

3. **Required route metadata and the shared route skeleton are incomplete.** The live home page has no canonical link, Twitter card metadata, Apple touch icon, or SVG favicon. Its Open Graph image is the 1280 × 853 hero rather than a dedicated 1200 × 630 social image. Legal routes do not use the same header navigation as home. Footers do not include “Built by Param Factory” or a version/build id, and legal footers omit the product one-line description. Route titles, one `h1`, `lang`, `main`, the sitemap for existing routes, and the self-hosted 404 are otherwise correct.

## Clean checkout and declared commands

The candidate was cloned into a new temporary directory and checked out detached at the real implementation SHA. The SHA expanded in the previous handoff, `7c22308b3b0c5c3d9de845ac7a05659d12e541d0`, does not exist; the short SHA in the work order resolves to `7c2230825302a194bacf235efc191ec0f892c47a`. This report and the updated handoff use the real object.

- Node `v22.23.2`; npm `10.9.8`.
- `npm ci`: passed; 184 packages installed; 0 vulnerabilities.
- `npm test`: passed; Vitest 10/10, Playwright 13 passed with 3 intentional duplicate-project skips.
- `npm run typecheck`: passed.
- `npm audit --audit-level=high`: passed with 0 vulnerabilities.
- `npm run build`: passed and produced `dist/site/`, `.output/chrome-mv3/`, and the extension ZIP.
- `unzip -t dist/site/downloads/code-lesson-replay.zip`: passed every member.
- `npm run verify:billing`: passed; secure checkout redirect and 51 of 80 invalid-license probes returned `429` with positive `Retry-After`.
- Declared claim commands: none, because `.factory/claims.json` is missing.

Build sizes remain within the supplied budgets: initial site JavaScript 4,220 B, site CSS 10,079 B, no fonts, hero AVIF 45,932 B, and extension ZIP 163,198 B.

## Live site and installed artifact evidence

All served candidate files matched the clean implementation build byte for byte. The live ZIP and local ZIP both have SHA-256 `fb1cba18ca0f5ecdc0e2bfd0a7f85170e25f4a033925cb147ad37965b0b4c82c`; the live and local 404 documents both have SHA-256 `51b6bf255c4af32dba776eadfd58739aee5f1acd933cb4788d20a681ddf42fe5`. `staticwebapp.config.json` is deployment configuration and is correctly not served as a public file.

The live ZIP was downloaded, extracted outside the repository, and installed into a fresh Chromium profile.

- Normal flow: created “Cart total debugging” for student Sam, recorded a failed command with a hypothesis, added a named `src/cart.ts` diff, and added an excluded private-command gap. The populated output was realistic and readable.
- Privacy: the assignment secret, Bearer token, private command, and private output occurred in neither extension storage nor the exported bundle. The free extension made no HTTP(S) request; its recorded origin is the opaque extension origin.
- Persistence and reset: reload retained the replay. Export produced `code-lesson-replay/v1` with three ordered steps. **New** cleared the verifier-created session and left extension storage empty.
- Invalid and recovery: malformed JSON produced an announced next-step error; whitespace-only title produced the visible-character validation message.
- Boundaries: 500 steps imported; 501 and 5,000,001 bytes were rejected while the 500-step replay remained; a valid one-step tutor bundle then imported successfully.
- Keyboard: tab-list Right Arrow moved focus from Command to File diff; playback Left Arrow moved from the private gap to the file diff.
- Mobile and accessibility: populated studio fit 390 px with 17 px body text, no horizontal overflow, no console/page errors, and zero serious/critical axe findings.

The live hosted checkout ended at `checkout.dodopayments.com`, titled `Sociobot | Checkout`, and displayed `Remote Code Lesson Replay`, `$19.00`, and `One-time unlock`. No purchase or refund was submitted because no purchaser identity or payment instrument was provided. The deterministic return, paste-restore, revocation, and free-tier-retention regressions passed in `npm test`.

## Accessibility, offline, privacy, links, and performance

- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, descriptive title, `lang=en`, one `h1`, `main`, complete image alternatives, labelled buttons, and no console errors.
- Independent Playwright axe checks on home, privacy, terms, 404, and the populated extension found zero serious/critical violations.
- Keyboard traversal starts at the skip link with a 3 px blue focus outline. The restore control opens with Enter and focuses the labelled license input. All measured phone controls were at least 44 × 44 CSS px.
- The 390 px pages have no horizontal overflow and use 17 px body text. Reduced-motion mode changes smooth scrolling to `auto` and reduces the tested transition to `0.01 ms`.
- A fresh service worker activated and updated. After the HTTP cache was cleared and the context was put offline, home reloaded styled and interactive, showed its offline notice, and produced no errors.
- Normal live loads requested only the product origin and wrote no local storage. The manifest requests only `storage`, with host access limited to `https://api.sociobot.in/*`, and has no content scripts or capture permissions.
- Home, privacy, terms, the ZIP, the source repository, and the public issue tracker returned 200. The deliberate unknown document returned HTTP 404 with the product title, `h1`, recovery link, CSP, HSTS, `nosniff`, referrer policy, and denied camera/microphone/geolocation.
- Hashed JavaScript uses one-year immutable caching. The ZIP is `application/zip`, attachment-dispositioned, and one-hour cached.
- Lighthouse 13.0.3 mobile produced Performance 100, Accessibility 100, Best Practices 100, and SEO 100; FCP 0.91 s, LCP 1.07 s, TBT 0 ms, CLS 0, transfer 57,626 B. Lighthouse printed a final tab-crash warning after writing the complete report; the metrics JSON is intact and the independent browser runs had no crash or page error.

This product has no product backend, tenant store, or shared database, so tenant isolation, server restart persistence, and a product health route do not apply. The only live API in scope is the Sociobot billing gateway, whose checkout and rate-limit contract passed.

## Earlier finding disposition

| Earlier finding | Current disposition and proof |
| --- | --- |
| Live ZIP missing | Fixed. HTTP 200 `application/zip`; byte-identical to candidate; installed successfully. |
| First-install offline shell broken | Fixed. Fresh worker/update, cache clear, offline reload, interaction, and clean console passed. |
| Pilot billing used in production | Fixed. Site and manifest use only `api.sociobot.in`. |
| Fresh malformed import silent | Fixed. Announced actionable JSON error appears from empty state. |
| Tab keyboard behavior incomplete | Fixed. Arrow movement and retained focus passed. |
| 390 px targets under 44 px | Fixed for the phone layout; no undersized visible target found. |
| Hashed caching and AVIF MIME wrong | Fixed. Immutable one-year asset cache and `image/avif` are live. |
| Whitespace-only title accepted | Fixed. Visible-character validation blocks it. |
| Production checkout absent | Fixed. Catalog/redirect command passes and hosted checkout shows the product and price. |
| Platform 404 loads third-party scripts | Fixed. Product-owned 404 is byte-identical to candidate and makes no third-party request. |
| Mobile body text below 17 px | Fixed. Site and extension compute to 17 px at 390 px. |
| Verify API accepted all 80 requests | Fixed. 51/80 returned 429 with positive `Retry-After`. |
| Unknown document returned HTTP 200 | Fixed. It returns HTTP 404 with the product page and security headers. |

## Evidence files

- Browser result: `/work/.evidence/verification-5-browser.json`
- Screenshots: `/work/.evidence/live-home-desktop.png`, `/work/.evidence/live-home-phone.png`, `/work/.evidence/live-home-phone-offline.png`, `/work/.evidence/live-extension-popup.png`, `/work/.evidence/live-extension-populated-phone.png`, `/work/.evidence/live-checkout-desktop.png`
- Lighthouse: `/work/.evidence/lighthouse.json`
- Basic URL check: `/work/.evidence/verify-url/verify.json`
- Exported replay inspected during QA: `/work/.evidence/qa-cart-total.lesson-replay.json`

No product code, deployment, infrastructure, billing state, or user data was changed during this verification.
