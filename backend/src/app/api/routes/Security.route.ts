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
  fastify: FastifyInstance,
  opts: Record<never, never>,
  done: () => void,
) => {
  fastify.post<{ Body: SignupFormSchemaType; Reply: LoginResponseSchemaType }>(
    '/signup',
    {
      schema: {
        body: SignupFormSchema,
        description:
          'Create a new user within the `Security` and `User` entity. Returns an object with the newly created user and a JWT.',
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
        description:
          'Handle the login workflow for the actuve user. Returns an object with the newly created user and a JWT.',
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
