<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 1.5C6.202 1.5 1.5 5.866 1.5 11.25c0 1.94.6 3.75 1.632 5.28L2.1 20.82a1.125 1.125 0 0 0 1.335 1.406l4.057-1.008A11.25 11.25 0 0 0 12 22.5c5.798 0 10.5-4.365 10.5-9.75S17.798 1.5 12 1.5Z"
      :fill="color"
    />
    <path
      d="M7.5 9.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"
      :fill="color === 'currentColor' ? '#fff' : '#fff'"
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
