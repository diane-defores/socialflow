---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "socialflow"
created: "2026-05-02"
created_at: "2026-05-02 12:38:54 UTC"
updated: "2026-05-02"
updated_at: "2026-05-02 19:56:37 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "migration / audit-fix"
owner: "Diane"
user_story: "As the SocialFlow maintainer, I want the remaining RustSec warning set split into fixable native dependency updates and explicitly accepted upstream risks, so desktop and Android native releases are not blocked by hidden Rust dependency risk or unsafe transitive overrides."
risk_level: "medium"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Tauri 2 native dependency graph"
  - "src-tauri/Cargo.toml"
  - "src-tauri/Cargo.lock"
  - "src-tauri/plugins/android-webview/Cargo.toml"
  - "RustSec/cargo-audit"
  - "Documented cargo-audit warning policy"
  - "GitHub Actions native build workflows"
  - "Dependabot Cargo updates"
  - "desktop Linux WebKitGTK/GTK stack"
  - "Android Tauri build path"
depends_on:
  - artifact: "BUSINESS.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "GUIDELINES.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "CLAUDE.md"
    artifact_version: "1.0.0"
    required_status: "active"
  - artifact: "specs/socialflow-dependency-hygiene-and-major-line-migration.md"
    artifact_version: "0.1.0"
    required_status: "ready"
  - artifact: "docs/dependency-risk-register.md"
    artifact_version: "0.1.0"
    required_status: "active"
  - artifact: "src-tauri/DEPENDENCY_AUDIT.md"
    artifact_version: "unknown"
    required_status: "active"
  - artifact: "Tauri official docs via Context7 /websites/v2_tauri_app"
    artifact_version: "current as of 2026-05-02"
    required_status: "official"
  - artifact: "RustSec Advisory Database and cargo-audit README"
    artifact_version: "current as of 2026-05-02"
    required_status: "official"
  - artifact: "cargo-deny official docs via Context7 /websites/embarkstudios_github_io_cargo-deny (consulted to defer adoption)"
    artifact_version: "current as of 2026-05-02"
    required_status: "official"
supersedes: []
evidence:
  - "Local `(cd src-tauri && cargo audit --json)` exits 0 and reports 0 vulnerabilities, 17 unmaintained warnings, and 3 unsound warnings."
  - "RustSec warnings include GTK3 binding crates, `fxhash`, `proc-macro-error`, `unic-*`, `glib@0.18.5`, `rand@0.7.3`, and `rand@0.8.5`."
  - "`cargo tree --locked -i glib@0.18.5` traces the `glib` warning through Tauri Linux desktop stack paths including `tauri`, `tauri-runtime-wry`, `wry`, `webkit2gtk`, `gtk`, `muda`, `tray-icon`, and `libappindicator`."
  - "`cargo tree --locked -i rand@0.8.5` shows one direct SocialFlow edge through `app` plus transitive Tauri parsing/codegen edges through `phf_generator`, `cssparser`, `kuchikiki`, `tauri-utils`, and `html5ever`."
  - "`cargo tree --locked -i rand@0.7.3` traces the older `rand` line through `phf_generator@0.8.0`, `selectors`, `kuchikiki`, and `tauri-utils`."
  - "`cargo update -p rand@0.8.5 --precise 0.8.6 --dry-run` succeeds and would update the direct `rand` 0.8 lock entry without writing the lockfile."
  - "RustSec RUSTSEC-2024-0429 marks `glib` unsound and patched in `>=0.20.0`; the current lockfile has `glib@0.18.5`."
  - "RustSec RUSTSEC-2026-0097 marks `rand` unsound and patched in `>=0.8.6`, `>=0.9.3`, or `>=0.10.1`; the current lockfile has `rand@0.8.5` and `rand@0.7.3`."
  - "RustSec GTK3 binding advisories such as RUSTSEC-2024-0415 have no patched GTK3 versions and point toward gtk4-rs rather than a simple patch bump."
  - "Tauri official docs state `tauri build` and `tauri android build` run `build.beforeBuildCommand` and use `build.frontendDist`; `pnpm tauri:build` remains only the frontend Vite build script in this repo."
  - "Local docs and workflows already use `cargo-audit` as the executable RustSec gate; `cargo-deny` is unavailable locally and is deferred from this stage."
next_step: "/sf-start SocialFlow Native Tauri RustSec Warning Migration"
---

# Title

SocialFlow Native Tauri RustSec Warning Migration

# Status

