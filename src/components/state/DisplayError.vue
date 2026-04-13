<template>
  <Message
    v-if="error"
    severity="error"
    :closable="false"
  >
    {{ error }}
  </Message>
</template>

<script setup lang="ts">
defineProps<{
  error: string
}>()
</script>
