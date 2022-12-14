import pino from 'pino';
import fastify from 'fastify';

import swaggerPlugin from 'fastify-swagger';
import sensiblePlugin from 'fastify-sensible';
import corsPlugin from 'fastify-cors';
import authPlugin from 'fastify-auth';
import multipartPlugin from 'fastify-multipart';

import searchRoutes from './api/routes/Search.route';
import userRoutes from './api/routes/User.route';
import securityRoutes from './api/routes/Security.route';
import chatRoutes from './api/routes/Chat.route';

const log = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
  },
});

const app = fastify({ logger: log });

app.register(swaggerPlugin, {
  exposeRoute: true,
  routePrefix: '/api/docs',
  swagger: {
    securityDefinitions: {
      'x-api-key': {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
      },
    },
  },
});

app.register(sensiblePlugin);
app.register(corsPlugin);
app.register(authPlugin);
app.register(multipartPlugin);

app.register(searchRoutes, { prefix: '/api' });
app.register(userRoutes, { prefix: '/api' });
app.register(securityRoutes, { prefix: '/api' });
app.register(chatRoutes, { prefix: '/api' });

export default app;
