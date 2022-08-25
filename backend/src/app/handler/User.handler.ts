import { FastifyReply } from 'fastify';
import Handler from '../base/Handler';
import UserModel from '../model/User.schema';
import { UserRepository } from '../redis/redis.provider';
import { AppRequest, UserSchemaType } from '../api/schemata';

class UserHandler extends Handler {
  constructor() {
    super('user');
  }

  public getUserList = async (req: AppRequest, reply: FastifyReply) => {
    const users = await UserRepository.search().return.all();
    return reply.send(users);
  };

  public getActiveUser = async (req: AppRequest, reply: FastifyReply) => {
    const { userId } = this.getSession(req);
    if (!userId) {
      return reply.badRequest(`Request did not contain a userId!`);
    }

    const user = await UserRepository.search()
      .where('_id')
      .eq(userId)
      .return.first();
    if (!user) {
      return reply.notFound(
        `No user maintained with ID ${userId}. This message might indicate that user is maintained in security, but not in user model`,
      );
    }
    return reply.send(user?.toJSON());
  };

  public updateActiveUser = async (req: AppRequest, reply: FastifyReply) => {
    const { userId } = this.getSession(req);
    const payload = req.body as UserSchemaType;
    const userEntry = await UserModel.findOne({ _id: userId });
    await userEntry?.updateOne(payload);
    return reply.send(userEntry);
  };
}

export default new UserHandler();
