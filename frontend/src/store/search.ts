import { ref, Ref, computed } from 'vue';
import client from '../api_client';
import useLazySearch from '../use/lazysearch';
import useSession from './session';

export interface SearchResult {
  _id: string;
  type: 'user' | 'chat';
  text: string;
}

const { sessionHeaders } = useSession();

const searchResultState = ref<SearchResult[]>([]);

export default function useSearch(query: Ref<string>) {
  const searchResults = computed(() => searchResultState.value);

  const fetchSearchResults = async (query: Ref<string>) => {
    const response = await client.get(`/search?q=${query.value}`, {
      headers: sessionHeaders.value,
    });
    searchResultState.value = response.data;
  };

  const resetSearchResults = async () => {
    searchResultState.value = [];
  };

  const { handleSearch, loading } = useLazySearch(
    () => fetchSearchResults(query),
    () => resetSearchResults(),
    1000,
  );

  return { searchResults, handleSearch, loading };
}
