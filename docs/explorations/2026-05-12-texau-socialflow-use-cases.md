---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialflow"
created: "2026-05-12"
updated: "2026-05-13"
status: draft
source_skill: sf-explore
scope: "TexAu API and MCP use cases for SocialFlow"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "README.md"
  - "shipflow_data/technical/context.md"
  - "shipflow_data/technical/context-function-tree.md"
  - "convex/schema.ts"
  - "src/ui/setup/pages/SocialFlow/App.vue"
evidence:
  - "README.md"
  - "shipflow_data/technical/context.md"
  - "shipflow_data/technical/context-function-tree.md"
  - "TexAu release text provided by user, dated 2026-05-04"
depends_on: []
supersedes: []
next_step: "/sf-spec TexAu-powered GTM workspace for SocialFlow"
---

# Exploration Report: TexAu Use Cases For SocialFlow

## Starting Question

Quels cas d'utilisation TexAu seraient pertinents pour SocialFlow, qui est aujourd'hui un dashboard social multi-plateforme avec Vue 3, Tauri, extension navigateur, WebView natives et sync Convex.

## Context Read

- `README.md` - confirme le positionnement SocialFlow comme dashboard multi-reseaux avec extension, desktop, mobile et web.
- `shipflow_data/technical/context.md` - situe les frontieres app, sync Convex, stores, WebViews et surfaces extension.
- `shipflow_data/technical/context-function-tree.md` - identifie les points d'integration probables: app SocialFlow, stores, Convex, services externes.

## Internet Research

- None. Analyse basee sur le contenu TexAu fourni par l'utilisateur.

## Problem Framing

TexAu n'est pas principalement un canal social supplementaire. C'est une couche de donnees GTM: recherche de prospects, enrichissement, signaux, reviews, ads, jobs, emails et automatisation via MCP. Pour SocialFlow, le bon angle semble etre de passer d'un cockpit de consultation social a un cockpit de prospection et d'action.

## Option Space

### Option A: Social CRM leger

- Summary: transformer les interactions et profils consultes dans SocialFlow en fiches contacts enrichies.
- Pros: naturel pour une app social dashboard; forte valeur pour agences, sales, founders.
- Cons: implique donnees personnelles, consentement, stockage et limites d'usage.

### Option B: Prospection locale

- Summary: utiliser Google Maps, reviews et enrichissement pour creer des listes d'entreprises locales et angles d'outreach.
- Pros: tres concret pour agences social media, freelances, consultants.
- Cons: moins aligne avec LinkedIn/WebViews si SocialFlow vise surtout la gestion quotidienne de comptes existants.

### Option C: Signal monitoring

- Summary: suivre comptes cibles, nouvelles embauches, ads, jobs, changements et produire un digest actionnable.
- Pros: colle bien avec un dashboard recurrent; moins intrusif qu'une automatisation d'outreach brute.
- Cons: depend d'une bonne gestion des couts et de la fraicheur des donnees.

### Option D: Competitive intelligence social

- Summary: analyser pubs LinkedIn, SERP, signaux publics et activite pour inspirer contenus et campagnes.
- Pros: utile aux equipes social/marketing, moins centre sur la chasse email.
- Cons: necessite une couche analyse et synthesis pour etre differenciant.

## Comparison

Le meilleur fit produit court terme semble etre C + D pour enrichir le dashboard sans le transformer brutalement en outil d'outbound. A et B deviennent des modules premium si SocialFlow vise explicitement les agences et independants qui vendent des services.

## Emerging Recommendation

Construire d'abord un module "Signals" ou "Opportunites" qui ingere des donnees TexAu via cle utilisateur, stocke peu de donnees sensibles, et produit des cartes actionnables: nouveau signal, pourquoi c'est important, action proposee, reseau ou canal a ouvrir dans SocialFlow.

## Non-Decisions

- Choix MCP vs API directe.
- Modele de pricing et credits.
- Niveau de stockage des donnees enrichies dans Convex.
- Automatisation d'actions LinkedIn ou email.

## Rejected Paths

- Automatiser directement likes, commentaires ou messages comme premiere fonctionnalite - risque produit, plateforme et reputation trop eleve.
- Stocker massivement emails personnels et enrichissements sans cadre clair - risque legal et confiance.

## Risks And Unknowns

- Compliance: donnees personnelles, email finding, LinkedIn scraping, anti-spam et conditions des plateformes.
- Cout: certains flows peuvent consommer beaucoup de credits TexAu.
- Positionnement: SocialFlow peut devenir trop GTM et perdre sa clarte si le module n'est pas separe.
- UX: les signaux doivent finir dans une action simple, pas dans une table de donnees froide.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: none
- Redactions applied: none
- Notes: release content summarized, no tokens or customer data included.

## Decision Inputs For Spec

- User story seed: En tant qu'agence, freelance ou fondateur, je veux voir des opportunites commerciales issues de signaux publics afin de savoir qui contacter et avec quel angle.
- Scope in seed: module Signals, TexAu key BYO, quelques playbooks cibles, cout estime avant execution, cartes actionnables.
- Scope out seed: envoi automatique d'emails/messages, stockage massif d'emails personnels, actions LinkedIn automatiques.
- Invariants/constraints seed: garder Convex comme sync app, ne jamais stocker de cle TexAu sans chiffrement ou strategie explicite, respecter opt-in utilisateur.
- Validation seed: flow demo avec liste de comptes ou recherche locale, resultats synthetises, cout visible, action ouvrant le bon reseau dans SocialFlow.

## Handoff

- Recommended next command: `/sf-spec TexAu-powered GTM workspace for SocialFlow`
- Why this next step: transformer les pistes en perimetre MVP, contrats de donnees, risques compliance et UX.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-05-12 00:00:00 UTC | Cas d'utilisation TexAu pour SocialFlow | Lecture contexte projet et analyse du release fourni | Recommandation: module Signals/Opportunites avant automatisation outbound | `/sf-spec TexAu-powered GTM workspace for SocialFlow` |
| 2026-05-13 07:36:10 UTC | Enregistrer l'exploration | Reprise du rapport existant au lieu de creer un doublon | Exploration durable confirmee et date de mise a jour actualisee | `/sf-spec TexAu-powered GTM workspace for SocialFlow` |
