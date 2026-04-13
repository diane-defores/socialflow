<template>
  <div class="instagram-view">
    <div class="header">
      <SocialNetworkLogo 
        network="instagram"
        size="small"
        class="mr-2"
      />
      <h2>Instagram Feed</h2>
    </div>
    <div class="instagram-grid">
      <!-- Grille de photos Instagram -->
      <div
        v-for="i in 9"
        :key="i"
        class="instagram-item"
      >
        <div class="image-placeholder">
          <i class="pi pi-image"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SocialNetworkLogo } from '../common'
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.header h2 {
  margin: 0;
}

.instagram-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.instagram-item {
  aspect-ratio: 1;
  background: var(--surface-card);
  border-radius: 8px;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  font-size: 2rem;
}
</style> 
