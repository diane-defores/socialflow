<template>
  <div class="threads-view">
    <h2>Threads Feed</h2>
    <div class="threads-content">
      <div class="thread-list">
        <div v-for="i in 5" :key="i" class="thread-card">
          <div class="thread-header">
            <Avatar 
              :image="`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`"
              shape="circle"
              size="normal"
            />
            <div class="thread-user">
              <span class="username">@user{{ i }}</span>
              <span class="timestamp">{{ Math.floor(Math.random() * 24) }}h ago</span>
            </div>
          </div>
          <div class="thread-body">
            <p>This is a thread post #{{ i }}. Engaging with the community! 🚀</p>
          </div>
          <div class="thread-actions">
            <Button icon="pi pi-heart" text />
            <Button icon="pi pi-comment" text />
            <Button icon="pi pi-share-alt" text />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.threads-content {
  padding: 1rem;
}

.thread-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.thread-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1rem;
}

.thread-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.thread-user {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
}

.timestamp {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.thread-body {
  margin-bottom: 1rem;
}

.thread-actions {
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid var(--surface-border);
  padding-top: 0.8rem;
}
</style> 