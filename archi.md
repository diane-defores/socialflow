les composants nécessaires pour notre système d'authentification des réseaux sociaux :

1. **Store des réseaux sociaux** (`src/stores/socialNetworks.ts`) :
   - Gestion des connexions aux réseaux sociaux
   - État des connexions avec tokens d'accès
   - Actions pour connecter/déconnecter les réseaux

2. **Composant SocialLogin** (`src/components/SocialLogin.vue`) :
   - Interface de connexion pour tous les réseaux sociaux
   - Boutons stylisés pour chaque réseau
   - Gestion de l'authentification via fenêtre popup

3. **Adaptation de RedditView** (`src/components/networks/RedditView.vue`) :
   - Ajout de la vérification de connexion
   - Interface de connexion si non connecté
   - Utilisation du store pour la gestion de l'état

Pour utiliser ces composants, vous devrez :

1. Importer et utiliser `SocialLogin` là où vous souhaitez afficher les boutons de connexion :
```vue
import SocialLogin from '@/components/SocialLogin.vue'
```

2. Configurer les endpoints d'authentification côté serveur pour gérer :
   - `/api/auth/:network` pour initier l'authentification
   - `/api/auth/callback` pour recevoir le code d'autorisation

3. Assurez-vous d'avoir les dépendances PrimeVue installées avec :
```bash
pnpm add primevue primeicons
```

Voulez-vous que je crée d'autres composants pour les autres réseaux sociaux (Twitter, Facebook, etc.) ou que j'apporte des modifications à ce qui a été fait ?
