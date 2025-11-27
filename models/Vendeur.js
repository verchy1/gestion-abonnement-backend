const mongoose = require('mongoose');

const vendeurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  commission: {
    type: Number,
    default: 500
  },
  actif: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Vendeur', vendeurSchema);
