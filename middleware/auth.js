const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: 'Admin non trouvé' });
    }

    req.admin = admin;
    req.admin.identifiant = admin.identifiant;
    next();
  } catch (error) {
    // Soit tu envoies la réponse directement
    res.status(401).json({ message: 'Token invalide', error: error.message });
    // — ou — 
    // next(error);  // si tu veux que ton gestionnaire global récupère l'erreur
  }
};
