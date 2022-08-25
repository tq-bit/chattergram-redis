<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppHeader from './components/ui/AppHeader.vue';
import AppSidebar from './components/ui/AppSidebar.vue';
import AppAlert from './components/ui/AppAlert.vue';
import AppSearch from './components/search/AppSearch.vue';

import useAppAlert from './use/app-alert';
import useSession from './store/session';

const { message, showAppAlert, variant } = useAppAlert();
const { syncLocalApiToken } = useSession();
let showSidebar = ref(false);
let showSearch = ref(false);

onMounted(() => {
  syncLocalApiToken();
});
</script>

<template>
  <div>
    <Transition name="fade-from-top">
      <app-alert
        v-if="showAppAlert && message"
        :variant="variant"
        class="absolute top-20 right-4 left-4 z-50 mx-auto block w-64 max-w-xs text-center"
      >
        {{ message }}
      </app-alert>
    </Transition>

    <app-header
      title="Chattergram"
      @toggle-sidebar="showSidebar = !showSidebar"
      @toggle-search="showSearch = !showSearch"
    ></app-header>
    <transition name="fade">
      <app-search v-if="showSearch"></app-search>
    </transition>

    <app-sidebar
      :show="showSidebar"
      @toggle-sidebar="showSidebar = !showSidebar"
    ></app-sidebar>
    <main>
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>
