import { FastifyInstance, FastifyPluginCallback } from 'fastify';
import SecurityHandler from '../../handler/Security.handler';
import {
  SignupFormSchema,
  SignupFormSchemaType,
  LoginResponseSchema,
  LoginResponseSchemaType,
  LoginFormSchema,
} from '../schemata';

const securityRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance<any, any, any, any, any>,
  opts: Record<never, never>,
  done: () => void,
) => {
  fastify.post<{ Body: SignupFormSchemaType; Reply: LoginResponseSchemaType }>(
    '/signup',
    {
      schema: {
        body: SignupFormSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
      handler: SecurityHandler.signup,
    },
  );

  fastify.post<{ Body: SignupFormSchemaType; Reply: LoginResponseSchemaType }>(
    '/login',
    {
      schema: {
        body: LoginFormSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
      handler: SecurityHandler.login,
    },
  );

  done();
};

export default securityRoutes;
