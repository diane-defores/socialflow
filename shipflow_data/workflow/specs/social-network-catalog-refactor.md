---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-05-08"
created_at: "2026-05-08 00:00:00 UTC"
updated: "2026-05-08"
updated_at: "2026-05-08 00:00:00 UTC"
status: ready
source_skill: sf-build
source_model: "GPT-5 Codex"
scope: "architecture-refactor"
owner: "Diane"
confidence: high
user_story: "As the SocialGlowz maintainer, I want built-in social network metadata to come from one frontend catalog, so adding a network no longer requires manual edits across multiple UI files and is safer to validate before Android/native-specific work."
risk_level: "medium"
security_impact: "no"
docs_impact: "yes"
linked_systems:
  - "SocialGlowz webview network selection"
  - "desktop sidebar"
  - "mobile dashboard"
  - "mobile profile sheet"
  - "onboarding network selection"
  - "profile hidden-network preferences"
  - "Tauri/Android native webview inputs"
depends_on:
  - artifact: "AGENT.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "CLAUDE.md"
    artifact_version: "1.0.0"
    required_status: "active"
supersedes: []
evidence:
  - "2026-05-08 network-addition review found duplicated built-in network metadata in WEBVIEW_URLS, AppSidebar, MobileLayout, MobileProfileSheet, and OnboardingFlow."
  - "Android native plugin keeps a separate network registry for bottom bar icons, cookies, login URLs, and UA behavior; this refactor must not pretend frontend metadata fully owns native behavior."
next_step: "/sf-start shipflow_data/workflow/specs/social-network-catalog-refactor.md"
---

# Social Network Catalog Refactor

## Status

Ready. This spec defines the first refactor step before adding Patreon, There's An AI For That, Industry Social, or other new networks.

## User Story

As the SocialGlowz maintainer, I want built-in social network metadata to come from one frontend catalog, so adding a network no longer requires manual edits across multiple UI files and is safer to validate before Android/native-specific work.

Actor: SocialGlowz maintainer.

Trigger: a developer adds, removes, renames, hides, displays, or validates a built-in social network in the SocialGlowz UI.

Expected observable result: frontend built-in network lists are generated from one typed catalog, while native Android special cases remain explicit and documented.

Value: fewer missed surfaces when adding social networks, less UI drift, and a smaller future project-local skill for adding networks.

## Minimal Behavior Contract

When the app needs built-in social network metadata, it must read IDs, labels, icons, colors, webview URLs, and onboarding/default-selection flags from a single typed frontend catalog. Existing visible networks, order, URLs, labels, icons, colors, hidden-network behavior, and custom-link behavior must remain unchanged. The easy edge case to miss is treating non-webview tools such as Kanban or native Android session rules as normal catalog networks; those must remain separate or explicitly flagged.

## Success Behavior

- Given the desktop sidebar renders built-in networks, then it uses catalog-derived items and preserves the current order and labels.
- Given the mobile dashboard renders built-in networks and colors, then it uses catalog-derived items and preserves current tile colors and custom icon branches.
- Given the mobile profile sheet lists clear-cookie targets, then it uses catalog-derived webview networks and preserves labels/icons.
- Given onboarding displays selectable networks, then it uses catalog-derived onboarding-enabled networks and preserves the current default selected networks.
- Given webview code needs a URL by network ID, then it reads from catalog-derived `WEBVIEW_URLS` or an equivalent compatibility export.
- Given custom links exist, then they remain outside the built-in catalog and still use their existing add/remove/select flow.

## Error Behavior

- Unknown network IDs must keep existing fallback behavior where available, such as default globe icons or raw ID labels.
- Missing catalog URL for a built-in webview network must fail typecheck or be impossible through the typed catalog shape.
- Existing hidden-network preferences for current IDs must continue to work because IDs are unchanged.
- Native Android special behavior must not silently disappear; if not refactored in this chantier, it must be documented as a separate registry.

## Scope In

- Add a typed frontend network catalog, likely `src/config/socialNetworks.ts`.
- Keep a compatibility export for `WEBVIEW_URLS` from `src/stores/webviewState.ts` unless replacing all imports is cleaner and low-risk.
- Refactor these consumers to use the catalog:
  - `src/ui/setup/pages/SocialGlowz/components/AppSidebar.vue`
  - `src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue`
  - `src/ui/setup/pages/SocialGlowz/components/MobileProfileSheet.vue`
  - `src/ui/setup/pages/SocialGlowz/components/OnboardingFlow.vue`
- Preserve current network order:
  - Twitter / X
  - Facebook
  - Instagram
  - LinkedIn
  - TikTok
  - Threads
  - Discord
  - Reddit
  - Snapchat
  - Quora
  - Pinterest
  - Telegram
  - Nextdoor
