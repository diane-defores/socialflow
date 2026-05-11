---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialflow"
created: "2026-04-28"
created_at: "2026-04-28 01:08:44 UTC"
updated: "2026-04-28"
updated_at: "2026-04-28 01:22:02 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "audit-fix"
owner: "Diane"
confidence: high
user_story: "As the SocialFlow maintainer, I want auth, cloud sync, and profile/account state to be protected by tests and stronger server-side contracts, so releases do not regress session continuity or leak/overwrite user data across profiles and accounts."
risk_level: "medium"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Convex Auth"
  - "Convex functions and schema"
  - "Pinia persisted stores"
  - "cloud sync queue"
  - "Vue app bootstrap"
  - "GitHub Actions CI"
  - "Tauri/WebView profile session flows"
depends_on:
  - artifact: "shipflow_data/business/business.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: "active"
  - artifact: "shipflow_data/technical/guidelines.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: "reviewed"
  - artifact: "Convex docs: convex-test"
    artifact_version: "current as of 2026-04-28"
    required_status: "official"
  - artifact: "Convex docs: validation and best practices"
    artifact_version: "current as of 2026-04-28"
    required_status: "official"
  - artifact: "Vitest docs: mocking and dates"
    artifact_version: "current as of 2026-04-28"
    required_status: "official"
supersedes: []
evidence:
  - "sf-audit-code 2026-04-28 scored code C+ and identified missing critical-path tests."
  - "shipflow_data/workflow/TASKS.md Audit: Code 2026-04-28 lists auth/bootstrap, Convex hydration, cloud-sync replay, and profile/account switching as uncovered high-risk flows."
  - "shipflow_data/workflow/TASKS.md Audit: Code 2026-04-28 lists duplicated src/ and src/ui/setup/pages/SocialFlow paths as convention drift."
  - "pnpm lint passed with 67 warnings, many from any-typed auth/cloud/Convex boundaries."
  - "convex/customLinks.ts, convex/profiles.ts, and convex/settings.ts accept broad string/number payloads without stronger domain validation."
next_step: "/sf-verify SocialFlow Code Hardening and Test Coverage"
---

# Title

SocialFlow Code Hardening and Test Coverage

# Status

Ready. This spec defines a staged hardening chantier. It does not implement code.

# User Story

As the SocialFlow maintainer, I want auth, cloud sync, and profile/account state to be protected by tests and stronger server-side contracts, so releases do not regress session continuity or leak/overwrite user data across profiles and accounts.

Actor: SocialFlow maintainer/operator.

Trigger: a code change touches auth bootstrap, Convex sync, cloud-backed settings/profiles/accounts/custom links, source-tree organization, or CI quality gates.

Expected observable result: the repository has a repeatable test command and CI step covering the critical auth/sync flows, Convex mutations reject malformed or cross-resource data, and duplicated source paths are either removed or documented as intentional.

Value: safer releases across web, extension, desktop, and Android surfaces without relying on manual memory of fragile flows.

# Minimal Behavior Contract

When a developer changes SocialFlow auth, sync, profile/account, or cloud-backed preference behavior, the project must provide automated checks that exercise the main success path and the likely failure paths before release; invalid cloud data must be rejected server-side instead of trusted from local stores; and duplicated source paths must not hide a second copy of code that can drift. If Convex or local storage is unavailable, the app must keep its documented offline-safe behavior and tests must prove no partial sync writes are silently treated as success. The easy edge case to miss is a stale local queue or active pointer from one user/profile being replayed into another signed-in account after hydration.

# Success Behavior

