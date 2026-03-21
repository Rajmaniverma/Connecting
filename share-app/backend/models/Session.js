import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 12
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) // Expires in 24 hours
  }
}, { timestamps: true });

// TTL index for automatic expiration
sessionSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
