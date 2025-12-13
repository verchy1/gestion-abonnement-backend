// routes/abonnements.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Abonnement = require('../models/Abonnement');
const Carte = require('../models/Carte');
const { decrypt } = require("../utils/encryption");

//client

// Route publique pour récupérer les abonnements actifs (pour le client)
router.get('/public', async (req, res) => {
  try {
    const abonnements = await Abonnement.find({ actif: true })
      .sort({ createdAt: -1 });
    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});



///////////////////////////////////////////

// Récupérer tous les abonnements avec prix fournisseur des cartes
router.get('/', auth, async (req, res) => {
  try {
    const abonnements = await Abonnement.find({ adminId: req.adminId })
      .populate('vendeurId')
      .populate('profils.utilisateurId')
      .sort({ createdAt: -1 });

    const cartes = await Carte.find({ adminId: req.adminId });

    const data = abonnements.map(a => {
      let passwordDecrypted = null;

      if (a.credentials?.password) {
        try {
          passwordDecrypted = decrypt(a.credentials.password);
        } catch (err) {
          passwordDecrypted = null;
        }
      }

      let prixFournisseur = 0;

      for (const carte of cartes) {
        const abonnementCarte = carte.abonnements.find(
          ab => ab.service === a.service && ab.emailService === a.emailService && carte.adminId.toString() === req.adminId,
        );

        if (abonnementCarte && abonnementCarte.prixFournisseur) {
          prixFournisseur = abonnementCarte.prixFournisseur;
          break;
        }
      }

      return {
        ...a.toObject(),
        prixFournisseur,
        credentials: {
          email: a.credentials?.email || '',
          password: passwordDecrypted
        }
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un abonnement
router.post('/', auth, async (req, res) => {
  try {
    const abonnementData = {
      ...req.body,
      adminId: req.adminId,
    };

    const abonnement = new Abonnement(abonnementData);
    await abonnement.save();

    res.status(201).json(abonnement);
  } catch (error) {
    console.error('❌ Erreur création:', error);
    res.status(400).json({
      message: 'Erreur création',
      error: error.message,
      details: error.errors
    });
  }
});

// Récupérer un abonnement par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findOne({
      _id: req.params.id,
      adminId: req.adminId
    }).populate('vendeurId').populate('profils.utilisateurId');

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }
    res.json(abonnement);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Modifier un abonnement
router.put('/:id', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findOne({
      _id: req.params.id,
      adminId: req.adminId
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    // Validation : empêcher la réduction de slots sous le nombre utilisé
    if (req.body.slots !== undefined) {
      const utilises = abonnement.profils.filter(p => p.utilisateurId !== null).length;
      if (req.body.slots < utilises) {
        return res.status(400).json({
          message: `Impossible de réduire à ${req.body.slots} places. ${utilises} places sont déjà utilisées.`
        });
      }
    }

    const abonnementModifie = await Abonnement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('vendeurId').populate('profils.utilisateurId');

    res.json(abonnementModifie);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification', error: error.message });
  }
});

// Supprimer un abonnement
router.delete('/:id', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findOneAndDelete({
      _id: req.params.id,
      adminId: req.adminId
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    res.json({ message: 'Abonnement supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression', error: error.message });
  }
});

// GET - Récupérer les profils d'un abonnement
router.get('/:id/profils', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findOne({
      _id: req.params.id,
      adminId: req.adminId
    }).populate('profils.utilisateurId', 'nom telephone');

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    res.json(abonnement.profils);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST - Ajouter un profil manuellement
router.post('/:id/profils', auth, async (req, res) => {
  try {
    const { nom, codePIN, avatar, estEnfant } = req.body;

    if (!nom || !codePIN) {
      return res.status(400).json({ message: "Nom et code PIN requis" });
    }

    const abonnement = await Abonnement.findOne({ 
      _id: req.params.id, 
      adminId: req.adminId 
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    // Vérifier si on peut ajouter un profil
    if (abonnement.profils.length >= abonnement.slots) {
      return res.status(400).json({ message: 'Nombre maximum de profils atteint' });
    }

    // Ajouter le profil avec adminId
    abonnement.profils.push({
      adminId: req.adminId,
      nom,
      codePIN,
      avatar: avatar || 'default',
      estEnfant: estEnfant || false
    });

    await abonnement.save();
    await abonnement.populate('profils.utilisateurId');
    
    res.status(201).json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur ajout profil', error: error.message });
  }
});

// PATCH - Modifier un profil
router.patch('/:id/profils/:profilId', auth, async (req, res) => {
  try {
    const { nom, codePIN, avatar, estEnfant } = req.body;

    const abonnement = await Abonnement.findOne({
      _id: req.params.id, 
      adminId: req.adminId 
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    const profil = abonnement.profils.id(req.params.profilId);

    if (!profil) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    // Mettre à jour les champs
    if (nom !== undefined) profil.nom = nom;
    if (codePIN !== undefined) profil.codePIN = codePIN;
    if (avatar !== undefined) profil.avatar = avatar;
    if (estEnfant !== undefined) profil.estEnfant = estEnfant;

    await abonnement.save();
    await abonnement.populate('profils.utilisateurId');

    res.json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification profil', error: error.message });
  }
});

// PATCH - Assigner un profil à un utilisateur
router.patch('/:id/profils/:profilId/assigner', auth, async (req, res) => {
  try {
    const { utilisateurId } = req.body;

    if (!utilisateurId) {
      return res.status(400).json({ message: 'utilisateurId requis' });
    }

    const abonnement = await Abonnement.findOne({
      _id: req.params.id, 
      adminId: req.adminId 
    });

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

    await abonnement.save();
    await abonnement.populate('profils.utilisateurId');
    
    res.json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur assignation profil', error: error.message });
  }
});

// PATCH - Libérer un profil
router.patch('/:id/profils/:profilId/liberer', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findOne({
      _id: req.params.id,
      adminId: req.adminId
    });

    if (!abonnement) {
      return res.status(404).json({ message: 'Abonnement non trouvé' });
    }

    const profil = abonnement.profils.id(req.params.profilId);

    if (!profil) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    if (!profil.utilisateurId) {
      return res.status(400).json({ message: 'Ce profil n\'est pas assigné' });
    }

    // ✅ LIBÉRER le profil
    profil.utilisateurId = null;
    profil.dateAssignation = null;

    await abonnement.save();
    await abonnement.populate('profils.utilisateurId');

    res.json(abonnement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur libération profil', error: error.message });
  }
});

// DELETE - Supprimer un profil
router.delete('/:id/profils/:profilId', auth, async (req, res) => {
  try {
    const abonnement = await Abonnement.findOne({
      _id: req.params.id, 
      adminId: req.adminId 
    });

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

    // ✅ Utiliser pull au lieu de remove (deprecated)
    abonnement.profils.pull(req.params.profilId);
    await abonnement.save();

    res.json({ message: 'Profil supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression profil', error: error.message });
  }
});



module.exports = router;