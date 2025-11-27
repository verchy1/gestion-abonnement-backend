const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true,
    enum: ['Netflix', 'Apple Music', 'Prime Video', 'Spotify', 'Disney+', 'YouTube Premium', 'Autre']
  },
  prix: {
    type: Number,
    required: true
  },
  slots: {
    type: Number,
    required: true,
    min: 1
  },
  utilises: {
    type: Number,
    default: 0
  },
  proprio: {
    type: String,
    enum: ['Moi', 'Vendeur'],
    default: 'Moi'
  },
  emailService: {
    type: String,
    required: true
  },
  vendeurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendeur',
    required: function () {
      return this.proprio === 'Vendeur';
    }
  },
  actif: {
    type: Boolean,
    default: true
  },
  credentials: {
    email: String,
    password: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Abonnement', abonnementSchema);