- Given a clean install with `VITE_CONVEX_URL` configured, when the app bootstraps anonymous auth and then upgrades to password auth, then cloud hydration applies the right snapshot and the post-auth sync state reaches an observable ready or restart state without corrupting local profile/account data.
- Given pending queue operations while offline, when connectivity and authentication return, then queued operations flush once, merge deterministically, and leave the queue empty or in a retryable state with attempts incremented.
- Given a malicious or stale client calls Convex mutations with invalid IDs, invalid URLs, overlong labels, invalid profile references, or mismatched active account/network pairs, then the mutation rejects without changing stored data.
- Given the test suite runs locally or in CI, then `pnpm test:once`, `pnpm typecheck`, `pnpm exec tsc -p convex/tsconfig.json --noEmit`, and `pnpm lint` complete with expected results.
- Given source-tree drift remains after cleanup, then each remaining duplicate has an explicit owner and reason in `docs/repo-architecture-audit.md` or a replacement architecture note.

# Error Behavior

- Invalid Convex input returns a failed mutation and no partial document write.
- Unauthenticated calls to cloud-backed functions continue to fail with no data exposure.
- A queue flush failure increments attempts and schedules a retry; it must not drop the operation unless an explicit invalid-data path removes or dead-letters it with a documented reason.
- Hydration failure resets post-auth feedback state and leaves local state recoverable; it must not clear a valid local state for a different remembered user unless cloud-priority rules explicitly require it.
- Test harness setup failures must fail CI loudly; they must not be hidden behind optional scripts.
- Lint warning reduction must not weaken rules globally to hide warnings in auth, sync, or Convex code.

# Problem

The 2026-04-28 code audit found that the most valuable SocialFlow flows are under-protected: auth bootstrap, Convex hydration, cloud sync replay, and profile/account switching have no automated tests. Convex mutation validators enforce basic types, but the domain rules are still too broad for cloud-backed user data. The repository also carries duplicated source paths under `src/` and `src/ui/setup/pages/SocialFlow/`, which makes maintenance risky because a fix can land in one copy and miss the actual runtime copy.

# Solution

Add a focused test harness around Convex functions and pure frontend sync/auth helpers, then use that harness to lock the critical flows before tightening server-side validation. In parallel, audit and reduce source-tree drift by deleting dead duplicate files only after import verification, documenting any remaining intentional duplication.

# Scope In

- Add Vitest-based test scripts and configuration.
- Add Convex function tests using `convex-test` for cloud-backed mutations and queries.
- Add frontend/unit tests for local sync queue behavior, signup nudge timing, and hydration decision helpers where code can be isolated without mounting the full app.
- Add or extract small pure helper functions only where needed to test behavior without over-mocking Vue/Pinia singletons.
- Harden Convex validation and invariants for:
  - `convex/socialAccounts.ts`
  - `convex/customLinks.ts`
  - `convex/profiles.ts`
  - `convex/settings.ts`
  - `convex/friendsFilters.ts` if friend-name limits are missing.
- Tighten type boundaries in:
  - `src/lib/cloudSync.ts`
  - `src/lib/convexAuth.ts`
  - Convex helper `getAuthUserId` declarations.
- Add CI steps for tests, typecheck, Convex typecheck, and lint.
- Update architecture docs to record source-tree ownership and any remaining duplicates.

# Scope Out

- No redesign of auth UX, signup nudge copy, or settings UI.
- No migration away from Convex Auth.
- No rewrite of the cloud sync architecture.
- No Tauri native WebView session persistence changes unless a test reveals a direct blocker.
- No dependency major upgrade unless required by the test harness; if required, reroute to `/sf-migrate`.
- No end-to-end browser/device automation for Android WebView in this chantier; keep Android device validation as manual acceptance unless a later spec adds E2E infrastructure.

# Constraints

- Preserve offline-safe startup: missing or unreachable `VITE_CONVEX_URL` must not crash the app.
- Preserve hash routing and existing platform-specific Vite configs.
- Use `pnpm`.
- Prefer existing Vue, Pinia, Convex, and TypeScript patterns.
- Keep tests focused on behavior and invariants, not snapshots of implementation details.
- Avoid broad refactors of `src/ui/setup/pages/SocialFlow/` layout or native WebView plumbing.
- Existing dirty changes from the 2026-04-28 audit should be reviewed before implementation and not reverted accidentally.

