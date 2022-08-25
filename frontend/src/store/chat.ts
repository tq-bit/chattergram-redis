import { ref, computed } from 'vue';
import { AxiosError } from 'axios';
import useUsers from './users';
import client from '../api_client';
import useSession from './session';
import useLogger from '../use/logger';
import useAppAlert from '../use/app-alert';
import { AppServerResponseOrError } from '../@types/commons';

const { log } = useLogger();
const { sessionHeaders, user: activeUser } = useSession();
const { chatPartner } = useUsers();
const { triggerAppAlert } = useAppAlert();

export interface FileSchema {
  audioFile: string;
  audioFileUuid: string;
  audioFileName: string;
  audioFileMimetype: string;
}

export interface ChatFormItem {
  senderId: string;
  receiverId: string;
  audioFileId?: string;
  text: string;
}

export interface ChatHistoryItem {
  senderId: string;
  receiverId: string;
  dateSent: string;
  audioFileId: string;
  text: string;
  confidence: number;
  isLoadingAudioFile: boolean;
}

const chatState = ref<ChatHistoryItem[]>([]);

const audioFileState = ref<Record<string, FileSchema>>({});

const chatHistoryOffsetState = ref<number>(0);
const isMoreHistoryLoadableState = ref<boolean>(true);
const chatHistoryFetchLimit = 50;

/**
 * @description useChat is to be used for a single user only and can only be
 *              initialized when a chat partner from `useUsers` has been defined.
 */
