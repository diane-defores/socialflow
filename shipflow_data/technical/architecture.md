---
artifact: architecture_context
metadata_schema_version: "1.0"
artifact_version: "1.0.2"
project: "socialflow"
created: "2026-04-26"
updated: "2026-05-11"
status: reviewed
source_skill: sf-docs
scope: architecture
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "shipflow_data/technical/context.md"
  - "shipflow_data/technical/context-function-tree.md"
  - "README.md"
  - "shipflow_data/technical/README.md"
external_dependencies:
  - "Vue 3"
  - "Vite"
  - "Tauri 2"
  - "Convex"
  - "Browser extension APIs"
invariants:
  - "One shared Vue application layer serves extension, desktop, mobile, and web targets."
  - "Native WebView/session behavior stays isolated in Tauri/Rust and Android plugin surfaces."
  - "Cloud sync must remain optional when Convex configuration is absent."
depends_on:
  - artifact: "shipflow_data/technical/context.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes:
  - "archi.md"
evidence:
  - "Legacy root archi.md was a pointer to shipflow_data/technical/architecture.md."
  - "Vite, Tauri, Convex, and manifest configs define SocialFlow's distribution targets."
next_review: "2026-06-11"
next_step: "/sf-docs audit shipflow_data/technical/architecture.md"
---

# Architecture

- SocialFlow repose sur une base Vue.js unique distribuée en 4 familles de cibles (extension, desktop, mobile, web).
- La couche domaine métier et les stores partagés vivent dans `src/` et `src/ui/setup/pages/SocialFlow/`.
- La synchronisation cloud passe par Convex quand configurée; sinon, état local.
- Les fonctions natives critiques restent concentrées dans `src-tauri/src/lib.rs` et le plugin Android WebView.

## Références d'architecture

- Vue d’ensemble détaillée : `shipflow_data/technical/context.md`
- Arborescence fonctionnelle : `shipflow_data/technical/context-function-tree.md`
- Contrats techniques : `shipflow_data/technical/README.md`
