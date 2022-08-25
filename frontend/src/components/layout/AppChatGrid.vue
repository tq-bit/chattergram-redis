<script setup lang="ts">
import iClose from '../icons/iClose.vue';

defineProps<{ showSidebar: boolean }>();

const emit = defineEmits(['toggleSidebar']);
</script>

<template>
  <div class="relative grid min-h-screen grid-cols-12">
    <transition name="grid-sidebar">
      <aside
        v-if="showSidebar"
        class="absolute top-16 bottom-0 z-10 block w-full overflow-y-hidden md:hidden"
      >
        <header class="bg-gray-50 p-4 pb-2 text-right dark:bg-gray-800">
          <button @click="emit('toggleSidebar')">
            <i-close></i-close>
          </button>
        </header>
        <slot name="aside">Aside slot</slot>
      </aside>
    </transition>

    <div class="col-span-12 hidden md:col-span-3 md:block lg:col-span-2">
      <slot name="aside">Aside slot</slot>
    </div>

    <div class="relative col-span-12 md:col-span-9 lg:col-span-10">
      <slot name="default">Main</slot>
    </div>
  </div>
</template>

<style scoped></style>
