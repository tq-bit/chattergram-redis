<script setup lang="ts">
import { inject, Ref } from 'vue';
import AppChatUserItem from './AppChatUserItem.vue';

import { PublicUser } from '../../store/users';

const chatPartner = inject('chatPartner') as Ref<PublicUser>;
const users = inject('users') as Ref<PublicUser[]>;

const emit = defineEmits(['userSelected']);
</script>

<template>
  <div class="relative h-full">
    <ul
      class="overflow-y absolute top-0 left-0 bottom-0 max-h-full w-full overflow-auto bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-50 md:top-16"
    >
      <app-chat-user-item
        class="cursor-pointer transition-all hover:bg-violet-600 hover:text-gray-100"
        :class="{
          'bg-violet-600 text-gray-100': user._id === chatPartner?._id,
        }"
        v-for="user in users"
        :key="user.username"
        :user="user"
        @click="emit('userSelected', user)"
      ></app-chat-user-item>
    </ul>
  </div>
</template>
