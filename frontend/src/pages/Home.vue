<script setup lang="ts">
import AppContainer from '../components/layout/AppContainer.vue';
import AppButton from '../components/form/AppButton.vue';
import Logo from '../assets/logo.gif';
</script>

<template>
  <app-container tag="main" page center>
    <img
      class="mx-auto block"
      :src="Logo"
      height="600"
      width="300"
      alt="Chattergram Logo"
    />
    <h1
      class="relative mb-12 text-center text-2xl text-violet-800 dark:text-violet-400"
    >
      If I wanted to hear your voice, <br />
      I'd listen to your podcast
    </h1>
    <router-link class="mb-4" to="/signup">
      <app-button block>Get started</app-button>
    </router-link>
    <app-button block variant="link" link="/about">Learn more</app-button>
  </app-container>
</template>

<style scoped>
h1::before {
  content: '“';
  @apply absolute -top-4 -left-8 text-6xl;
}
</style>
