<script setup lang="ts">
import AppContainer from '../components/layout/AppContainer.vue';
import TrophyMeme from '../assets/trophymeme.jpg';
</script>

<template>
  <app-container tag="main" page center>
    <div>
      <img class="rounded" :src="TrophyMeme" height="800" width="375" alt="" />
      <p class="my-4 text-center">To be implemented ...</p>
      <router-link
        class="block w-full text-center font-bold text-violet-500"
        to="/chat"
        >Back to chat</router-link
      >
    </div>
  </app-container>
</template>
