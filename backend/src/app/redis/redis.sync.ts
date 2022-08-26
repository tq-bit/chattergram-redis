import { FastifyInstance } from 'fastify';
import { DateTime } from 'luxon';

import { KEY_REDIS_TO_MONGO_SYNC } from '../config/redis.config';

import ChatModel from '../model/Chat.schema';
import UserModel from '../model/User.schema';

import { ChatRepository, client, UserRepository } from './redis.provider';

export async function syncRedisChatToMongo(lastSync: string | null) {
  if (!lastSync) {
    console.log(
      'No previous chat sync from Redis to MongoDB found. Attempting a full sync',
    );

    const allChatHistoryEntities = await ChatRepository.search().return.all();
    const fullChatHistory = allChatHistoryEntities.map((entity) =>
      entity.toJSON(),
    );
    if (fullChatHistory.length > 0) {
      await ChatModel.insertMany(fullChatHistory);
    }
  }

  if (lastSync) {
    console.log(`Last chat sync from Redis to MongoDB was at '${lastSync}'`);
    console.log(
      `Attempting to sync all chat entries that were made since then`,
    );

    const recentChatHistoryEntities = await ChatRepository.search()
      .where('dateSent')
      .gt(lastSync)
      .return.all();
    const recentChatHistory = recentChatHistoryEntities.map((entity) =>
      entity.toJSON(),
    );
    const recentChatHistoryLength = recentChatHistory.length;
    if (recentChatHistoryLength === 0) {
      console.log(`No chat entries were synchronized from Redis to MongoDB`);
      return;
    }
    await ChatModel.insertMany(recentChatHistory);
    console.log(
      `Synchronized ${recentChatHistoryLength} entries from Redis to MongoDB`,
    );
  }
}

export async function syncMongoChatHistoryToRedis() {
  const threeMonthsAgo = DateTime.local().minus({ months: 3 });
  const historyFromLastThreeMonths = await ChatModel.find({
    dateSent: { $gte: threeMonthsAgo },
  });

  const chatHistoryLength = historyFromLastThreeMonths.length;

  if (chatHistoryLength === 0) {
    console.log(`No chat entries were synchronized from MongoDB to Redis`);
    return;
  }

  console.log(
    `Synchronizing ${chatHistoryLength} chat entries from MongoDB to Redis`,
  );
  historyFromLastThreeMonths.forEach(async (historyItemDocument) => {
    const historyItem = historyItemDocument.toObject();

    await ChatRepository.createAndSave({
      ...historyItem,
      _id: historyItemDocument._id.toString(),
    });
  });
}

export async function syncMongoUsersToRedis() {
  const userDocuments = await UserModel.find();

  console.log(
    `Synchronizing ${userDocuments.length} users from MongoDB to Redis`,
  );

  userDocuments.forEach(async (userDocument) => {
    const userItem = userDocument.toObject();
    await UserRepository.createAndSave({
      ...userItem,
      _id: userDocument._id.toString(),
      online: false,
    });
  });
}

export async function performFullSynchronization() {
  const lastSync = await client.get(KEY_REDIS_TO_MONGO_SYNC);

  await syncRedisChatToMongo(lastSync);

  await client.execute(['flushall']);

  await Promise.all([syncMongoChatHistoryToRedis(), syncMongoUsersToRedis()]);
  client.set(KEY_REDIS_TO_MONGO_SYNC, DateTime.local().toString());

  await Promise.all([
    UserRepository.createIndex(),
    ChatRepository.createIndex(),
  ]);
}
