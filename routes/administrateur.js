// routes/admin.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// GET - Récupérer le profil de l'admin connecté
router.get('/profile', auth, async (req, res) => {
  try {
    const admin = await Admin.findOne({ identifiant: req.admin.identifiant }).select('-motDePasse');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH - Mettre à jour le profil
router.patch('/profile', auth, async (req, res) => {
  try {
    const { nom, email, telephone } = req.body;
    
    // Validation
    if (!nom || !email) {
      return res.status(400).json({ 
        message: 'Le nom et l\'email sont requis' 
      });
    }

    // Vérifier si l'email existe déjà (pour un autre admin)
    if (email !== req.body.emailActuel) {
      const emailExists = await Admin.findOne({ 
        email, 
        _id: { $ne: req.adminId } 
      });
      
      if (emailExists) {
        return res.status(400).json({ 
          message: 'Cet email est déjà utilisé' 
        });
      }
    }

    // Mise à jour
    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      { nom, email, telephone },
      { new: true, runValidators: true }
    ).select('-motDePasse');

    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Cet email est déjà utilisé' 
      });
    }
    
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH - Changer le mot de passe
router.patch('/profile/password', auth, async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    // Validation
    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ 
        message: 'Les deux mots de passe sont requis' 
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ 
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Récupérer l'admin avec le mot de passe
    const admin = await Admin.findById(req.adminId).select('+motDePasse');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await admin.comparePassword(ancienMotDePasse);
    
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Ancien mot de passe incorrect' 
      });
    }

    // Mettre à jour le mot de passe
    admin.motDePasse = nouveauMotDePasse;
    await admin.save();

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;