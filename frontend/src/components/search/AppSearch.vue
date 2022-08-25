<script setup lang="ts">
import { ref } from 'vue';
import useSearch, { SearchResult } from '../../store/search';
import AppInput from '../form/AppInput.vue';
import iUserGroup from '../icons/iUserGroup.vue';
import iChat from '../icons/iChat.vue';
import iaRipple from '../icons/iaRipple.vue';

const emit = defineEmits<{
  (event: 'click-user', payload: string): void;
  (event: 'click-chat', payload: string): void;
}>();

const query = ref('');

const { handleSearch, loading, searchResults } = useSearch(query);

const onChange = () => handleSearch(query.value);

const onClick = (searchResult: SearchResult) => {
  if (searchResult.type === 'user') {
    emit('click-user', searchResult._id);
  }
};
</script>

<template>
  <div
    class="absolute top-0 left-0 z-10 flex h-full w-full flex-col items-center justify-center bg-gray-200 bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90"
  >
    <div
      class="h-auto w-11/12 bg-white p-6 dark:bg-gray-900 md:w-4/12 lg:w-3/12"
    >
      <app-input
        label="Start typing to search"
        class="mb-4"
        variant="chat"
        @keyup="onChange"
        v-model="query"
      />
      <ia-ripple v-if="loading" class="m-auto h-24 w-24"></ia-ripple>
      <p v-else-if="!loading && !!query && searchResults.length === 0">
        No search results found
      </p>
      <div v-else>
        <ul class="max-h-56 overflow-y-auto">
          <li
            class="flex max-w-full overflow-hidden rounded p-2 hover:bg-violet-200 dark:hover:bg-violet-500"
            v-for="(result, index) in searchResults"
            :key="index"
            @click="onClick(result)"
          >
            <i-user-group v-if="result.type === 'user'"></i-user-group>
            <i-chat v-if="result.type === 'chat'"></i-chat>
            <p class="ml-2">{{ result.text }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
