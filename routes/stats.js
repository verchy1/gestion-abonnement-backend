const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Utilisateur = require('../models/Utilisateurs');
const Paiement = require('../models/Paiement');
const Abonnement = require('../models/Abonnement');

// Statistiques du dashboard
router.get('/', auth, async (req, res) => {
  try {
    const totalUtilisateurs = await Utilisateur.countDocuments({ actif: true });
    const totalAbonnements = await Abonnement.countDocuments({ actif: true });
    
    // Revenus du mois en cours
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    
    const paiements = await Paiement.find({
      datePaiement: { $gte: debutMois },
      statut: 'Validé'
    });
    
    const revenusMois = paiements.reduce((acc, p) => acc + p.montant, 0);
    const commissionsTotal = paiements.reduce((acc, p) => acc + (p.commission || 0), 0);
    
    const paiementsEnAttente = await Utilisateur.countDocuments({ paye: false, actif: true });
    
    res.json({
      totalUtilisateurs,
      totalAbonnements,
      revenusMois,
      commissionsTotal,
      paiementsEnAttente
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
