// routes/abonnements.js
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

// Créer un abonnement (les profils seront créés automatiquement)
router.post('/', auth, async (req, res) => {
  try {
    // Retirez profils si envoyé
    const { profils, ...abonnementData } = req.body;
    
    const abonnement = new Abonnement(abonnementData);
    await abonnement.save();
    
    res.status(201).json(abonnement);
  } catch (error) {
    console.error('❌ Erreur création:', error); // DEBUG
    res.status(400).json({ 
      message: 'Erreur création', 
      error: error.message,
      details: error.errors // Erreurs de validation Mongoose
    });
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

// 🆕 GET - Récupérer les profils d'un abonnement
router.get('/:id/profils', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findById(req.params.id).populate('profils.utilisateurId', 'nom telephone');

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    res.json(abonnement.profils);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// 🆕 POST - Ajouter un profil manuellement
router.post('/:id/profils', auth, async (req, res) => {
  try {
    const { nom, codePIN, avatar, estEnfant } = req.body;


    if (!nom || !codePIN) {
      return res.status(400).json({ message: "Nom et code PIN requis" });
    }

    const abonnement = await Abonnement.findById(req.params.id);

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    // Vérifier si on peut ajouter un profil
    if (abonnement.profils.length >= abonnement.slots) {
      return res.status(400).json({ message: 'Nombre maximum de profils atteint' });
    }

    // Ajouter le profil
    abonnement.profils.push({
      nom: nom || `Profil ${abonnement.profils.length + 1}`,
      codePIN: codePIN || Math.floor(1000 + Math.random() * 9000).toString(),
      avatar: avatar || 'default',
      estEnfant: estEnfant || false
    });

    await abonnement.save();
    res.status(201).json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur ajout profil', error: error.message });
  }
});

// 🆕 PATCH - Modifier un profil
router.patch('/:id/profils/:profilId', auth, async (req, res) => {
  try {
    const { nom, codePIN, avatar, estEnfant } = req.body;

    const abonnement = await Abonnement.findById(req.params.id);

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    const profil = abonnement.profils.id(req.params.profilId);

    if (!profil) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    // Mettre à jour les champs
    if (nom) profil.nom = nom;
    if (codePIN) profil.codePIN = codePIN;
    if (avatar !== undefined) profil.avatar = avatar;
    if (estEnfant !== undefined) profil.estEnfant = estEnfant;

    await abonnement.save();
    res.json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification profil', error: error.message });
  }
});

// 🆕 PATCH - Assigner un profil à un utilisateur
router.patch('/:id/profils/:profilId/assigner', auth, async (req, res) => {
  try {
    const { utilisateurId } = req.body;

    const abonnement = await Abonnement.findById(req.params.id);

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    const profil = abonnement.profils.id(req.params.profilId);

    if (!profil) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    if (profil.utilisateurId) {
      return res.status(400).json({ message: 'Ce profil est déjà assigné' });
    }

    profil.utilisateurId = utilisateurId;
    profil.dateAssignation = new Date();
    abonnement.utilises = abonnement.profils.filter(p => p.utilisateurId).length;

    await abonnement.save();
    res.json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur assignation profil', error: error.message });
  }
});

// 🆕 PATCH - Libérer un profil
router.patch('/:id/profils/:profilId/liberer', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findById(req.params.id);

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    const profil = abonnement.profils.id(req.params.profilId);

    if (!profil) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    profil.utilisateurId = null;
    profil.dateAssignation = null;
    abonnement.utilises = abonnement.profils.filter(p => p.utilisateurId).length;

    await abonnement.save();
    res.json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur libération profil', error: error.message });
  }
});

// 🆕 DELETE - Supprimer un profil
router.delete('/:id/profils/:profilId', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findById(req.params.id);

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    const profil = abonnement.profils.id(req.params.profilId);

    if (!profil) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    if (profil.utilisateurId) {
      return res.status(400).json({
        message: 'Impossible de supprimer un profil assigné. Libérez-le d\'abord.'
      });
    }

    profil.remove();
    await abonnement.save();

    res.json({ message: 'Profil supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression profil', error: error.message });
  }
});

module.exports = router;