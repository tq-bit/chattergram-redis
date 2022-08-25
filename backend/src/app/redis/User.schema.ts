import { Entity, Schema } from 'redis-om';

export interface UserEntity {
  _id: string;
  email: string;
  username: string;
  bio: string;
  online: boolean;
}

export class UserEntity extends Entity {}

const UserSchema = new Schema(UserEntity, {
  _id: { type: 'string' },
  email: { type: 'string' },
  username: { type: 'text' },
  bio: { type: 'text' },
  online: { type: 'boolean' },
});

export default UserSchema;
