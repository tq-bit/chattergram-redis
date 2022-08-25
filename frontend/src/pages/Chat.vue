<script setup lang="ts">
import { ref, computed, onMounted, provide, onUnmounted } from 'vue';
import AppChatGrid from '../components/layout/AppChatGrid.vue';
import AppChatUserList from '../components/chat/AppChatUserList.vue';
import AppChatHistoryList from '../components/chat/AppChatHistoryList.vue';
import AppChatInput from '../components/chat/AppChatInput.vue';
import AppChatRecordingBlend from '../components/blends/AppChatRecordingBlend.vue';
import AppChatLoadingBlend from '../components/blends/AppChatLoadingBlend.vue';
import AppChatGridToggle from '../components/layout/AppChatGridToggle.vue';
import AppButton from '../components/form/AppButton.vue';
import AppBanner from '../components/ui/AppBanner.vue';

import useUsers, { PublicUser } from '../store/users';
import useChat from '../store/chat';
import useWebsocket from '../use/websocket';
import useSession from '../store/session';
import useRecorder from '../use/recorder';
import Logo from '../assets/logo.gif';

const WS_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'ws://localhost:9090'
    : 'ws://localhost:9090';

const {
  users,
  fetchUsers,
  chatPartner,
  setChatpartner,
  updateUserOnlineStatus,
} = useUsers();

const {
  loading,
  createChatItem,
  chatHistory,
  fetchRecentChatHistory,
  fetchChatHistory,
  isMoreHistoryLoadable,
  createChatItemWithRecordedFile,
  getAudioFileCacheEntry,
  fetchAudioFileByUuid,
  addOneToBackOfChatHistory,
} = useChat();
const {
  isRecording,
  startRecording,
  stopRecording,
  recordedFile,
  requestAudioPermission,
  hasAudioPermission,
} = useRecorder();
const { user } = useSession();
const { connect, socketStatus, close } = useWebsocket(WS_BASE_URL, {
  chatSubscriptionHandler: addOneToBackOfChatHistory,
  userSubscriptionHandler: updateUserOnlineStatus,
  chatPartner: chatPartner,
});

provide('chatPartner', chatPartner);
provide('users', users);
provide('user', user);
provide('getAudioFileCacheEntry', getAudioFileCacheEntry);
provide('fetchAudioFileByUuid', fetchAudioFileByUuid);

const showChatPartnerSidebar = ref(false);

const hasChatPartner = computed(
  () => !!chatPartner.value && chatPartner.value._id !== '',
);

const onToggleChatSidebar = () => {
  showChatPartnerSidebar.value = !showChatPartnerSidebar.value;
};

const onUserSelected = async (payload: PublicUser) => {
  onToggleChatSidebar();
  setChatpartner(payload);
  await fetchRecentChatHistory();
};

const onLoadMoreHistoryItems = async () => {
  await fetchChatHistory();
};

const onClickRecord = async () => {
  if (isRecording.value === false) {
    return startRecording();
  }
  stopRecording();

  // FIXME: Remove this timeout and replace with promise or suchlike
  setTimeout(() => createChatItemWithRecordedFile(recordedFile.value));
};

const onClickReconnect = () => {
  close();
  connect();
};

const onClickCancelRecord = () => {
  stopRecording();
};

onMounted(async () => {
  if (socketStatus.value === 'open') {
    close();
  }
  if (socketStatus.value === 'closed') {
    connect();
  }
  requestAudioPermission();
  await fetchUsers();
});

onUnmounted(() => close());
</script>

<template>
  <app-chat-grid
    :show-sidebar="showChatPartnerSidebar"
    @toggle-sidebar="onToggleChatSidebar"
    class="h-screen"
  >
    <template v-slot:aside>
      <app-chat-user-list
        @user-selected="onUserSelected"
        :chat-partner="chatPartner"
        :users="users"
      ></app-chat-user-list>
    </template>

    <template v-slot:default>
      <app-chat-recording-blend
        :show="isRecording"
        @finish-record="onClickRecord"
        @cancel-record="onClickCancelRecord"
      ></app-chat-recording-blend>

      <app-chat-loading-blend :show="loading"></app-chat-loading-blend>

      <app-chat-grid-toggle @click="onToggleChatSidebar"></app-chat-grid-toggle>

      <app-chat-history-list
        v-if="hasChatPartner"
        @load-more-history-items="onLoadMoreHistoryItems"
        :history-items="chatHistory"
        :show-load-more-button="isMoreHistoryLoadable"
      ></app-chat-history-list>

      <app-chat-input
        v-if="hasChatPartner"
        @click-record="onClickRecord"
        @submit="createChatItem"
        class="absolute bottom-0 right-0"
      ></app-chat-input>

      <!-- Alternative text to be shown when no chat partner is selected -->
      <div
        class="flex h-full flex-col items-center justify-center"
        v-if="!hasChatPartner"
      >
        <img
          class="mx-auto block"
          :src="Logo"
          height="600"
          width="300"
          alt="Chattergram Logo"
        />
        <p>Select a user to get started</p>
      </div>

      <!-- First aid toolbar for WS connection or audio permissions -->
      <section class="absolute bottom-12 left-0 w-full px-4">
        <app-banner v-if="socketStatus === 'closed'" class="my-2">
          <p>
            You are not connected to the live chat.
            <button
              class="underline"
              title="Try to reconnect"
              @click="onClickReconnect"
            >
              Click here
            </button>
            to try and reconnect
          </p>
        </app-banner>

        <app-banner class="my-2" v-if="!hasAudioPermission">
          <p>
            You did not grant audio permission.
            <button
              class="underline"
              title="Try to request audio permission"
              @click="requestAudioPermission"
            >
              Click here
            </button>
            to request it again
          </p>
        </app-banner>
      </section>
    </template>
  </app-chat-grid>
</template>
