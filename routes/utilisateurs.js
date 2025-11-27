const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Utilisateur = require('../models/Utilisateurs');
const Abonnement = require('../models/Abonnement');

// Récupérer tous les utilisateurs
router.get('/', auth, async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.find()
      .populate('abonnementId')
      .sort({ createdAt: -1 });
    res.json(utilisateurs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un utilisateur
router.post('/', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findById(req.body.abonnementId);
    
    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    if (abonnement.utilises >= abonnement.slots) {
      return res.status(400).json({ message: 'Plus de places disponibles' });
    }

    const utilisateur = new Utilisateur(req.body);
    await utilisateur.save();

    // Incrémenter le nombre de slots utilisés
    abonnement.utilises += 1;
    await abonnement.save();

    res.status(201).json(utilisateur);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error: error.message });
  }
});

// Modifier le statut de paiement
router.patch('/:id/paiement', auth, async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByIdAndUpdate(
      req.params.id,
      { 
        paye: req.body.paye,
        datePaiement: req.body.paye ? new Date() : null
      },
      { new: true }
    );
    res.json(utilisateur);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification', error: error.message });
  }
});

// Supprimer un utilisateur
router.delete('/:id', auth, async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByIdAndDelete(req.params.id);
    
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Décrémenter le nombre de slots utilisés
    await Abonnement.findByIdAndUpdate(utilisateur.abonnementId, {
      $inc: { utilises: -1 }
    });

    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression', error: error.message });
  }
});

module.exports = router;