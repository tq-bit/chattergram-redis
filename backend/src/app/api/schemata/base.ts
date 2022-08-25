import { FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';
import { SearchRequestQueryType } from './search';
import { UserChatSchemaType } from './user';

type HttpStatus = 200 | 201 | 204 | 400 | 404 | 500;

export type AppEventName = 'message';

export interface AppStandardResponseData {
  statusCode: HttpStatus;
  error?: string;
  msg?: string;
}

export interface AppRequestSession extends JwtPayload {
  userId?: string;
}

export interface AppRequest extends FastifyRequest {
  userSession?: AppRequestSession;
}

export interface ChatRequestParams {
  partnerId?: string;
}

export interface ChatRequestQuery {
  offset?: number;
  limit?: number;
}

export interface FileRequestParams {
  fileUuid: string | undefined;
}

export interface ChatRequest extends AppRequest {
  params: ChatRequestParams;
  query: ChatRequestQuery;
  body: UserChatSchemaType | unknown;
}

export interface SearchRequest extends AppRequest {
  query: SearchRequestQueryType;
}

export interface FileRequest extends AppRequest {
  params: FileRequestParams;
}
