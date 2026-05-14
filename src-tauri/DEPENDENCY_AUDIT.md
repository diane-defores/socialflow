# Rust/Tauri Dependency Audit - 2026-05-02

Scope: `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, the local Android webview plugin manifest, and native build workflow RustSec gates.

## Policy

This stage keeps `cargo-audit` as the executable RustSec gate. It does not add `.cargo/audit.toml`, `deny.toml`, `cargo-deny`, advisory ignores, or transitive overrides. Remaining warnings must stay visible in `cargo audit` output and be tracked here with advisory IDs, owner paths, platform reachability, release impact, next review, and removal criteria.

## Commands Run

- `cargo audit --version` - available locally as `cargo-audit-audit 0.22.1`.
- `(cd src-tauri && cargo audit --json > /tmp/socialglowz-cargo-audit-before.json)` - pre-migration baseline.
- `(cd src-tauri && cargo update -p rand@0.8.5 --precise 0.8.6 --dry-run)` - succeeded; would update only `rand v0.8.5 -> v0.8.6`.
- `(cd src-tauri && cargo update -p rand@0.8.5 --precise 0.8.6)` - applied the safe direct patch update.
- `(cd src-tauri && cargo update --dry-run)` - broad compatible native refresh was evaluated but not kept in this stage because it would change 134 packages and requires a separate Tauri/native MSRV and packaging validation pass.
- `(cd src-tauri && cargo audit --json > /tmp/socialglowz-cargo-audit-accepted.json)` - post-migration RustSec posture.
- `(cd src-tauri && cargo tree --locked -i rand@0.8.6)` - confirms the patched 0.8 line is used by `app` and Tauri parser/codegen paths.
- `(cd src-tauri && cargo tree --locked -i rand@0.7.3)` - confirms the remaining old `rand` line is owned by `tauri-utils -> kuchikiki -> selectors -> phf_generator`.
- `(cd src-tauri && cargo tree --locked -i glib@0.18.5)` - confirms the remaining `glib` warning is owned by the Linux GTK/WebKit/Tauri stack.
- `(cd src-tauri && cargo metadata --locked --format-version 1)` - lockfile metadata resolves.
- `(cd src-tauri && cargo check --locked)` - passed after installing the Tauri Linux system dependencies.
- `corepack pnpm tauri:build` - Tauri frontend asset build passes; this is not native packaging proof.
- `pnpm tauri:bundle` - passed after enabling the Corepack `pnpm` shim; produced `/home/ubuntu/socialglowz/src-tauri/target/release/app`.
- Workflow review: `.github/workflows/build.yml` and `.github/workflows/dev-builds.yml` install `cargo-audit` and run `cargo audit` before Linux, Windows, and Android native artifact builds.

## RustSec Baseline

| Stage | Hard vulnerabilities | Yanked crates | Unmaintained warnings | Unsound warnings |
| --- | ---: | ---: | ---: | ---: |
| Before migration | 0 | 0 | 17 | 3 |
| After accepted migration | 0 | 0 | 17 | 2 |

Fixed in this stage:

- `RUSTSEC-2026-0097` for the direct `rand@0.8.5` line is fixed by `Cargo.lock` moving `rand` 0.8 to `0.8.6`.

Not fixed in this stage:

- The remaining `RUSTSEC-2026-0097` warning is `rand@0.7.3` through Tauri parser/codegen transitive paths.
- `RUSTSEC-2024-0429` remains `glib@0.18.5` through the Linux GTK/WebKit/Tauri stack.
- GTK3 binding advisories remain because the affected crates have no patched GTK3 line and the supported migration path is an ecosystem move away from GTK3 bindings.
- `proc-macro-error` and `unic-*` warnings remain through Tauri parser/codegen paths unless a broader compatible Tauri/parser refresh is accepted and fully validated.

## Warning Classification

| Advisory | Crate/version | Type | Patched range | Owner path | Platform reachability | Decision | Removal criteria | Next review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RUSTSEC-2026-0097` | `rand@0.8.6` | unsound | `>=0.8.6` for the 0.8 line | `app` direct dependency and Tauri parser helpers | Desktop, Android, build/codegen | Fixed | Keep `rand` 0.8 at `>=0.8.6` or migrate direct code to a newer supported major | 2026-06-02 |
| `RUSTSEC-2026-0097` | `rand@0.7.3` | unsound | no patched 0.7 line; patched ranges start at `>=0.8.6`, `>=0.9.3`, `>=0.10.1` | `tauri-utils -> kuchikiki -> selectors -> phf_generator` | Build/codegen path used by Tauri manifests; release relevant because audit scans the whole lockfile | Accepted visible upstream risk | Remove when Tauri/parser updates drop `rand@0.7.3` without raising unsupported floors or breaking native builds | 2026-06-02 |
| `RUSTSEC-2024-0429` | `glib@0.18.5` | unsound | `>=0.20.0` | `tauri/wry/webkit2gtk/gtk/tray-icon/muda/tao` Linux desktop stack | Linux desktop native release path | Accepted visible upstream risk | Remove when Tauri/Wry/WebKitGTK/GTK stack supports `glib >=0.20` without forced overrides | 2026-06-02 |
| `RUSTSEC-2024-0413` | `atk@0.18.2` | unmaintained | none | GTK3 binding family via `gtk -> tauri/wry/tray` | Linux desktop native release path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0416` | `atk-sys@0.18.2` | unmaintained | none | GTK3 binding family via `atk/gtk` | Linux desktop native release path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0412` | `gdk@0.18.2` | unmaintained | none | GTK3 binding family via `gtk/webkit2gtk/wry` | Linux desktop native release path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0418` | `gdk-sys@0.18.2` | unmaintained | none | GTK3 binding family via `gdk/gtk/webkit2gtk/wry` | Linux desktop native release path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0411` | `gdkwayland-sys@0.18.2` | unmaintained | none | GTK3 binding family via `tao/wry` | Linux desktop Wayland path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0417` | `gdkx11@0.18.2` | unmaintained | none | GTK3 binding family via `wry` | Linux desktop X11 path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0414` | `gdkx11-sys@0.18.2` | unmaintained | none | GTK3 binding family via `gdkx11/wry` | Linux desktop X11 path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0415` | `gtk@0.18.2` | unmaintained | none | GTK3 binding family via `tauri`, `tauri-runtime-wry`, `webkit2gtk`, `wry`, `tray-icon`, `muda`, `tao` | Linux desktop native release path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0420` | `gtk-sys@0.18.2` | unmaintained | none | GTK3 binding family via `gtk/webkit2gtk` | Linux desktop native release path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0419` | `gtk3-macros@0.18.2` | unmaintained | none | GTK3 binding family via `gtk` | Linux desktop native release path | Accepted visible upstream risk | Remove through upstream GTK4/non-GTK3 migration or Tauri ecosystem update | 2026-06-02 |
| `RUSTSEC-2024-0370` | `proc-macro-error@1.0.4` | unmaintained | none | Tauri parser/codegen transitive path | Build/codegen path | Accepted visible upstream risk | Remove when compatible Tauri/parser update drops the crate and native validation passes | 2026-06-02 |
| `RUSTSEC-2025-0081` | `unic-char-property@0.9.0` | unmaintained | none | `tauri-utils -> kuchikiki/selectors/html5ever` parser path | Build/codegen and URL/pattern parsing path | Accepted visible upstream risk | Remove when compatible Tauri/parser update drops `unic-*` and native validation passes | 2026-06-02 |
| `RUSTSEC-2025-0075` | `unic-char-range@0.9.0` | unmaintained | none | `tauri-utils -> kuchikiki/selectors/html5ever` parser path | Build/codegen and URL/pattern parsing path | Accepted visible upstream risk | Remove when compatible Tauri/parser update drops `unic-*` and native validation passes | 2026-06-02 |
| `RUSTSEC-2025-0080` | `unic-common@0.9.0` | unmaintained | none | `tauri-utils -> kuchikiki/selectors/html5ever` parser path | Build/codegen and URL/pattern parsing path | Accepted visible upstream risk | Remove when compatible Tauri/parser update drops `unic-*` and native validation passes | 2026-06-02 |
| `RUSTSEC-2025-0100` | `unic-ucd-ident@0.9.0` | unmaintained | none | `tauri-utils -> kuchikiki/selectors/html5ever` parser path | Build/codegen and URL/pattern parsing path | Accepted visible upstream risk | Remove when compatible Tauri/parser update drops `unic-*` and native validation passes | 2026-06-02 |
| `RUSTSEC-2025-0098` | `unic-ucd-version@0.9.0` | unmaintained | none | `tauri-utils -> kuchikiki/selectors/html5ever` parser path | Build/codegen and URL/pattern parsing path | Accepted visible upstream risk | Remove when compatible Tauri/parser update drops `unic-*` and native validation passes | 2026-06-02 |

## Supported Update Evaluation

`cargo update --dry-run` showed a compatible broad refresh that would move Tauri to `2.11.0`, Wry to `0.55.0`, parser crates to newer lines, and remove `fxhash` plus `rand@0.7.3`. This stage did not keep that refresh because it changes 134 packages and needs its own native packaging/MSRV validation pass. It remains a candidate follow-up if the maintainer wants to reduce the remaining parser warnings before waiting for a GTK/WebKitGTK ecosystem fix.

No transitive override was applied for `glib`, GTK3 crates, `wry`, `tao`, `webkit2gtk`, `kuchikiki`, `selectors`, `phf`, or `html5ever`.

## Risk Assessment

Current posture is scanner-proven but not warning-free. The direct `rand` 0.8 unsound warning is fixed. The remaining RustSec posture is accepted-visible upstream risk:

- Linux desktop release still carries GTK3/glib warnings through the Tauri/Wry/WebKitGTK stack.
- Tauri parser/codegen paths still carry `rand@0.7.3`, `proc-macro-error`, and `unic-*` warnings until a broader native stack refresh is validated.
- Android does not exercise the GTK/WebKitGTK Linux runtime stack, but this repository uses one shared Cargo lockfile and audit policy, so warnings remain release-visible instead of being filtered or ignored.

## Proof Gaps

- Local native compile and no-bundle release build proof are now available: `(cd src-tauri && cargo check --locked)` and `pnpm tauri:bundle` pass in this environment after installing the Tauri Linux system dependencies.
- Live GitHub Actions logs still need to confirm `cargo audit` runs before native artifacts on the actual runners.
- Runtime reachability of warned transitive APIs was not proven.
- License/source policy scanning remains out of scope because `cargo-deny` adoption is intentionally deferred.
