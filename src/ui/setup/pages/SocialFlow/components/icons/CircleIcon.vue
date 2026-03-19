<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 2.8a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z"
      :fill="color"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: string | number
  color?: string
}>(), {
  size: '1em',
  color: 'currentColor',
})
</script>
