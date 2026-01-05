# Good Foods Backend

API backend pour l'application Good Foods avec système de gestion de restaurants, commandes et livraisons.

## 🚀 Démarrage Rapide

### Démarrage rapide
### Configuration Automatisée (Recommandé)
```bash
npm install
npm run setup  # Configuration interactive
npm run test:db
npm run migrate:up
npm start
```

### Configuration Manuelle
```bash
npm install
cp config-template.env .env  # Copier le template
# Éditer .env selon vos besoins
npm run test:db
npm run migrate:up
npm start
```

Si certaines collections sont vides après la première migration, relancez :
```bash
npm run migrate:up  # Une deuxième fois pour remplir les collections manquées
```

## ⚙️ Configuration de la Base de Données

### Variables d'Environnement
```env
MONGO_URI=mongodb://127.0.0.1:27017/good-foods
```

### Exemples
```env
# Local
MONGO_URI=mongodb://127.0.0.1:27017/good-foods

# Avec authentification
MONGO_URI=mongodb://user:password@localhost:27017/good-foods

# MongoDB Atlas
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/good-foods
```

## 📊 Migrations

Certaines migrations dépendent d'autres collections. Si des collections sont vides après `npm run migrate:up`, relancez simplement la commande.

### Commandes
```bash
npm run migrate:status   # Voir le statut
npm run migrate:up       # Exécuter les migrations
npm run migrate:down     # Annuler la dernière
npm run migrate:create   # Créer une nouvelle migration
```

**Note :** Certaines migrations dépendent d'autres collections. Si des collections sont vides après la première exécution, relancez simplement `npm run migrate:up`.

### Ordre des Dépendances

Les migrations sont exécutées dans cet ordre logique :

1. **Schémas de base** (currencies, languages, settings)
2. **Données de référence** (restaurants, taxes, catégories)
3. **Utilisateurs** (base pour tout le reste)
4. **Produits & Menus** (dépendent des restaurants/catégories)
5. **Drivers** (dépendent des utilisateurs)
6. **Commandes** (dépendent de users/restaurants/drivers/products/menus)
7. **Transactions & Earnings** (dépendent des commandes)
8. **Support & Notifications** (dépendent des données précédentes)
9. **Rapports** (dépendent de toutes les données)

## 🛠️ Scripts

```bash
npm run setup            # Configuration interactive de l'environnement
npm run test:db          # Test de connexion à la base de données
npm start                # Démarrage du serveur
npm run dev              # Mode développement (avec nodemon)
npm run migrate:status   # Statut des migrations
npm run migrate:up       # Exécuter les migrations
npm run migrate:down     # Annuler la dernière migration
npm run migrate:create   # Créer une nouvelle migration
```

## 🧪 Test de Connexion

```bash
npm run test:db
```

Ce script vérifie :
- ✅ Connexion à MongoDB
- 📊 Statistiques de la base
- 📋 Liste des collections
- 👤 Présence de l'utilisateur admin

## 📁 Structure du Projet

```
src/
├── config/
│   ├── db.js              # Configuration de la connexion MongoDB
│   └── i18n.js            # Configuration d'internationalisation
├── controllers/           # Contrôleurs des routes API
├── middleware/            # Middlewares personnalisés
├── models/               # Modèles Mongoose
├── routes/               # Définition des routes API
├── utils/                # Utilitaires
└── server.js             # Point d'entrée de l'application

migrations/               # Migrations de base de données
scripts/                  # Scripts utilitaires
config-template.env       # Template de configuration
render.yaml              # Configuration de déploiement Render
```

## 🔧 Dépannage

### Problèmes de Connexion MongoDB

1. **Vérifiez que MongoDB est démarré**
   ```bash
   sudo systemctl status mongod
   # ou sur macOS
   brew services list | grep mongodb
   ```

2. **Testez la connexion manuellement**
   ```bash
   mongosh "votre-mongo-uri"
   # ou avec mongo (ancienne version)
   mongo "votre-mongo-uri"
   ```

3. **Utilisez le script de test intégré**
   ```bash
   npm run test:db
   ```

4. **Vérifiez les variables d'environnement**
   - Assurez-vous que le fichier `.env` existe
   - Vérifiez que les credentials sont corrects
   - Pour MongoDB Atlas, assurez-vous que l'IP est autorisée

### Problèmes de Migrations

Si des collections sont vides après `npm run migrate:up`, relancez simplement la commande :
```bash
npm run migrate:up  # Les migrations manquées s'exécuteront
```

Pour les problèmes plus complexes :
```bash
npm run migrate:status   # Voir quelles migrations ont été exécutées
npm run migrate:down     # Annuler la dernière migration si nécessaire
```

### Erreurs Courantes

- **"User not found"** : Vérifiez que les migrations ont été exécutées et que l'utilisateur admin existe
- **"Connection refused"** : MongoDB n'est pas démarré ou l'URL est incorrecte
- **"Authentication failed"** : Credentials incorrects dans la configuration
- **"BSON version error"** : Problème de version de migrate-mongo (essayez `npm update migrate-mongo`)

## 🔒 Sécurité

- **Ne commitez jamais** le fichier `.env` avec des mots de passe réels
- Utilisez des variables d'environnement différentes pour chaque environnement
- Changez la clé JWT en production
- Utilisez des mots de passe forts pour MongoDB
- Restreignez l'accès IP sur MongoDB Atlas

## 🔧 Dépannage

### Problèmes de Connexion MongoDB

1. **Vérifiez que MongoDB est démarré**
   ```bash
   sudo systemctl status mongod
   ```

2. **Testez la connexion manuellement**
   ```bash
   mongosh "votre-mongo-uri"
   ```

3. **Vérifiez les variables d'environnement**
   ```bash
   npm run test:db
   ```

### Problèmes de Migrations

1. **Vérifiez le statut**
   ```bash
   npm run migrate:status
   ```

2. **Réinitialisez si nécessaire**
   ```bash
   # Supprimer la base de données
   # Puis relancer les migrations
   npm run migrate:up
   ```

## 📚 API Documentation

### Authentification
```
POST /api/auth/login
POST /api/auth/signup
```

### Utilisateurs
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Restaurants
```
GET    /api/resource/restaurants
POST   /api/resource/restaurants
GET    /api/resource/restaurants/:id
PUT    /api/resource/restaurants/:id
DELETE /api/resource/restaurants/:id
```

## 🚀 Déploiement

### Render (Configuration Incluse)

Le fichier `render.yaml` contient la configuration pour déployer automatiquement sur Render :

1. Connectez votre repository GitHub à Render
2. Render détectera automatiquement le fichier `render.yaml`
3. Configurez les variables d'environnement dans le dashboard Render
4. Le déploiement se fera automatiquement

### Variables d'Environnement pour le Déploiement

```env
NODE_ENV=production
MONGO_URI=votre-mongo-uri-production
JWT_SECRET=votre-cle-jwt-production
```

### Autres Plateformes

Pour Heroku, Railway, ou autres plateformes :
1. Copiez `config-template.env` vers `.env`
2. Ajustez les variables selon votre fournisseur de base de données
3. Configurez les variables d'environnement dans le dashboard de la plateforme

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Pushez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT.