# Dependencies

- Local stack:
  - Vue `^3.5.13`
  - Vite `^6.4.2`
  - TypeScript `^5.7.3`
  - Convex `^1.32.0`
  - `@convex-dev/auth` `^0.0.91`
  - Pinia `^2.3.1`
  - `pnpm@8.11.0`
- Test dependencies to add if absent:
  - `vitest`
  - `convex-test`
  - `@edge-runtime/vm`
  - optional `happy-dom` or `jsdom` only if frontend tests need DOM APIs; prefer pure-helper tests first.
- Fresh external docs:
  - `fresh-docs checked`: Convex official `convex-test` docs say `convex-test` provides a mock Convex backend for JavaScript tests, recommends Vitest and `@edge-runtime/vm`, and shows separate Vitest project environments for Convex and frontend tests.
  - `fresh-docs checked`: Convex official validation docs confirm function `args` validators enforce runtime arguments and reject undeclared object properties.
  - `fresh-docs checked`: Convex official best practices recommend validators on functions and access control checks on public functions.
  - `fresh-docs checked`: Vitest official mocking docs require clearing/restoring mocks and document `vi.setSystemTime`/fake timers for date-sensitive behavior such as signup nudge cooldowns.
- Official documentation URLs:
  - https://docs.convex.dev/testing/convex-test
  - https://docs.convex.dev/functions/validation
  - https://docs.convex.dev/understanding/best-practices
  - https://vitest.dev/guide/mocking
  - https://vitest.dev/guide/mocking/dates

# Invariants

- A user can only read and mutate their own Convex-backed profiles, custom links, social accounts, active account pointers, settings, and friends filters.
- `activeAccounts.accountId` must reference an account owned by the same user and matching the same `networkId`.
- `settings.activeProfileId`, when present, should either reference one of the user's profiles or be ignored/repaired by hydration without creating a broken active profile.
- Custom links must be web URLs using `https:` or `http:` only; app/native/custom schemes are out of scope for cloud-backed custom links.
- Profile IDs, link IDs, account IDs, labels, names, emoji, avatar data, and friends-filter names must have bounded length.
- Offline queue persistence must preserve operations until they are either successfully applied or explicitly rejected by a documented invalid-data path.
- Anonymous users can keep local-only placeholder profile behavior until a profile is materialized.
- Cloud-priority hydration remains the rule when cloud data exists for a signed-in non-anonymous user.

# Links & Consequences

- Auth and sync entrypoints:
  - `src/ui/setup/pages/SocialFlow/main.ts`
  - `src/lib/convexAuth.ts`
  - `src/lib/cloudSync.ts`
  - `src/lib/cloudSyncQueue.ts`
  - `src/lib/cloudSettings.ts`
- Cloud-backed stores:
  - `src/stores/profiles.ts`
  - `src/stores/accounts.ts`
  - `src/stores/customLinks.ts`
  - `src/stores/friendsFilter.ts`
  - `src/stores/onboarding.ts`
  - `src/stores/theme.ts`
- Convex backend:
  - `convex/schema.ts`
  - `convex/users.ts`
  - `convex/settings.ts`
  - `convex/profiles.ts`
  - `convex/customLinks.ts`
  - `convex/socialAccounts.ts`
  - `convex/friendsFilters.ts`
- CI and quality:
  - `package.json`
  - `vitest.config.ts` or equivalent new config
  - `.github/workflows/dev-builds.yml`
  - `.github/workflows/build.yml` if release builds should include tests.
- Docs:
  - `docs/repo-architecture-audit.md`
  - `CLAUDE.md` only if commands or constraints change.
  - `README.md` only if test commands become part of contributor workflow.

# Documentation Coherence

