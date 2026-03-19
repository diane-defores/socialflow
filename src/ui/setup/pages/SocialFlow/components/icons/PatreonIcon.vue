<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21ZM2 21.6h3.5V2.41H2V21.6Z"
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
