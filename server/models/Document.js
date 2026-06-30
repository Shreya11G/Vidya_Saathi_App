import mongoose from 'mongoose';
import crypto from 'crypto';

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    originalFileName: {
      type: String,
      required: true,
    },
    storedFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'documents',
  }
);

documentSchema.index({ userId: 1, updatedAt: -1 });

documentSchema.statics.generateShareId = () => crypto.randomBytes(16).toString('hex');

// Fix legacy rows that stored shareId: null (breaks unique sparse index)
documentSchema.statics.fixNullShareIds = async function () {
  await this.updateMany({ shareId: null }, { $unset: { shareId: 1 } });
};

export default mongoose.model('Document', documentSchema);
