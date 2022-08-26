import { FastifyInstance, FastifyPluginCallback } from 'fastify';

import UserHandler from '../../handler/User.handler';
import SecurityHandler from '../../handler/Security.handler';

import {
  StaticSecuritySchema,
  UserSchema,
  UserSchemaType,
  UserPublicSchema,
  UserPublicSchemaType,
} from '../schemata';

const userRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  opts: Record<never, never>,
  done: () => void,
) => {
  fastify.get<{ Reply: UserSchemaType[] }>('/user/list', {
    schema: {
      security: StaticSecuritySchema,
      description:
        'Get a list of all registered users. Returns an array of user items',
      response: {
        200: {
          type: 'array',
          items: UserPublicSchema,
        },
      },
    },
    preHandler: fastify.auth([SecurityHandler.authenticate]),
    handler: UserHandler.getUserList,
  });

  fastify.get<{ Reply: UserSchemaType }>('/user/me', {
    schema: {
      security: StaticSecuritySchema,
      description:
        'Get a list fo the currently active user. Returns a user item object',
      response: {
        200: UserSchema,
      },
    },
    preHandler: fastify.auth([SecurityHandler.authenticate]),
    handler: UserHandler.getActiveUser,
  });

  fastify.post<{ Body: UserPublicSchemaType; Reply: UserSchemaType }>(
    '/user/me',
    {
      schema: {
        security: StaticSecuritySchema,
        deprecated: true,
        description:
          "Update the currently active user. Deprecated for the sake of using Redis pub/sub functionality to update and propagate user's online stati",
        body: UserPublicSchema,
        response: {
          204: {},
        },
      },
      preHandler: fastify.auth([SecurityHandler.authenticate]),
      handler: UserHandler.updateActiveUser,
    },
  );
  done();
};

export default userRoutes;
