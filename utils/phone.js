function normalizeCongoPhone(phone) {
  if (!phone) throw new Error("Numéro de téléphone manquant");

  // Supprimer espaces, tirets, parenthèses
  let cleaned = phone.replace(/[^\d]/g, "");

  // Supprimer + si présent
  if (cleaned.startsWith("242")) {
    return cleaned;
  }

  // Cas local : 06XXXXXXXX ou 05XXXXXXXX
  if (cleaned.length === 9 && cleaned.startsWith("0")) {
    return "242" + cleaned;
  }

  throw new Error("Numéro de téléphone invalide");
}

module.exports = { normalizeCongoPhone };
