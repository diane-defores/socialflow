<template>
  <div class="linkedin-view">
    <template v-if="isConnected">
      <h2>LinkedIn Feed</h2>
      <div class="linkedin-content">
        <div class="profile-sidebar">
          <div class="profile-card">
            <div class="profile-banner" />
            <div class="profile-info">
              <Avatar :image="profileInfo.avatar" size="xlarge" shape="circle" class="profile-avatar" />
              <h3>{{ profileInfo.name }}</h3>
              <p class="headline">{{ profileInfo.headline }}</p>
              <div class="profile-stats">
                <div class="stat-item">
                  <span class="stat-label">Vues du profil</span>
                  <strong>{{ profileInfo.profileViews }}</strong>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Apparitions dans la recherche</span>
                  <strong>{{ profileInfo.searchAppearances }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="network-card">
            <h3>Mon Réseau</h3>
            <div class="network-stats">
              <div class="network-stat">
                <i class="pi pi-users"></i>
                <div class="stat-content">
                  <span>Connexions</span>
                  <strong>{{ profileInfo.connections }}</strong>
                </div>
              </div>
              <div class="network-stat">
                <i class="pi pi-building"></i>
                <div class="stat-content">
                  <span>Pages suivies</span>
                  <strong>{{ profileInfo.followedPages }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="feed-section">
          <div class="post-composer">
            <Avatar :image="profileInfo.avatar" size="normal" shape="circle" />
            <div class="composer-input">
              <Button 
                class="start-post"
                text
                @click="showPostDialog = true"
              >
                Commencer un post
              </Button>
              <div class="post-types">
                <Button icon="pi pi-image" label="Photo" text class="flex-1" />
                <Button icon="pi pi-video" label="Vidéo" text class="flex-1" />
                <Button icon="pi pi-calendar" label="Événement" text class="flex-1" />
                <Button icon="pi pi-file" label="Article" text class="flex-1" />
              </div>
            </div>
          </div>

          <div v-for="post in posts" :key="post.id" class="post-card">
            <div class="post-header">
              <Avatar :image="post.authorAvatar" size="normal" shape="circle" />
              <div class="author-info">
                <h4>{{ post.authorName }}</h4>
                <p class="author-headline">{{ post.authorHeadline }}</p>
                <span class="post-time">{{ post.time }}</span>
              </div>
              <Button icon="pi pi-ellipsis-h" text rounded />
            </div>
            
            <div class="post-content">
              <p>{{ post.text }}</p>
              <img v-if="post.image" :src="post.image" :alt="post.text" class="post-image" />
            </div>

            <div class="post-stats">
              <span><i class="pi pi-thumbs-up"></i> {{ post.likes }}</span>
              <span>{{ post.comments }} commentaires</span>
              <span>{{ post.shares }} partages</span>
            </div>

            <div class="post-actions">
              <Button icon="pi pi-thumbs-up" label="J'aime" text />
              <Button icon="pi pi-comment" label="Commenter" text />
              <Button icon="pi pi-share-alt" label="Partager" text />
              <Button icon="pi pi-send" label="Envoyer" text />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="connect-prompt">
        <h3>Connectez-vous à LinkedIn</h3>
        <p>Pour voir votre feed professionnel et interagir avec votre réseau, vous devez d'abord vous connecter.</p>
        <Button 
          icon="pi pi-linkedin" 
          label="Se connecter avec LinkedIn" 
          @click="connectLinkedIn"
          class="p-button-linkedin"
        />
      </div>
    </template>

    <Dialog 
      v-model:visible="showPostDialog" 
      header="Créer un post" 
      :modal="true"
      class="post-dialog"
    >
      <div class="dialog-content">
        <div class="dialog-header">
          <Avatar :image="profileInfo.avatar" size="normal" shape="circle" />
          <div>
            <h4>{{ profileInfo.name }}</h4>
            <Button 
              icon="pi pi-globe" 
              label="Tout le monde" 
              text
              class="visibility-selector"
            />
          </div>
        </div>
        
        <InputTextarea
          v-model="newPost"
          placeholder="De quoi souhaitez-vous parler ?"
          :autoResize="true"
          rows="5"
        />

        <div class="dialog-footer">
          <div class="post-attachments">
            <Button icon="pi pi-image" text rounded />
            <Button icon="pi pi-video" text rounded />
            <Button icon="pi pi-file" text rounded />
            <Button icon="pi pi-briefcase" text rounded />
            <Button icon="pi pi-chart-bar" text rounded />
            <Button icon="pi pi-ellipsis-h" text rounded />
          </div>
          <Button 
            label="Publier" 
            :disabled="!newPost.length"
            class="p-button-linkedin"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import { Button } from 'primevue/button'
import { InputTextarea } from 'primevue/inputtextarea'
import { Avatar } from 'primevue/avatar'
import { Dialog } from 'primevue/dialog'
import { Textarea } from "primevue/textarea"

const store = useSocialNetworksStore()
const isConnected = computed(() => store.isConnected('linkedin'))
const showPostDialog = ref(false)
const newPost = ref('')

const profileInfo = ref({
  name: 'John Doe',
  headline: 'Développeur Full Stack Vue.js | TypeScript | Node.js',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  profileViews: '142',
  searchAppearances: '24',
  connections: '1,483',
  followedPages: '28'
})

const posts = ref([
  {
    id: 1,
    authorName: 'Vue.js Jobs',
    authorHeadline: 'Offres d\'emploi pour développeurs Vue.js',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=vuejobs',
    time: '2h',
    text: 'Nous recherchons un développeur Vue.js senior pour rejoindre notre équipe en pleine croissance ! Stack technique : Vue 3, TypeScript, Node.js, PostgreSQL. Remote possible.',
    likes: '45',
    comments: '12',
    shares: '8'
  },
  {
    id: 2,
    authorName: 'Tech Conference Paris',
    authorHeadline: 'Événements tech à Paris',
    authorAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=techparis',
    time: '5h',
    text: 'La plus grande conférence Vue.js en France arrive bientôt ! Rejoignez-nous pour deux jours de talks, workshops et networking.',
    image: 'https://picsum.photos/seed/conf/600/400',
    likes: '234',
    comments: '45',
    shares: '23'
  }
])

const connectLinkedIn = () => {
  const authWindow = window.open(
    '/api/auth/linkedin',
    'LinkedIn Auth',
    'width=500,height=600,scrollbars=yes'
  )

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return
    
    if (event.data.type === 'auth-callback') {
      const { authCode } = event.data
      await store.connectNetwork('linkedin', authCode)
      authWindow?.close()
    }
  }, { once: true })
}
</script>

