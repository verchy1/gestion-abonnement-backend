const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
   adminId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  abonnementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Abonnement',
    required: true
  },
  montant: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    default: 0
  },
  vendeurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendeur'
  },
  datePaiement: {
    type: Date,
    default: Date.now
  },
  methodePaiement: {
    type: String,
    enum: ['Mobile Money', 'Cash', 'Virement', 'Autre'],
    required: true
  },
  statut: {
    type: String,
    enum: ['En attente', 'Validé', 'Échoué'],
    default: 'Validé'
  },
  reference: {
    type: String
  }
}, { timestamps: true });

paiementSchema.index({ adminId: 1 });

module.exports = mongoose.model('Paiement', paiementSchema);