- Update `README.md` scripts section if adding `pnpm test`, `pnpm test:once`, or `pnpm test:coverage`.
- Update `CLAUDE.md` common commands if test commands become required safety checks.
- Update `docs/repo-architecture-audit.md` with final ownership of duplicated paths and any intentional exceptions.
- Update `CHANGELOG.md` only at shipping/end step, not during spec implementation unless project convention requires it.
- No public marketing/branding copy should change because this chantier is internal quality and security hardening.

# Edge Cases

- Existing local queue contains malformed JSON.
- Existing local queue contains operations generated by older app versions.
- User signs in with password after using anonymous mode and cloud is empty.
- User signs in with password and cloud already contains data for another device.
- Queue flush fails halfway through multiple operations.
- Active account pointer exists for a deleted account.
- Active profile points to a missing profile after cloud hydration.
- Custom link URL contains a non-web scheme, leading/trailing whitespace, newline, or extremely long host/path.
- Profile avatar is an oversized base64 payload.
- `navigator.onLine` lies or is unavailable.
- Tests using fake time forget to restore real timers.
- Convex mock behavior differs from real backend limits; critical paths still need one manual Convex dev sanity check.

# Implementation Tasks

- [ ] Task 1: Add test harness scripts and config.
  - File: `package.json`
  - Action: Add `test`, `test:once`, and optionally `test:coverage` scripts using Vitest.
  - User story link: Gives maintainers a repeatable release gate.
  - Depends on: None.
  - Validate with: `pnpm test:once -- --passWithNoTests` only during initial setup, then `pnpm test:once` after tests exist.
  - Notes: Do not remove existing build/typecheck scripts.

- [ ] Task 2: Add Vitest multi-environment config.
  - File: `vitest.config.ts`
  - Action: Configure Convex tests for `edge-runtime` and frontend/helper tests for a browser-like or node environment according to actual test needs.
  - User story link: Allows backend and frontend critical behavior to be tested in the right runtime.
  - Depends on: Task 1.
  - Validate with: `pnpm test:once`.
  - Notes: Follow official Convex `convex-test` guidance. Prefer pure node tests for helpers when DOM is not needed.

- [ ] Task 3: Add Convex test setup.
  - File: `convex/test.setup.ts`
  - Action: Export `modules = import.meta.glob("./**/!(*.*.*)*.*s")` or the equivalent pattern needed for this repo.
  - User story link: Enables Convex function tests to load current modules.
  - Depends on: Task 2.
  - Validate with: A minimal Convex query test.
  - Notes: Keep generated `convex/_generated` imports intact.

- [ ] Task 4: Harden shared Convex auth context typing.
  - File: `convex/authHelpers.ts` or existing Convex modules if a helper is too much indirection.
  - Action: Replace repeated `ctx: { db: any; auth: any }` helper typing with a typed helper compatible with Convex query/mutation contexts.
  - User story link: Reduces type blind spots in the backend trust boundary.
  - Depends on: None.
  - Validate with: `pnpm exec tsc -p convex/tsconfig.json --noEmit` and `pnpm lint`.
  - Notes: Do not introduce a helper that makes generated Convex types harder to use.

- [ ] Task 5: Add domain validation helpers for cloud-backed inputs.
  - File: `convex/validators.ts`
  - Action: Define reusable validation functions/constants for max label/name lengths, allowed network IDs, ID prefixes where applicable, URL scheme checks, text zoom range, avatar size/data URL rules, and friends-filter list bounds.
  - User story link: Prevents malformed client state from becoming trusted cloud state.
  - Depends on: Task 4.
  - Validate with: Unit tests or Convex mutation tests for accepted and rejected inputs.
  - Notes: Use Convex `v.*` validators for shape and explicit runtime checks for semantic rules like URL scheme and max string length if not expressible in `v`.

