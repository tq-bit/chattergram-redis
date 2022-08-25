<script setup lang="ts">
import { ref, watch, computed, nextTick, inject, ComputedRef, Ref } from 'vue';
import AppChatHistoryItem from './AppChatHistoryItem.vue';
import AppContainer from '../layout/AppContainer.vue';
import iMicrophone from '../icons/iMicrophone.vue';
import { PublicUser } from '../../store/users';
import { ChatHistoryItem } from '../../store/chat';
import AppBanner from '../ui/AppBanner.vue';

const chatPartner = inject('chatPartner') as Ref<PublicUser>;

const props = defineProps<{
  historyItems: ChatHistoryItem[];
  showLoadMoreButton: boolean;
}>();
const emit = defineEmits<{ (event: 'load-more-history-items'): void }>();

const chatHistoryListElement = ref<HTMLElement | null>(null);
const scrollHistoryListToBottom = () =>
  chatHistoryListElement.value?.scrollTo(
    0,
    chatHistoryListElement.value.scrollHeight,
  );

const historyItemCount: ComputedRef<number> = computed(
  () => props.historyItems.length,
);
watch(historyItemCount, (current, previous) => {
  if (current === previous + 1) {
    nextTick(() => scrollHistoryListToBottom());
  }
});
</script>

<template>
  <div class="relative h-full">
    <div class="absolute top-16 left-0 bottom-12 max-h-full w-full">
      <transition name="fade" mode="out-in">
        <ul
          v-if="historyItemCount > 0"
          ref="chatHistoryListElement"
          class="overflow-y max-h-full w-full overflow-x-hidden p-4 md:mt-0"
        >
          <transition name="fade-from-top">
            <app-banner class="mb-4" v-if="showLoadMoreButton">
              <button @click="emit('load-more-history-items')">
                Load older messages
              </button>
            </app-banner>
          </transition>
          <transition-group name="fade-from-right" mode="out-in">
            <app-chat-history-item
              v-for="(historyItem, index) in historyItems"
              :key="index"
              :history-item="historyItem"
            ></app-chat-history-item>
          </transition-group>
        </ul>
      </transition>

      <transition name="fade" mode="out-in">
        <app-container v-if="historyItemCount === 0" tag="div" page center>
          <h2 class="mb-4 text-2xl text-violet-800 dark:text-violet-400">
            Start your chat with {{ chatPartner.username }}
          </h2>
          <p>
            Click on the <i-microphone class="inline"></i-microphone> symbol to
            <br />
            start recording a message
          </p>
        </app-container>
      </transition>
    </div>
  </div>
</template>

<style scoped></style>
