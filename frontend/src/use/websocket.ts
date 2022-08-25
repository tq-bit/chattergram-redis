import { ComputedRef, Ref, ref } from 'vue';
import { ChatHistoryItem } from '../store/chat';
import useSession from '../store/session';
import { PublicUser } from '../store/users';
import useLogger from './logger';

const { token, user } = useSession();
const { log } = useLogger('development');

const socketStatus = ref<'open' | 'closed'>('closed');
const socketHeartbeat: Ref<ReturnType<typeof setInterval>> = ref(
  setInterval(() => {}, 0),
);

export default function useWebsocket(
  socketUrl: string,
  {
    chatSubscriptionHandler,
    userSubscriptionHandler,
    chatPartner,
  }: {
    chatSubscriptionHandler: (payload: ChatHistoryItem) => void;
    userSubscriptionHandler: (
      payload: Pick<PublicUser, '_id' | 'online'>,
    ) => void;
    chatPartner: ComputedRef<PublicUser>;
  },
) {
  if (!token) {
    log(
      'You forgot to create a session. Call useWebsocket only after creating a JWT',
      'error',
    );
    throw new Error('Cannot open socket connection without session JWT');
  }

  const socket = ref<WebSocket | null>(null);

  const handleSocketChatMessage = (chatPayload: ChatHistoryItem) => {
    const isValidChatPayload =
      !!chatPayload.receiverId && !!chatPayload.senderId;
    if (isValidChatPayload) {
      const { senderId, receiverId } = chatPayload;
      log(`Sender: Message from EQ ${senderId} to ${receiverId}`, 'info');

      const activeUserIsChatSender = user.value._id === senderId;
      const activeUserIsChatReceiver = user.value._id === receiverId;
      const chatPartnerIsChatSender = chatPartner.value._id === senderId;
      if (
        activeUserIsChatSender ||
        (activeUserIsChatReceiver && chatPartnerIsChatSender)
      ) {
        chatSubscriptionHandler(chatPayload);
      }
    }
  };

  const handleSocketUserMessage = (
    userMessage: Pick<PublicUser, '_id' | 'online'>,
  ) => {
    userSubscriptionHandler(userMessage);
  };

  const handleSocketMessage = ({ data }: MessageEvent) => {
    const [channel, payload] = (data as string).split('---');
    const chatPayload = JSON.parse(payload);

    if (channel === 'application:messages') {
      handleSocketChatMessage(chatPayload as ChatHistoryItem);
    }
    if (channel === 'application:users') {
      handleSocketUserMessage(
        chatPayload as Pick<PublicUser, '_id' | 'online'>,
      );
    }
  };

  const connect = () => {
    socket.value = new WebSocket(`${socketUrl}/?token=${token.value}`);

    socket.value.addEventListener('open', () => {
      log('Opened Websocket', 'info');
      socketStatus.value = 'open';
    });

    socket.value.addEventListener('close', () => {
      log('Closed websocket', 'warn');
      socketStatus.value = 'closed';
    });

    socket.value.addEventListener('message', handleSocketMessage);

    socket.value.addEventListener('open', (ev) => {
      socket.value?.send(token.value);
      socketHeartbeat.value = setInterval(
        () => socket.value?.send(token.value),
        5000,
      );
    });
  };

  const close = () => {
    if (socket.value) {
      socket.value.close();
      clearInterval(socketHeartbeat.value);
    }
  };

  return { socketStatus, connect, close };
}