Ready. This spec defines the dedicated native dependency migration and risk-policy pass for the RustSec warning set left after the dependency hygiene chantier. It was updated after the first readiness gate to make the policy surface explicit: this stage uses `cargo-audit` plus documented accepted-risk tracking, with no `cargo-deny`, `.cargo/audit.toml`, or `deny.toml` adoption.

# User Story

As the SocialFlow maintainer, I want the remaining RustSec warning set split into fixable native dependency updates and explicitly accepted upstream risks, so desktop and Android native releases are not blocked by hidden Rust dependency risk or unsafe transitive overrides.

Actor: SocialFlow maintainer/operator.

Trigger: a native dependency/security maintenance pass starts after the general dependency hygiene stage documented `DEP-RISK-004`.

Expected observable result: the native dependency graph either removes fixable RustSec warnings, documents accepted upstream warnings with exact advisory IDs and rationale, or stops with a clear migration blocker before native release artifacts are treated as clean.

# Minimal Behavior Contract

When the maintainer starts the native RustSec warning migration, the project must produce a fresh RustSec baseline, attempt only safe direct or officially supported native dependency updates, and then make the final warning posture observable in `src-tauri/DEPENDENCY_AUDIT.md` and `docs/dependency-risk-register.md`. The policy surface for this stage is `cargo-audit` plus explicit documentation: remaining warning advisories stay visible and are classified as fixed, accepted, or blocked, without adding `cargo-deny`, `.cargo/audit.toml`, `deny.toml`, or silent suppressions. If an advisory cannot be fixed without unsupported transitive overrides or a larger Tauri/Wry/GTK ecosystem migration, the run must stop or explicitly document that accepted risk with the advisory ID, dependency path, affected platform, release impact, and next review. The easiest edge case to miss is that `cargo audit` can exit 0 while still reporting informational `unsound` or `unmaintained` warnings that matter for native release decisions.

# Success Behavior

- Given the current `src-tauri/Cargo.lock`, when the migration starts, then `cargo audit --json` is saved or summarized with exact counts for vulnerabilities, unmaintained warnings, unsound warnings, and yanked crates.
- Given `rand@0.8.5` is a direct root dependency through `src-tauri/Cargo.toml`, when the safe patch update is attempted, then `Cargo.lock` moves the direct 0.8 line to a patched version such as `0.8.6` if Cargo resolves it without changing unrelated native stacks.
- Given `glib@0.18.5`, GTK3 crates, `rand@0.7.3`, `fxhash`, `proc-macro-error`, and `unic-*` are owned by Tauri/Wry/GTK/parser transitive paths, when no supported direct update removes them, then the docs record the advisory IDs, inverse dependency trees, owner path, and accepted or blocked status instead of forcing overrides.
- Given native release workflows run, when RustSec scans execute before native artifact builds, then workflow logs prove the current warning policy was applied before Linux, Windows, or Android artifacts are produced.
- Given the stage completes, when `/sf-verify` reviews it, then each original RustSec warning is classified as fixed, accepted with rationale and review date, or blocked pending upstream migration while still visible to `cargo audit`.

# Error Behavior

- If `cargo audit` reports any hard vulnerability, the migration must fail the stage and cannot be closed as warning-only.
- If `cargo update` or `pnpm tauri:bundle` changes or breaks unrelated web, extension, Tauri frontend, desktop, or Android behavior, the stage must stop and keep the prior lockfile boundary available for rollback.
- If a transitive override is required to silence a warning but the direct owner crate does not officially support the target major line, the implementation must not apply the override.
- If implementation appears to require `.cargo/audit.toml`, `deny.toml`, `cargo-deny`, or any other suppression/policy tool to close the stage, the implementation must stop and route that as a separate dependency-policy spec.
- If warnings remain but the final docs do not name the advisory IDs, owner paths, affected platforms, release impact, and review/removal criteria, the stage must fail verification.
- If native Linux dependencies or Android tooling are unavailable locally, the stage must document the local proof gap and require CI workflow evidence before closing.
- It must never log secrets, loosen Tauri permissions, remove the lockfile, disable RustSec gates, or treat `pnpm tauri:build` alone as native packaging proof.

# Problem

The dependency hygiene chantier made RustSec scanning reproducible, but it did not remove the warning set. The current local baseline is scanner-proven rather than warning-free: `cargo audit` exits 0 with no vulnerabilities, but reports 17 unmaintained and 3 unsound informational warnings. Some warnings are fixable local drift, especially the direct `rand@0.8.5` lock entry, while others are Tauri Linux desktop ecosystem dependencies that cannot be safely fixed by forcing transitive major versions.

