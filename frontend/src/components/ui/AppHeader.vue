<script setup lang="ts">
import iMenu from '../icons/iMenu.vue';
import iSearch from '../icons/iSearch.vue';
import AppThemeButton from '../form/AppThemeButton.vue';

withDefaults(defineProps<{ title: string }>(), { title: 'Chattergram' });
const emit = defineEmits(['toggleSidebar', 'toggleSearch']);
</script>

<template>
  <header
    class="absolute top-0 left-0 z-50 h-16 w-full bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-50"
  >
    <div class="grid h-16 grid-cols-3">
      <div class="col-span-1 ml-4 flex items-center justify-start">
        <button class="flex flex-row" @click="emit('toggleSidebar')">
          <i-menu></i-menu> <span class="ml-2 hidden md:block">Menu</span>
        </button>
      </div>
      <div
        class="col-span-1 flex items-center justify-center text-lg font-semibold"
      >
        <h2 class="text-xl">{{ title }}</h2>
      </div>
      <div class="col-span-1 mr-4 flex items-center justify-end">
        <button class="mr-2 md:mr-4" @click="emit('toggleSearch')">
          <i-search></i-search>
        </button>
        <app-theme-button></app-theme-button>
      </div>
    </div>
  </header>
</template>
