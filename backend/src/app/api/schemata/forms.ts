import { Static, Type } from '@sinclair/typebox';

export const SignupFormSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  username: Type.String(),
  password: Type.String({ minLength: 8 }),
});

export const LoginFormSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
});

export const StaticSecuritySchema = [
  {
    'x-api-key': [],
  },
];

export type SignupFormSchemaType = Static<typeof SignupFormSchema>;
export type LoginFormSchemaType = Static<typeof LoginFormSchema>;