The operational risk is ambiguity. Without a dedicated native migration stage, future release checks may read `cargo audit` exit 0 as "Rust clean" even though advisory warnings still affect the native desktop dependency graph.

# Solution

Run a dedicated native/Tauri RustSec migration pass. First refresh and classify the baseline, then apply safe direct Cargo updates such as the `rand` 0.8 patch line, then evaluate whether current Tauri/Wry/GTK upgrades can remove the transitive warning paths without breaking desktop and Android packaging. Any warnings that remain must stay visible to `cargo-audit` and be documented as accepted upstream risk or blocked native migration work with explicit advisory IDs and review criteria. `cargo-deny` adoption and RustSec suppression configuration are intentionally deferred to a later dependency-policy chantier if they become necessary.

# Scope In

- Refresh RustSec baseline using `cargo audit --json` from `src-tauri`.
- Classify every current RustSec warning by advisory ID, crate, version, warning type, patched range, owner path, platform reachability, and remediation status.
- Attempt safe direct update for `rand@0.8.5` to the patched 0.8 line.
- Investigate supported Tauri 2, Wry, WebKitGTK/GTK, tray, parser, and plugin update paths that could remove transitive warnings.
- Add or update Rust dependency documentation in `src-tauri/DEPENDENCY_AUDIT.md`.
- Update `docs/dependency-risk-register.md`, especially `DEP-RISK-004`, with final status and review criteria.
- Keep `cargo-audit` as the executable RustSec gate for this stage; do not add suppression config.
- Document the warning policy decision in `src-tauri/DEPENDENCY_AUDIT.md` and `docs/dependency-risk-register.md`: remaining accepted warnings stay visible, tracked, and time-bounded.
- Validate native packaging through local commands and/or CI evidence, distinguishing frontend Tauri build from native bundle generation.
- Preserve desktop Linux, Windows, Android, web, Chrome extension, and Firefox extension release surfaces.

# Scope Out

- No broad migration from Tauri 2 to another native shell framework.
- No forced transitive Rust overrides for `glib`, GTK3 crates, `wry`, `tao`, `webkit2gtk`, `kuchikiki`, `selectors`, `phf`, or `html5ever` unless the direct owner officially supports the target version range.
- No GTK4 application rewrite unless `/sf-ready` or a later spec explicitly approves a larger native architecture migration.
- No removal of tray, child webview, session persistence, backup encryption, or Android plugin behavior to make warnings disappear.
- No npm dependency migration except commands required to validate native builds.
- No `cargo-deny` adoption, `.cargo/audit.toml`, `deny.toml`, broad ignore file, or advisory suppression in this stage.
- No user-facing UI, copy, branding, pricing, auth, Convex, or social-network workflow changes.
- No changelog update in this stage; changelog remains for `/sf-end` or release flow.

# Constraints

- Keep changes incremental and reversible.
- Preserve Tauri 2 and existing `src-tauri` structure.
- Preserve `rust-version = "1.77.2"` unless a readiness decision explicitly approves raising the Rust floor.
- Preserve `publish = false` for the private native crate.
- Preserve the committed `src-tauri/Cargo.lock`.
- Use `cargo update --dry-run` before writing lockfile changes for targeted updates.
- Use official docs or local Cargo resolution as the contract for dependency compatibility.
- Do not disable `.github/workflows/build.yml` or `.github/workflows/dev-builds.yml` RustSec gates.
- Do not treat `pnpm tauri:build` as native release proof; it is the frontend Vite build script.
- Do not introduce a new dependency-policy tool or RustSec suppression config in this stage; route that to a separate spec if implementation proves it necessary.

# Dependencies

- Local native stack:
  - Rust package: `app@0.1.0`, edition 2021, `rust-version = "1.77.2"`.
  - Tauri root manifest: `src-tauri/Cargo.toml`.
  - Android plugin manifest: `src-tauri/plugins/android-webview/Cargo.toml`.
  - Tauri dependency line: `tauri = "2.10.0"` with `unstable`, `tray-icon`, and `image-png` features for both desktop and Android target sections.
  - Direct random dependency: `rand = "0.8"`, currently locked to `rand@0.8.5`.
  - Native backup code uses `rand::thread_rng().fill_bytes(...)` in `src-tauri/src/backup.rs`.
