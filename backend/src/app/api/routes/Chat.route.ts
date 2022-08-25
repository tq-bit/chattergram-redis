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
  fastify: FastifyInstance<any, any, any, any, any>,
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
