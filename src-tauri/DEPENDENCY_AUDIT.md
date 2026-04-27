# Rust/Tauri Dependency Audit - 2026-04-27

Scope: `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, and the local Android webview plugin manifest.

## Commands Run

- `cargo audit --version` - unavailable locally (`cargo audit` is not installed).
- `cargo deny --version` - unavailable locally (`cargo deny` is not installed).
- `cargo tree --locked` - dependency graph resolves with the committed lockfile.
- `cargo tree --locked -d` - duplicate major/minor families are present, mostly through Tauri/GTK/webview transitive dependencies.
- `cargo metadata --locked --no-deps --format-version 1` - root manifest metadata is readable; root package currently has an empty `license` field.
- `git ls-files --error-unmatch src-tauri/Cargo.lock` - lockfile is tracked.

## Findings

- No automated RustSec advisory scan was possible because neither `cargo-audit` nor `cargo-deny` is installed.
- Manual RustSec spot-checks for notable locked packages found patched versions:
  - `aes-gcm 0.10.3` is at the patched version for RUSTSEC-2023-0096 / CVE-2023-42811 (`>=0.10.3`).
  - `bytes 1.11.1` is at the patched version for RUSTSEC-2026-0007 / CVE-2026-25541 (`>=1.11.1`).
  - `time 0.3.47` is at the patched version for RUSTSEC-2026-0009 / CVE-2026-25727 (`>=0.3.47`).
  - `rustls` is not present in the locked dependency graph.
- `Cargo.lock` is committed and all registry dependencies inspected in the lockfile use the crates.io index with checksums.
- A Dependabot config is present in the working tree for Cargo updates in both `/src-tauri` and `/src-tauri/plugins/android-webview`, but `.github/dependabot.yml` is currently untracked.
- Duplicate dependency versions exist, including `bitflags`, `getrandom`, `hashbrown`, `indexmap`, `png`, `rand`, `thiserror`, `toml`, `uuid`, and Windows target crates. These appear to be transitive ecosystem duplication from Tauri/GTK/webview stacks rather than direct manifest drift.
- The root package `license` field is empty. I did not change it because no repository license file or authoritative project license was found. Setting a guessed license would be higher risk than leaving the gap documented.

## Risk Assessment

Current posture is reasonable but not fully proven. The lockfile is tracked and checksummed, a Dependabot Cargo config is present in the working tree, and spot-checked current advisories are patched. The main gap is lack of a local RustSec scanner in the development/CI path, so this audit cannot prove there are zero advisories across the full locked graph.

Recommended next low-risk step: add `cargo audit` or `cargo deny` to CI or a documented local audit workflow. This does not require upgrading Tauri.

## Proof Gaps

- Full RustSec advisory matching was not performed locally.
- License compatibility across the full transitive graph was not scanned because `cargo-deny` is unavailable.
- Runtime reachability of transitive vulnerable APIs, if any exist outside the manual spot-checks, was not proven.
- Cargo update automation is not proven committed because `.github/dependabot.yml` is untracked in the current worktree.
- The correct project license is unknown; root Cargo metadata remains incomplete until ownership selects an SPDX license or adds a license file.