- [ ] Task 6: Harden `socialAccounts` invariants.
  - File: `convex/socialAccounts.ts`
  - Action: Validate network ID and label length on upsert; keep current ownership and network match checks in `setActive`; reject active account pointers for missing or wrong-network accounts.
  - User story link: Protects profile/account switching from stale or malicious active pointers.
  - Depends on: Task 5.
  - Validate with: Convex tests for own account success, foreign account rejection, wrong-network rejection, missing account rejection, and delete-clears-active behavior.
  - Notes: The 2026-04-28 audit already patched `setActive`; preserve that behavior.

- [ ] Task 7: Harden `customLinks` invariants.
  - File: `convex/customLinks.ts`
  - Action: Validate link ID, profile ownership/existence, label length, icon length/allowlist if feasible, and URL scheme/length before insert or patch.
  - User story link: Prevents cloud sync from storing dangerous or unusable custom links.
  - Depends on: Task 5.
  - Validate with: Convex tests for valid link, non-web scheme rejection, missing profile rejection, overlong label rejection, and per-user isolation.
  - Notes: Client auto-prefix behavior in `src/stores/customLinks.ts` can remain but must not be the only defense.

- [ ] Task 8: Harden `profiles`, `settings`, and `friendsFilters`.
  - File: `convex/profiles.ts`, `convex/settings.ts`, `convex/friendsFilters.ts`
  - Action: Add semantic checks for profile name, emoji, avatar, hidden networks, active profile existence, text zoom range, language allowlist, and friend-name limits.
  - User story link: Keeps cloud-backed preferences coherent across devices and profiles.
  - Depends on: Task 5.
  - Validate with: Convex tests for accepted values and rejected invalid values.
  - Notes: Avoid making existing valid user data impossible to read; reject only future invalid writes.

- [ ] Task 9: Extract testable pure helpers from cloud sync where needed.
  - File: `src/lib/cloudSync.ts`
  - Action: Introduce narrowly scoped exported or internal-tested helpers for hydration decisions, snapshot emptiness, and reusable typed snapshot shapes.
  - User story link: Makes the cloud/local merge policy verifiable without mounting the app.
  - Depends on: Task 1.
  - Validate with: Unit tests for anonymous reuse, same-user reuse, different-user cloud-priority, empty-cloud seed, and pending queue flush branch.
  - Notes: Do not rewrite store interactions broadly. Extract only enough to test the decision matrix.

- [ ] Task 10: Add queue behavior tests.
  - File: `src/lib/cloudSyncQueue.test.ts` and potentially `src/lib/cloudSyncQueue.ts`
  - Action: Test queue merge, malformed storage handling, retry scheduling, attempt increments, and successful removal after mutation.
  - User story link: Protects offline-first sync reliability.
  - Depends on: Task 1.
  - Validate with: `pnpm test:once`.
  - Notes: Use fake storage and module boundaries. Avoid over-mocking Convex internals where a small wrapper is cleaner.

- [ ] Task 11: Add signup nudge time tests.
  - File: `src/composables/useSignupNudge.test.ts`
  - Action: Cover first-launch suppression, day-2 display, once-per-day dismissal, five dismissals, 30-day pause, cooldown expiry, email-account suppression, and offline/no-Convex suppression.
  - User story link: Locks the account-conversion behavior that protects user data.
  - Depends on: Task 1.
  - Validate with: `pnpm test:once`.
  - Notes: Use Vitest fake timers and restore real timers after each test.

- [ ] Task 12: Add auth client boundary tests or refactor seams.
  - File: `src/lib/convexAuth.ts` and `src/lib/convexAuth.test.ts`
  - Action: Test storage namespacing, token persistence/clear behavior, missing backend errors, and refresh-token failure clearing tokens.
  - User story link: Protects sign-in/sign-out session correctness.
  - Depends on: Task 1.
  - Validate with: `pnpm test:once`.
  - Notes: If direct testing requires heavy mocking of `ConvexHttpClient`, extract a tiny factory seam instead of broad module mocking.