- Keep Kanban as a separate app/tool item.
- Update technical docs or agent guidance if the new catalog becomes the required edit point for future network additions.

## Scope Out

- Do not add Patreon, There's An AI For That, Industry Social, or any other new network in this refactor.
- Do not merge Android/Kotlin native network metadata into the frontend catalog in this chantier.
- Do not change cookie persistence, user-agent rules, login URL overrides, or Android bottom bar rendering.
- Do not redesign sidebar/mobile/onboarding UI.
- Do not delete routes or legacy mock network views unless proven unused and explicitly in scope later.
- Do not create the project-local `socialglowz-add-network` skill yet; create it after this catalog proves stable.

## Constraints

- Use `pnpm`.
- Preserve current public behavior across web, extension, desktop, and Android.
- Keep IDs stable because hidden-network preferences, session storage, and native session labels depend on them.
- Prefer TypeScript types that make an incomplete built-in network hard to define.
- Keep fallback icon behavior for networks without a custom Vue icon.
- Avoid touching generated type files manually.

## Target Catalog Shape

The catalog should expose enough structured metadata for current consumers without forcing Android details into frontend UI code:

```ts
export type BuiltInSocialNetwork = {
  id: string
  label: string
  route: `/${string}`
  url: string
  icon: string
  color: string
  tileColor?: string
  customIcon?: 'threads' | 'snapchat' | 'nextdoor'
  onboarding: boolean
  defaultSelected: boolean
}
```

Implementation may choose stricter literal types if it stays maintainable.

## Links & Consequences

- Current URL source: `src/stores/webviewState.ts`
- Desktop UI source: `src/ui/setup/pages/SocialGlowz/components/AppSidebar.vue`
- Mobile UI source: `src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue`
- Mobile profile/session source: `src/ui/setup/pages/SocialGlowz/components/MobileProfileSheet.vue`
- Onboarding source: `src/ui/setup/pages/SocialGlowz/components/OnboardingFlow.vue`
- Native Android registry: `src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt`
- DNS prefetch source: `src/ui/setup/pages/SocialGlowz/index.html`

## Documentation Coherence

- Update `AGENT.md` or a technical doc if future network additions should start from `src/config/socialNetworks.ts`.
- No marketing/editorial copy changes are expected.
- A later project-local skill can reference this spec and the new catalog after implementation.

## Validation

- `pnpm typecheck`
- `pnpm test:once`
- Optional if time allows: `pnpm build:web`
- Manual sanity after launch: sidebar order, mobile order, onboarding selected defaults, custom links, and webview opening for at least one catalog-derived network.

## Implementation Tasks

- [x] Add `src/config/socialNetworks.ts` with the typed built-in catalog and helper exports.
- [x] Refactor `src/stores/webviewState.ts` to derive `WEBVIEW_URLS` from the catalog while preserving its public API.
- [x] Refactor `AppSidebar.vue` to derive built-in menu items and custom-icon routing from the catalog.
- [x] Refactor `MobileLayout.vue` to derive built-in menu items and network colors from the catalog.
- [x] Refactor `MobileProfileSheet.vue` to derive webview labels/icons from the catalog.
- [x] Refactor `OnboardingFlow.vue` to derive network choices and default selections from the catalog.
- [x] Run validation and fix regressions within the scoped files.
- [x] Update docs/guidance for the new source of truth if validation passes.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-08 | sf-build | GPT-5 Codex | Created ready spec for catalog-first network refactor | ready | `/sf-start shipflow_data/workflow/specs/social-network-catalog-refactor.md` |
| 2026-05-08 | sf-start | GPT-5.3 Codex Spark | Implemented frontend catalog and refactored network UI consumers | implemented | `/sf-verify shipflow_data/workflow/specs/social-network-catalog-refactor.md` |
| 2026-05-08 | sf-verify | GPT-5 Codex | Ran typecheck, tests, Vue typecheck review, and web build | partial pass: scoped checks pass; `vue-tsc` still fails on pre-existing `src/lib/cloudSync.ts` issues | Fix unrelated `cloudSync.ts` full typecheck debt later or continue with scoped verification |
| 2026-05-09 | sf-end | GPT-5 Codex | Closed catalog refactor after cloudSync full typecheck fix and tracker/changelog updates | closed | `/sf-ship end` |
| 2026-05-09 | sf-ship | GPT-5 Codex | Full close and ship preparation with typecheck, full typecheck, tests, and lint | shipped | None |

## Current Chantier Flow

- sf-spec: ready
- sf-ready: ready
- sf-start: implemented
- sf-verify: pass
- sf-end: closed
- sf-ship: shipped
