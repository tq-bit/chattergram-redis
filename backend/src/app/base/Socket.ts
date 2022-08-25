import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

import {
  ApplicationChannel,
  APPLICATION_MESSAGE_SEPARATOR,
  redisSubscriberClient,
  redisPublisherClient,
} from '../config/redis.config';
import SecurityHandler from '../handler/Security.handler';
import { UserRepository } from '../redis/redis.provider';
import { stringifyOnlineStatus } from './Stringifier';
import { UserChatSchemaType } from '../api/schemata';

/**
 * - A Token must be passed as part of the URL from the client to the serverside
 * - This token is received and identifier, then decoded and verified
 * - The userId will be used to identify the socket to which messages are to be sent
 */

class AppSocketServer {
  port: number;
  server: WebSocketServer;

  constructor(port: number) {
    this.port = port || 9090;
    this.server = new WebSocketServer({ port: this.port });
  }

  public listen() {
    this.server.on(
      'connection',
      async (socket: WebSocket, request: IncomingMessage) => {
        try {
          const token = this.getTokenFromUrl(request.url);
          const userId = this.verifyUserIntegrity(token);

          this.subscribeToActiveChannels(socket, userId);
          this.updateAndPublishUserOnlineStatus(userId, true);

          socket.on('close', async () => {
            this.updateAndPublishUserOnlineStatus(userId, false);
          });
          socket.on('message', async (message: Buffer) => {
            this.handleIncomingMessage(message);
          });
        } catch (error) {
          console.error(error);
          socket.close();
        }
      },
    );
  }

  private async updateAndPublishUserOnlineStatus(
    userId: string,
    online: boolean,
  ) {
    const userEntity = await UserRepository.search()
      .where('_id')
      .equal(userId)
      .return.first();
    if (userEntity) {
      userEntity.online = online;
      await UserRepository.save(userEntity);
    }
    redisPublisherClient.publish(
      ApplicationChannel.USER,
      stringifyOnlineStatus({ _id: userId, online }),
    );
  }

  private async handleIncomingMessage(message: Buffer) {
    const token = Buffer.from(message).toString();
    const userId = this.verifyUserIntegrity(token);
    await this.updateAndPublishUserOnlineStatus(userId, true);
  }

  private subscribeToActiveChannels(socket: WebSocket, userId: string) {
    redisSubscriberClient.subscribe(
      ApplicationChannel.USER,
      ApplicationChannel.MESSAGE,
      (err, count) => {
        if (err) throw err;
        console.log(`User ${userId} is subscribed to ${count} channels`);
      },
    );

    redisSubscriberClient.on(
      'message',
      (channel: ApplicationChannel, message: string) => {
        this.handleRealtimeMessageSending({ socket, userId, channel, message });
      },
    );
  }

  private handleRealtimeMessageSending({
    socket,
    userId,
    channel,
    message,
  }: {
    socket: WebSocket;
    userId: string;
    channel: ApplicationChannel;
    message: string;
  }) {
    function sendMessageOnUserChannel() {
      const payload = `${channel}${APPLICATION_MESSAGE_SEPARATOR}${message}`;
      socket.send(payload);
    }

    function sendMessageOnChatChannel() {
      const parsedMessage = JSON.parse(message) as UserChatSchemaType;
      const socketIsChatReceiverOrSender =
        userId === parsedMessage.receiverId ||
        userId === parsedMessage.senderId;
      const payload = `${channel}${APPLICATION_MESSAGE_SEPARATOR}${message}`;
      if (socketIsChatReceiverOrSender) {
        socket.send(payload);
      }
    }

    if (channel === ApplicationChannel.USER) {
      sendMessageOnUserChannel();
    }
    if (channel === ApplicationChannel.MESSAGE) {
      sendMessageOnChatChannel();
      this.updateAndPublishUserOnlineStatus(userId, true);
    }
  }

  private verifyUserIntegrity(token: string): string {
    const session = SecurityHandler.verifyJwt(token);
    if (!token || !session.userId) {
      throw new Error('Invalid token or session data');
    }
    return session.userId;
  }

  private getTokenFromUrl(url: string | undefined): string {
    const tokenIdentifier = '/?token=';
    if (url && url.includes(tokenIdentifier)) {
      return url.split(tokenIdentifier)[1];
    }
    throw new Error(`${tokenIdentifier} must be part of the socket URL!`);
  }
}

export default AppSocketServer;
