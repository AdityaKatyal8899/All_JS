const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['video', 'audio'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  youtubeUrl: {
    type: String,
    required: true
  },
  youtubeTitle: {
    type: String
  },
  youtubeThumbnail: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
downloadSchema.index({ userId: 1 });
downloadSchema.index({ status: 1 });
downloadSchema.index({ expiresAt: 1 });

// Method to check if file is expired
downloadSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to get file size in human readable format
downloadSchema.methods.getFileSizeFormatted = function() {
  if (!this.fileSize) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Pre-save middleware to set expiry date
downloadSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    const expiryHours = parseInt(process.env.FILE_EXPIRY_HOURS) || 24;
    this.expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Download', downloadSchema);
