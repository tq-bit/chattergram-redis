import fastJsonStringify from 'fast-json-stringify';
import { UserChatSchema, UserChatSchemaType } from '../api/schemata';

export const stringifyOnlineStatus = (payload: {
  _id: string;
  online: boolean;
}) => {
  const stringify = fastJsonStringify({
    type: 'object',
    properties: {
      _id: { type: 'string' },
      online: { type: 'boolean' },
    },
  });
  return stringify(payload);
};

export const stringifyUserChatSchemaType = (payload: UserChatSchemaType) => {
  const stringify = fastJsonStringify(UserChatSchema);
  return stringify(payload);
};
