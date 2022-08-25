import { Static, Type } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  _id: Type.String(),
  email: Type.String({ format: 'email' }),
  username: Type.String(),
  bio: Type.Optional(Type.String()),
});

export const UserPublicSchema = Type.Object({
  _id: Type.String(),
  username: Type.String(),
  bio: Type.Optional(Type.String()),
});

export const UserChatSchema = Type.Object({
  senderId: Type.String(),
  receiverId: Type.String(),
  audioFileId: Type.Optional(Type.String()),
  dateSent: Type.Optional(Type.String({ format: 'date' })),
  text: Type.Optional(Type.String()),
  confidence: Type.Optional(Type.Number()),
});

export const LoginResponseSchema = Type.Object({
  user: UserSchema,
  token: Type.String(),
});

export type UserSchemaType = Static<typeof UserSchema>;
export type UserPublicSchemaType = Static<typeof UserPublicSchema>;
export type UserChatSchemaType = Static<typeof UserChatSchema>;
export type LoginResponseSchemaType = Static<typeof LoginResponseSchema>;
