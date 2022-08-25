import mongoose from 'mongoose';

const chatFileSchema = new mongoose.Schema({
  audioFile: { type: String, required: true },
  audioFileUuid: { type: String, required: true },
  audioFileName: { type: String, required: true },
  audioFileMimetype: { type: String, required: true },
});

const ChatFileSchema = mongoose.model('File', chatFileSchema);

export default ChatFileSchema;
