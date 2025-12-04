const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  nom: {
    type: String,
    required: true,
    trim: true
  },
  telephone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  abonnementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Abonnement',
    required: true
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  montant: {
    type: Number,
    required: true
  },
  paye: {
    type: Boolean,
    default: false
  },
  datePaiement: {
    type: Date
  },
  methodePaiement: {
    type: String,
    enum: ['Mobile Money', 'Cash', 'Virement', 'Autre']
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
utilisateurSchema.index({ adminId: 1 });

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
