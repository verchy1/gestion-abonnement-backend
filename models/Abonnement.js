const mongoose = require('mongoose');
const { encrypt } = require("../utils/encryption");

// Schéma pour un profil individuel
const profilSchema = new mongoose.Schema({
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
  codePIN: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 6
  },
  utilisateurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    default: null
  },
  avatar: {
    type: String,
    default: 'default'
  },
  estEnfant: {
    type: Boolean,
    default: false
  },
  dateAssignation: {
    type: Date,
    default: null
  }
}, { _id: true });

// Schéma principal Abonnement
const abonnementSchema = new mongoose.Schema({
  adminId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
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
  },
  profils: {
    type: [profilSchema],
    default: []
  }
}, { timestamps: true });

// Index pour optimiser les requêtes
abonnementSchema.index({ adminId: 1 });

// Middleware pour crypter le mot de passe
abonnementSchema.pre("save", async function () {
  if (this.isModified("credentials.password") && this.credentials.password) {
    this.credentials.password = encrypt(this.credentials.password);
  }
});

// Virtual pour calculer dynamiquement le nombre d'utilisés
abonnementSchema.virtual('utilises').get(function() {
  return this.profils.filter(p => p.utilisateurId !== null).length;
});

// Pour que les virtuals apparaissent dans JSON
abonnementSchema.set('toJSON', { virtuals: true });
abonnementSchema.set('toObject', { virtuals: true });

// ✅ MIDDLEWARE : Créer automatiquement les profils avec adminId
abonnementSchema.pre('save', async function() {
  // Si c'est un nouvel abonnement et qu'il n'y a pas de profils
  if (this.isNew && (!this.profils || this.profils.length === 0)) {
    this.profils = [];
    
    // Créer automatiquement les profils selon le nombre de slots
    for (let i = 1; i <= this.slots; i++) {
      this.profils.push({
        adminId: this.adminId, // ✅ IMPORTANT : Ajouter l'adminId
        nom: `Profil ${i}`,
        codePIN: Math.floor(1000 + Math.random() * 9000).toString(),
        utilisateurId: null,
        avatar: 'default',
        estEnfant: false
      });
    }
  }
});

// Méthode pour obtenir les profils disponibles
abonnementSchema.methods.getProfilsDisponibles = function() {
  return this.profils.filter(p => !p.utilisateurId);
};

// Méthode pour obtenir les profils occupés
abonnementSchema.methods.getProfilsOccupes = function() {
  return this.profils.filter(p => p.utilisateurId !== null);
};

module.exports = mongoose.model('Abonnement', abonnementSchema);