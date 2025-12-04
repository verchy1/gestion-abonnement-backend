const mongoose = require('mongoose');

const vendeurSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
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

// 🆕 Index pour optimiser les requêtes
vendeurSchema.index({ adminId: 1 });

module.exports = mongoose.model('Vendeur', vendeurSchema);
