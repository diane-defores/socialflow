---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "socialflow"
created: "2026-05-11"
created_at: "2026-05-11 19:51:04 UTC"
updated: "2026-05-14"
updated_at: "2026-05-14 17:59:02 UTC"
status: implemented
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "audit-fix"
owner: "socialflow-team"
user_story: "En tant qu'utilisateur SocialFlow connecté, je veux que la phase d'initialisation d'authentification, le stockage de session et la surface d'exécution Android soient sécurisés, afin de réduire les risques de fuite de session, d'exécution non autorisée et d'erreur silencieuse."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "README.md"
  - "src/ui/setup/pages/SocialFlow/main.ts"
  - "src/ui/setup/pages/SocialFlow/router/guards.ts"
  - "src/lib/convexAuth.ts"
  - "src/lib/cloudSync.ts"
  - "src/stores/socialNetworks.ts"
  - "src-tauri/src/lib.rs"
  - "src-tauri/tauri.conf.json"
  - "shipflow_data/business/business.md"
  - "shipflow_data/business/branding.md"
depends_on:
  - artifact: "shipflow_data/business/business.md"
    artifact_version: "1.0.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: "active"
supersedes: []
evidence:
  - "src/ui/setup/pages/SocialFlow/main.ts:24-35"
  - "src/lib/convexAuth.ts:11-17,63-71,97-113,159-166"
  - "src/ui/setup/pages/SocialFlow/router/guards.ts:15-23"
  - "src/lib/cloudSync.ts:360-369,442-450,584-586"
  - "src-tauri/tauri.conf.json:1-120"
  - "src-tauri/src/lib.rs:1-200"
  - "src/stores/socialNetworks.ts:1-200"
next_step: "/sf-test validation Android auth deep-link sur device"
---

Title
------
Renforcer la sécurité auth/session et réduire la surface d'exécution Android (Top priorités audit)

Status
------
Implemented

User Story
----------
En tant qu'utilisateur SocialFlow connecté, je veux que l'application initialise son authentification de façon explicite, valide les échanges OAuth et limite son exécution aux pages autorisées, afin de protéger ma session et éviter des actions non voulues sur des pages tiers.

Minimal Behavior Contract
-------------------------
 Le système doit démarrer SocialFlow seulement si l'état d'authentification est établi de manière vérifiable; dans le cas contraire, il doit montrer une erreur de connexion claire avec une action de reconnexion, sans poursuivre silencieusement. Les points d'entrée Android (deep links, callbacks OAuth, ouvertures d'URL vers un webview) ne doivent accepter que des domaines/hosts explicites autorisés. Les données de session ne doivent plus être récupérées par défaut depuis un stockage persistant faible; elles sont stockées via un mécanisme durci et explicite, et les flux OAuth doivent être validés avant de conclure la connexion. En cas d'échec de callback, de permission insuffisante ou de token invalide, la session ne doit pas être marquée connectée et l'utilisateur doit voir un état d'erreur récupérable.

Success Behavior
---------------
1) Au chargement de SocialFlow, si l'utilisateur est connecté et valide, l'app monte en mode authentifié et ouvre l'UI principale.
2) Si l'auth échoue, une bannière/écran d'erreur explicite avec guidance s'affiche (`Réessayer la connexion`, `Retour à login`), et aucune vue protégée n'est visible.
3) Les callbacks OAuth et ouvertures d'URL natives ne sont acceptés que depuis des hôtes et schémas explicitement autorisés, avec une préférence par défaut pour les flux fonctionnels strictement nécessaires.
4) Le callback OAuth n'est accepté que si le message/événement respecte le protocole attendu (origin, channel, state/nonce, type d'événement, TTL de 5 minutes, anti-rejeu).
5) Les tokens/session sont centralisés dans un store dédié, avec purge automatique de l'ancien `localStorage` et sans persistance de fallback silencieux.
6) Les sessions restaurées sont disponibles par défaut; un re-verrouillage local (PIN/biométrie) s'applique après 15 minutes d'inactivité (configurable), puis la session est revalidée avant accès sensible.

