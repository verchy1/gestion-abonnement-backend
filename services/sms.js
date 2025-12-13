// services/smsService.js
const axios = require("axios");

const MTN_SMS_URL = process.env.MTN_SMS_URL;
const MTN_TOKEN = process.env.MTN_TOKEN; // Toujours sécuriser dans .env

async function sendSMS({ message, receivers, sender = "OVFA" }) {
  try {
    const response = await axios.post(
      MTN_SMS_URL,
      {
        msg: message,
        sender,
        receivers
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${MTN_TOKEN}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erreur envoi SMS :", error.response?.data || error.message);
    throw new Error("Envoi SMS échoué");
  }
}

module.exports = { sendSMS };
