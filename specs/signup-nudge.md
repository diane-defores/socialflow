---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: socialflow
created: "2026-04-25"
updated: "2026-04-27"
status: ready
source_skill: sf-docs
scope: feature
owner: Diane
confidence: medium
risk_level: medium
security_impact: unknown
docs_impact: yes
user_story: "En tant qu'utilisateur anonyme, je veux une invitation non bloquante a creer mon compte pour securiser mes donnees et conserver ma progression."
linked_systems: []
depends_on: []
supersedes: []
evidence: []
next_step: "/sf-docs audit specs/signup-nudge.md"
---
# Spec : Nudge d'inscription — "Crée ton compte"

## Problème

Les utilisateurs arrivent en anonyme (Convex Auth) et n'ont aucune incitation à créer un vrai compte email/password. Pas de sync multi-device, pas de rétention, pas de conversion.

## Solution

Bottom sheet non-bloquant (mobile) / Dialog (desktop), affiché une fois par jour (calendrier) pendant max 5 jours, avec offre promo. Pause 30 jours si refus, puis relance. Disparaît définitivement à la création du compte.

## Scope

**In** :
- Composant `SignupNudge` (bottom sheet mobile / dialog desktop)
- Composable `useSignupNudge` (logique de timing localStorage)
- Query Convex `users.hasEmail` pour détecter si le user a un compte email
- Section "Compte" dans le drawer Settings (mobile) et AppSettings (desktop) pour l'inscription email/password via Convex Auth
- Post-signup : toast succès + fermer le nudge
- Traductions fr/en

**Out** :
- Pas de système de paiement / stripe (l'offre promo est juste un message marketing)
- Pas de reset password (phase suivante)
- Pas de nudge si Convex n'est pas connecté (mode offline)

## Tâches d'implémentation

### Tâche 1 : Query Convex `users.hasEmail`
- **Fichier** : `convex/users.ts`
- **Action** : Ajouter une query `hasEmail` qui retourne true si le user courant a un authAccount de type "password" (table authAccounts de Convex Auth)

### Tâche 2 : Composable `useSignupNudge`
- **Fichier** : `src/composables/useSignupNudge.ts`
- **Logique** :
  - localStorage keys : `sfz_first_launch`, `sfz_nudge_count`, `sfz_nudge_last`, `sfz_nudge_paused_until`
  - `shouldShowNudge()` : `isAuthenticated && !hasEmailAccount && convexConnected && firstLaunch pas aujourd'hui && lastNudge pas aujourd'hui && (count < 5 || pausedUntil expiré)`
  - `dismissNudge()` : incrémente count, set last = today. Si count >= 5, set paused_until = today + 30 jours, reset count à 0
  - `recordFirstLaunch()` : set sfz_first_launch si pas déjà set
  - Comparer par **date calendrier** (`toDateString()`), pas 24h glissantes

### Tâche 3 : Composant `SignupNudge`
- **Fichier** : `src/ui/setup/pages/SocialFlow/components/SignupNudge.vue`
- **UI mobile** (<=768px) : bottom sheet (Teleport to body, Transition slide-up)
- **UI desktop** (>768px) : Dialog PrimeVue modal
- **Contenu** :
  - Icône cadeau
  - Titre : "Sécurisez vos données"
  - Sous-titre promo : "Créez votre compte et obtenez 1 mois offert sur SocialFlow Pro"
  - Champs : email + password (min 8 chars)
  - Bouton "Créer mon compte" → `signIn("password", { email, password, flow: "signUp" })`
  - Lien "Pas maintenant" → `dismissNudge()`
  - **Post-signup** : toast PrimeVue "Compte créé !" + fermer le sheet
  - **Erreur** : afficher le message (email déjà pris, etc.)
- **Pas de nudge** si webview active (mobile) ou si offline

### Tâche 4 : Intégrer dans MobileLayout
- **Fichier** : `src/ui/setup/pages/SocialFlow/components/MobileLayout.vue`
- onMounted : appeler `recordFirstLaunch()` + checker `shouldShowNudge()`
- Afficher `<SignupNudge>` si shouldShow est true ET `!webviewStore.activeUrl`

### Tâche 5 : Intégrer dans App.vue (desktop)
- **Fichier** : `src/ui/setup/pages/SocialFlow/App.vue`
- Même logique onMounted, composant `<SignupNudge>` en Teleport (Dialog mode)
- Indépendant du layout sidebar — le Dialog se positionne tout seul

### Tâche 6 : Section "Compte" dans Settings (mobile + desktop)
- **Fichiers** : `MobileLayout.vue` (drawer), `AppSettings.vue` (dialog)
- Si pas de compte email : formulaire email + password + bouton "Créer mon compte"
- Si compte existant : afficher l'email (read-only) + bouton "Se déconnecter"
- Le champ username reste en localStorage (info locale de profil)

### Tâche 7 : Traductions fr/en
- **Fichiers** : `src/locales/fr.json`, `src/locales/en.json`
- Clés : `nudge.*`, `account.*`

## Critères d'acceptation

1. Given premier lancement, when l'app s'ouvre, then pas de nudge (grâce au délai 1 jour calendaire)
2. Given lancement jour 2+, when l'app s'ouvre, then le nudge apparaît
3. Given nudge affiché, when "Pas maintenant", then nudge disparaît et ne revient pas avant demain
4. Given 5 refus consécutifs, when l'app s'ouvre, then pas de nudge pendant 30 jours
5. Given 30 jours écoulés après pause, when l'app s'ouvre, then le cycle recommence (5 nudges max)
6. Given nudge + email/password soumis, then compte créé via Convex Auth + toast succès + nudge fermé définitivement
7. Given compte existant (email lié), then plus jamais de nudge
8. Given mobile, then bottom sheet slide-up
9. Given desktop, then Dialog PrimeVue
10. Given Settings ouvert + pas de compte, then formulaire inscription visible
11. Given Settings ouvert + compte existant, then email affiché + bouton déconnexion
12. Given mode offline (pas de VITE_CONVEX_URL), then pas de nudge
13. Given compte créé via Settings (pas via nudge), then nudge s'arrête aussi

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-04-27 | sf-deps | GPT-5 | Dependency audit | D: `pnpm audit` reports 0 critical, 40 high, 34 moderate, 7 low; direct `vue-i18n` runtime advisory affects localized signup/settings/auth surfaces | Upgrade `vue-i18n` patch first, then remediate compatible build-chain advisories before release |
| 2026-04-27 | sf-deps | GPT-5 | Dependency fix pass | B-: compatible updates reduce `pnpm audit` from 81 advisories to 8; direct `vue-i18n` runtime advisory fixed | Use `/sf-migrate` for remaining Vite/Rollup/Workbox/vue-tsc/web-ext major-line advisories |
| 2026-04-27 | sf-ship | GPT-5 | Quick ship | shipped | Use `/sf-migrate` for remaining major-line dependency advisories |

## Current Chantier Flow

- sf-spec: ready
- sf-ready: unknown
- sf-start: unknown
- sf-verify: not run
- sf-end: not run
- sf-ship: shipped