- Advisory tooling:
  - `cargo-audit` local version: `cargo-audit-audit 0.22.1`.
  - `cargo-audit` is the only executable RustSec policy gate in this stage.
  - `cargo-deny` is currently unavailable locally and is explicitly out of scope for this stage.
- Fresh external docs:
  - `fresh-docs checked`: Context7 `/websites/v2_tauri_app` confirms `tauri build` and `tauri android build` generate native artifacts and run `build.beforeBuildCommand` against `build.frontendDist`; Linux packaging depends on WebKitGTK/GTK runtime and build packages.
  - `fresh-docs checked`: RustSec official advisory pages confirm `glib` RUSTSEC-2024-0429 patched in `>=0.20.0`, `rand` RUSTSEC-2026-0097 patched in `>=0.8.6`, `>=0.9.3`, or `>=0.10.1`, and GTK3 binding warnings such as RUSTSEC-2024-0415 have no patched GTK3 versions.
  - `fresh-docs checked`: `cargo-audit` README states the first preferred fix is upgrading the vulnerable crate and that ignores can be configured through `audit.toml`.
  - `fresh-docs checked`: `cargo-deny` official docs support advisory configuration, ignore lists, `unmaintained`, `unsound`, license checks, source checks, and unused ignored advisory checks; this confirms that adopting it would be a broader dependency-policy change and is deferred here.

# Invariants

- Native security posture must be observable through scan output and docs.
- Release artifacts must remain gated by RustSec scanning before build/upload.
- Cargo lockfile integrity must be preserved.
- Desktop child webviews, isolated data directories, tray behavior, Android webview plugin behavior, and encrypted backups must keep working.
- Optional credentials and offline-safe startup behavior must remain unchanged.
- Accepted risks must have review/removal criteria; they must not become invisible ignores.

# Links & Consequences

- `src-tauri/Cargo.lock`: expected to change if direct or supported transitive Cargo updates are applied.
- `src-tauri/Cargo.toml`: may change only for direct dependency version constraints needed by supported Cargo resolution.
- `src-tauri/DEPENDENCY_AUDIT.md`: must be updated with the fresh baseline, classifications, commands, and proof gaps.
- `docs/dependency-risk-register.md`: must update `DEP-RISK-004` with fixed, accepted-visible, or blocked status.
- `.github/workflows/build.yml` and `.github/workflows/dev-builds.yml`: should continue running `cargo audit` before native artifact generation; command changes are only allowed to repair a missing or misplaced existing gate.
- `.cargo/audit.toml` or `deny.toml`: must not be added in this stage.
- Dependabot Cargo config already covers `/src-tauri` and `/src-tauri/plugins/android-webview`; keep it aligned with any new policy.
- CI consequences: Linux desktop release depends on WebKitGTK/GTK system packages; Android depends on SDK/NDK target setup; Windows build job has RustSec scan before Tauri action.

# Documentation Coherence

- Update `src-tauri/DEPENDENCY_AUDIT.md` because this is the canonical native dependency evidence file.
- Update `docs/dependency-risk-register.md` because `DEP-RISK-004` is the current accepted native migration risk.
- Update the parent dependency spec's `Skill Run History` only through lifecycle skills when the native migration is explicitly attached to that parent chantier; otherwise this spec owns the new chantier trace.
- README, marketing pages, onboarding, pricing, FAQ, SEO, and support docs are not impacted because this stage does not change user-facing product behavior.
- CHANGELOG is out of scope until `/sf-end` or release preparation.

# Edge Cases

- `cargo audit` exit 0 can still include `unsound` or `unmaintained` warnings.
- Updating direct `rand@0.8.5` may leave `rand@0.7.3` through `tauri-utils` parser transitive paths.
- Updating Tauri packages may update the lockfile but still keep GTK3 warnings if current Tauri Linux desktop still depends on GTK3 bindings.
- Removing `tray-icon` to avoid GTK/libappindicator warnings would change product behavior and is out of scope without explicit approval.
- Linux warnings may be platform-specific, but release workflow includes Linux artifacts, so they remain operationally relevant.
- Android may not exercise GTK/WebKitGTK Linux dependencies, but the same root Cargo workspace and audit policy covers all target paths unless target-specific filtering is explicitly configured and documented.
- `cargo-deny` multiple-version and advisory rules are intentionally out of scope; adding them here would expand the migration into a broader dependency-policy chantier.
- A new RustSec advisory can appear during the stage; classify it separately instead of hiding it inside this baseline.

# Implementation Tasks

