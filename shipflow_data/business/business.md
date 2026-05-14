---
artifact: business_profile
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: socialglowz
created: "2026-04-26"
status: reviewed
source_skill: sf-docs
scope: business
owner: "Diane"
updated: "2026-04-26"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: high
depends_on: []
evidence:
  - "README.md"
  - "package.json"
  - "src/ui/setup/pages/SocialGlowz/App.vue"
supersedes: []
next_step: "/sf-docs audit shipflow_data/business/business.md"
---

# Business Context

## Business model

SocialGlowz is a unified social management platform with a cross-platform approach:

- Chrome and Firefox extensions
- Web application (Vercel-hosted)
- Tauri desktop app (Windows, macOS, Linux)
- Tauri mobile build targets (Android now, iOS planned)

This repository should be documented as an active product under continued development, not as a pure prototype or internal lab.

Core value:

- Manage and access multiple social networks from one interface.
- Preserve session continuity via controlled WebView + cookie/session persistence.
- Offer lightweight workflows for browsing, composing, and switching networks quickly.

## Target users

- Multi-account social media users
- Teams maintaining multiple community channels
- Professionals managing both personal and business profiles from one tool
- Mobile-first users needing consistent behavior across desktop and phone

## Monetization assumptions

- Current repo structure indicates an active product with a **freemium** foundation and optional premium features.
- Conversion opportunities sit in:
  - Advanced sync reliability
  - Enhanced profile/network automation
  - Priority support and future cloud features
- Keep core browser/webview workflows stable; premium should not block essential operations.

## Key differentiation

- Single shared codebase reduces maintenance footprint versus separate native apps.
- Native WebView capabilities are better for session persistence and integration than web-only alternatives.
- Browser-extension continuity allows a smoother migration path between web, desktop, and browser workflows.

## Risks and constraints

- Native platform variance for social site behavior can shift quickly.
- Social platform policy changes can impact automation or cookie/session handling.
- iOS desktop/mobile expansion is not yet complete.

## Current priorities

1. Improve conversion from anonymous to authenticated users.
2. Reduce operational risk around cross-platform webview behavior.
3. Keep deployment and release paths simple for all five deployment surfaces.
