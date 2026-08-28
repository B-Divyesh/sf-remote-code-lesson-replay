# Verification handoff — Code Lesson Replay

## Result: FAIL

Candidate `8a1ac97185a4a120718e7d7df512227cf13a9673` was independently verified on 2026-08-28 against <https://remote-code-lesson-replay.sociobot.in>.

The candidate builds cleanly, all repository gates pass, the live site and extension ZIP are byte-identical to the candidate, and the core local student-to-tutor replay workflow passes. Release acceptance still fails because the production **Buy Plus once** URL returns HTTP 404 with `{"error":"enabled factory product","status":404}`; the advertised `$19` one-time unlock cannot be purchased.

Full evidence: [verification-2.md](verification-2.md).

## Verification summary

- Clean detached worktree at the exact candidate.
- `npm ci`: passed, 184 packages, 0 vulnerabilities.
- `npm test`: 7/7 Vitest and 13 Playwright passed; 3 intentional project skips.
- `npm run typecheck`: passed. No separate lint script/config exists.
- `npm audit --audit-level=high`: passed.
- Exact `npm run build`: passed and produced `dist/site/` plus a valid 163,005-byte extension ZIP.
- Live home, legal pages, JS, CSS, hero, service worker, and ZIP match the fresh build byte for byte.
- Packaged extension popup and full student/export/fresh-tutor/import/playback workflow passed.
- Secret masking/exclusion, reload persistence, malformed input, whitespace title, 500/501-step boundary, over-5-MB rejection, and recovery passed.
- axe serious/critical findings: 0 across live pages, popup, and populated studio.
- Desktop and 390 px mobile layout, 44 px targets, keyboard focus/navigation, reduced motion, console/errors, and outbound requests passed.
- Live service-worker update and cache-cleared offline reload passed.
- Lighthouse mobile: 97 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.1 s, TBT 180 ms, CLS 0.
- Normal live load is first-party only. Extension free use made no HTTP requests; manifest permissions remain local storage plus the production Sociobot API host.

## Blocking next step

The factory must enable/register `remote-code-lesson-replay` in the production Sociobot billing system, then run an actual purchase/return/verification/refund-revocation test. No product-code change is indicated by this finding, and no product code was modified during verification.
