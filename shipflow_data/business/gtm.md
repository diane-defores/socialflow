---
artifact: gtm_context
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "socialglowz"
created: "2026-04-26"
updated: "2026-05-11"
status: reviewed
source_skill: manual
scope: gtm
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
evidence:
  - "README.md and shipflow_data/workflow/TASKS.md describe current positioning, platforms, and roadmap."
  - "Build outputs in vite.* and src-tauri show concrete launch channels and packaging model."
  - "Feature set in src/ui and social network components demonstrates operational utility."
linked_artifacts:
  - shipflow_data/business/product.md
depends_on:
  - artifact: "shipflow_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
supersedes: []
next_review: "2026-05-26"
next_step: "/sf-docs audit shipflow_data/business/gtm.md"
target_segment: "independent operators, small marketing teams, and social operators managing multiple accounts across networks and devices"
offer: "an all-in-one social operations workspace with shared UI, local profiles, and cross-platform delivery from one codebase"
channels: "developer and user documentation, landing pages, feature changelogs, social proof from update cadence, and onboarding walkthroughs"
proof_points: "shared multi-platform build pipeline, Convex-backed profile/session architecture, native webview support, and explicit roadmap visibility in shipflow_data/workflow/TASKS.md"
---

# GTM Context

## Target Segment

- Operators already active on several social channels who need faster switching and a consistent workflow.
- Teams running outreach, content production, and account operations in constrained teams.

## Offer

- SocialGlowz is positioned as a unified social operations workspace, not another fragmented extension or single-surface tool.
- The practical promise is consistency: one interface and one codebase behavior across browser extension, desktop, and web.

## Positioning

- Not a replacement for full campaign planning platforms.
- Not a social analytics replacement suite.
- Not a standalone scheduler-only tool.
- It is a cross-platform execution layer for day-to-day social workflow.

## Channels

- Open documentation and public README as primary discovery surfaces.
- Product demos focused on profile switching, multi-network webviews, and setup flow.
- Landing and pricing pages in `en/` and `fr/` for conversion exploration.
- Community and founder-to-founder promotion around reliability and platform consistency.

## Conversion Path

- Discover intent through documentation and feature pages.
- Validate utility on one use case (profile switching + multi-platform access).
- Convert through clear usage outcome, visible release progress, and trust in privacy/state reliability.

## Proof Points

- Concrete build/release evidence by platform target in repo scripts.
- Multi-target architecture described in `shipflow_data/technical/architecture.md` and implemented in shared stores.
- Active roadmap transparency through `shipflow_data/workflow/TASKS.md`.

## KPIs (Initial)

- Activation of first-time users across at least one desktop/web target.
- Reduction in support/repeat questions about account/session behavior.
- Faster time to first successful workflow completion across at least two social networks.
