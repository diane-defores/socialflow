<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-header">
        <h1>SocialFlowz</h1>
        <p>Your social media command center</p>
      </div>

      <SignIn
        :appearance="{
          elements: {
            rootBox: 'clerk-root',
            card: 'clerk-card',
          },
        }"
        after-sign-in-url="/twitter"
        sign-up-url="/sign-up"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SignIn } from "@clerk/vue";
</script>

<style scoped>
.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--surface-ground);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
}

.login-header {
  text-align: center;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--text-color);
}

.login-header p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}
</style>
