import Redis from 'ioredis';

export const redisPublisherClient = new Redis({
  port: 6379,
  host: 'redis',
  db: 0,
});

export const redisSubscriberClient = new Redis({
  port: 6379,
  host: 'redis',
  db: 0,
});

export const APPLICATION_MESSAGE_SEPARATOR = '---';
export const KEY_REDIS_TO_MONGO_SYNC = 'last-redis-sync';

export enum ApplicationChannel {
  USER = 'application:users',
  MESSAGE = 'application:messages',
}
