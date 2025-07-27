const mongoose = require('mongoose');

const believerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
    },
    grandfatherName: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: [true, 'Gender is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: function (value) {
          return value <= Date.now();
        },
        message: 'Date of birth cannot be in the future.',
      },
    },
    christianityName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    educationLevel: {
      type: String,
      enum: [
        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
        'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
        'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College',
      ],
    },
    role: {
      type: String,
      enum: [
        'Admin', 'Priest', 'Deacon', 'Choir Member',
        'Sunday School Student', 'Sunday School Teacher',
        'Treasurer', 'Secretary', 'Member', 'Guest',
      ],
      default: 'Member',
      required: [true, 'Role is required'],
    },
    liveStatus: {
      type: String,
      enum: ['Active', 'Deceased', 'Transfer'],
      default: 'Active',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?\d{10,15}$/, 'Please enter a valid phone number'],
      sparse: true,
    },
    emergencyPhone: {
      type: String,
      trim: true,
      match: [/^\+?\d{10,15}$/, 'Please enter a valid emergency phone number'],
    },
    atbiya: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Atbiya',
    },
    motherName: {
      type: String,
      trim: true,
    },
    motherFatherName: {
      type: String,
      trim: true,
    },
    soulFatherName: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          return /^https?:\/\/.*/.test(val);
        },
        message: 'Invalid photo URL format',
      }
    },
    death: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Death',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for search
believerSchema.index({
  firstName: 'text',
  fatherName: 'text',
  grandfatherName: 'text',
});


believerSchema.index({ atbiya: 1 });

// Virtual for full name
believerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.fatherName ? this.fatherName + ' ' : ''}${this.grandfatherName || ''}`.trim();
});

// Virtual for age
believerSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

module.exports = mongoose.model('Believer', believerSchema);