- [ ] Task 1: Capture fresh RustSec and Cargo baseline
  - File: `src-tauri/DEPENDENCY_AUDIT.md`
  - Action: Record outputs or summaries for `cargo audit --version`, `(cd src-tauri && cargo audit --json)`, `cargo tree --locked -d`, `cargo metadata --locked --no-deps --format-version 1`, and inverse trees for every warning family.
  - User story link: Establishes the exact native risk baseline before changing dependencies.
  - Depends on: None.
  - Validate with: `node -e "const a=require('/tmp/socialflow-cargo-audit.json'); console.log(a.vulnerabilities?.count, a.warnings)"` or equivalent parser after writing the JSON to a temp file.
  - Notes: Do not commit raw JSON unless it is intentionally useful; a concise doc table is preferred.

- [ ] Task 2: Build the warning classification table
  - File: `src-tauri/DEPENDENCY_AUDIT.md`
  - Action: Add a table listing advisory ID, crate, locked version, warning type, patched range, inverse dependency owner path, platform reachability, and planned status for each warning.
  - User story link: Makes every warning observable and prevents `cargo audit` exit 0 from hiding risk.
  - Depends on: Task 1.
  - Validate with: Every advisory ID reported by `cargo audit --json` appears exactly once in the table or as a grouped GTK3 family with all crate names listed.
  - Notes: Group GTK3 binding advisories only when the individual crate list remains explicit.

- [ ] Task 3: Apply safe direct `rand` 0.8 patch update
  - File: `src-tauri/Cargo.lock`
  - Action: Run `cargo update -p rand@0.8.5 --precise 0.8.6` from `src-tauri` if the dry-run still succeeds, then verify the direct `rand@0.8` warning is removed or reduced.
  - User story link: Removes the easiest direct unsound warning without changing major lines.
  - Depends on: Task 1.
  - Validate with: `cargo update -p rand@0.8.5 --precise 0.8.6 --dry-run`, then after applying, `(cd src-tauri && cargo audit --json)` and `cargo tree --locked -i rand@0.8.6`.
  - Notes: Stop if Cargo wants unrelated major updates or raises the Rust version floor.

- [ ] Task 4: Verify native backup crypto behavior after `rand` update
  - File: `src-tauri/src/backup.rs`
  - Action: Inspect whether code changes are needed for `rand::thread_rng().fill_bytes(...)`; avoid changing crypto behavior unless the compiler requires it.
  - User story link: Preserves encrypted backup behavior while updating dependency risk.
  - Depends on: Task 3.
  - Validate with: `(cd src-tauri && cargo check --locked)` and any existing Rust tests if present.
  - Notes: If no Rust tests exist, document that the validation is compile/build only.

- [ ] Task 5: Evaluate supported Tauri/Wry/GTK/parser update path
  - File: `src-tauri/Cargo.toml`
  - Action: Check whether current compatible Tauri 2, Tauri plugins, `tauri-build`, `wry`, `tao`, `webkit2gtk`, `tray-icon`, parser crates, or Android plugin updates remove warning paths without unsupported overrides.
  - User story link: Separates ecosystem-owned warnings from local direct dependency drift.
  - Depends on: Task 2.
  - Validate with: `cargo update --dry-run`, targeted `cargo update -p <package> --dry-run`, `cargo tree --locked -i glib@0.18.5`, `cargo tree --locked -i rand@0.7.3`, and `cargo audit --json`.
  - Notes: If official crate constraints still require GTK3/glib 0.18 paths, do not force a patch. Document the blocker instead.

- [ ] Task 6: Encode the visible-warning `cargo-audit` policy
  - File: `src-tauri/DEPENDENCY_AUDIT.md`, `docs/dependency-risk-register.md`
  - Action: Document that this stage keeps `cargo-audit` as the executable gate, adds no `.cargo/audit.toml`, `deny.toml`, or `cargo-deny` config, and requires every remaining warning to stay visible while being classified with rationale, platform scope, owner path, next review, and removal criteria.
  - User story link: Keeps accepted risk explicit and prevents silent warning drift.
  - Depends on: Tasks 2 and 5.
  - Validate with: `(cd src-tauri && cargo audit)` plus `rg -n "cargo-audit|cargo audit|audit.toml|deny.toml|cargo-deny|RUSTSEC-" src-tauri/DEPENDENCY_AUDIT.md docs/dependency-risk-register.md .github/workflows/build.yml .github/workflows/dev-builds.yml`.
  - Notes: Do not add suppression config. If a hard gate for warnings or license/source policy becomes required, stop and create a separate dependency-policy spec.

