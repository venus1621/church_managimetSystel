const mongoose = require('mongoose');

const atbiyaSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  address: {
    region: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    woreda: { type: String, trim: true },
    kebele: { type: String, trim: true }
  },
  contactPerson: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, trim: true }
  },
  under:{
     type: mongoose.Schema.Types.ObjectId,
        ref: 'WeredaBetekihinet',
        required: true
  }
  
}, {
  timestamps: true
});

// Indexes
atbiyaSchema.index({ name: 'text', 'address.region': 'text' });

const Atbiya = mongoose.model('Atbiya', atbiyaSchema);

module.exports = Atbiya;