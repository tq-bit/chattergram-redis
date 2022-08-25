<script setup lang="ts">
import { computed, inject, Ref } from 'vue';
import AppAudioPlayer from '../ui/AppAudioPlayer.vue';
import { ChatHistoryItem, FileSchema } from '../../store/chat';
import { PublicUser } from '../../store/users';
import { ActiveUser } from '../../store/session';

import { convertBase64ToObjectUrl } from '../../utils/convert';

const chatPartner = inject('chatPartner') as Ref<PublicUser>;
const user = inject('user') as Ref<ActiveUser>;
const getAudioFileCacheEntry = inject('getAudioFileCacheEntry') as (
  audioFileUuid: string,
) => FileSchema | null;
const fetchAudioFileByUuid = inject('fetchAudioFileByUuid') as (
  audioFileUuid: string,
) => Promise<any>;

const props = defineProps<{ historyItem: ChatHistoryItem }>();

const wasSentByActiveUser = computed(() => {
  return user.value._id === props.historyItem.senderId;
});

const activeUser = computed(() => {
  if (wasSentByActiveUser.value) {
    return `${user.value.username} (You)`;
  } else {
    return chatPartner.value?.username;
  }
});

const dateSent = computed(() => {
  const now = new Date();
  const dateSentRaw = new Date(props.historyItem.dateSent);
  const daysPassedSinceSent =
    (now.getTime() - dateSentRaw.getTime()) / 1000 / 60 / 60 / 24;

  // less than 1 day ago means < 24h
  if (daysPassedSinceSent < 1) {
    return `Less than 24h ago`;
  }

  return `${Math.ceil(daysPassedSinceSent)} days ago`;
});

const hasAudioFile = computed(() => {
  return props.historyItem.audioFileId;
});
const isLoadingAudioFile = computed(() => {
  return props.historyItem.isLoadingAudioFile || false;
});
const audioFileUrl = computed(() => {
  const audioFileEntry = getAudioFileCacheEntry(props.historyItem.audioFileId);
  if (audioFileEntry) {
    return convertBase64ToObjectUrl(audioFileEntry.audioFile);
  }
  return null;
});
const syncAudioFile = async () => {
  await fetchAudioFileByUuid(props.historyItem.audioFileId);
};
</script>

<template>
  <li
    class="mb-4 w-fit max-w-xs break-words rounded-2xl px-8 py-4 md:max-w-xl"
    :class="{
      'ml-auto bg-gradient-to-br from-violet-600  to-violet-800 text-gray-100':
        wasSentByActiveUser,
      'mr-auto bg-gradient-to-bl from-violet-400 to-violet-500 text-gray-100':
        !wasSentByActiveUser,
    }"
  >
    <h3 class="inline text-lg font-semibold">
      {{ activeUser }}
    </h3>
    - <span>{{ dateSent }}</span>
    <app-audio-player
      v-if="hasAudioFile"
      @mouseenter="syncAudioFile"
      :loading="isLoadingAudioFile"
      :audio-file-url="audioFileUrl"
    ></app-audio-player>
    <p class="mb-2">{{ historyItem.text }}</p>
    <small
      class="rounded-lg bg-gray-200 p-1 px-2 text-violet-800"
      v-if="historyItem.confidence"
      ><span class="font-bold"
        >{{ (historyItem.confidence * 100).toFixed(2) }}%</span
      >
      transcript accuracy
    </small>
  </li>
</template>

<style scoped></style>