- [ ] Task 7: Update dependency risk register
  - File: `docs/dependency-risk-register.md`
  - Action: Update `DEP-RISK-004` with final status, warnings removed, warnings accepted, blocked migration owner path, review date, and removal criteria.
  - User story link: Provides operator-facing release risk tracking.
  - Depends on: Tasks 3, 5, and 6.
  - Validate with: `rg -n "DEP-RISK-004|RustSec|RUSTSEC-" docs/dependency-risk-register.md src-tauri/DEPENDENCY_AUDIT.md`.
  - Notes: Keep `DEP-RISK-002` separate; it tracks scan execution, not warning remediation.

- [ ] Task 8: Revalidate CI RustSec gate semantics
  - File: `.github/workflows/build.yml`
  - Action: Confirm release Linux and Windows jobs install and run `cargo audit` before Tauri artifact build; adjust only if the existing gate is missing, weakened, or placed after artifact generation.
  - User story link: Ensures native release artifacts cannot bypass the warning policy.
  - Depends on: Task 6.
  - Validate with: workflow review plus `rg -n "cargo-audit|cargo audit|Run RustSec audit" .github/workflows/build.yml`.
  - Notes: Do not weaken gates or move them after artifact upload.

- [ ] Task 9: Revalidate Android/dev native gate semantics
  - File: `.github/workflows/dev-builds.yml`
  - Action: Confirm Android debug APK and Windows test native paths run `cargo audit` before native builds; adjust only if the existing gate is missing, weakened, or placed after artifact generation.
  - User story link: Keeps Android and dev native artifacts aligned with release risk posture.
  - Depends on: Task 6.
  - Validate with: workflow review plus `rg -n "cargo-audit|cargo audit|Run RustSec audit" .github/workflows/dev-builds.yml`.
  - Notes: Preserve existing Android SDK/NDK setup and `pnpm exec tauri android build --ci --debug --apk -t aarch64`.

- [ ] Task 10: Run cross-surface validation
  - File: `package.json`
  - Action: Run the relevant repo checks without changing scripts for new policy tooling.
  - User story link: Proves dependency changes did not break web, extension, desktop, Android, or Convex-adjacent build surfaces.
  - Depends on: Tasks 3 through 9.
  - Validate with: `corepack pnpm install --frozen-lockfile --ignore-scripts`, `corepack pnpm typecheck`, `corepack pnpm typecheck:full`, `corepack pnpm exec tsc -p convex/tsconfig.json --noEmit`, `corepack pnpm lint:check`, `corepack pnpm test:once`, `corepack pnpm build:web`, `corepack pnpm build:chrome`, `corepack pnpm build:firefox`, `corepack pnpm lint:manifest`, `corepack pnpm tauri:build`, `(cd src-tauri && cargo check --locked)`, `(cd src-tauri && cargo audit)`, and `corepack pnpm tauri:bundle` when local native prerequisites are available.
  - Notes: `corepack pnpm tauri:build` is only Tauri frontend output. Native proof requires `tauri:bundle`, `pnpm exec tauri build --ci --no-bundle`, or CI artifact evidence.

# Acceptance Criteria

- [ ] CA 1: Given the current native dependency graph, when `cargo audit --json` runs before edits, then the baseline records 0 hard vulnerabilities and the exact RustSec warning count by type.
- [ ] CA 2: Given each current warning advisory, when the classification table is complete, then every advisory has a crate, version, warning type, owner path, platform reachability, decision, and removal criterion.
- [ ] CA 3: Given `rand@0.8.5` is directly reachable from `app`, when the safe patch update is applied, then the lockfile uses a patched 0.8 version or the stage documents why the update was blocked.
- [ ] CA 4: Given `src-tauri/src/backup.rs` uses random bytes for salt and nonce generation, when the `rand` update is complete, then backup encryption code still compiles without changing archive format.
- [ ] CA 5: Given `glib@0.18.5` is owned by Tauri/Wry/GTK Linux desktop dependencies, when no supported direct update removes it, then the warning remains visible in `cargo audit` and is documented with explicit advisory-specific rationale.
- [ ] CA 6: Given GTK3 RustSec advisories have no patched GTK3 versions, when the stage completes, then the docs classify them as upstream/native migration risk rather than local hygiene failure.
- [ ] CA 7: Given this stage excludes RustSec suppression config, when the final diff is reviewed, then no `.cargo/audit.toml`, `deny.toml`, `cargo-deny` config, or broad advisory ignore is added.
- [ ] CA 8: Given Linux/Windows release workflows build native artifacts, when workflow review runs, then `cargo audit` executes before Tauri artifact generation.
- [ ] CA 9: Given Android debug APK workflow builds native artifacts, when workflow review runs, then `cargo audit` executes before Android build output.
- [ ] CA 10: Given dependency docs are updated, when `/sf-verify` reviews them, then `src-tauri/DEPENDENCY_AUDIT.md` and `docs/dependency-risk-register.md` agree on the status of `DEP-RISK-004`.
- [ ] CA 11: Given native build prerequisites are available locally, when validation runs, then at least one native desktop packaging path succeeds; if not available, CI artifact evidence is required before closing.
- [ ] CA 12: Given the migration changes Cargo dependencies, when cross-surface checks run, then web, Chrome, Firefox, Tauri frontend, TypeScript, lint, tests, Convex typecheck, Cargo check, and RustSec checks pass or the stage is blocked with a repair plan.

