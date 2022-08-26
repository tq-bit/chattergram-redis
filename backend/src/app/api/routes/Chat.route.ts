import { FastifyInstance, FastifyPluginCallback } from 'fastify';

import ChatHandler from '../../handler/Chat.handler';
import SecurityHandler from '../../handler/Security.handler';

import {
  UserChatSchema,
  UserChatSchemaType,
  StaticSecuritySchema,
  UserUploadResponseSchema,
  FileResponseSchemaType,
  FileResponseSchema,
  ChatRequestParams,
  ChatRequestQuery,
  FileRequestParams,
} from '../schemata';

const chatRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  opts: Record<never, never>,
  done: () => void,
) => {
  fastify.post('/upload', {
    schema: {
      security: StaticSecuritySchema,
      description: `Upload an audio file and receive a UUID back to add to the next client's \`/chat\` message. The file upload will be available for **${
        process.env.BACKEND_FILE_LIFESPAN
          ? +process.env.BACKEND_FILE_LIFESPAN / 1000
          : 60
      } seconds** to be processed.`,
      response: {
        200: UserUploadResponseSchema,
      },
    },
    preHandler: fastify.auth([SecurityHandler.authenticate]),
    handler: ChatHandler.uploadAudioFile,
  });

  fastify.post<{ Body: UserChatSchemaType; Reply: UserChatSchemaType }>(
    '/chat',
    {
      schema: {
        security: StaticSecuritySchema,
        description:
          "Create a new chat message. If you have uploaded an audio file before, you can use the returned `audioFileId` to trigger Deepgram's transcription flow.",
        body: UserChatSchema,
        response: {
          200: UserChatSchema,
        },
      },
      preHandler: fastify.auth([SecurityHandler.authenticate]),
      handler: ChatHandler.createChatEntry,
    },
  );

  fastify.get<{
    Params: ChatRequestParams;
    Querystring: ChatRequestQuery;
    Reply: UserChatSchemaType;
  }>('/chat/:partnerId', {
    schema: {
      security: StaticSecuritySchema,
      params: {
        partnerId: {
          type: 'string',
        },
      },
      description:
        'Gets the chat history for a chat partner from Redis.\n' +
        'If `offset` & `limit` are used, fetches history data from MongoDB instead.\n\n' +
        '**Note that Redis takes only the last three months of MongoDB chat history into account**',
      querystring: {
        offset: { type: 'number' },
        limit: { type: 'number' },
      },
      response: {
        200: {
          type: 'array',
          items: UserChatSchema,
        },
      },
    },
    preHandler: fastify.auth([SecurityHandler.authenticate]),
    handler: ChatHandler.getChatHistoryByReceiver,
  });

  fastify.get<{ Params: FileRequestParams; Reply: FileResponseSchemaType }>(
    '/file/:fileUuid',
    {
      schema: {
        security: StaticSecuritySchema,
        description:
          'Download an audio file that has been uploaded previously. Returns an object with file metadata and a base64 encoded string that represents the file binary.',
        params: {
          fileUuid: {
            type: 'string',
          },
        },
        response: {
          200: FileResponseSchema,
        },
      },
      preHandler: fastify.auth([SecurityHandler.authenticate]),
      handler: ChatHandler.getChatAudioByUuid,
    },
  );

  done();
};

export default chatRoutes;
