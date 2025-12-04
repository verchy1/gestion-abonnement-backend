const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vendeur = require('../models/Vendeur');

// Récupérer tous les vendeurs
router.get('/', auth, async (req, res) => {
  try {
    const vendeurs = await Vendeur.find({ adminId: req.adminId }).sort({ createdAt: -1 });
    res.json(vendeurs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un vendeur
router.post('/', auth, async (req, res) => {
  try {
    const vendeur = new Vendeur({
      ...req.body,
      adminId: req.adminId
    });
    await vendeur.save();
    res.status(201).json(vendeur);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error: error.message });
  }
});

// Modifier un vendeur
router.put('/:id', auth, async (req, res) => {
  try {
    const vendeur = await Vendeur.findByOneAndUpdate(
      { _id: req.params.id, adminId: req.adminId },
      req.body,
      { new: true }
    );
    res.json(vendeur);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification', error: error.message });
  }
});

// Supprimer un vendeur
router.delete('/:id', auth, async (req, res) => {
  try {
    await Vendeur.findOneAndDelete({ _id: req.params.id, adminId: req.adminId });
    res.json({ message: 'Vendeur supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression', error: error.message });
  }
});

module.exports = router;