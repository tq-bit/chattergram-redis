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
  fastify: FastifyInstance,
  opts: Record<never, never>,
  done: () => void,
) => {
  fastify.get<{
    Querystring: SearchRequestQueryType;
  }>('/search', {
    schema: {
      security: StaticSecuritySchema,
      querystring: SearchRequestQuery,
      description: `Run a search query against the chat and user Redis repository. Returns an array of result items`,
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