# Test Strategy

- Baseline and policy:
  - `(cd src-tauri && cargo audit --json > /tmp/socialflow-cargo-audit.json)`
  - Parse JSON to confirm vulnerabilities and warnings by category.
  - `(cd src-tauri && cargo tree --locked -d)`
  - `(cd src-tauri && cargo tree --locked -i glib@0.18.5)`
  - `(cd src-tauri && cargo tree --locked -i rand@0.8.5)` before the update and `rand@0.8.6` after the update if applied.
  - `(cd src-tauri && cargo tree --locked -i rand@0.7.3)`
- Cargo/Rust validation:
  - `(cd src-tauri && cargo update -p rand@0.8.5 --precise 0.8.6 --dry-run)`
  - `(cd src-tauri && cargo check --locked)`
  - `(cd src-tauri && cargo audit)`
  - Confirm no suppression/policy config was added: `test ! -f src-tauri/.cargo/audit.toml && test ! -f .cargo/audit.toml && test ! -f deny.toml && test ! -f src-tauri/deny.toml`.
- Project validation:
  - `corepack pnpm install --frozen-lockfile --ignore-scripts`
  - `corepack pnpm typecheck`
  - `corepack pnpm typecheck:full`
  - `corepack pnpm exec tsc -p convex/tsconfig.json --noEmit`
  - `corepack pnpm lint:check`
  - `corepack pnpm test:once`
  - `corepack pnpm build:web`
  - `corepack pnpm build:chrome`
  - `corepack pnpm build:firefox`
  - `corepack pnpm lint:manifest`
  - `corepack pnpm tauri:build`
  - `corepack pnpm tauri:bundle` when local Linux native prerequisites are available.
- CI/manual evidence:
  - Review `.github/workflows/build.yml` and `.github/workflows/dev-builds.yml`.
  - Before closing, collect live CI logs for RustSec/policy steps before native artifact build when local packaging cannot prove every target.

# Risks

- Some warnings are ecosystem-owned and may remain until Tauri/Wry/GTK move away from GTK3 binding paths or update parser dependencies.
- Deferring `cargo-deny` means this stage does not add license/source policy scanning; that remains a separate dependency-policy chantier if needed.
- Changing Tauri feature flags to remove warning paths may remove tray, image, unstable child webview, or platform behavior.
- A Tauri update may affect Linux WebKitGTK, Windows bundling, Android plugin build, or generated artifacts even when Rust compilation passes.
- Local ARM/Linux environment may not prove Windows artifact behavior.
- Treating warnings as accepted risk without review dates would make the release posture decay.

# Execution Notes

Read first:

