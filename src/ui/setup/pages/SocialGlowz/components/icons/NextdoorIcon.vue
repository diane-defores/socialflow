<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2.4c-.24 0-.48.08-.67.24L2.4 9.84c-.36.28-.44.8-.16 1.16.16.2.4.32.66.32h1.52v8.28c0 .88.72 1.6 1.6 1.6h3.2c.44 0 .8-.36.8-.8v-5.2c0-.88.72-1.6 1.6-1.6h.76c.88 0 1.6.72 1.6 1.6v5.2c0 .44.36.8.8.8h3.2c.88 0 1.6-.72 1.6-1.6v-8.28h1.52c.44 0 .8-.36.8-.8 0-.26-.12-.5-.32-.66l-1.88-1.52V5.2c0-.44-.36-.8-.8-.8h-1.6c-.44 0-.8.36-.8.8v1.6L12.67 2.64A.94.94 0 0 0 12 2.4Z"
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
