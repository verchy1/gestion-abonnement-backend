const express = require("express");
const router = express.Router();

const { scheduleReminder } = require("../services/reminderService");
const { sendLoginCredentials } = require("../services/loginService");

// 📌 Route : Programmer un rappel
router.post("/rappel", async (req, res) => {
  try {
    const { phone, message, date } = req.body;

    if (!phone || !message || !date) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    scheduleReminder({ phone, message, date });
    res.json({ success: true, message: "Rappel programmé avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur création rappel" });
  }
});

// 📌 Route : Envoi identifiants
router.post("/identifiants", async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    if (!phone || !username || !password) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    const result = await sendLoginCredentials({
      phone,
      username,
      password
    });

    res.json({
      success: true,
      message: "Identifiants envoyés",
      result
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur envoi identifiants" });
  }
});

module.exports = router;
