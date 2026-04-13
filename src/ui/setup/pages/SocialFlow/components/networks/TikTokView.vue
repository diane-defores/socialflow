<template>
  <div class="tiktok-view">
    <h2>TikTok Feed</h2>
    <div class="tiktok-content">
      <div class="video-grid">
        <div
          v-for="i in 6"
          :key="i"
          class="video-card"
        >
          <div class="video-placeholder">
            <i class="pi pi-play"></i>
          </div>
          <div class="video-info">
            <p class="video-title">TikTok #{{ i }}</p>
            <div class="video-stats">
              <span><i class="pi pi-heart"></i> {{ Math.floor(Math.random() * 1000) }}K</span>
              <span><i class="pi pi-comments"></i> {{ Math.floor(Math.random() * 100) }}K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tiktok-content {
  padding: 1rem;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.video-card {
  background: var(--surface-card);
  border-radius: 8px;
  overflow: hidden;
}

.video-placeholder {
  aspect-ratio: 9/16;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-color-secondary);
}

.video-info {
  padding: 0.8rem;
}

.video-title {
  margin: 0;
  font-weight: bold;
}

.video-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
}

.video-stats span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
</style> 