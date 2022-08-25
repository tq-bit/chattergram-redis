import { FastifyReply } from 'fastify';
import { Repository } from 'redis-om';
import { DateTime } from 'luxon';

import { ApplicationChannel } from '../config/redis.config';

import Handler from '../base/Handler';
import Uploader from '../base/Uploader';
import Transcriber from '../base/Transcriber';

import ChatFileSchema from '../model/File.schema';
import UserModel from '../model/User.schema';
import ChatModel from '../model/Chat.schema';

import { ChatRepository } from '../redis/redis.provider';
import { ChatEntity } from '../redis/Chat.schema';

import { stringifyUserChatSchemaType } from '../base/Stringifier';

import {
  UserChatSchemaType,
  AppRequest,
  ChatRequest,
  FileRequest,
} from '../api/schemata';

class ChatHandler extends Handler {
  uploader: Uploader;
  chatRepository: Repository<ChatEntity>;
  constructor() {
    super('chat');
    this.uploader = new Uploader();
    this.chatRepository = ChatRepository;
  }

  public uploadAudioFile = async (req: AppRequest, reply: FastifyReply) => {
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('multipart/form-data')) {
      return reply.badRequest(
        'Content-type header does not include multipart/form-data',
      );
    }
    const { files } = await this.uploader.extractForm(req);
    reply.send({ files });
  };

  public createChatEntry = async (req: AppRequest, reply: FastifyReply) => {
    const session = this.getSession(req);
    const incomingPayload = req.body as UserChatSchemaType;

    await this.checkIfChatPartnersExist(
      reply,
      session.userId,
      incomingPayload.receiverId,
    );
    await this.checkIfUploadedAudioIsAvailable(reply, incomingPayload);

    const processedPayload = await this.processIncomingChatPayload(
      incomingPayload,
    );

    await this.saveIncomingChatPayload(processedPayload);

    this.publishMessage(
      ApplicationChannel.MESSAGE,
      stringifyUserChatSchemaType(processedPayload),
    );
    return reply.send(processedPayload);
  };

  public getChatHistoryByReceiver = async (
    req: ChatRequest,
    reply: FastifyReply,
  ) => {
    const { userId } = this.getSession(req);
    const { partnerId } = req.params;
    const { offset, limit } = req.query;

    if (!userId || !partnerId) {
      return reply.notFound();
    }

    if ((offset || offset === 0) && (limit || limit === 0)) {
      const options = {
        offset: offset || 0,
        limit: limit || 0,
      };
      const mongoHistory = await this.getChatHistoryFromMongo(
        userId,
        partnerId,
        options,
      );

      return reply.send(mongoHistory);
    }

    const chats = await this.getChatHistoryFromRedis(userId, partnerId);
    return reply.send(chats);
  };

  public getChatAudioByUuid = async (req: FileRequest, reply: FastifyReply) => {
    const { fileUuid } = req.params;

    const file = await ChatFileSchema.findOne({ audioFileUuid: fileUuid });
    reply.send(file);
  };

  private checkIfUploadedAudioIsAvailable = async (
    reply: FastifyReply,
    payload: UserChatSchemaType,
  ): Promise<UserChatSchemaType | void> => {
    const payloadHasAudioFile = !!payload.audioFileId;
    const audioFileWasUploaded = !!this.uploader.getFilePathByUuid(
      payload.audioFileId,
    );

    if (payloadHasAudioFile && !audioFileWasUploaded) {
      return reply.notFound(
        `File with id ${payload.audioFileId} was not uploaded or does not exist anymore`,
      );
    }
  };

  private checkIfChatPartnersExist = async (
    reply: FastifyReply,
    senderId?: string,
    receiverId?: string,
  ) => {
    const chatPartners = await UserModel.find({
      $or: [{ _id: senderId }, { _id: receiverId }],
    });

    if (chatPartners.length < 1) {
      return reply.notFound(`One of the two chat partners does not exist`);
    }
  };

  private async processIncomingChatPayload(
    incomingPayload: UserChatSchemaType,
  ): Promise<UserChatSchemaType> {
    if (!incomingPayload.audioFileId) {
      return {
        ...incomingPayload,
        dateSent: DateTime.local().toString(),
      };
    }

    const uuid = incomingPayload.audioFileId;

    const path = this.uploader.getFilePathByUuid(uuid);
    const transcriber = new Transcriber(path, 'audio/mp3');
    const transcription = await transcriber.translateFromLocalFile();
    return {
      ...incomingPayload,
      dateSent: DateTime.local().toString(),
      text: transcription?.transcript || '',
      confidence: transcription?.confidence || 0,
    };
  }

  private async saveIncomingChatPayload(
    payload: UserChatSchemaType,
  ): Promise<void> {
    await this.chatRepository.createAndSave(payload);

    if (payload.audioFileId) {
      const audioFile = await this.uploader.getFileStringByUuid(
        payload.audioFileId,
      );

      const chatFile = new ChatFileSchema({
        audioFile: audioFile,
        audioFileMimetype: 'audio/mp3',
        audioFileName: 'blob',
        audioFileUuid: payload.audioFileId,
      });

      await chatFile.save();
    }
  }

  /**
   * @desc  Get all chat entries that are less than 3 months old
   * @param userId
   * @param partnerId
   * @returns
   */
  private async getChatHistoryFromRedis(userId: string, partnerId: string) {
    return !!userId && !!partnerId
      ? await this.chatRepository
          .search()
          .where('senderId')
          .equals(userId)
          .and('receiverId')
          .equals(partnerId)
          .or((search) => {
            return search
              .where('senderId')
              .equals(partnerId)
              .and('receiverId')
              .equals(userId);
          })
          .sortAsc('dateSent')
          .return.all()
      : [];
  }

  /**
   * @desc Get all chat entries that are older than three months
   *
   * @param userId
   * @param partnerId
   */
  private async getChatHistoryFromMongo(
    userId: string,
    partnerId: string,
    options: {
      offset: number;
      limit: number;
    },
  ) {
    const lastRedisEntry = await this.chatRepository
      .search()
      .where('senderId')
      .equals(userId)
      .and('receiverId')
      .equals(partnerId)
      .or((search) => {
        return search
          .where('senderId')
          .equals(partnerId)
          .and('receiverId')
          .equals(userId);
      })
      .sortAsc('dateSent')
      .return.first();

    const mongoChats = await ChatModel.find({
      dateSent: { $lt: lastRedisEntry?.toJSON().dateSent },
    })
      .skip(options.offset || 0)
      .limit(options.limit || 50)
      .sort({ dateSent: 1 });

    return mongoChats;
  }
}

export default new ChatHandler();
