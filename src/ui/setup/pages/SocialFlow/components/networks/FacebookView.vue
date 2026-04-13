<template>
  <div class="facebook-view">
    <div class="facebook-content">
      <!-- Feed principal -->
      <div class="main-feed">
        <!-- Stories -->
        <div class="stories-section">
          <ScrollPanel class="stories-scroll">
            <div class="stories-container">
              <div
                v-for="story in store.stories" 
                :key="story.id" 
                class="story-card"
                :class="{ viewed: story.viewed }"
                @click="store.viewStory(story.id)"
              >
                <img
                  :src="story.image"
                  :alt="story.author.name"
                  class="story-image"
                />
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
            :show-comments="post.showComments"
            @primary-action="store.addReaction(post.id, 'like')"
            @comment="store.addComment(post.id, '')"
            @share="store.sharePost(post.id)"
            @toggle-comments="togglePostComments(post.id)"
          >
            <template
              v-if="post.showComments"
              #comments
            >
              <div
                v-if="post.comments?.length"
                class="comments-container"
              >
                <SocialComment
                  v-for="comment in post.comments"
                  :key="comment.id"
                  :comment="comment"
                  @like="handleCommentLike(post.id, comment.id)"
                  @reply="handleCommentReply(post.id, comment.id)"
                />
              </div>
              <div class="comment-composer">
                <SocialAvatar 
                  :user="store.currentUser"
                  size="normal"
                />
                <InputText 
                  v-model="newComments[post.id]" 
                  :placeholder="$t('facebook.comment_placeholder')"
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
          <h4>{{ $t('facebook.contacts') }}</h4>
          <div
            v-for="friend in store.onlineFriends" 
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
import { SocialAvatar, SocialPost, SocialComment, CreatePost } from '../feed'
import { useFacebookMockStore } from '../../stores/mockData/facebookMock'

const store = useFacebookMockStore()
const newComments = ref<Record<string, string>>({})

const handleCommentSubmit = (postId: string) => {
  if (newComments.value[postId]?.trim()) {
    store.addComment(postId, newComments.value[postId])
    newComments.value[postId] = ''
  }
}

const handleCommentLike = (postId: string, commentId: string) => {
  store.likeComment(postId, commentId)
}

const handleCommentReply = (postId: string, commentId: string) => {
  // Logique pour répondre à un commentaire
  console.log(`Répondre au commentaire ${commentId} du post ${postId}`)
}

const togglePostComments = (postId: string) => {
  const post = store.posts.find(p => p.id === postId)
  if (post) {
    // Vous pouvez ajouter une propriété personnalisée pour suivre l'état des commentaires
    post.showComments = !post.showComments
  }
}
</script>

<style scoped>
.facebook-view {
  height: 100%;
  background: var(--surface-ground);
  padding-top: 4rem;
}

.facebook-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  height: calc(100% - 4rem);
  overflow-y: auto;
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

.right-sidebar {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  height: fit-content;
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