- [ ] Task 13: Reduce or document source-tree duplication.
  - File: `docs/repo-architecture-audit.md`
  - Action: Inventory duplicated paths under `src/` and `src/ui/setup/pages/SocialFlow/`; delete dead copies only after `rg` confirms no imports and typecheck/lint pass; document remaining intentional ownership.
  - User story link: Ensures maintainers fix the code that actually runs.
  - Depends on: Tests from Tasks 1-12 enough to guard critical flows.
  - Validate with: `rg` import checks, `pnpm typecheck`, `pnpm lint`, and targeted build if imports move.
  - Notes: Do not remove runtime files solely because names duplicate; confirm import graph first.

- [ ] Task 14: Tighten lint/type warnings in critical modules.
  - File: `src/lib/cloudSync.ts`, `src/lib/convexAuth.ts`, Convex modules touched above.
  - Action: Replace `any` with generated Convex types, explicit local types, or `unknown` plus narrowing where appropriate.
  - User story link: Keeps auth/sync correctness reviewable by TypeScript.
  - Depends on: Tasks 4-12.
  - Validate with: `pnpm lint`; warning count in critical auth/sync/Convex files is zero or explicitly documented.
  - Notes: This task is not required to eliminate all 67 repo warnings, only warnings in touched critical files unless the change is trivial.

- [ ] Task 15: Add CI quality gate.
  - File: `.github/workflows/dev-builds.yml`
  - Action: Add steps after dependency install to run `pnpm test:once`, `pnpm typecheck`, `pnpm exec tsc -p convex/tsconfig.json --noEmit`, and `pnpm lint` before Android build.
  - User story link: Makes the hardening enforceable before platform builds.
  - Depends on: Tasks 1-14.
  - Validate with: local commands and next GitHub Actions run.
  - Notes: Consider whether release `build.yml` should also run the same quality gate before packaging; add it there if runtime cost is acceptable.

- [ ] Task 16: Update contributor docs.
  - File: `README.md`, `CLAUDE.md`, `docs/repo-architecture-audit.md`
  - Action: Document new test commands, quality gate expectations, and source ownership decisions.
  - User story link: Keeps future maintenance aligned with the new safety contract.
  - Depends on: Tasks 1-15.
  - Validate with: Docs mention the exact commands that exist in `package.json`.
  - Notes: Keep public/product docs unchanged unless behavior visible to users changed.

# Acceptance Criteria

- [ ] AC 1: Given the repo after implementation, when `pnpm test:once` runs locally, then it executes Convex and frontend/helper tests and exits successfully.
- [ ] AC 2: Given CI on a branch touching `src/**`, `src-tauri/**`, `package.json`, `pnpm-lock.yaml`, `vite.tauri.config.ts`, or workflow files, when dependencies install, then tests and type/lint checks run before Android build.
- [ ] AC 3: Given an unauthenticated client, when it calls cloud-backed Convex queries or mutations, then no user data is returned or changed.
- [ ] AC 4: Given user A and user B exist, when user B attempts to set active account to user A's account ID, then `convex/socialAccounts.ts:setActive` rejects and no active pointer changes.
- [ ] AC 5: Given a social account belongs to `twitter`, when a client attempts to set it active for `facebook`, then the mutation rejects and existing active pointer remains unchanged.
- [ ] AC 6: Given a custom link with `javascript:`, `file:`, `intent:`, newline-containing, or overlong URL, when it is synced to Convex, then the mutation rejects and no custom link document is inserted or patched.
- [ ] AC 7: Given a custom link references a missing or other-user profile ID, when it is synced to Convex, then the mutation rejects.
- [ ] AC 8: Given profile settings contain a missing active profile ID, when hydration applies cloud state, then local active profile resolves to an existing profile or empty safe state without crashing.
- [ ] AC 9: Given local queue storage contains malformed JSON, when queue read/flush runs, then it recovers to an empty queue without throwing to app bootstrap.
- [ ] AC 10: Given a queue operation fails during flush, when flush completes, then attempts increments and the operation remains queued for retry.
- [ ] AC 11: Given the signup nudge has been dismissed five times, when `check()` runs before 30 days have elapsed, then it does not show; when 30 days have elapsed, then the cycle can restart.
- [ ] AC 12: Given a user has an email/password account, when signup nudge `check()` runs, then the nudge remains hidden.
- [ ] AC 13: Given source-tree duplicates remain, when reading `docs/repo-architecture-audit.md`, then each remaining duplicate has an owner, purpose, and import/runtime status.
- [ ] AC 14: Given `pnpm lint` runs, then touched auth/sync/Convex files have no `no-explicit-any` warnings unless a local explanatory exception is unavoidable and documented in the spec implementation notes.
- [ ] AC 15: Given `pnpm typecheck` and `pnpm exec tsc -p convex/tsconfig.json --noEmit` run, then both pass.
- [ ] AC 16: Given `README.md` and `CLAUDE.md` after implementation, when a new contributor reads commands, then the documented test commands match `package.json`.

