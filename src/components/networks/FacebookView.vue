<template>
  <div class="facebook-view">
    <div class="facebook-content">
      <!-- Sidebar gauche -->
      <div class="left-sidebar">
        <div class="profile-section">
          <SocialAvatar 
            :user="store.currentUser"
            size="xlarge"
          />
          <h3>{{ store.currentUser.name }}</h3>
          <p>{{ store.currentUser.friends }} amis</p>
        </div>

        <div class="menu-section">
          <Button icon="pi pi-home" label="Fil d'actualité" text class="w-full justify-start" />
          <Button icon="pi pi-user" label="Profil" text class="w-full justify-start" />
          <Button icon="pi pi-users" label="Amis" text class="w-full justify-start" />
          <Button icon="pi pi-bell" :badge="store.currentUser.notifications.toString()" label="Notifications" text class="w-full justify-start" />
          <Button icon="pi pi-bookmark" label="Enregistrements" text class="w-full justify-start" />
          <Button icon="pi pi-calendar" label="Événements" text class="w-full justify-start" />
        </div>
      </div>

      <!-- Feed principal -->
      <div class="main-feed">
        <!-- Stories -->
        <div class="stories-section">
          <ScrollPanel class="stories-scroll">
            <div class="stories-container">
              <div v-for="story in store.stories" 
                :key="story.id" 
                class="story-card"
                :class="{ viewed: story.viewed }"
                @click="store.viewStory(story.id)"
              >
                <img :src="story.image" :alt="story.author.name" class="story-image" />
                <div class="story-overlay">
                  <SocialAvatar 
                    :user="story.author"
                    size="normal"
                    :border-color="story.viewed ? 'var(--surface-border)' : 'var(--primary-color)'"
                    border-width="3px"
                  />
                  <span class="story-author">{{ story.author.name }}</span>
                </div>
              </div>
            </div>
          </ScrollPanel>
        </div>

        <!-- Créer un post -->
        <CreatePost 
          :current-user="store.currentUser"
          network="facebook"
          @submit="store.addPost"
        />

        <!-- Posts -->
        <div class="posts-section">
          <SocialPost
            v-for="post in store.posts"
            :key="post.id"
            :post="post"
            network="facebook"
            :show-comments="true"
            @primary-action="store.addReaction(post.id, 'like')"
            @comment="store.addComment(post.id, '')"
            @share="store.sharePost(post.id)"
          >
            <template #comments>
              <div v-if="post.comments?.length" class="comments-container">
                <SocialComment
                  v-for="comment in post.comments"
                  :key="comment.id"
                  :comment="comment"
                  @like="store.addReaction(post.id, 'like')"
                />
              </div>
              <div class="comment-composer">
                <SocialAvatar 
                  :user="store.currentUser"
                  size="normal"
                />
                <InputText 
                  v-model="newComments[post.id]" 
                  placeholder="Écrivez un commentaire..."
                  class="flex-1"
                  @keyup.enter="handleCommentSubmit(post.id)"
                />
              </div>
            </template>
          </SocialPost>
        </div>
      </div>

      <!-- Sidebar droite -->
      <div class="right-sidebar">
        <div class="online-friends">
          <h4>Contacts</h4>
          <div v-for="friend in store.onlineFriends" 
            :key="friend.id" 
            class="friend-item"
          >
            <SocialAvatar 
              :user="friend"
              size="normal"
              :show-status="true"
            />
            <span class="friend-name">{{ friend.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ScrollPanel from 'primevue/scrollpanel'
import SocialAvatar from '@/components/feed/SocialAvatar.vue'
import SocialPost from '@/components/feed/SocialPost.vue'
import SocialComment from '@/components/feed/SocialComment.vue'
import CreatePost from '@/components/feed/CreatePost.vue'
import { useFacebookMockStore } from '@/stores/mockData/facebookMock'

const store = useFacebookMockStore()
const newComments = ref<Record<string, string>>({})

const handleCommentSubmit = (postId: string) => {
  if (newComments.value[postId]?.trim()) {
    store.addComment(postId, newComments.value[postId])
    newComments.value[postId] = ''
  }
}
</script>

<style scoped>
.facebook-view {
  height: 100%;
  background: var(--surface-ground);
}

.facebook-content {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 1rem;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem;
  height: 100%;
}

.left-sidebar, .right-sidebar {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  height: fit-content;
}

.profile-section {
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 1rem;
}

.profile-section h3 {
  margin: 0.5rem 0 0.25rem;
}

.profile-section p {
  color: var(--text-color-secondary);
  margin: 0;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.main-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stories-section {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
}

.stories-scroll {
  height: 250px;
}

.stories-container {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
}

.story-card {
  position: relative;
  width: 140px;
  height: 220px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}

.story-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.story-author {
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
}

.story-card.viewed {
  opacity: 0.8;
}

.posts-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.online-friends {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.online-friends h4 {
  margin: 0 0 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
}

.friend-item:hover {
  background: var(--surface-hover);
}

.friend-name {
  font-size: 0.9rem;
}

.comments-container {
  padding: 0.5rem 1rem;
}

.comment-composer {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  align-items: center;
}
</style> 