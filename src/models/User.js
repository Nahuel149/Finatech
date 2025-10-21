const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['local', 'google'],
      required: true,
    },
    providerId: {
      type: String,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    providers: {
      type: [providerSchema],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verification: {
      token: String,
      expiresAt: Date,
    },
    passwordReset: {
      token: String,
      expiresAt: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastFailedLoginAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    twoFactor: {
      enabled: {
        type: Boolean,
        default: false,
      },
      secret: String,
      backupCodes: [String],
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.hasProvider = function hasProvider(provider) {
  return this.providers.some((item) => item.provider === provider);
};

userSchema.methods.addProvider = function addProvider(provider, providerId) {
  if (!this.hasProvider(provider)) {
    this.providers.push({ provider, providerId });
  }
};

userSchema.methods.primaryProvider = function primaryProvider() {
  return this.providers.length ? this.providers[0].provider : undefined;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
