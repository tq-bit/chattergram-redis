import { Client } from 'redis-om';
import ChatSchema from './Chat.schema';
import UserSchema from './User.schema';

// Instantiate central client
export const client = new Client();
client.open('redis://redis:6379');

// Provide repositories
export const ChatRepository = client.fetchRepository(ChatSchema);
export const UserRepository = client.fetchRepository(UserSchema);

// Create indicies
export async function createRedisIndexes() {
  await ChatRepository.createIndex();
  await UserRepository.createIndex();
}