Error Behavior
--------------
- Erreur de bootstrap auth: le flux est interrompu, un message d'erreur est affiché, et l'utilisateur reçoit un lien de réessai; aucune navigation silencieuse vers pages protégées.
- Token absent, invalide, expiré ou non-réconciliable: nettoyage des artefacts de session existants et redirection vers onboarding/login.
- Callback deep link/API hors domaine/host autorisé: le flux est annulé; aucune mutation d'état auth n'est appliquée.
- Callback OAuth rejeté (origin/state/format inattendu, timeout, replay): message d'erreur avec guidance, alerte de sécurité via Sentry anonymisée, et session inchangée.
- Cas limite: navigation concurrente pendant `isAuthLoading` ne doit jamais débloquer l'accès à des routes privées.

Problem
-------
L’audit a montré des risques élevés sur:
- la bootstrap d’authentification qui peut être silencieuse (pas d'erreur visible, `catch` vide),
- le stockage persistant de tokens de session en clair dans `localStorage`,
- une surface d’exécution trop large via des callbacks/URLs non validés,
- et des échanges OAuth/callback peu contraints côté message.

Solution
--------
Mettre en place une sécurisation progressive en trois axes: (1) contrôle strict des flux Android (deep links et callbacks OAuth), (2) pipeline d'auth explicite et fail-fast avec états visibles, (3) durcissement du stockage session + du handshake OAuth avec validation stricte.

Scope In
--------
- Durcir la configuration Android et webview pour limiter les hôtes/page-matches de callbacks et URL autorisées.
- Refaire la séquence bootstrap `main.ts` + route guard pour bloquer la navigation tant que l’auth n’est pas résolue.
- Introduire une couche `sessionStorage`/`tokenStore` sécurisée sans fallback anonyme implicite.
- Valider la forme des messages OAuth (state/nonce, origin, type, source) avant d’accepter la connexion.
- Mettre à jour la purge et les migrations de stockage de session.
- Ajouter tests/smoke pour ces parcours critiques.

Scope Out
---------
- Refonte totale de l’architecture auth Convex.
- Migration des schémas de données métier (posts, réseaux, kanban).
- Changement de fournisseur d'identité ou implémentation d’un provider SSO tiers nouveau.
- Refonte Tauri majeure hors surface webview/session (hors audit ciblé de sécurité local à ces priorités).

Constraints
-----------
- Pas de comportement silencieux en cas d’échec d’initialisation auth.
- Pas de traitement de callback/open-url non conforme aux politiques host/schéma sans raison métier explicite.
- Pas de persistance de token par défaut en clair dans `localStorage`.
- Pas de bypass de guard via état `isAuthLoading` tant que la résolution auth est en cours.
- Un verrouillage local est activé après inactivité ou réouverture suspecte: demande utilisateur (PIN/biométrie) avant réouverture des zones sensibles.
- Conserver la compatibilité runtime Android et WebView via abstraction de stockage adaptée.

Dependencies
------------
- Stack: Vue 3 / Vue Router / Pinia, Convex Auth, Tauri Android/WebView.
- Dépendance externe principale: API Convex d’authentification et lifecycle de session existants (mode opératoire inchangé, hardening uniquement).
- fresh-docs status: fresh-docs checked.
- Local versions noted: `@tauri-apps/api` 2.10.1, `tauri` 2.10.0, `@tauri-apps/cli` 2.10.0, `vue-router` 4.5.0, `convex` 1.32.0, `@convex-dev/auth` 0.0.91.
- Official docs checked 2026-05-12: Android Developers App Links intent filters and verification behavior; Tauri 2 Deep Linking plugin for Android static mobile scheme/host config and fake deep-link validation warning; Vue Router navigation guards async/cancel/error contract; Convex Auth session/refresh token lifecycle and session duration config.
- Fichiers à coordonner:
  - `src/lib/convexAuth.ts`
  - `src/ui/setup/pages/SocialFlow/main.ts`
  - `src/ui/setup/pages/SocialFlow/router/guards.ts`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/src/lib.rs`
  - `src/stores/socialNetworks.ts`
  - `src/lib/cloudSync.ts`

Invariants
----------
- L'UI principale ne doit jamais marquer `isAuthenticated=true` sans preuve explicite de session valide.
- Les tokens de session ne doivent pas être lus au premier plan depuis un stockage non confiable sans migration/validation.
- Aucune route privée ne doit être rendue tant que l’état auth est indéterminé.
- Les callbacks OAuth et URLs de redirection ne doivent être traités que pour des hôtes explicitement autorisés.

Links & Consequences
--------------------
- `src/lib/convexAuth.ts` est la source de vérité session côté UI; toute modification de ses contrats nécessite revue des usages.
- Le comportement d’amorçage impacte `router` et toutes les pages SocialFlow.
- La configuration des deep links/open-url impacte permissions système, stabilité Android/WebView et conformité stores.
- Les changements de stockage session impactent la synchronisation cloud et la résilience UX (reconnexion nécessaire plus fréquente).
- Régression potentielle: sessions non restaurées automatiquement selon la stratégie retenue; prévoir fallback utilisateur.

Documentation Coherence
-----------------------
Oui, car le comportement utilisateur change: update README (section Android + auth), guide de dépannage session et changelog.

Edge Cases
----------
- Utilisateur ouvre l’app sans réseau: bootstrap auth doit afficher erreur réseau et options de réessai, pas écran blanc.
- Callback OAuth arrive après timeout (5 minutes): rejet propre, tentative annulée, aucun token partiellement appliqué.
- Navigation rapide pendant chargement auth: route guard doit rester fermé (ou afficher loader) et jamais afficher vue privée.
- Stockage ancien détecté (`localStorage`) après déploiement: migration + purge en one-shot, puis message silencieux non bloquant.
- Multi-plateforme: Android (wrapper) et web peuvent n’exposer pas les mêmes APIs de stockage.

Implementation Tasks
-------------------
- [ ] Tâche 1 — Restreindre la surface Android aux callbacks et URLs autorisés
  - Fichier : `src-tauri/tauri.conf.json`, `src-tauri/src/lib.rs`
  - Action : définir une allowlist explicite d’hôtes/schémas OAuth et de callbacks; bloquer l’ouverture de liens non autorisés côté shell et webview.
  - User story link : réduire la surface d'exécution non autorisée de l'app.
  - Depends on : aucune
  - Validate with : test d’un callback vers un host non autorisé; test d’un callback vers un host autorisé.
  - Notes : documenter la rationalité et le coût d'ajout d'un nouveau réseau/URL.

- [ ] Tâche 2 — Vérifier le routing Android runtime
  - Fichier : `src-tauri/src/lib.rs`
  - Action : vérifier source/origin/host/state au moment du dispatch auth; rejeter les events non conformes, appliquer anti-rejeu et TTL/one-shot.
  - User story link : éviter exécution sur flux non pertinents.
  - Depends on : Tâche 1
  - Validate with : test manuel sur callbacks conformes/non conformes et événements inattendus.
  - Notes : garder l’UX actuelle sur réseaux supportés.

- [ ] Tâche 3 — Rendre la résolution auth fail-fast dans le bootstrap
  - Fichiers : `src/ui/setup/pages/SocialFlow/main.ts`, `src/ui/setup/pages/SocialFlow/router/guards.ts`
  - Action : supprimer le `catch` silencieux de bootstrap, exiger un état `authReady/error`; empêcher la navigation sur routes protégées tant que `isAuthLoading` et afficher état d’erreur bloquant.
  - User story link : visibilité d’erreur et prévention accès non-autorisée.
  - Depends on : Tâche 2
  - Validate with : test: erreur d’initialisation auth -> app affiche écran d’erreur + pas d'accès route privée.
  - Notes : conserver fallback de debug non-bypassable en mode local uniquement si explicitement justifié.

- [ ] Tâche 4 — Supprimer le fallback anonyme implicite et centraliser la persistance session
  - Fichiers : `src/lib/convexAuth.ts`, `src/lib/cloudSync.ts`
  - Action : désactiver la création de session anonyme par défaut lorsque aucun JWT; refactorer la lecture/écriture JWT/refresh dans un store session dédié (avec purge totale des clés anciennes).
  - User story link : réduire risques de contournement d'auth et fuites.
  - Depends on : Tâche 3
  - Validate with : test: premier lancement sans token -> état non-authentifié explicite; test: purge des anciennes clés de storage.
  - Notes : garder compatibilité des flows existants, documenter comportement d'expiration.

- [ ] Tâche 5 — Durcir le flux OAuth/callback réseau
  - Fichier : `src/stores/socialNetworks.ts`
  - Action : ajouter validation stricte des messages `postMessage` (type attendu, origine, origin + state/nonce lié à la demande, one-shot, TTL 5 min, anti-rejeu, et contrôle source/popup), accepter uniquement la forme contractuelle du callback.
  - User story link : sécuriser la connexion réseau et prévenir les injections/spoofing.
  - Depends on : Tâche 4
  - Validate with : simulation callback valide/invalide (origin faux, state manquant, format inattendu) avec état auth refusé.
  - Notes : prévoir utilitaire de validation partagé si plusieurs réseaux suivent le même pattern.

- [ ] Tâche 6 — Ajouter un lock local configurable pour sessions restaurées
  - Fichiers : `src/ui/setup/pages/SocialFlow/main.ts`, `src/ui/setup/pages/SocialFlow/router/guards.ts`, modules de session
  - Action : implémenter un verrous UX local (PIN/biométrie si dispo) après 15 min d'inactivité (configurable), et réinitialiser le timeout sur activité; bloquer l'accès aux routes sensibles tant que lock actif.
  - User story link : maintenir le confort de restauration tout en limitant l'exposition en cas de reprise tardive.
  - Depends on : Tâche 3
  - Validate with : test de réouverture après timeout => lock affiché, puis unlock + session revalidée ou retour login.
  - Notes : lock non persistant (pas de jeton de lock durable), compatible sans biométrie.

Acceptance Criteria
------------------
- [ ] CA1 : Given une navigation app initialisée sans réseau, when le bootstrap auth échoue, then l'UI affiche un écran d'erreur avec action claire de réessayer et aucune route privée n'est rendue.
- [ ] CA2 : Given un callback deep link vers un host non autorisé, when la requête arrive, then il est rejeté et aucune session n’est mutée.
- [ ] CA3 : Given un callback OAuth conforme en provenance d’un host autorisé, when la validation passe, then le flux poursuit l’authentification sans erreur de traitement.
- [ ] CA4 : Given un ancien `localStorage` contenant `sf_jwt`, `sf_refresh`, when nouveau code démarre, then ces clés sont supprimées et la session n’est pas restaurée implicitement.
- [ ] CA5 : Given une tentative de callback OAuth avec `state` invalide ou origin étranger, then la session reste non connectée et un événement d’erreur est loggé côté UI.
- [ ] CA6 : Given une navigation au lancement avec `isAuthLoading=true`, when un utilisateur tente d’accéder à route protégée, then la navigation est bloquée jusqu’à résolution ou affiche erreur explicite.
- [ ] CA7 : Given un callback OAuth valide reçu, when l’état state/nonce correspond, then la session passe en connecté et redirige vers la route par défaut prévue.
- [ ] CA8 : Given des changements futurs de politique d’hôtes, when le fichier d’allowlist est mis à jour, then le comportement suit ce fichier sans changements de code applicatif.
- [ ] CA9 : Given une session restaurée et une inactivité > 15 minutes, when l’utilisateur tente d’accéder à une vue sensible, then lock local s'affiche avant de continuer.
- [ ] CA10 : Given un callback OAuth en replay state, when le même `state` est reçu de nouveau après réussite ou expiration, then rejet de callback, guidance d’erreur, aucune mutation de session.

Test Strategy
-------------
- Unitaires : tests de garde-fou d'auth (bootstrap/guard), validateurs OAuth et parser de message.
- Intégration : tests frontaux simulant succès/échec bootstrap auth, callback OAuth valide/invalide, migration de storage.
- Manuels :
  - callbacks Android uniquement sur URLs/hôtes autorisés,
  - login/logout cycle dans environnement sans session,
  - navigation sur routes privées pendant chargement.
- Sanity checks : exécution build Android/WebView selon scripts projet et validation callback deep link.

Risks
-----
- Perte de persistance de session : plus besoin de reconnexion plus fréquente si stockage strict choisi.
- Régression de flux réseau : callback OAuth peut nécessiter adaptation côté backend si la payload contractuelle change.
- Risque de blocage de fonctionnalités Android si la allowlist callbacks est trop stricte.
- Augmentation de la complexité de tests en raison des flux Android/WebView.

Execution Notes
--------------
1) Lire d'abord:
   - `src-tauri/tauri.conf.json`
   - `src-tauri/src/lib.rs`
   - `src/ui/setup/pages/SocialFlow/main.ts`
   - `src/ui/setup/pages/SocialFlow/router/guards.ts`
   - `src/lib/convexAuth.ts`
2) Implémenter d'abord la sécurité deep link/callback Android, puis le contrat auth, puis OAuth.
3) Garder les changements ciblés: pas de refactor global du store; ajouter/adapter une abstraction de session propre et minimale.
4) Stop condition: toutes les CA sont passées et aucun token non validé ne peut basculer l’état utilisateur.
5) Cas de reroute: si la nouvelle politique de callbacks casse des usages métiers, revenir à une allowlist minimale et documenter la déviation.

Open Questions
--------------
- None.

Skill Run History
-----------------
| Date UTC             | Skill   | Model       | Action | Result | Next step |
| -------------------- | ------- | ----------- | ------ | ------ | --------- |
| 2026-05-11 19:51:04 UTC | sf-spec | GPT-5 Codex | Created draft spec for top audit priorities | Draft saved | /sf-ready Renforcer la sécurité auth Android |
| 2026-05-11 21:26:25 UTC | sf-spec | GPT-5 Codex | Updated spec with open clarifications (lock + OAuth hardening) | Draft revised | /sf-ready Renforcer la sécurité auth Android |
| 2026-05-11 19:51:04 UTC | sf-ready | GPT-5 Codex | Readiness gate | Not ready | /sf-spec Renforcer la sécurité auth Android |
| 2026-05-11 21:28:45 UTC | sf-ready | GPT-5 Codex | Readiness gate (re-run after open clarifications) | Not ready | /sf-spec Renforcer la sécurité auth Android |
| 2026-05-11 21:35:00 UTC | sf-spec | GPT-5 Codex | Removed surface references and aligned spec for Android-only scope and files/tasks/CA | Draft revised | /sf-ready Renforcer la sécurité auth Android |
| 2026-05-11 21:32:49 UTC | sf-ready | GPT-5 Codex | Readiness gate | Not ready | /sf-spec Renforcer la sécurité auth Android |
| 2026-05-12 19:52:42 UTC | sf-docs | GPT-5 Codex | Documentation update | Updated `depends_on` versions and synchronized docs versions | /sf-ready Renforcer la sécurité auth Android |
| 2026-05-12 20:02:41 UTC | sf-ready | GPT-5 Codex | Readiness gate with official docs freshness check | Ready | /sf-start Renforcer la sécurité auth Android |
| 2026-05-13 04:27:56 UTC | sf-start | GPT-5 Codex | Implémentation Android auth hardening (bootstrap fail-fast, guard, session lock, OAuth callback checks, allowlist Android webview) | Partial | /sf-start Renforcer la sécurité auth Android (finaliser coverage lock UX/tests) |
| 2026-05-13 08:39:51 UTC | sf-start | GPT-5 Codex | Finalized lock UX route, Android OAuth callback replay validation, and deep-link config policy | Implemented | /sf-verify Renforcer la sécurité auth Android |
| 2026-05-14 11:01:41 UTC | sf-verify | GPT-5 Codex | Verification against auth/session Android hardening contract | Not verified | /sf-start Renforcer la sécurité auth Android (corriger verification) |
| 2026-05-14 16:11:02 UTC | sf-build | GPT-5 Codex | Applied verification corrections (session lock no set-on-lock, safe error rendering, deep-link plugin wiring, native callback validator usage, auth tests refresh+legacy purge, docs map/docs update) | Implemented | /sf-verify Renforcer la sécurité auth Android |
| 2026-05-14 17:33:08 UTC | sf-verify | GPT-5.5 xhigh | Verification rerun after Android auth hardening corrections | Not verified | /sf-start Renforcer la sécurité auth Android (lier state OAuth Android à une requête attendue) |
| 2026-05-14 17:41:56 UTC | sf-start | GPT-5.5 | Linked Android OAuth callback validation to pending app-created state/nonce and anonymized Sentry rejection signal | Implemented | /sf-verify Renforcer la sécurité auth Android |
| 2026-05-14 17:59:02 UTC | sf-verify | GPT-5.5 | Corrected final deep-link consumer gap during verification and reran local JS checks | Partial | /sf-test validation Android auth deep-link sur device |

Current Chantier Flow
---------------------
- sf-spec: done
- sf-ready: ready
- sf-start: implemented
- sf-verify: not verified
- sf-end: not launched
- sf-ship: not launched

## Chantier
Skill courante: sf-verify
Chantier: specs/security-hardening-top-priorites.md
Trace spec: ecrite
Flux:
- sf-spec: done
- sf-ready: ready
- sf-start: implemented
- sf-verify: partial
- sf-end: not launched
- sf-ship: not launched

Reste a faire:
- Preuve runtime Android device manquante pour callbacks deep-link acceptes/rejetes; `cargo check` local bloque sur `pkg-config`/GTK manquants.

Prochaine etape:
- /sf-test validation Android auth deep-link sur device
