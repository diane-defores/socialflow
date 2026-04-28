---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialflow"
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: manual
scope: content_map
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
evidence:
  - "README.md and TASKS.md serve as the public and execution surfaces."
  - "en/ and fr/ landing pages expose public product positioning."
  - "src/ui and src-tauri represent operational and desktop surfaces."
  - "research and specs folders contain exploration and implementation context."
linked_artifacts:
  - PRODUCT.md
  - GTM.md
depends_on:
  - artifact: "PRODUCT.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "GTM.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
next_review: "2026-05-26"
next_step: "/sf-docs audit CONTENT_MAP.md"
content_surfaces:
  - repo_docs
  - landing_pages
  - static_pages
  - architecture_docs
  - specs
  - research_notes
  - scripts_and_ops
---

# Content Map

## Purpose

`CONTENT_MAP.md` defines where SocialFlow content and product truth should live so future repurposing does not drift from implementation.

## Content Surfaces

### Repo documentation

- `README.md` — canonical entry for architecture and platform matrix.
- `TASKS.md` — roadmap and execution priorities.
- `AUDIT_LOG.md` — historical decision and review notes.
- `CHANGELOG.md` — release-level evolution.

### Front-end and product surfaces

- `src/ui/setup/pages/SocialFlow/` — primary application surface.
- `src-tauri/` — desktop and packaging surface.
- `en/` and `fr/` — public landing/content pages.
- `404.html` and extension-specific root index as distribution entry docs.

### Technical and discovery surfaces

- `src/` and `convex/` folders — implementation surfaces for workflows.
- `vite.*.config.ts`, `manifest.*.config.ts`, and `vercel.json` — release/build contracts.
- `scripts/` — operational helper surface.
- `specs/` and `research/` — planning and deep-dive evidence.

## Content Routing Rules

- Use `PRODUCT.md` and `GTM.md` when changing positioning, audience, offer, or proof assumptions.
- Use `README.md` for scope, platform coverage, and onboarding truth updates.
- Use `TASKS.md` for execution shifts and sequencing changes.
- Use `archi.md` and `src/*` references when introducing architecture-level changes.
- Use `CHANGELOG.md` for externally visible milestone summaries.

## Repurposing Outputs

- For public-facing positioning content, target `/en` and `/fr` landing structures first, then keep links back to `README.md`.
- For technical summaries and workflow explanations, target `README.md` and `TASKS.md`.
- For product truth updates, update linked artifact files in tandem (`PRODUCT.md`, `GTM.md`) before publication-facing copy changes.
