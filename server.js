const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

//Middlewares
const corsOptions = {
  origin: ['http://localhost:5173',],
  credentials: true
};

// const corsOptions = {
//   origin: ['https://subscmanager.netlify.app'],
//   credentials: true
// };

app.use(cors(corsOptions));
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/abonnements', require('./routes/abonnements'));
app.use('/api/utilisateurs', require('./routes/utilisateurs'));
app.use('/api/vendeurs', require('./routes/vendeur'));
app.use('/api/paiements', require('./routes/paiement'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/cartes', require('./routes/cartes'));
app.use('/api/admin', require('./routes/administrateur'));
app.use('/api/recu', require('./routes/recu'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Abonnements fonctionne !' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});