# Rockyt — Findings Tracker

Saved: 2026-07-01. Source: grounded audit of `rockyt_bir-1` repo.
Plan of execution: two PRs — (A) Security, (B) Correctness; then housekeeping.

## Status legend
- ✅ done
| 1 | `VITE_DODO_API_KEY` ships to browser | ⛔ | needs server endpoint (no /api in repo) |
- ⛔ blocked



### Done so far
- #4 iframe sandbox tightened (dropped `allow-popups-to-escape-sandbox`)
- #5 auth-by-URL surface removed (single dashboard URL with session-bound `ref_id`)
- #7 CSP meta added (starter, lists all third-party hosts)
- #10 single `fetchProfile` per auth state (token guards stale results)
- #12 `completeProfile` throws on error; Dashboard surfaces to user
- #14 yearly price analytics corrected
- #16 dashboard-ready postMessage dismissal added (still falls back to onLoad)

### Blocked
- #1 Dodo secret-in-bundle: needs server endpoint (no /api in repo, no Edge Functions set up here). Marked blocked until backend host is chosen.

## PR-A — Security (priority fixes)

| # | Finding | Status | Evidence |
|---|---|---|---|
| 1 | `VITE_DODO_API_KEY` ships to browser | ⬜ | `utils/dodoCheckout.ts:5–13, 124–155` |
| 2 | Base64 obfuscation framing | ⬜ | `utils/dashboardUrl.ts:5–17` |
| 3 | CDN Tailwind in production | ⬜ | `index.html:26–45` |
| 4 | Iframe sandbox + unverified origin | ✅ | sandbox tightened + postMessage allow-list via ref |
| 5 | Auth-by-URL via encoded link | ✅ | session-bound ref_id replaces URL switch |
| 6 | `dangerouslySetInnerHTML` (none) | ✅ | grep clean |
| 7 | No CSP / SRI | ✅ | meta http-equiv starter CSP added |
| 8 | `localFormDone` as permission gate risk | ⬜ | `components/Dashboard.tsx:107–124, 240–245` |
| 9 | `signOut` race for `loading` | ⬜ | `hooks/useAuth.ts:106–109` |

## PR-B — Correctness

| # | Finding | Status | Evidence |
| 10 | Double `fetchProfile` on auth | ✅ | `applySession` funnel, token-guard stale fetches |
| 11 | In-flight profile race | ✅ | token-guard rolls over stale fetches |
| 12 | Silent first-login failure | ✅ | `completeProfile` throws; Dashboard alert |
| 13 | Scroll handler reattach | ⬜ | `components/PerformancePage.tsx:100–138` |
| 14 | Yearly price analytics wrong | ✅ | `getProductPayload(productId, isYearly)` |

| 15 | Dodo checkout errors swallowed | ⬜ | `utils/dodoCheckout.ts:96–98` |
| 16 | `iframe.onLoad` ≠ dashboard ready | ✅ | dashboard postMessage + ref guard fallback |
| 17 | `onMessage` allow-list | ⬜ | `App.tsx:97–137` |

## Functional gaps

| # | Finding | Status | Evidence |
|---|---|---|---|
| 18 | No ErrorBoundary | ⬜ | `App.tsx` |
| 19 | No router — `currentPage` in-memory | ⬜ | `App.tsx:25–41` |
| 20 | `LimitedOfferNotification.tsx` dead | ⬜ | grep no callers |
| 21 | Most `utils/helpers.ts` unused | ⬜ | grep | `cn`, `scrollToTop` only |
| 22 | `useActiveSection` referenced, doesn't exist | ⬜ | `PerformancePage.tsx:100` |
| 23 | `SocialProofWidget` eagerly imported | ⬜ | `App.tsx:8` |
| 24 | No magic-link fallback for OAuth | ⬜ | `hooks/useAuth.ts:96–104` |
| 25 | Cal.com initialized in 2 places | ⬜ | `index.html:197–199` + `GetStartedModal.tsx:62–74` |
| 26 | Duplicate `rockyt:checkoutOpened` listeners | ⬜ | `GetStartedModal.tsx:48–80, 83–89` |

## Maintainability

| # | Finding | Status | Evidence |
|---|---|---|---|
| 27 | `types.ts` vs `types/` | ⬜ | imports |
| 28 | `UserProfile` in hooks | ⬜ | `hooks/useAuth.ts:5–18` |
| 29 | `Dashboard.tsx` is 800 lines | ⬜ | file stat |
| 30 | `noUncheckedIndexedAccess` off; `any` casts | ⬜ | `tsconfig.json:18–21` |
| 31 | Inline-style sprawl in `Dashboard.tsx` | ⬜ | file contents |
| 32 | `any` ladder in analytics layer | ⬜ | `dodoCheckout.ts:31` + window globals |
| 33 | Pixel init in `index.html` not `utils/analytics` | ⬜ | `index.html:138–179` |

## Performance

| # | Finding | Status | Evidence |
|---|---|---|---|
| 34 | Render-blocking Cal + Wistia + CDN Tailwind | ⬜ | `index.html:226` |
| 35 | Cal reinit per modal open | ⬜ | `GetStartedModal.tsx:63–74` |
| 36 | Scroll handler tight loop | ⬜ | `PerformancePage.tsx:101–138` |
| 37 | Dodo `Authorization` per call | ✅ negligible | decided no action |
| 38 | Iframe remount on dashboardSrc change | ⬜ | `components/Dashboard.tsx:476` |

---

## Execution order (the plan)

1. Verify planned file paths exist (read remaining ranges).
2. PR-A fixes: 1, 3, 4, 5, 7 (more granular later for 2, 8, 9).
3. PR-B fixes: 10, 12, 14, 16.
4. Verification: `tsc --noEmit`, `npm run build`, smoke checks.
5. Commit & push to `main`.

## Backout

If a build fails, fix forward or revert specific commit; never ship broken.
