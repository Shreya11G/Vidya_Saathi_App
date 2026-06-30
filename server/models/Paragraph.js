import mongoose from 'mongoose';

const paragraphSchema = new mongoose.Schema(
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
      default: 'Untitled paragraph',
    },
    content: {
      type: String,
      required: [true, 'Paragraph content is required'],
      maxlength: [50000, 'Paragraph cannot exceed 50000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'paragraphs',
  }
);

paragraphSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Paragraph', paragraphSchema);