export default function useChat() {
  if (!chatPartner.value) {
    log('No chat partner defined before initializing useChat', 'error');
    log(
      'Make sure to set a chat partner with useUsers before using this composable',
      'error',
    );
  }

  // Chat History
  const chatHistory = computed(() => chatState.value);

  const setHistoryItemIsLoadingAudioFile = (
    audioFileId: string,
    to: boolean,
  ) => {
    setChatHistory(
      chatHistory.value.map((entry) => {
        if (entry.audioFileId === audioFileId) {
          entry.isLoadingAudioFile = to;
        }
        return entry;
      }),
    );
  };

  const setChatHistory = (chatHistory: ChatHistoryItem[]) => {
    isMoreHistoryLoadableState.value = true;
    chatState.value = chatHistory;
  };

  const addOneToBackOfChatHistory = (payload: ChatHistoryItem) => {
    chatState.value.push(payload);
  };

  const addManyToFrontOfChatHistory = (payload: ChatHistoryItem[]) => {
    chatState.value = [...payload, ...chatState.value];
  };

  const createChatItem = async (text: string, fileInfo?: FileSchema) => {
    if (!chatPartner.value) throw new Error('No chat partner defined');
    try {
      const payload: ChatFormItem = {
        receiverId: chatPartner.value._id,
        senderId: activeUser.value._id,
        audioFileId: fileInfo?.audioFileUuid,
        text: text,
      };

      const response = await client.post(`/chat`, payload, {
        headers: sessionHeaders.value,
      });
      return [response, null];
    } catch (error) {
      log(error as string, 'error');
      triggerAppAlert({
        message: 'Something went wrong while posting a chat message',
        variant: 'error',
      });
      return [null, error as AxiosError];
    }
  };

  const createChatItemWithRecordedFile = async (
    file: Blob | null | undefined,
  ): Promise<AppServerResponseOrError> => {
    if (!file) throw new Error('Must provide a file to upload');
    loading.value = true;
    const [fileResponse, fileError] = await uploadRecordedFile(file);
    const fileInfo: FileSchema = fileResponse?.data.files[0];
    const [response, chatError] = await createChatItem('', fileInfo);
    loading.value = false;
    return [
      response,
      fileError || chatError || null,
    ] as AppServerResponseOrError;
  };

  // Audio File state
  const audioFileCache = computed(() => audioFileState.value);
  const setAudioFileState = (
    audioFileUuid: string,
    payload: FileSchema,
  ): void => {
    audioFileState.value[audioFileUuid] = payload;
  };

  const getAudioFileCacheEntry = (audioFileUuid: string): FileSchema | null => {
    return audioFileCache.value[audioFileUuid] || null;
  };

  // Loading & Query state
  const loading = ref<boolean>(false);

  const isMoreHistoryLoadable = computed(() => {
    return isMoreHistoryLoadableState.value;
  });
  const setIsMoreHistoryLoadable = (to: boolean) => {
    isMoreHistoryLoadableState.value = to;
  };

  const chatHistoryOffset = computed(() => chatHistoryOffsetState.value);
  const increaseChatOffsetValue = () => {
    chatHistoryOffsetState.value += chatHistoryFetchLimit;
  };

  const fetchChatHistory = async (): Promise<AppServerResponseOrError> => {
    if (!chatPartner.value) throw new Error('No chat partner defined');

    try {
      loading.value = true;
      const response = await client.get(
        `/chat/${chatPartner.value._id}?offset=${chatHistoryOffset.value}&limit=${chatHistoryFetchLimit}`,
        {
          headers: sessionHeaders.value,
        },
      );
      addManyToFrontOfChatHistory(response.data);
      increaseChatOffsetValue();
      if (response.data.length < chatHistoryFetchLimit) {
        setIsMoreHistoryLoadable(false);
      }
      return [response, null];
    } catch (error) {
      log(error as string, 'error');
      triggerAppAlert({
        message: 'Something went wrong while fetching more messages' + error,
        variant: 'error',
      });
      return [null, error as AxiosError];
    } finally {
      loading.value = false;
    }
  };

  const fetchRecentChatHistory =
    async (): Promise<AppServerResponseOrError> => {
      if (!chatPartner.value) throw new Error('No chat partner defined');
      try {
        loading.value = true;
        const response = await client.get(`/chat/${chatPartner.value._id}`, {
          headers: sessionHeaders.value,
        });
        setChatHistory(response.data);
        return [response, null];
      } catch (error) {
        log(error as string, 'error');
        triggerAppAlert({
          message: 'Something went wrong while receiving messages' + error,
          variant: 'error',
        });
        return [null, error as AxiosError];
      } finally {
        loading.value = false;
      }
    };

  const fetchAudioFileByUuid = async (audioFileUuid: string) => {
    try {
      const cachedAudioFile = getAudioFileCacheEntry(audioFileUuid);
      if (cachedAudioFile) {
        return [cachedAudioFile, null];
      }

      setHistoryItemIsLoadingAudioFile(audioFileUuid, true);
      const response = await client.get(`file/${audioFileUuid}`, {
        headers: sessionHeaders.value,
      });
      setAudioFileState(audioFileUuid, response.data);

      return [response.data, null];
    } catch (error) {
      log(error as string, 'error');
      triggerAppAlert({
        message:
          'Something went wrong while receiving a recorded audio file' + error,
        variant: 'error',
      });
      return [null, error as AxiosError];
    } finally {
      setHistoryItemIsLoadingAudioFile(audioFileUuid, false);
    }
  };

  const uploadRecordedFile = async (
    file: Blob,
  ): Promise<AppServerResponseOrError> => {
    try {
      const form = new FormData();
      form.append('audioFile', file);
      const response = await client.post('/upload', form, {
        headers: sessionHeaders.value,
      });
      form.delete('audioFile');

      return [response, null];
    } catch (error) {
      log(error as string, 'error');
      triggerAppAlert({
        message: 'Something went wrong while uploading the audio file',
        variant: 'error',
      });
      return [null, error as AxiosError];
    }
  };

  return {
    loading,
    chatHistory,
    createChatItem,
    createChatItemWithRecordedFile,
    fetchRecentChatHistory,
    fetchChatHistory,
    isMoreHistoryLoadable,
    close,
    addOneToBackOfChatHistory,
    fetchAudioFileByUuid,
    getAudioFileCacheEntry,
  };
}
