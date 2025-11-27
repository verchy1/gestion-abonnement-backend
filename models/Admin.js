const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  identifiant: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  motDePasse: {
    type: String,
    required: true
  },
  nom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    default: 'admin'
  }
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
// Utiliser un hook async sans `next` pour éviter l'erreur "next is not a function"
adminSchema.pre('save', async function() {
  if (!this.isModified('motDePasse')) return;
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
});

// Méthode pour comparer les mots de passe
adminSchema.methods.comparePassword = async function(motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};

module.exports = mongoose.model('Admin', adminSchema);
