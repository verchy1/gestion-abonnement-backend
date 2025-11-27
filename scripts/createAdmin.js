require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function run() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set in .env');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const identifiant = process.argv[2] || 'admin';
    const motDePasse = process.argv[3] || 'admin123';
    const nom = process.argv[4] || 'Super Admin';
    const email = process.argv[5] || 'admin@example.com';

    const existing = await Admin.findOne({ $or: [{ identifiant }, { email }] });
    if (existing) {
      console.log('⚠️ Admin déjà présent:', existing.identifiant);
      return process.exit(0);
    }

    const admin = new Admin({ identifiant, motDePasse, nom, email });
    await admin.save();
    console.log('✅ Admin créé:', identifiant);
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

run();
