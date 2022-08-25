import mongoose from 'mongoose';

export async function connect() {
  await mongoose.connect(`mongodb://mongo/chattergram`);
}
