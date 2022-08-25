import mongoose from 'mongoose';

const securitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  password: { type: String, required: true },
});

const SecurityModel = mongoose.model('Security', securitySchema);

export default SecurityModel;