- `src-tauri/DEPENDENCY_AUDIT.md`
- `docs/dependency-risk-register.md`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/plugins/android-webview/Cargo.toml`
- `.github/workflows/build.yml`
- `.github/workflows/dev-builds.yml`
- `src-tauri/src/backup.rs`

Implementation approach:

1. Start with a no-edit baseline run and warning classification.
2. Apply only the direct `rand` 0.8 patch update if the dry-run remains narrow.
3. Re-run RustSec and Cargo inverse trees to see which warnings remain.
4. Investigate supported Tauri/native updates, but do not force transitive overrides.
5. Keep remaining warnings visible through `cargo-audit` and encode accepted or blocked status in docs; do not add suppression or `cargo-deny` config.
6. Update docs and risk register.
7. Run cross-surface checks and native packaging/CI validation.

Stop conditions:

- Any hard RustSec vulnerability appears.
- A dependency update requires raising Rust below/above the approved project floor without a readiness decision.
- A fix requires removing tray, child webviews, session persistence, Android plugin behavior, or backup encryption behavior.
- A transitive override is the only way to make warnings disappear.
- A suppression file, `cargo-deny`, or stricter dependency-policy tool becomes necessary to satisfy release requirements.
- Native packaging fails after Cargo changes.
- Official docs or Cargo resolution show the planned path is unsupported.

Fresh external docs verdict:

- `fresh-docs checked`. Tauri, RustSec/cargo-audit, and cargo-deny official sources were consulted on 2026-05-02. The supported implementation path for this stage is staged update plus visible-warning documentation under `cargo-audit`; `cargo-deny` and suppressions are deferred rather than silently introduced.

# Open Questions

- None. Policy decision for this spec: keep `cargo-audit` as the executable RustSec gate, keep remaining warnings visible, document accepted or blocked warning posture in `src-tauri/DEPENDENCY_AUDIT.md` and `docs/dependency-risk-register.md`, and defer `cargo-deny`, `.cargo/audit.toml`, `deny.toml`, or any advisory suppression to a separate dependency-policy spec.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-02 12:38:54 | sf-spec | GPT-5 Codex | Created dedicated native RustSec warning migration spec from local cargo audit, Cargo tree evidence, existing dependency risk docs, CI workflows, and current Tauri/RustSec/cargo-deny docs | Draft saved; ready gate required before implementation | /sf-ready SocialFlow Native Tauri RustSec Warning Migration |
| 2026-05-02 12:45:48 | sf-ready | GPT-5 Codex | Ran strict readiness gate against the native RustSec warning migration spec, local Cargo/Tauri evidence, dependency risk docs, and current official Tauri/RustSec/cargo-deny sources | Not ready: the spec still leaves the cargo-deny versus cargo-audit policy surface for readiness to decide, which changes tooling, CI, validation, and acceptance scope | /sf-spec SocialFlow Native Tauri RustSec Warning Migration |
| 2026-05-02 12:49:59 | sf-spec | GPT-5 Codex | Updated the native RustSec warning migration spec to resolve the readiness blocker by choosing visible `cargo-audit` warnings plus documentation as the stage policy surface | Draft updated; cargo-deny, audit suppressions, and deny.toml are explicitly out of scope for this stage | /sf-ready SocialFlow Native Tauri RustSec Warning Migration |
| 2026-05-02 13:13:33 | sf-ready | GPT-5 Codex | Re-ran readiness gate against the updated native RustSec warning migration spec, local cargo-audit/workflow evidence, language doctrine, and fresh Tauri/RustSec/cargo-deny docs | Ready: no blocking ambiguity remains; visible cargo-audit warning policy, stop conditions, tasks, acceptance criteria, docs impact, and security boundaries are explicit | /sf-start SocialFlow Native Tauri RustSec Warning Migration |
| 2026-05-02 13:53:52 | sf-start | GPT-5 Codex | Implemented the native RustSec warning migration: refreshed cargo-audit baseline, patched direct `rand` 0.8 to `0.8.6`, evaluated broader Tauri/parser update path, documented remaining visible warnings, and rechecked workflow gate placement | Partial: direct fix and policy docs are implemented; native compile/package proof is blocked locally because `pkg-config`/GTK system dependencies are unavailable | /sf-verify SocialFlow Native Tauri RustSec Warning Migration |
| 2026-05-02 14:26:43 | sf-verify | GPT-5 Codex | Verified the native RustSec migration against the ready spec, current cargo-audit output, Cargo inverse trees, dependency docs, workflow gate placement, quick pnpm checks, local `cargo check --locked`, and `pnpm tauri:bundle` | Partial: RustSec classification, direct `rand` fix, local Rust check, and Tauri no-bundle release build are verified; required docs/spec artifacts are still untracked and the worktree still contains out-of-scope changes that need isolation before ship | /sf-ship SocialFlow Native Tauri RustSec Warning Migration |
| 2026-05-02 19:56:37 | sf-ship | GPT-5 Codex | Closed and shipped the scoped native RustSec migration with updated dependency docs, local task/changelog notes, local native proof, and a targeted commit excluding unrelated dirty worktree changes | shipped | None |

# Current Chantier Flow

- sf-spec: done
- sf-ready: ready
- sf-start: partial
- sf-verify: partial
- sf-end: not launched
- sf-ship: shipped

Current command: `/sf-ship end SocialFlow Native Tauri RustSec Warning Migration`

Next command: `None`
