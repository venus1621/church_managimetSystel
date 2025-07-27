const mongoose = require('mongoose');

const WeredaBetekihinetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long'],
      unique: true, // Ensure unique names
    },
    address: {
      region: { type: String, required: [true, 'Region is required'], trim: true },
      zone: { type: String, required: [true, 'Zone is required'], trim: true },
      woreda: { type: String, required: [true, 'Woreda is required'], trim: true },
      kebele: { type: String, required: [true, 'Kebele is required'], trim: true },
    },
  },
  {
    timestamps: true, // Add createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for searching
WeredaBetekihinetSchema.index({
  name: 'text',
  'address.region': 'text',
  'address.zone': 'text',
  'address.woreda': 'text',
  'address.kebele': 'text',
});

// Index for performance on queries
WeredaBetekihinetSchema.index({ 'address.region': 1, 'address.zone': 1, 'address.woreda': 1 });

module.exports = mongoose.model('WeredaBetekihinet', WeredaBetekihinetSchema);