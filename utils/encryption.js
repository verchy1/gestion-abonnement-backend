const crypto = require("crypto");

const ALGO = "aes-256-ctr";
const SECRET = process.env.CREDENTIALS_SECRET_KEY; // à mettre dans ton .env
const IV_LENGTH = 16;

// Chiffrer
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, SECRET, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Déchiffrer
function decrypt(hash) {
  const parts = hash.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const content = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(ALGO, SECRET, iv);

  const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
