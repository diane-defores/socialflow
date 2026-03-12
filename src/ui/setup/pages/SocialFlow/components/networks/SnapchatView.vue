<template>
  <div class="snapchat-view">
    <h2>Snapchat</h2>
    <div class="snapchat-content">
      <div class="snap-grid">
        <div v-for="i in 6" :key="i" class="snap-card">
          <div class="snap-placeholder">
            <i class="pi pi-camera"></i>
          </div>
          <div class="snap-info">
            <p class="snap-title">Snap #{{ i }}</p>
            <div class="snap-stats">
              <span><i class="pi pi-eye"></i> {{ Math.floor(Math.random() * 500) }}</span>
              <span><i class="pi pi-replay"></i> {{ Math.floor(Math.random() * 50) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snapchat-content {
  padding: 1rem;
}

.snap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.snap-card {
  background: var(--surface-card);
  border-radius: 8px;
  overflow: hidden;
}

.snap-placeholder {
  aspect-ratio: 9/16;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-color-secondary);
}

.snap-info {
  padding: 0.8rem;
}

.snap-title {
  margin: 0;
  font-weight: bold;
}

.snap-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
}

.snap-stats span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
</style>
