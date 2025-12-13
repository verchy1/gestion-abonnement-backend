const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Paiement = require('../models/Paiement');
const axios = require("axios");
require("dotenv").config();
const https = require("https");
const qs = require("qs");

const agent = new https.Agent({
  family: 4 // ⛔ bloque IPv6
});

// Récupérer tous les paiements
router.get('/', auth, async (req, res) => {
  try {
    const paiements = await Paiement.find({ adminId: req.adminId })
      .populate('utilisateurId')
      .populate('abonnementId')
      .populate('vendeurId')
      .sort({ createdAt: -1 });
    res.json(paiements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un paiement
router.post('/', auth, async (req, res) => {
  try {
    const paiement = {
      ...req.body,
      adminId: req.adminId
    };
    const newPaiement = new Paiement(paiement);
    await newPaiement.save();
    res.status(201).json(paiement);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error: error.message });
  }
});

// Endpoint pour l'achat d'un abonnement - initiation du paiement
router.post('/achat-abonnement', async (req, res, next) => {

  const { amount, methodPay, phone } = req.body;// Récupérer les données envoyées par le client
  console.log(amount, methodPay);

  // Liste des méthodes de paiement acceptées
  const validPaymentMethods = ["MTN MONEY", "AIRTEL MONEY"];

  if (!amount || isNaN(amount) || amount <= 0) {
    return next(new AppError("Le montant est invalide.", 400))
  }

  if (!methodPay || typeof methodPay !== "string" || !validPaymentMethods.includes(methodPay)) {
    return next(new AppError("Méthode de paiement invalide.", 400))
  }

  let operator = methodPay
  if (operator === "MTN MONEY") {
    operator = "CG_MTNMOBILEMONEY"
  } else if (operator === "AIRTEL MONEY") {
    operator = "CG_AIRTELMONEY"
  }

  const payload = {
    service: process.env.MONETBIL_KEY,
    phonenumber: phone,
    amount: amount,
    country: "CG", // Par défaut : Congo-Brazzaville
    currency: "XAF",
    operator: operator
  };

  const response = await axios.post(
    process.env.PLACEMENT_PAIEMENT_URL,
    payload,
    {
      httpsAgent: agent,
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.data.status === "REQUEST_ACCEPTED") {
    res.status(200).json({
      success: true,
      message: "Paiement en attente...",
      paymentId: response.data.paymentId, // ID de la transaction
      payment_url: response.data.payment_url, // URL de paiement si disponible
    });
  } else {
    return next(new AppError(response.data.message, 400))
  }
});

// Vérification du statut du paiement
router.post('/verifier-paiement', async (req, res, next) => {
  const { paymentId, amount } = req.body;

  if (!paymentId) {
    return next(new AppError("L'ID de paiement est requis.", 400))
  }

  const payload = {
    service: process.env.MONETBIL_KEY,
    paymentId: paymentId
  };

  try {
    const response = await axios.post(
      process.env.CHECK_PAIEMENT,
      payload,
      {
        httpsAgent: agent,
        timeout: 15000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.transaction.status === 1) {
      res.status(200).json({
        success: true,
        message: "Paiement réussi.",
        details: response.data
      });

      try {
        const FRAIS_RETRAIT = 50;

        if (amount <= FRAIS_RETRAIT) {
          throw new Error("Solde insuffisant pour effectuer le retrait");
        }

        const montantRetrait = amount - FRAIS_RETRAIT;

        const payloadRetrait = {
          service_key: process.env.MONETBIL_KEY,
          service_secret: process.env.MONETBIL_SECRET,
          phonenumber: "242065254776", // Numéro du compte marchand
          amount: montantRetrait,
          country: "CG",
          currency: "XAF",
          operator: "CG_MTNMOBILEMONEY"
        };

        const response = await axios.post(
          process.env.WITHDRAWAL_URL,
          qs.stringify(payloadRetrait),
          {
            timeout: 15000,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          }
        );

      } catch (error) {
        console.error(
          "Erreur lors du retrait :",
          error.response?.data || error.message
        );
      }

    } else {
      res.status(200).json({
        success: false,
        message: "Paiement non encore complété.",
        details: response.data
      });
    }
  } catch (error) {
    return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification du paiement.",
        details: error.response?.data || error.message
      });
  }
});

module.exports = router;