# Test Strategy

- Convex unit/integration tests:
  - Use `convex-test` with Vitest and `@edge-runtime/vm`.
  - Cover ownership, validation, and invariant rejection for Convex functions.
  - Do not assert exact Convex backend error wording because the official docs warn mock and real backend error details can differ.
- Frontend/helper tests:
  - Use Vitest fake timers for signup nudge date behavior.
  - Use fake localStorage/navigator state for queue and auth client tests.
  - Prefer pure helper extraction over full Vue app mounting.
- Manual sanity:
  - Run local app with no `VITE_CONVEX_URL` to confirm offline-safe startup still works.
  - Run one Convex dev sanity flow for password sign-in/hydration if local deployment credentials are available.
  - For Android WebView session behavior, keep manual device testing as a separate release checklist because this chantier does not add mobile E2E infrastructure.
- Required commands:
  - `pnpm test:once`
  - `pnpm typecheck`
  - `pnpm exec tsc -p convex/tsconfig.json --noEmit`
  - `pnpm lint`
  - Optional after import cleanup: `pnpm build:web` or targeted platform build.

# Risks

- Adding tests may require introducing dev dependencies and a new config path; misconfigured Vitest environments can make tests flaky.
- Convex mock tests are fast but do not enforce all real backend limits; keep manual Convex sanity for critical auth/sync paths.
- Tightening validation can reject existing cloud data if rules are too strict. Implement future-write rejection carefully and preserve read compatibility.
- Removing duplicated files can break platform-specific imports if the import graph is incomplete. Use `rg`, typecheck, and builds before deletion.
- Over-mocking `ConvexHttpClient`, Pinia stores, or Vue refs can make tests brittle. Prefer small seams and pure helper extraction.
- CI time may increase before Android builds. Keep the test suite focused and avoid full Tauri builds inside every quality job unless needed.

# Execution Notes

- Read first:
  - `src/lib/convexAuth.ts`
  - `src/lib/cloudSync.ts`
  - `src/lib/cloudSyncQueue.ts`
  - `convex/socialAccounts.ts`
  - `convex/customLinks.ts`
  - `convex/profiles.ts`
  - `convex/settings.ts`
  - `docs/repo-architecture-audit.md` if present.
- Implementation order:
  - Add test harness with one trivial passing test.
  - Add Convex setup and tests for already-fixed `socialAccounts.setActive`.
  - Add validation helpers and backend hardening one module at a time.
  - Extract only necessary pure helpers for frontend sync tests.
  - Add queue/auth/nudge tests.
  - Reduce duplicate files only after behavior tests exist.
  - Add CI gate and docs updates last.
- Packages:
  - Allowed: `vitest`, `convex-test`, `@edge-runtime/vm`, and one DOM test environment only if required.
  - Avoid adding large E2E/browser frameworks in this chantier.
