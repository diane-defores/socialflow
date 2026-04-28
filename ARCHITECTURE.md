---
artifact: architecture_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialflow"
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: architecture
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "README.md"
  - "CONTEXT.md"
  - "CONTEXT-FUNCTION-TREE.md"
  - "src/ui/setup/pages/SocialFlow/main.ts"
  - "src-tauri/src/lib.rs"
  - "convex/schema.ts"
  - "manifest.config.ts"
  - "vite.config.ts"
  - "vite.tauri.config.ts"
  - "vite.web.config.ts"
external_dependencies:
  - "Vue 3"
  - "Vite 5"
  - "Pinia"
  - "PrimeVue"
  - "Convex"
  - "Tauri 2"
  - "Rust"
  - "Kotlin"
  - "Vue Router"
invariants:
  - "Les surfaces extension, web et desktop partagent une base de code Vue sans dupliquer le contrat de domaine central"
  - "Les données de synchronisation cloud passent par Convex quand la config est disponible, sinon degrade en mode local"
  - "Les commandes natives sensibles aux sessions sont centralisées dans src-tauri/src/lib.rs"
  - "La config d'app (theme, langue, profils) reste cohérente entre local state et cloud"
depends_on:
  - "CONTEXT.md"
  - "CONTEXT-FUNCTION-TREE.md"
supersedes: []
evidence:
  - "package.json"
  - "vite.config.ts"
  - "vite.chrome.config.ts"
  - "vite.firefox.config.ts"
  - "vite.tauri.config.ts"
  - "vite.web.config.ts"
  - "src/ui/setup/pages/SocialFlow/main.ts"
  - "src-tauri/src/lib.rs"
  - "convex/schema.ts"
  - "convex/*"
  - "manifest.config.ts"
next_review: "2026-07-26"
next_step: "/sf-docs audit ARCHITECTURE.md"
---

# Architecture Context

## Shape

- `source` : un codebase Vue 3 partagé.
- `distribution` : extension Chrome/Firefox, desktop Tauri, Android, web SPA.
- `backend` : Convex serverless.
- `sync` : stores locaux Pinia + sync cloud optionnelle via Convex.
- `native layer` : Rust/Kotlin (Tauri + plugin Android WebView).

## Runtime Boundaries

- **Browser shell**
  - Manifest + background/content script/services d'injection.
  - Pages UI dédiées : setup, popup, side-panel, options.
- **SocialFlow app**
  - `src/ui/setup/pages/SocialFlow` avec router et vues réseaux.
  - Appel de `cloudSyncQueue` et des stores partagés de `src/`.
- **Native host (desktop/mobile)**
  - `src-tauri/src/lib.rs` expose les commandes de contrôle WebView.
  - `set_grayscale`, `set_dark_mode`, `open_webview`, `inject_script`, backups.
- **Cloud backend**
  - `convex/` contient `schema` + fonctions auth/mutations/queries.

## Data and Control Flow

1. L'entrée UI monte l'app, configure Convex si `VITE_CONVEX_URL`.
2. L'utilisateur navigue entre vues réseau via le routeur SocialFlow.
3. `webviewStore` déclenche soit une vue intégrée (`NetworkWebviewHost` + commandes Rust), soit un rendu non-webview.
4. Les mutations importantes passent par les stores dans `src/stores` et les fonctions Convex.
5. Les settings et métadonnées de profils sont synchronisés via `cloudSync*` quand authenticated.
6. Les sessions natives sont maintenues par label `(profileId, networkId)` et stockages persistants par session.

## Multi-Output Build Pipeline

- `vite.chrome.config.ts` -> `dist/chrome/` + ZIP de publication.
- `vite.firefox.config.ts` -> `dist/firefox/` + ZIP de publication.
- `vite.tauri.config.ts` -> `dist/tauri/` pour Tauri desktop/mobile.
- `vite.web.config.ts` -> `dist/web/` et pages marketing multi-routes.
- `vite.config.ts` -> configuration de base commune.

## Platform Nuances

- Desktop webviews utilisent commandes Rust pour création/resize/show/hide/close.
- Android webviews sont délégués au plugin `tauri_plugin_android_webview`.
- Extension Chrome/Firefox garde des scripts dédiés (content script, side panel, popup).

## Security and Privacy Notes

- Auth token lifecycle est local à session via `src/lib/convexAuth.ts`.
- Les clés et données utilisateur proviennent des tables Convex dédiées.
- Les backups sont chiffrés côté Rust et stockés dans l'app data directory.

## Hotspots

- `src-tauri/src/lib.rs` : commandes d'ouverture/commande webview et gestion des sessions natives.
- `src/ui/setup/pages/SocialFlow/App.vue` : orchestrateur front de premier niveau.
- `src/stores/webviewState.ts` : point de décision pour le flux réseau actif.
- `src/lib/cloudSync.ts` : point de vérité du sync cloud.
- `convex/socialAccounts.ts` et `convex/schema.ts` : cœur domaine persistance.

## Known Constraints

- Le module `src/ui/setup/pages/SocialFlow` et les shells racine ne sont pas totalement dédoublés.

## Update Rule

Mettre à jour l'architecture si changent :
- la partition `src/` vs `SocialFlow/`,
- la topologie des commandes Tauri,
- le schéma Convex,
- les surfaces de build par plateforme.
