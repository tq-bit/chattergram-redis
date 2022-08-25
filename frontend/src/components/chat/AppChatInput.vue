<script setup lang="ts">
import { ref } from 'vue';
import AppInput from '../form/AppInput.vue';
import AppButton from '../form/AppButton.vue';
import iMicrophone from '../icons/iMicrophone.vue';
import iChat from '../icons/iChat.vue';

const chatText = ref<string>('');

const emit = defineEmits<{
  (event: 'submit', chatText: string): void;
  (event: 'clickRecord'): void;
}>();

const onSubmit = () => {
  if (chatText.value) {
    emit('submit', chatText.value);
    chatText.value = '';
  }
};
</script>

<template>
  <form
    @submit.prevent="onSubmit"
    class="flex h-16 w-full bg-gray-50 p-1 text-gray-800 dark:bg-gray-800 dark:text-gray-50"
  >
    <app-input variant="chat" class="w-full" v-model="chatText"></app-input>
    <app-button
      title="Send message"
      class="hidden md:block"
      type="submit"
      variant="ghost"
      ><i-chat></i-chat
    ></app-button>
    <app-button
      type="button"
      title="Record a voice message"
      variant="ghost"
      @click="emit('clickRecord')"
    >
      <i-microphone></i-microphone
    ></app-button>
  </form>
</template>

<style scoped></style>
