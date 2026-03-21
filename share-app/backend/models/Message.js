import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: ''
  },
  isFile: {
    type: Boolean,
    default: false
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId, // GridFS file ID
  },
  fileName: String,
  fileSize: Number,
  fileType: String,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
