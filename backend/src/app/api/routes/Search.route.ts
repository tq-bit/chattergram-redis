import { FastifyInstance, FastifyPluginCallback } from 'fastify';

import SearchHandler from '../../handler/Search.handler';
import SecurityHandler from '../../handler/Security.handler';

import {
  StaticSecuritySchema,
  SearchResponseSchema,
  SearchRequestQueryType,
  SearchRequestQuery,
} from '../schemata';

const chatRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance<any, any, any, any, any>,
  opts: Record<never, never>,
  done: () => void,
) => {
  fastify.get<{
    Querystring: SearchRequestQueryType;
  }>('/search', {
    schema: {
      security: StaticSecuritySchema,
      querystring: SearchRequestQuery,
      description: `Execute a search query against the chat and user Redis store.`,
      response: {
        200: {
          type: 'array',
          items: SearchResponseSchema,
        },
      },
    },
    preHandler: fastify.auth([SecurityHandler.authenticate]),
    handler: SearchHandler.queryRedisStore,
  });

  done();
};

export default chatRoutes;
