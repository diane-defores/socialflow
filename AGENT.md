---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialflow"
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: agent-entrypoint
owner: "Diane"
confidence: medium
risk_level: low
security_impact: none
docs_impact: yes
linked_systems:
  - "README.md"
  - "CONTEXT.md"
  - "CONTEXT-FUNCTION-TREE.md"
  - "ARCHITECTURE.md"
  - "src/ui/setup/pages/SocialFlow/main.ts"
  - "src/ui/setup/pages/SocialFlow/App.vue"
  - "src-tauri/src/lib.rs"
  - "convex/schema.ts"
  - "vite.config.ts"
  - "vite.chrome.config.ts"
  - "vite.firefox.config.ts"
  - "vite.tauri.config.ts"
  - "vite.web.config.ts"
depends_on: []
supersedes: []
evidence:
  - "README.md"
  - "package.json"
  - "src/ui/setup/pages/SocialFlow/main.ts"
  - "src/ui/setup/pages/SocialFlow/App.vue"
  - "src/ui/setup/pages/SocialFlow/router/index.ts"
  - "convex/auth.config.ts"
  - "convex/schema.ts"
  - "src-tauri/src/lib.rs"
  - "src-tauri/tauri.conf.json"
  - "manifest.config.ts"
next_review: "2026-07-26"
next_step: "/sf-docs audit AGENT.md"
---

# AGENT

## Purpose

Ce fichier sert de point d'entrée rapide pour toute action dans `socialflow`.
Il permet de lire les bons documents avant de parcourir le code.

## Read Order

1. Lire `README.md` pour la vue d'ensemble des plateformes.
2. Lire `CONTEXT.md` pour la carte opérationnelle et les flux.
3. Lire `CONTEXT-FUNCTION-TREE.md` avant toute tâche sur modules principaux.
4. Lire `ARCHITECTURE.md` quand la question touche aux frontières techniques.
5. Lire `CONTEXT.md` encore une fois avant une tâche de maintenance transversale.

## What This Repo Is

- Une seule base Vue 3 qui produit :
  - une extension navigateur (Chrome + Firefox)
  - un shell desktop Tauri 2 (Windows/Mac/Linux)
  - une build mobile Android via plugin Android WebView
  - une web SPA déployée sur Vercel
- L'authentification et le sync principal passent par Convex.
- Le coeur métier social se trouve dans `src/` et `src/ui/setup/pages/SocialFlow/`.

## Route by Task

- Si la tâche concerne l'expérience extension (manifest, background, content script, popup, side panel), ouvrir :
  - `manifest.config.ts`
  - `src/background/index.ts`
  - `src/content-script/index.ts`
  - `src/ui/*/index.ts`
  - puis `CONTEXT-FUNCTION-TREE.md`
- Si la tâche concerne la logique métier principale SocialFlow :
  - `src/ui/setup/pages/SocialFlow/main.ts`
  - `src/ui/setup/pages/SocialFlow/App.vue`
  - `src/ui/setup/pages/SocialFlow/router/index.ts`
  - `src/stores`
  - `src/lib`
- Si la tâche concerne un flow natif desktop/mobile :
  - `src-tauri/src/lib.rs`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/plugins/android-webview`
  - puis `ARCHITECTURE.md`
- Si la tâche concerne le backend sync :
  - `convex/*`
  - `src/lib/convex*.ts`
  - `src/lib/cloudSync*`
  - puis `CONTEXT.md`
- Si la tâche concerne build/déploiement :
  - `vite.config.ts`
  - `vite.chrome.config.ts`
  - `vite.firefox.config.ts`
  - `vite.tauri.config.ts`
  - `vite.web.config.ts`
  - `package.json`

## Invariants

- Le même store et utilitaires partagés restent la source de vérité métier.
- Les métadonnées des réseaux webview intégrés côté UI se gèrent depuis `src/config/socialNetworks.ts`.
- Les invocations natives Tauri sont encapsulées dans `@tauri-apps/api/core.invoke` depuis le front.
- Toute mutation du stockage de session passe par `convexAuth` / `cloudSync` ou les commandes Rust dédiées.
- `convex` est le contrat de données synchronisées quand VITE_CONVEX_URL est configuré.

## Boundaries & Responsibilities

- `src/ui/setup/pages/SocialFlow/` : app principale SocialFlow (routing, UI, vues réseaux).
- `src/` : services et stores partagés (état, auth, sync, utilitaires).
- `src-tauri/` : orchestration WebView, commandes natives, plugins et persistance sessions.
- `src/ui/*` (hors SocialFlow) : shells historiques de l'extension.
- `convex/` : schema, queries/mutations et auth backend.

## Editing Order

- Changer un comportement d'app SocialFlow → `src/ui/setup/pages/SocialFlow/*` puis `src/stores/*`/`src/lib/*`.
- Changer des services partagés → `src/services/*`, `src/utils/*`, `src/composables/*` puis mettre à jour SocialFlow.
- Modifier les commandes natives → `src-tauri/src/lib.rs` et tests manuels sur desktop/mobile après.
- Changer des règles de sync/auth → `convex/*` + `src/lib/cloud*` + `src/lib/convexAuth.ts`.
