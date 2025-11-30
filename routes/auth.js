const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { identifiant, motDePasse } = req.body;

    const admin = await Admin.findOne({ identifiant }).select('+motDePasse');
    if (!admin) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const isMatch = await admin.comparePassword(motDePasse);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: admin._id, identifiant: admin.identifiant },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        identifiant: admin.identifiant,
        nom: admin.nom,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un admin (à utiliser une seule fois)
router.post('/register', async (req, res) => {
  try {
    const { identifiant, motDePasse, nom, email } = req.body;

    const existant = await Admin.findOne({ $or: [{ identifiant }, { email }] });
    if (existant) {
      return res.status(400).json({ message: 'Admin déjà existant' });
    }

  const admin = new Admin({ identifiant, motDePasse, nom, email });
  await admin.save();

    res.status(201).json({ message: 'Admin créé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
