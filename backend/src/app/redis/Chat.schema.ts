import { Entity, Schema } from 'redis-om';

export interface ChatEntity {
  _id: string;
  senderId: string;
  dateSent: string;
  audioFileId: string;
  text: string;
  confidence: string;
}

export class ChatEntity extends Entity {}

const ChatSchema = new Schema(ChatEntity, {
  _id: { type: 'string' },
  senderId: { type: 'string' },
  receiverId: { type: 'string' },
  dateSent: { type: 'date' },
  audioFileId: { type: 'string' },
  text: { type: 'text' },
  confidence: { type: 'number' },
});

export default ChatSchema;
