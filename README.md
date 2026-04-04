# SocialFlow

Dashboard unifié pour gérer tous vos réseaux sociaux depuis une seule interface. Disponible en extension Chrome/Firefox, application desktop, application mobile et web app.

## Plateformes

| Plateforme | Technologie | Build | Statut |
|---|---|---|---|
| Chrome Extension | CRXJS + Vite | `pnpm build:chrome` | Production |
| Firefox Extension | CRXJS + Vite | `pnpm build:firefox` | Production |
| Desktop (Win/Mac/Linux) | Tauri 2 | `pnpm tauri:bundle` | Production |
| Android | Tauri 2 Mobile | CI GitHub Actions | Production |
| iOS | Tauri 2 Mobile | CI GitHub Actions (macOS) | Planned |
| Web (Vercel) | Vite SPA | `pnpm build:web` | Production |

## Architecture

```
Une seule codebase Vue.js → 6 plateformes

src/ui/setup/pages/SocialFlow/    # App principale (Vue 3 + PrimeVue + Clerk)
├── main.ts                        # Entry point standalone
├── App.vue                        # Layout responsive (mobile/desktop)
├── router/                        # Vue Router (createWebHistory)
├── components/
│   ├── networks/                  # Vues par réseau social
│   ├── kanban/                    # Tableau Kanban
│   └── feed/                      # Feed unifié
├── stores/                        # Pinia stores
├── composables/                   # Hooks Vue
└── services/                      # Services API (Gmail, etc.)
```

### Configs Vite par plateforme

| Fichier | Cible | Sortie |
|---|---|---|
| `vite.chrome.config.ts` | Extension Chrome | `dist/chrome/` |
| `vite.firefox.config.ts` | Extension Firefox | `dist/firefox/` |
| `vite.tauri.config.ts` | Desktop/Mobile Tauri | `dist/tauri/` |
| `vite.web.config.ts` | Web SPA (Vercel) | `dist/web/` |

## Pourquoi Tauri et pas Flutter ou Expo

> **ADR-001** — Choix du framework cross-platform (2025-01)

### Contexte

SocialFlow affiche des réseaux sociaux dans des WebViews natives et injecte des scripts dans ces WebViews (grayscale, protection copie, session par profil). L'UI est écrite en Vue.js car le projet a démarré comme une extension Chrome.

### Décision : Tauri 2

### Alternatives rejetées

**Flutter (Dart)**
- Réécriture complète de l'UI en Dart — double codebase à maintenir
- WebView support limité : pas d'injection de scripts JS, pas de contrôle cookie granulaire
- Impossible de partager du code avec l'extension Chrome (Dart ≠ JS)
- Pas de support extension navigateur

**Expo / React Native (React)**
- Réécriture complète en React — double codebase à maintenir
- WebView : le package `react-native-webview` ne supporte pas l'injection `document_start`, ni le contrôle cookie natif
- Pas de support desktop natif sans Electron (lourd, ~200 MB)
- Pas de support extension navigateur

**Electron**
- Supporte le web mais embarque un Chromium complet (~200 MB par app)
- Pas de support mobile
- Mémoire excessive pour une app qui affiche déjà des WebViews

### Pourquoi Tauri gagne

| Critère | Tauri | Flutter | Expo/RN | Electron |
|---|---|---|---|---|
| Réutilise le code Vue.js existant | Oui | Non (Dart) | Non (React) | Oui |
| Extension navigateur | Oui (même code) | Non | Non | Non |
| WebView native + injection JS | Oui | Limité | Limité | Oui |
| Taille binaire | ~5 MB | ~15 MB | ~30 MB | ~200 MB |
| Support mobile | Tauri 2 | Natif | Natif | Non |
| Support desktop | Natif | Natif | Limité | Natif |
| Contrôle cookies WebView | Natif (Kotlin/Swift) | Non | Non | Oui |

**En résumé** : Tauri est le seul framework qui permet de garder une codebase Vue.js unique pour les 6 plateformes, avec un accès bas-niveau au WebView natif pour l'injection de scripts et la gestion des cookies — ce qui est le coeur fonctionnel de SocialFlow.

## Stack technique

- **Frontend** : Vue 3, PrimeVue, Tailwind CSS, DaisyUI, Pinia
- **Auth** : Clerk
- **Backend** : Convex (serverless)
- **i18n** : vue-i18n
- **Build** : Vite 5, pnpm
- **Desktop/Mobile** : Tauri 2 (Rust + Kotlin/Swift)
- **Hosting web** : Vercel

## Variables d'environnement

```env
VITE_CLERK_PUBLISHABLE_KEY=   # Auth Clerk
VITE_SUPABASE_URL=            # Supabase (optionnel)
VITE_SUPABASE_KEY=            # Supabase (optionnel)
VITE_GMAIL_CLIENT_ID=         # Gmail API (optionnel)
VITE_GMAIL_API_KEY=           # Gmail API (optionnel)
```

## Scripts

```bash
# Développement
pnpm dev:chrome              # Dev extension Chrome
pnpm dev:firefox             # Dev extension Firefox
pnpm tauri:dev               # Dev desktop Tauri

# Build
pnpm build:chrome            # Build extension Chrome
pnpm build:firefox           # Build extension Firefox
pnpm build:web               # Build web SPA (Vercel)
pnpm tauri:bundle            # Build desktop

# Qualité
pnpm lint                    # ESLint
pnpm format                  # Prettier
pnpm typecheck               # TypeScript
```

## Déploiement

### Web (Vercel)
Configuré via `vercel.json`. Push sur `master` déclenche un déploiement automatique.

### Mobile (CI)
Voir [TAURI_MOBILE.md](./TAURI_MOBILE.md) pour le workflow GitHub Actions.

### Extensions
Les fichiers `.zip` sont générés dans `dist/` pour upload sur le Chrome Web Store et Firefox Add-ons.
