import { FastifyReply } from 'fastify';
import { SearchRequest } from '../api/schemata';
import Handler from '../base/Handler';

import { ChatRepository, UserRepository } from '../redis/redis.provider';

class SearchHandler extends Handler {
  constructor() {
    super('search');
  }

  public async queryRedisStore(req: SearchRequest, reply: FastifyReply) {
    const { q } = req.query;
    const chatResults = await ChatRepository.search()
      .where('text')
      .match(q)
      .return.all();
    const userResults = await UserRepository.search()
      .where('username')
      .match(q)
      .return.all();

    const chatResponse = chatResults.map((result) => ({
      type: 'chat',
      _id: result._id,
      text: result.text,
    }));

    const userResponse = userResults.map((result) => ({
      type: 'user',
      _id: result._id,
      text: result.username,
    }));

    reply.send([...userResponse, ...chatResponse]);
  }
}

export default new SearchHandler();
