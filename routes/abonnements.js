const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Abonnement = require('../models/Abonnement');

// Récupérer tous les abonnements
router.get('/', auth, async (req, res) => {
  try {
    const abonnements = await Abonnement.find().populate('vendeurId');
    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un abonnement
router.post('/', auth, async (req, res) => {
  try {
    const abonnement = new Abonnement(req.body);
    await abonnement.save();
    res.status(201).json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error: error.message });
  }
});

// Modifier un abonnement
router.put('/:id', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }
    res.json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification', error: error.message });
  }
});

// Supprimer un abonnement
router.delete('/:id', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findByIdAndDelete(req.params.id);
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }
    res.json({ message: 'Abonnement supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression', error: error.message });
  }
});

module.exports = router;