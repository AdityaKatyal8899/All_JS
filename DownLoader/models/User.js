const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  tokens: {
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    expiresIn: {
      type: Number,
      required: true
    },
    tokenExpiry: {
      type: Date,
      required: true
    }
  },
  profilePicture: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

// Method to check if token is expired
userSchema.methods.isTokenExpired = function() {
  return new Date() > this.tokens.tokenExpiry;
};

// Method to update tokens
userSchema.methods.updateTokens = function(accessToken, refreshToken, expiresIn) {
  this.tokens.accessToken = accessToken;
  this.tokens.refreshToken = refreshToken;
  this.tokens.expiresIn = expiresIn;
  this.tokens.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
