import { Type, Static } from '@sinclair/typebox';

export const SearchResponseSchema = Type.Object({
  _id: Type.String(),
  type: Type.Enum({ user: 'user', chat: 'chat' }),
  text: Type.String(),
});

export const SearchRequestQuery = Type.Object({
  q: Type.String(),
});

export type SearchResponseSchemaType = Static<typeof SearchResponseSchema>;
export type SearchRequestQueryType = Static<typeof SearchRequestQuery>;
