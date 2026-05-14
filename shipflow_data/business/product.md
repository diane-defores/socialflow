---
artifact: product_context
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "socialglowz"
created: "2026-04-26"
updated: "2026-05-11"
status: reviewed
source_skill: manual
scope: product
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
evidence:
  - "README.md defines the cross-platform product scope and architecture."
  - "vite.*.config.ts plus src-tauri config show delivery targets (extension, desktop, web, mobile)."
  - "shipflow_data/workflow/TASKS.md, shipflow_data/workflow/specs/signup-nudge.md, and shipflow_data/technical/architecture.md document current roadmap and decisions."
  - "Convex backend and Vue front-end folders show social account/workspace workflows."
linked_artifacts:
  - README.md
  - shipflow_data/technical/architecture.md
  - shipflow_data/workflow/TASKS.md
depends_on: []
supersedes: []
next_review: "2026-05-26"
next_step: "/sf-docs audit shipflow_data/business/product.md"
target_user: "creators, operators, marketers, and small teams managing multiple social accounts across LinkedIn, Instagram, X, Facebook, and Gmail workflows"
user_problem: "switching contexts between tools, fragmented account sessions, inconsistent automation behavior across platforms, and slow onboarding when extending the app to new surfaces"
desired_outcomes: "centralized social workflow in one codebase, predictable profile/account session behavior, and faster release velocity with clearer decision contracts"
non_goals: "enterprise ad bidding management, full campaign analytics stack, or a replacement for dedicated social analytics platforms"
---

# Product Context

## Target User

- Solopreneurs and small teams running social operations across multiple networks.
- Product managers and operators who need a unified dashboard plus strong local session and profile isolation.

## Problem

- Social workflows are fragmented across browser extensions, desktop apps, and web entry points.
- Existing automation often leaks context and session state, causing repeated logins and inconsistent behavior.
- Adding features requires touching both frontend and native webview/backend layers, making coordination harder.

## Desired Outcomes

- Deliver one product surface for web, extension, and desktop use with shared behavior.
- Improve reliability of authentication and session persistence per profile and network.
- Keep feature delivery predictable through explicit contracts and cross-platform release paths.

## Core Workflows

- Unified app shell routes users by network, with profile-aware webview switching.
- Auth + settings managed via a shared store and Convex persistence layer.
- Multi-platform release path: web bundle, extension builds, and Tauri desktop/mobile packaging.

## Scope In

- Social network access orchestration in Vue + Tauri + Vite workflows.
- Profile-aware webview session handling and account context switching.
- Cross-platform release and configuration support for this repository.

## Scope Out

- Building a social-first ad platform or campaign optimizer.
- Providing native social analytics dashboards beyond existing integration needs.
- Replacing social network backends or third-party policy stacks.

## Success Signals

- Faster onboarding for new contributors using the same app architecture across targets.
- Reduced session/context regressions when adding new profiles or networks.
- Stable cross-platform shipping cadence with fewer manual platform-specific fixes.

## Risks

- Native webview behavior differences between platforms can cause edge-case regressions.
- Browser policy changes can break embedded workflow assumptions.
- Multi-profile complexity can increase privacy or state-management bugs if routing rules drift.
