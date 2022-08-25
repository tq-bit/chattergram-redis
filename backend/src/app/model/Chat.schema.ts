import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  dateSent: { type: Date, default: Date.now },
  audioFileId: { type: String, default: '' },
  text: { type: String, default: '' },
  confidence: { type: Number },
});

const ChatModel = mongoose.model('Chat', chatSchema);

export default ChatModel;
