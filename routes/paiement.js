const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Paiement = require('../models/Paiement');

// Récupérer tous les paiements
router.get('/', auth, async (req, res) => {
  try {
    const paiements = await Paiement.find({ adminId: req.adminId })
      .populate('utilisateurId')
      .populate('abonnementId')
      .populate('vendeurId')
      .sort({ createdAt: -1 });
    res.json(paiements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un paiement
router.post('/', auth, async (req, res) => {
  try {
    const paiement = {
      ...req.body,
      adminId: req.adminId
    };
    const newPaiement = new Paiement(paiement);
    await newPaiement.save();
    res.status(201).json(paiement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error: error.message });
  }
});

module.exports = router;