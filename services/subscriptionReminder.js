const Utilisateur = require("../models/Utilisateurs");
const { sendSMS } = require("./sendSMS");

async function sendExpirationReminders(daysBefore) {
  const today = new Date();
  const target = new Date();
  target.setDate(today.getDate() + daysBefore);

  const users = await Utilisateur.find({
    actif: true,
    dateFin: {
      $gte: today,
      $lte: target
    }
  }).populate("abonnementId");

  for (const user of users) {
    const msg = `
        ⏰ OVFA - Rappel

        Votre abonnement ${user.abonnementId.service}
        expire dans ${daysBefore} jour(s).

        Renouvelez pour éviter la coupure.
        Support : +242 06 525 47 76
    `;

    await sendSMS({
      receivers: user.telephone,
      message: msg
    });
  }

  return users.length;
}

module.exports = { sendExpirationReminders };
