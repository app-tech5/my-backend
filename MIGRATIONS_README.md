# Migrations Guide

## 🛡️ Migrations Sécurisées

Ce projet contient uniquement des migrations **structurelles et sécurisées**. Toutes les données de développement/test ont été supprimées.

## 📁 Migrations Incluses

### Structure de Base (01-07)
- `01-create-currency-schema.js` : Schéma des devises
- `02-create-language-schema.js` : Schéma des langues
- `03-create-settings-schema.js` : Paramètres de l'application
- `04-create-taxes-schema.js` : Configuration des taxes
- `05-create-categories-schema.js` : Catégories de produits
- `06-create-service-modes.js` : Modes de service (livraison, à emporter)
- `07-init-app-settings.js` : Initialisation des paramètres

### Collections (08, 20250127000000)
- `08-create-cart-collection.js` : Collection des paniers avec validation
- `20250127000000-create-cart-collection.js` : Collection des paniers (version alternative)

### Administration (09)
- `09-create-admin-user.js` : **OPTIONNEL** - Crée un utilisateur admin de base

## 🚀 Utilisation

### Installation Complète
```bash
npx migrate-mongo up
```

### Installation sans Admin (Recommandé)
```bash
# Appliquer toutes les migrations sauf l'admin
npx migrate-mongo up 08-create-cart-collection.js
npx migrate-mongo up 20250127000000-create-cart-collection.js
```

### Créer un Admin Personnalisé (Après Installation)
```bash
npx migrate-mongo up 09-create-admin-user.js
# Puis changez immédiatement le mot de passe dans votre application !
```

## ⚠️ Points Importants

1. **Mot de Passe Admin** : Si vous utilisez `09-create-admin-user.js`, changez le mot de passe immédiatement via l'interface admin.

2. **Données de Test** : Aucune donnée de test n'est incluse. Vous devrez créer vos propres utilisateurs, restaurants, et produits.

3. **Collections Vides** : Les collections seront créées vides et prêtes à recevoir vos données.

## 🔧 Personnalisation

Vous pouvez modifier `09-create-admin-user.js` pour :
- Changer l'email admin
- Modifier le nom d'utilisateur
- Ajuster les informations de base

## 📊 État des Migrations

Vérifiez l'état avec :
```bash
npx migrate-mongo status
```

Toutes les migrations sont maintenant sûres à partager avec les acheteurs ! 🎉
