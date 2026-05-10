---
artifact: architecture_context
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "socialflow"
created: "2026-04-26"
updated: "2026-05-10"
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
