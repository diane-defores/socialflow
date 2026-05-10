---
artifact: branding_system
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: socialflow
created: "2026-04-26"
status: active
source_skill: sf-docs
scope: brand
owner: "Diane"
updated: "2026-04-26"
confidence: medium
risk_level: low
security_impact: low
docs_impact: high
depends_on: []
evidence:
  - "README.md"
  - "package.json"
  - "src/ui/setup/pages/SocialFlow/App.vue"
supersedes: []
next_step: "/sf-docs audit BRANDING.md"
---

# BRANDING.md

## Brand positioning

SocialFlow positions itself as a **pragmatic productivity interface** for social media professionals:

- Calm, efficient, and trustworthy
- Built for speed across platforms
- Unifying, not distracting

## Visual direction

- Maintain the current Vue + PrimeVue look foundation while avoiding style fragmentation.
- Prioritize contrast, legibility, and minimal chrome.
- Keep interface actions visually stable across desktop and mobile.
- App icon: compact "social flow" mark with connected nodes, dark calm base, teal/aqua/blue accents, and high small-size readability.

## Brand voice

- Tone: concise, practical, confidence-building
- Copy style: short instructions, clear outcomes, low fluff
- Language: French-first product docs, with English-ready keys already used in i18n

## Messaging pillars

- "All your networks in one place"
- "Sessions stay where they should"
- "Fast access, fewer context switches"

## UI consistency rules

1. Preserve existing component ecosystem (PrimeVue/DaisyUI + Tailwind utilities).
2. Prefer established navigation rhythm over heavy visual churn.
3. Keep copy aligned with current user journeys (`Network`, `Profiles`, `Settings`, `Auth`).
4. Never introduce branding motifs that conflict with social network readability.

## Visual accessibility guardrail

- Always check minimum color contrast for key CTAs.
- Use clear focus outlines and hover/focus differentiation.
- Avoid color-only state cues for critical controls.
