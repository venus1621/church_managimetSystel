const mongoose = require('mongoose');

const baptismSchema = new mongoose.Schema({
  believer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Believer',
    required: true
  },
  baptismDate: {
    type: Date,
    required: true
  },
  baptismChurch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Atbiya',
    required: true,
  },
  baptizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Believer',
  },
  christinaityparent: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Indexes
// baptismSchema.index({ believer: 1 }, { unique: true }); // ✅ Prevents duplicate baptism records
baptismSchema.index({ baptismDate: -1 });
baptismSchema.index({ baptizedBy: 1 });

const Baptism = mongoose.model('Baptism', baptismSchema);

module.exports = Baptism;
