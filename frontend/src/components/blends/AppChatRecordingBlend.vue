<script setup lang="ts">
import AppButton from '../form/AppButton.vue';
import iMicrophoneLg from '../icons/iMicrophoneLg.vue';

withDefaults(defineProps<{ show: boolean }>(), { show: false });

const emit = defineEmits(['finishRecord', 'cancelRecord']);
</script>

<template>
  <Transition name="fade">
    <div
      class="absolute top-0 left-0 z-20 flex h-full w-full flex-col items-center justify-center bg-gray-200 bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90"
      v-if="show"
    >
      <div
        class="mb-8 flex h-44 w-44 animate-pulse items-center justify-center rounded-full border-4 border-red-800"
      >
        <i-microphone-lg class="text-red-800"></i-microphone-lg>
      </div>
      <div class="w-40">
        <app-button block class="mb-4" @click="emit('finishRecord')">
          <span class="text-2xl">Send</span>
        </app-button>
        <app-button block outline class="text-lg" @click="emit('cancelRecord')"
          >Cancel</app-button
        >
      </div>
    </div>
  </Transition>
</template>

<style scoped></style>
