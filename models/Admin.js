const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  identifiant: {
    type: String,
    required: [true, 'L\'identifiant est requis'],
    unique: true,
    trim: true,
    lowercase: true
  },
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  telephone: {
    type: String,
    trim: true
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'super-admin'],
    default: 'admin'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  derniereConnexion: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash du mot de passe avant sauvegarde
// Utiliser un hook async sans `next` pour éviter l'erreur "next is not a function"
adminSchema.pre('save', async function () {
  if (!this.isModified('motDePasse')) return;
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
});

// Méthode pour comparer les mots de passe
adminSchema.methods.comparePassword = async function (motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};
// Méthode pour proteger les donneer plus precisement le mot de passe
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.motDePasse;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);