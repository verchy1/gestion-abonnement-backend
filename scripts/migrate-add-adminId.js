// scripts/migrate-add-adminId.js
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Abonnement = require('../models/Abonnement');
const Utilisateur = require('../models/Utilisateurs');
const Vendeur = require('../models/Vendeur');
const Carte = require('../models/Carte');
const Paiement = require('../models/Paiement');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });


async function migrate() {
 
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Récupérer le premier admin (ou créer un admin par défaut)
  let admin = await Admin.findOne();
  
  if (!admin) {
    console.log('Aucun admin trouvé. Création d\'un admin par défaut...');
    admin = await Admin.create({
      identifiant: 'admin',
      motDePasse: 'admin123',
      nom: 'Administrateur',
      email: 'admin@subsmanager.com'
    });
  }
  
  console.log(`Migration avec adminId: ${admin._id}`);
  
  // Mettre à jour tous les documents
  await Abonnement.updateMany({}, { adminId: admin._id });
  await Utilisateur.updateMany({}, { adminId: admin._id });
  await Vendeur.updateMany({}, { adminId: admin._id });
  await Carte.updateMany({}, { adminId: admin._id });
  await Paiement.updateMany({}, { adminId: admin._id });
  
  console.log('Migration terminée !');
  process.exit(0);
}

migrate().catch(console.error);