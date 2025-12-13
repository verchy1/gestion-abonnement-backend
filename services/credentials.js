const { sendSMS } = require("./sendSMS");
const { decrypt } = require("../utils/encryption");

async function sendCredentialsSMS(user, abonnement) {
  const password = decrypt(abonnement.credentials.password);

  const message =
`OVFA: Abonnement actif 🎉 
Service: ${abonnement.service}
Email: ${abonnement.credentials.email}
MDP: ${password}
Profil: ${abonnement.profils.find(p => p.utilisateurId.toString() === user._id.toString()).nom}
PIN: ${abonnement.profils.find(p => p.utilisateurId.toString() === user._id.toString()).codePIN}
Echeance: ${user.dateFin.toISOString().split('T')[0]}
Support: 0652547776`;

  await sendSMS({
    receivers: user.telephone,
    message
  });
}

module.exports = { sendCredentialsSMS };

