const mongoose = require('mongoose')

const fileRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = anonymous
  },
  sessionId: { type: String, default: null },
  tool: { type: String, required: true },
  category: {
    type: String,
    enum: ['organize', 'security', 'convert', 'edit', 'ai'],
    default: 'organize',
  },
  filename: { type: String, required: true },
  outputFilename: { type: String, default: null },
  inputPath: { type: String, required: true },
  outputPath: { type: String, default: null },
  size: { type: Number, default: 0 },
  outputSize: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  error: { type: String, default: null },
  options: { type: mongoose.Schema.Types.Mixed, default: {} },
  outputAvailable: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  },
  jobId: { type: String, default: null },
}, {
  timestamps: true,
})

// Auto-expire documents
fileRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
fileRecordSchema.index({ userId: 1, createdAt: -1 })
fileRecordSchema.index({ status: 1 })

module.exports = mongoose.model('FileRecord', fileRecordSchema)
