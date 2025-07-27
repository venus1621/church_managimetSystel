const mongoose = require('mongoose');

const deathSchema = new mongoose.Schema(
  {
    believer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Believer',
      required: [true, 'Believer ID is required'],
   
    },
    dateOfDeath: {
      type: Date,
      required: [true, 'Date of death is required'],
      validate: {
        validator: function (value) {
          return value <= Date.now();
        },
        message: 'Date of death cannot be in the future.',
      },
    },
    graveLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Atbiya', // Change to 'Atbiya' if needed
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
deathSchema.index({ dateOfDeath: -1 }); // Sort by date descending
deathSchema.index({ believer: 1 }); // Ensure one death per believer
deathSchema.index({ graveLocation: 1 }); // Optimize queries by grave location

// Middleware to update believer's status
deathSchema.pre('save', async function (next) {
  const Believer = require('../models/Believer'); // Adjust path
  const believer = await Believer.findById(this.believer);
  if (!believer) {
    return next(new Error('Invalid believer ID.'));
  }
  // Validate dateOfDeath against dateOfBirth
  if (believer.dateOfBirth && this.dateOfDeath < believer.dateOfBirth) {
    return next(new Error('Date of death cannot be before date of birth.'));
  }
  next();
});

deathSchema.post('save', async function (doc) {
  const Believer = require('../models/Believer'); // Adjust path
  await Believer.findByIdAndUpdate(doc.believer, {
    liveStatus: 'Deceased',
    death: doc._id,
  });
});

// Handle updates to death records
deathSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    const Believer = require('../models/Believer'); // Adjust path
    await Believer.findByIdAndUpdate(doc.believer, {
      liveStatus: 'Deceased',
      death: doc._id,
    });
  }
});

module.exports = mongoose.model('Death', deathSchema);