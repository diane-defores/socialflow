<template>
  <div
    v-if="loading"
    class="flex items-center justify-center p-4"
    role="status"
    aria-label="Loading"
  >
    <ProgressSpinner
      style="width: 2rem; height: 2rem"
      stroke-width="4"
      animation-duration=".8s"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
}>()
</script>
