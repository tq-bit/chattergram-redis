<script setup lang="ts">
import iaRipple from '../icons/iaRipple.vue';

withDefaults(defineProps<{ show: boolean }>(), { show: false });
</script>

<template>
  <Transition name="fade">
    <div
      class="absolute top-0 left-0 z-10 flex h-full w-full flex-col items-center justify-center bg-gray-200 bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90"
      v-if="show"
    >
      <ia-ripple></ia-ripple>
    </div>
  </Transition>
</template>
