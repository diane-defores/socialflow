<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 1C5.79 1 1 5.41 1 11.04c0 3.18 1.57 6.01 4.03 7.86V23l3.84-2.11c1.02.28 2.1.44 3.13.44 6.21 0 11-4.41 11-10.04S18.21 1 12 1Zm1.09 13.52-2.8-2.99-5.47 2.99 6.01-6.38 2.87 2.99 5.4-2.99-6.01 6.38Z"
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
