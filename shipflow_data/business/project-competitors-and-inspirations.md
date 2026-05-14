---
artifact: competitive_intelligence
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-05-11"
updated: "2026-05-11"
status: reviewed
source_skill: sf-veille
scope: "project-competitors-and-inspirations"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
evidence:
  - "Initial competitor and inspiration triage captured in legacy root concurrent.md."
  - "SocialGlowz product context describes a multi-platform social operations dashboard."
depends_on:
  - artifact: "shipflow_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
  - artifact: "shipflow_data/business/gtm.md"
    artifact_version: "1.0.1"
    required_status: reviewed
supersedes:
  - "concurrent.md"
next_review: "2026-06-11"
next_step: "/sf-market-study socialglowz"
target_projects:
  - socialglowz
reference_categories:
  - direct_competitor
  - indirect_competitor
  - product_inspiration
  - workflow_inspiration
source_policy: "Track public sources only; do not copy private positioning, paid assets, credentials, or non-public customer data."
---

# Concurrents et inspirations — SocialGlowz

## Lecture projet

SocialGlowz est un dashboard social multi-plateforme. Les liens utiles concernent multi-comptes, social content, analytics, relations et intégrations.

## Liens prioritaires

| Lien | Type | Score | Usage concret |
|---|---:|:---:|---|
| [BundleUp](https://betalist.com/startups/bundleup) | Inspiration architecture | 8/10 | API unifiée multi-intégrations: proche du besoin SocialGlowz pour réseaux, Gmail, storage, analytics. |
| [TonimusAI](https://betalist.com/startups/tonimusai) | Concurrent indirect | 7/10 | Creator analytics/revenue: benchmark pour vues performance et priorisation des contenus. |
| [Igloo](https://betalist.com/startups/igloo-2) | Inspiration contenu social | 7/10 | Génération de reels: utile pour workflow de publication/social content. |
| [Photo Poodle](https://betalist.com/startups/photo-poodle) | Inspiration UGC | 6/10 | Capture photo événementielle par QR: pattern intéressant pour campagnes sociales. |
| [rembr](https://betalist.com/startups/rembr) | Inspiration relationnelle | 6/10 | Rappels relationnels: pourrait enrichir CRM léger / friends filter / follow-up. |
| [Web-Analytics.ai](https://web-analytics.ai/) | Inspiration reporting | 6/10 | Résumés simples de performance sans dashboard trop lourd. |

## À faible priorité

| Lien | Type | Score | Pourquoi |
|---|---:|:---:|---|
| [The Monthly Soup](https://betalist.com/startups/the-monthly-soup) | Inspiration communauté | 4/10 | Bon pattern de prompts récurrents pour groupes privés, mais pas coeur produit. |
