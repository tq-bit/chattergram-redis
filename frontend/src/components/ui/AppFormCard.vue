<script setup lang="ts">
defineProps<{ center?: boolean; title?: string }>();
</script>

<template>
  <div class="h-auto w-96 p-4 md:mb-40" :class="{ 'text-center': center }">
    <div class="flex w-full items-center justify-center">
      <div
        class="rounded-full bg-gradient-to-br from-violet-400 to-violet-800 p-4 text-gray-100"
      >
        <slot name="icon" />
      </div>
    </div>
    <h3 class="mt-4 mb-8 text-center text-3xl">{{ title }}</h3>
    <slot name="default" />
  </div>
</template>
