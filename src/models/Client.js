const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    formatted: {
      type: String,
      trim: true,
    },
    placeId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    raw: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    internalOwner: {
      type: String,
      required: true,
      trim: true,
    },
    contactType: {
      type: String,
      enum: ['client', 'provider'],
      required: true,
      default: 'client',
    },
    cuit: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    lastMarginPercentage: {
      type: Number,
      default: null,
    },
    primaryAddress: {
      type: addressSchema,
      default: null,
    },
    secondaryAddress: {
      type: addressSchema,
      default: null,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ fullName: 'text', shortName: 'text', cuit: 'text', firstName: 'text', lastName: 'text' });

clientSchema.virtual('displayName').get(function displayName() {
  if (this.shortName) {
    return this.shortName;
  }
  return this.fullName;
});

clientSchema.pre('validate', function updateDerivedNames(next) {
  if (!this.fullName && (this.firstName || this.lastName)) {
    this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }

  if (!this.shortName && this.fullName) {
    this.shortName = this.fullName;
  }

  next();
});

module.exports = mongoose.model('Client', clientSchema);
