// scripts/fix-adminId.js

const mongoose = require('mongoose');
const Carte = require('../models/Carte');
const { ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  await Carte.updateMany(
    { "abonnements.adminId": { $exists: false } },
    { $set: { "abonnements.$[].adminId": new ObjectId("6928184168ce3ce1d330dccd") } }
  );

  console.log("Correction terminée !");
  process.exit();
})();
