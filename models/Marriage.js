const mongoose = require('mongoose');

const marriageSchema = new mongoose.Schema(
  {
    husband: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Believer',
      required: [true, 'Husband is required'],
    },
    wife: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Believer',
      required: [true, 'Wife is required'],
    },
    marriageDate: {
      type: Date,
      required: [true, 'Marriage date is required'],
    },
    marriagePlace: {
      type: String,
      trim: true,
      minlength: [2, 'Marriage place must be at least 2 characters long'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    divorceDate: {
      type: Date,
    },
    divorceReason: {
      type: String,
      trim: true,
      minlength: [2, 'Divorce reason must be at least 2 characters long'],
    },
    churchOfMarriage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Atbiya', // Changed to Atbiya
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
marriageSchema.index({ husband: 1, wife: 1 }, { unique: true }); // Prevent duplicate marriages
marriageSchema.index({ marriageDate: -1 }); // Sort by marriage date descending
marriageSchema.index({ churchOfMarriage: 1 }); // Optimize queries by church

// Text index for searching
marriageSchema.index({
  marriagePlace: 'text',
  divorceReason: 'text',
});

// Middleware to validate divorce details
marriageSchema.pre('save', function (next) {
  if (this.divorceDate) {
    // Ensure divorceDate is after marriageDate
    if (this.divorceDate <= this.marriageDate) {
      return next(new Error('Divorce date must be after marriage date.'));
    }
    // Set isActive to false if divorceDate is provided
    this.isActive = false;
  }
  if (this.divorceReason && !this.divorceDate) {
    return next(new Error('Divorce reason requires a divorce date.'));
  }
  if (!this.isActive && !this.divorceDate) {
    return next(new Error('Inactive marriage requires a divorce date.'));
  }
  next();
});

// Middleware to validate updates
marriageSchema.pre('findOneAndUpdate', function (next) {
  const update = this._update;
  if (update.divorceDate) {
    if (update.divorceDate <= this._conditions.marriageDate) {
      return next(new Error('Divorce date must be after marriage date.'));
    }
    update.isActive = false; // Set isActive to false if divorceDate is updated
  }
  if (update.divorceReason && !update.divorceDate) {
    return next(new Error('Divorce reason requires a divorce date.'));
  }
  if (update.isActive === false && !update.divorceDate) {
    return next(new Error('Inactive marriage requires a divorce date.'));
  }
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Marriage', marriageSchema);