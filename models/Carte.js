const mongoose = require('mongoose');

const abonnementSubSchema = new mongoose.Schema({
    service: { type: String, required: true },
    prixFournisseur: { type: Number, required: false, default: 0 }, // montant que TU payes réellement
    dateFin: { type: Date, required: true },
    emailService: { type: String }
}, { _id: false });

const carteSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    solde: { type: Number, required: true, default: 0 },
    abonnements: { type: [abonnementSubSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Carte', carteSchema);