<style scoped>
.linkedin-view {
  padding: 1rem;
}

.linkedin-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.connect-prompt {
  max-width: 400px;
  margin: 2rem auto;
  text-align: center;
  padding: 2rem;
  background: var(--surface-card);
  border-radius: 8px;
}

.connect-prompt h3 {
  margin-bottom: 1rem;
}

.connect-prompt p {
  margin-bottom: 1.5rem;
  color: var(--text-color-secondary);
}

.profile-card {
  background: var(--surface-card);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.profile-banner {
  height: 100px;
  background: linear-gradient(to right, #0077b5, #00a0dc);
}

.profile-info {
  padding: 0 1.5rem 1.5rem;
  text-align: center;
  margin-top: -40px;
}

.profile-avatar {
  border: 4px solid var(--surface-card);
}

.profile-info h3 {
  margin: 1rem 0 0.5rem;
}

.headline {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.profile-stats {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
  margin-top: 1rem;
}

.stat-item {
  text-align: left;
  padding: 0.5rem 0;
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.network-card {
  background: var(--surface-card);
  border-radius: 10px;
  padding: 1.5rem;
}

.network-stats {
  margin-top: 1rem;
}

.network-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-content span {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.feed-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-composer {
  background: var(--surface-card);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
}

.composer-input {
  flex: 1;
}

.start-post {
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 0.5rem;
  background: var(--surface-ground);
  border-radius: 2rem;
}

.post-types {
  display: flex;
  gap: 0.5rem;
}

.post-card {
  background: var(--surface-card);
  border-radius: 10px;
  padding: 1.5rem;
}

.post-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-info {
  flex: 1;
}

.author-info h4 {
  margin: 0;
}

.author-headline {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0;
}

.post-time {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.post-content {
  margin-bottom: 1rem;
}

.post-image {
  width: 100%;
  border-radius: 8px;
  margin-top: 1rem;
}

.post-stats {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--surface-border);
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.dialog-content {
  padding: 1rem;
}

.dialog-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.visibility-selector {
  font-size: 0.9rem;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.post-attachments {
  display: flex;
  gap: 0.5rem;
}

:deep(.p-button-linkedin) {
  background: #0077b5;
}

:deep(.p-button-linkedin:hover) {
  background: #006097;
}

:deep(.post-dialog) {
  max-width: 600px;
  width: 100%;
}

:deep(.p-dialog-content) {
  padding: 0;
}
</style> 