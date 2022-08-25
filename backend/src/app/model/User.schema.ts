import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: { type: String, required: true },
  bio: { type: String },
});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
