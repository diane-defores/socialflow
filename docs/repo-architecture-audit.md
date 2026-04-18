# Audit d'architecture du repo

Date: 2026-04-18

## Resume

Le repo contient trois produits dans un meme workspace:

- `src/` porte le socle front partage et les entrypoints historiques de l'extension.
- `src/ui/setup/pages/SocialFlow/` porte l'application SocialFlow dediee utilisee par Tauri et par une partie du build web.
- `src-tauri/` porte la couche native Rust/Kotlin pour desktop et Android.

Le point de confusion principal est que l'application SocialFlow a son propre `root` Vite, mais continue d'importer une grande partie de sa logique via l'alias `@ -> src/`. Il y a donc un melange entre composants locaux et logique partagee, plus quelques reliquats du template ou de l'ancienne structure qui ressemblent a des doublons.

## Architecture active

### 1. Extension / shells historiques

- Config: `vite.config.ts`
- Entrypoints: `src/ui/setup/index.html`, `src/ui/content-script-iframe/index.html`, `src/ui/devtools-panel/index.html`
- Composants shell generiques: `src/components/AppHeader.vue`, `src/components/AppFooter.vue`, etc.

### 2. Application SocialFlow

- Config Tauri: `vite.tauri.config.ts`
- `root`: `src/ui/setup/pages/SocialFlow`
- Config web: `vite.web.config.ts`
- Point d'entree app: `src/ui/setup/pages/SocialFlow/main.ts`
- UI dediee: `src/ui/setup/pages/SocialFlow/components/*`

### 3. Couche native

- `src-tauri/src/*`: backend Rust Tauri
- `src-tauri/plugins/android-webview/*`: plugin Android WebView/Kotlin

### 4. Backend cloud

- `convex/*`: schema, queries, mutations, auth

## Ce qui est reellement partage

L'app SocialFlow consomme deja la logique partagee dans `src/` pour:

- `src/lib/*`
- `src/stores/*`
- `src/utils/*`
- `src/services/*`
- `src/config/*`
- `src/locales/*`

Exemples:

- `src/ui/setup/pages/SocialFlow/App.vue` importe `@/stores/*` et `@/lib/*`
- `src/stores/socialNetworks.ts` importe `@/services/gmailService` et `@/config/gmail`

Conclusion: la source de verite de la logique metier est deja surtout `src/`, pas `src/ui/setup/pages/SocialFlow/`.

## Doublons confirmes

### Doublons voulus ou acceptables

- `src/components/AppHeader.vue` vs `src/ui/setup/pages/SocialFlow/components/AppHeader.vue`
- `src/components/AppSidebar.vue` vs `src/ui/setup/pages/SocialFlow/components/AppSidebar.vue`
- `src/components/AppRightSidebar.vue` vs `src/ui/setup/pages/SocialFlow/components/AppRightSidebar.vue`

Ces fichiers ne servent pas au meme produit:

- les versions racine servent aux shells generiques de l'extension
- les versions `SocialFlow/` servent a l'app SocialFlow

Ils ne doivent pas etre supprimes sans rerouter les entrypoints `src/ui/*`.

### Doublons suspects / reliquats

Copies locales probablement mortes dans `src/ui/setup/pages/SocialFlow/`:

- `services/gmailService.ts`
- `services/kanbanService.ts`
- `config/gmail.ts`
- `stores/mockData/gmailMock.ts`

Copies racine probablement heritees de l'ancien template ou d'une ancienne phase SocialFlow:

- `src/components/feed/*`
- `src/components/common/*`
- `src/utils/dateFormatter.ts`
- `src/stores/mockData/facebookMock.ts`

Ces fichiers ont encore une existence physique, mais l'app SocialFlow utilise majoritairement ses propres composants locaux pour `feed/` et `common/`.

## Points de drift a corriger

### 1. Types partages mal places

`src/stores/socialNetworks.ts` depend de `@/ui/setup/pages/SocialFlow/types` pour le type `Email`.

Consequence:

- une logique supposee partagee dans `src/stores/*` depend d'un dossier d'UI specifique
- cela rend les frontieres du repo floues

### 2. Generation de types en double

Il existe deux jeux de types auto-generes:

- `src/types/*`
- `src/ui/setup/pages/SocialFlow/types/*`

Pour `auto-imports.d.ts` et `components.d.ts`, c'est normal car les builds n'ont pas les memes roots.

En revanche, les types metier manuels doivent etre clarifies pour eviter les imports croises entre `src/` et `SocialFlow/`.

## Plan de nettoyage

### Phase 1 - Documentation et gel du perimetre

- Conserver ce document comme reference de cleanup.
- Considerer `src/` comme source de verite pour la logique partagee.
- Considerer `src/ui/setup/pages/SocialFlow/components/*` comme source de verite UI pour l'app SocialFlow.

### Phase 2 - Nettoyage sans risque

- Verifier qu'aucun import n'utilise encore:
  - `src/ui/setup/pages/SocialFlow/services/gmailService.ts`
  - `src/ui/setup/pages/SocialFlow/services/kanbanService.ts`
  - `src/ui/setup/pages/SocialFlow/config/gmail.ts`
  - `src/ui/setup/pages/SocialFlow/stores/mockData/gmailMock.ts`
- Supprimer ces fichiers s'ils sont bien morts.

### Phase 3 - Clarifier les types

- Deplacer `Email` et autres types metier reutilises hors de `src/ui/setup/pages/SocialFlow/types`.
- Creer une source de verite partagee, par exemple:
  - `src/types/socialflow.ts`
  - ou `src/features/socialflow/types.ts`
- Rerouter `src/stores/socialNetworks.ts` et les composants Gmail vers cette nouvelle source.

### Phase 4 - Unifier les primitives dupliquees

- Choisir une seule source de verite pour:
  - `feed/*`
  - `common/SocialNetworkLogo.vue`
  - `utils/dateFormatter.ts`
  - `stores/mockData/facebookMock.ts`
- Si l'app SocialFlow est la seule consommatrice reelle, deplacer les imports vers la branche `SocialFlow/` ou remonter proprement les composants vers `src/components/`.

### Phase 5 - Reste de l'extension

- Avant de supprimer les composants racine `src/components/AppHeader.vue`, `AppSidebar.vue`, `AppRightSidebar.vue`, verifier les shells `src/ui/*`.
- Si l'extension historique n'est plus un produit actif, prevoir une suppression dediee et separee du socle extension.

## Recommandation pratique

Ordre conseille:

1. supprimer les copies mortes locales `SocialFlow/services|config|gmailMock`
2. sortir les types metier partages hors de `SocialFlow/types`
3. unifier `dateFormatter`, `facebookMock`, `feed`, `common`
4. seulement apres, decider si les shells extension dans `src/ui/*` restent supportes ou non

Ce sequencement minimise le risque: on commence par les doublons probablement inutilises, puis on traite les frontieres d'architecture, et on ne touche au code shell historique qu'a la fin.