- Stop conditions:
  - If `convex-test` cannot support Convex Auth setup needed for ownership tests, keep pure Convex domain tests and add a local Convex dev test plan; do not fake ownership so much that tests lose value.
  - If validation would reject plausible existing production data, pause and add a migration/compatibility decision before enforcing it.
  - If source duplication removal touches native WebView or platform build behavior, reroute that slice to a separate spec or require platform build verification.

# Open Questions

None blocking. Assumptions made:

- The first implementation pass should prioritize unit/integration coverage over full device E2E.
- Existing product behavior remains unchanged except invalid cloud writes become rejected.
- CI should run tests before Android debug build in `dev-builds.yml`; adding the same gate to release `build.yml` is recommended if runtime is acceptable.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-04-28 | sf-spec | GPT-5 Codex | Created full technical spec for code hardening and test coverage | Draft saved | `/sf-ready socialflow code hardening and test coverage` |
| 2026-04-28 | sf-ready | GPT-5 Codex | Evaluated readiness gate for code hardening and test coverage | Ready | `/sf-start SocialFlow Code Hardening and Test Coverage` |
| 2026-04-28 | sf-start | GPT-5 Codex | Implemented test harness, Convex validation hardening, CI quality gate, and contributor doc updates | Partial | `/sf-verify SocialFlow Code Hardening and Test Coverage` |
| 2026-04-28 | sf-verify | GPT-5 Codex | Verified code hardening and test coverage against acceptance criteria | Partial | `/sf-start SocialFlow Code Hardening and Test Coverage auth and Convex mutation coverage gaps` |
| 2026-04-28 | sf-start | GPT-5 Codex | Added auth boundary tests, Convex mutation invariant tests, and removed `any` usage in critical auth/cloud-sync modules | Partial | `/sf-verify SocialFlow Code Hardening and Test Coverage` |
| 2026-04-28 | sf-verify | GPT-5 Codex | Verified latest hardening/test implementation against spec, docs, bugs, dependencies, and checks | Partial | `/sf-start SocialFlow Code Hardening and Test Coverage convex-test and documentation gaps` |
| 2026-04-28 | sf-start | GPT-5.3 Codex | Closed verification gaps with convex-test/edge-runtime coverage, README freshness fixes, and non-mutating CI lint gate | Implemented | `/sf-verify SocialFlow Code Hardening and Test Coverage` |
| 2026-04-28 | sf-verify | GPT-5 Codex | Reverified final implementation against acceptance criteria, docs, dependency gate, and technical checks | Verified | `/sf-end SocialFlow Code Hardening and Test Coverage` |
| 2026-04-28 | sf-end | GPT-5 Codex | Closed chantier, updated local/master TASKS and CHANGELOG with verified implementation summary | Closed | `/sf-ship SocialFlow Code Hardening and Test Coverage` |
| 2026-04-28 | sf-ship | GPT-5 Codex | Shipped code hardening and test coverage changes with quick commit and push | Shipped | None |
| 2026-05-10 | sf-build | GPT-5 Codex | Hardened `cloudSync.ts` runtime validation for inbound cloud snapshot payloads | Implemented: settings, profiles, custom links, friends filters, social accounts, and active account pointers are field-validated before store application; malformed entries are ignored; Vitest guard coverage added | Run bounded ship when ready |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | This document initializes the chantier. |
| sf-ready | ready | Readiness gate passed on 2026-04-28. |
| sf-start | implemented | Convex-test/edge-runtime coverage, README freshness, non-mutating CI lint gate, and 2026-05-10 cloud snapshot runtime validation hardening completed. |
| sf-verify | verified | Final verification passed; 2026-05-10 checks pass with `pnpm typecheck`, `pnpm typecheck:full`, and `pnpm test:once`. |
| sf-end | closed | TASKS and CHANGELOG updated after verified implementation. |
| sf-ship | shipped | Changes committed and pushed after quick-mode checks. |

Next command: None
