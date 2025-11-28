const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Carte = require('../models/Carte');

// GET /api/cartes - liste toutes les cartes (protégé)
router.get('/', auth, async (req, res) => {
    try {
        const cartes = await Carte.find().sort({ createdAt: -1 });

        // Enrichir les cartes avec les emailService des abonnements
        const cartesEnrichies = await Promise.all(cartes.map(async (carte) => {
            const carteObj = carte.toObject();
            if (carteObj.abonnements && carteObj.abonnements.length > 0) {
                carteObj.abonnements = await Promise.all(carteObj.abonnements.map(async (abo) => {
                    if (!abo.emailService) {
                        const abonnement = await require('../models/Abonnement').findOne({ service: abo.service });
                        abo.emailService = abonnement?.emailService || 'N/A';
                    }
                    return abo;
                }));
            }
            return carteObj;
        }));

        res.json(cartesEnrichies);
    } catch (err) {
        console.error('Erreur GET /api/cartes', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST /api/cartes - créer une carte (protégé)
router.post('/', auth, async (req, res) => {
    try {
        const { code, solde, abonnements } = req.body;
        if (!code || typeof solde === 'undefined') {
            return res.status(400).json({ message: 'code et solde requis' });
        }

        // Vérifier unicité
        const exists = await Carte.findOne({ code });
        if (exists) return res.status(400).json({ message: 'Code de carte déjà existant' });

        const carte = new Carte({ code, solde: Number(solde) || 0, abonnements: abonnements || [] });
        await carte.save();
        res.status(201).json(carte);
    } catch (err) {
        console.error('Erreur POST /api/cartes', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// PATCH /api/cartes/:id/solde - modifier le solde d'une carte (protégé)
router.patch('/:id/solde', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { solde } = req.body;

        if (typeof solde === 'undefined') {
            return res.status(400).json({ message: 'Le nouveau solde est requis' });
        }

        const carte = await Carte.findById(id);
        if (!carte) return res.status(404).json({ message: 'Carte non trouvée' });

        carte.solde = Number(solde);
        await carte.save();

        res.json({ message: 'Solde mis à jour avec succès', carte });
    } catch (err) {
        console.error('Erreur PATCH /api/cartes/:id/solde', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// POST /api/cartes/:id/abonnements - lier un abonnement à une carte (protégé)
router.post('/:id/abonnements', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const { abonnementId, dateFin } = req.body;

        if (!abonnementId || !dateFin) {
            return res.status(400).json({ message: 'abonnementId et dateFin requis' });
        }

        const carte = await Carte.findById(id);
        if (!carte) return res.status(404).json({ message: 'Carte non trouvée' });

        // Récupérer l'emailService de l'abonnement
        const Abonnement = require('../models/Abonnement');
        const abonnement = await Abonnement.findById(abonnementId);
        if (!abonnement) return res.status(404).json({ message: 'Abonnement introuvable' });

        carte.abonnements.push({
            service: abonnement.service,
            emailService: abonnement.emailService,
            dateFin: new Date(dateFin)
        });

        await carte.save();
        res.status(201).json(carte);
    } catch (err) {
        console.error('Erreur POST /api/cartes/:id/abonnements', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE /api/cartes/:id/abonnements/:index - supprimer un abonnement d'une carte (protégé)
router.delete('/:id/abonnements/:index', auth, async (req, res) => {
    try {
        const { id, index } = req.params;
        const abonnementIndex = parseInt(index, 10);

        if (isNaN(abonnementIndex) || abonnementIndex < 0) {
            return res.status(400).json({ message: 'Index d\'abonnement invalide' });
        }

        const carte = await Carte.findById(id);
        if (!carte) return res.status(404).json({ message: 'Carte non trouvée' });

        if (!carte.abonnements || abonnementIndex >= carte.abonnements.length) {
            return res.status(404).json({ message: 'Abonnement non trouvé à cet index' });
        }

        // Supprimer l'abonnement à l'index spécifié
        carte.abonnements.splice(abonnementIndex, 1);
        await carte.save();

        res.json({ message: 'Abonnement supprimé avec succès', carte });
    } catch (err) {
        console.error('Erreur DELETE /api/cartes/:id/abonnements/:index', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

// DELETE /api/cartes/:id - supprimer une carte (protégé)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const carte = await Carte.findByIdAndDelete(id);
        if (!carte) return res.status(404).json({ message: 'Carte non trouvée' });
        res.json({ message: 'Carte supprimée' });
    } catch (err) {
        console.error('Erreur DELETE /api/cartes/:id', err);
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

module.exports = router;