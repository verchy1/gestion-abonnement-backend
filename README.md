# Gestion d'Abonnement - Backend

Backend Node.js/Express pour gérer les abonnements, utilisateurs, vendeurs et cartes prépayées.

## 🚀 Démarrage rapide

### Prérequis
- Node.js v16+ 
- MongoDB (local ou Atlas)
- npm ou yarn

### Installation

```bash
# Cloner le repo
git clone https://github.com/verchy1/gestion-abonnement-backend.git
cd gestion-abonnement-backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos variables
```

### Variables d'environnement (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/gestion_abonnement
JWT_SECRET=votre_clé_jwt_secrète_ici
NODE_ENV=development
```

### Lancer le serveur

**Mode développement (avec nodemon):**
```bash
npm run dev
```

**Mode production:**
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

---

## 📁 Structure du projet

```
backend/
├── models/              # Schémas Mongoose
│   ├── Admin.js        # Modèle administrateur
│   ├── Abonnement.js   # Modèle abonnement/service
│   ├── Utilisateurs.js # Modèle utilisateur
│   ├── Vendeur.js      # Modèle vendeur
│   ├── Carte.js        # Modèle carte prépayée
│   └── Paiement.js     # Modèle paiement
├── routes/             # Routes API
│   ├── auth.js         # Authentification
│   ├── abonnements.js  # Gestion abonnements
│   ├── utilisateurs.js # Gestion utilisateurs
│   ├── vendeurs.js     # Gestion vendeurs
│   ├── cartes.js       # Gestion cartes prépayées
│   └── paiements.js    # Gestion paiements
├── middleware/         # Middleware personnalisé
│   └── auth.js         # Vérification JWT
├── scripts/            # Scripts utilitaires
│   └── createAdmin.js  # Créer un admin initial
├── server.js           # Point d'entrée principal
├── .env.example        # Variables d'environnement exemple
└── package.json        # Dépendances
```

---

## 🔐 Authentification

### Endpoints d'authentification

**POST /api/auth/register**
- Crée un nouvel admin
- Body:
```json
{
  "identifiant": "admin",
  "motDePasse": "admin123",
  "nom": "Super Admin",
  "email": "admin@example.com"
}
```

**POST /api/auth/login**
- Connecte un admin et retourne un JWT
- Body:
```json
{
  "identifiant": "admin",
  "motDePasse": "admin123"
}
```
- Réponse:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "id": "...", "nom": "...", "email": "..." }
}
```

### Créer un admin initial

```bash
npm install # (si pas fait)
node scripts/createAdmin.js admin admin123 "Super Admin" obaverchy@gmail.com
```

---

## 📊 API Endpoints

Tous les endpoints (sauf `/api/auth/login` et `/api/auth/register`) nécessitent un header :
```
Authorization: Bearer <JWT_TOKEN>
```

### Abonnements

- **GET /api/abonnements** — Liste tous les abonnements
- **POST /api/abonnements** — Crée un abonnement
- **DELETE /api/abonnements/:id** — Supprime un abonnement

### Utilisateurs

- **GET /api/utilisateurs** — Liste tous les utilisateurs
- **POST /api/utilisateurs** — Crée un utilisateur
- **DELETE /api/utilisateurs/:id** — Supprime un utilisateur

### Vendeurs

- **GET /api/vendeurs** — Liste tous les vendeurs
- **POST /api/vendeurs** — Crée un vendeur
- **DELETE /api/vendeurs/:id** — Supprime un vendeur

### Cartes Prépayées

- **GET /api/cartes** — Liste toutes les cartes
- **POST /api/cartes** — Crée une carte
- **DELETE /api/cartes/:id** — Supprime une carte
- **POST /api/cartes/:id/abonnements** — Lie un abonnement à une carte

### Paiements

- **GET /api/paiements** — Liste tous les paiements
- **POST /api/paiements** — Crée un paiement
- **PATCH /api/paiements/:id** — Met à jour le statut de paiement

### Rappels d'abonnement

- **POST /api/reminders/check-expiring** — Vérifie manuellement les abonnements expirants et envoie des rappels
  - Body: `{ "daysBefore": 7 }` (optionnel, défaut 7 jours)
- **POST /api/reminders/test** — Test manuel du système de rappels

**Système automatique :**
- Les rappels sont envoyés automatiquement tous les jours à 9h00
- Les utilisateurs reçoivent un SMS 7 jours avant l'expiration de leur abonnement
- Le SMS contient les identifiants de connexion (email + mot de passe déchiffré)

---

## 🔧 Technos utilisées

- **Express.js** — Framework web
- **Mongoose** — ODM pour MongoDB
- **JWT** — Authentification par token
- **bcryptjs** — Hash de mots de passe
- **CORS** — Gestion des origines
- **dotenv** — Variables d'environnement
- **nodemon** — Auto-reload en dev

---

## 📝 Modèles de données

### Admin
```javascript
{
  identifiant: String (unique),
  motDePasse: String (hashé),
  nom: String,
  email: String,
  createdAt: Date
}
```

### Abonnement
```javascript
{
  nom: String,
  prix: Number,
  slots: Number,
  utilisesTotal: Number,
  emailService: String,
  description: String,
  createdAt: Date
}
```

### Utilisateur
```javascript
{
  nom: String,
  email: String,
  telephone: String,
  adresse: String,
  abonnement: ObjectId (ref: Abonnement),
  dateDebut: Date,
  dateFin: Date,
  statut: String (actif/inactif),
  createdAt: Date
}
```

### Carte Prépayée
```javascript
{
  code: String (unique),
  solde: Number,
  abonnements: [{
    service: String,
    emailService: String,
    dateFin: Date
  }],
  createdAt: Date
}
```

### Paiement
```javascript
{
  utilisateur: ObjectId,
  montant: Number,
  methode: String (carte/mobile-money),
  statut: String (en_attente/payé/échoué),
  dateTransaction: Date,
  createdAt: Date
}
```

---

## 🐛 Dépannage

**Erreur : "Cannot find module"**
- Assure-toi que `npm install` a été exécuté

**Erreur : "MongoParseError"**
- Vérifie ta variable `MONGODB_URI` dans `.env`
- Assure-toi que l'URI ne contient pas d'options invalides

**Erreur : "next is not a function"**
- Redémarre le serveur après chaque modification importante

---

## 📄 License

ISC

---

## 👨‍💻 Support

Pour des questions, ouvre une issue sur le repo GitHub.