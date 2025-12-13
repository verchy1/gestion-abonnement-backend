const axios = require("axios");
const https = require("https");
const { normalizeCongoPhone } = require("../utils/phone");

const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV !== "production" ? false : false
});

async function sendSMS({ receivers, message, sender = "OVFA" }) {
  const msg = message
  const normalizedPhone = normalizeCongoPhone(receivers);
  
  if (!/^2420[5-6]\d{7}$/.test(normalizedPhone)) {
    throw new Error("Numéro Congo invalide");
  }

  try {
    const res = await axios.post(
      process.env.MTN_SMS_URL,
      { receivers: normalizedPhone, msg, sender },
      {
        httpsAgent,
        timeout: 10000,
        headers: {
          Authorization: `${process.env.MTN_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data;
  } catch (err) {
    console.error("❌ SMS error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendSMS };
