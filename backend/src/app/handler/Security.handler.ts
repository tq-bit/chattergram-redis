import bcrypt from 'bcrypt';
import { FastifyReply } from 'fastify';
import jwt, { SignOptions } from 'jsonwebtoken';

import Handler from '../base/Handler';

import UserModel from '../model/User.schema';
import SecurityModel from '../model/Security.schema';
import { UserRepository } from '../redis/redis.provider';

import {
  UserSchemaType,
  LoginFormSchemaType,
  SignupFormSchemaType,
  AppRequest,
  AppRequestSession,
} from '../api/schemata';

class SecurityHandler extends Handler {
  secret: string;
  signOptions: SignOptions;
  saltRounds: number;
  constructor(signOptions?: SignOptions, saltRounds?: number) {
    super('security');
    this.secret = process.env.BACKEND_JWT_SECRET || 'supersecret456';
    this.signOptions = signOptions || {
      audience: 'deepgram-app',
      expiresIn: '4h',
    };
    this.saltRounds = saltRounds || 12;
  }

  public signup = async (req: AppRequest, reply: FastifyReply) => {
    const { email, password, username } = req.body as SignupFormSchemaType;
    const userExists = await this.handleDoubleUserCheck(username, email);
    if (userExists) {
      return reply.badRequest('User with this email or name already exists');
    }
    return await this.handleUserSignup(reply, username, email, password);
  };

  public login = async (req: AppRequest, reply: FastifyReply) => {
    const { email, password } = req.body as LoginFormSchemaType;
    const user = await this.handleUserExistsCheck(reply, email);
    if (user) {
      await this.handleUserCredentialsCheck(reply, user, password);
      return await this.handleUserLogin(reply, user);
    }
  };

  public authenticate = (
    req: AppRequest,
    reply: FastifyReply,
    done: () => void,
  ) => {
    try {
      const payload = this.extractJwtPayloadFromRequest(req);
      req.userSession = payload;
      done();
    } catch (error) {
      req.log.error(error);
      return reply.forbidden();
    }
  };

  private signJwt(payload: AppRequestSession) {
    return jwt.sign(payload, this.secret, this.signOptions);
  }

  public verifyJwt(token: string): AppRequestSession {
    return jwt.verify(token, this.secret) as AppRequestSession;
  }

  private extractJwtPayloadFromRequest(req: AppRequest): AppRequestSession {
    const token: string = (req.headers['x-api-key'] as string) || '';
    const payload = this.verifyJwt(token);
    return payload;
  }

  private handleDoubleUserCheck = async (username: string, email: string) => {
    const existingUser = await UserModel.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existingUser) {
      return true;
    }

    return false;
  };

  private handleUserExistsCheck = async (
    reply: FastifyReply,
    email: string,
  ): Promise<UserSchemaType | void> => {
    const existingUser = await UserModel.findOne({ email: email });
    if (!existingUser) {
      return reply.notFound('User - password combination not found');
    }
    return existingUser.toObject();
  };

  private handleUserCredentialsCheck = async (
    reply: FastifyReply,
    user: UserSchemaType,
    password: string,
  ) => {
    const authEntry = await SecurityModel.findOne({ userId: user._id });
    if (!authEntry) {
      return reply.internalServerError(
        'Consistency error: No auth entry found for user',
      );
    }
    const isPwMatch = this.comparePasswords(password, authEntry.password);
    if (!isPwMatch) {
      return reply.notFound('User - password combination not found');
    }
    return true;
  };

  private handleUserSignup = async (
    reply: FastifyReply,
    username: string,
    email: string,
    password: string,
  ) => {
    const newUserEntry = new UserModel({ username, email, bio: '' });
    const passwordHash = await this.encryptPassword(password);
    const newAuthEntry = new SecurityModel({
      userId: newUserEntry._id,
      password: passwordHash,
    });
    await newAuthEntry.save();
    await newUserEntry.save();
    await UserRepository.createAndSave({
      ...newUserEntry.toObject(),
      _id: newUserEntry.toObject()._id.toString(),
    });

    const token = this.signJwt({ userId: newUserEntry._id.toString() });
    return reply.send({ user: newUserEntry, token });
  };

  private handleUserLogin = async (
    reply: FastifyReply,
    user: UserSchemaType,
  ) => {
    const token = this.signJwt({ userId: user._id });
    return reply.send({ user, token });
  };

  private comparePasswords = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash);
  };

  private encryptPassword = async (password: string): Promise<string> => {
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  };
}

export default new SecurityHandler();
