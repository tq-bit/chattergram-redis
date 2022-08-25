import { EventEmitter } from 'events';
import {
  redisPublisherClient,
  ApplicationChannel,
} from '../config/redis.config';
import { AppRequest, AppRequestSession } from '../api/schemata';

export default class Handler extends EventEmitter {
  namespace: string;
  constructor(namespace: string) {
    super();
    this.namespace = namespace;
  }

  public getSession(req: AppRequest): AppRequestSession {
    const hasUserSession = !!req.userSession;

    if (hasUserSession) {
      return req.userSession as AppRequestSession;
    }

    throw new Error('No user session found in request');
  }

  public publishMessage(redisChannel: ApplicationChannel, message: any) {
    redisPublisherClient.publish(redisChannel, message);
  }
}
