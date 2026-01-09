#!/bin/bash

# Script pour exécuter les migrations dans le bon ordre
# Ordre logique basé sur les dépendances

echo "=== Exécution des migrations dans l'ordre logique ==="

# 1. Schémas de base
echo "1. Schémas de base..."
npm run migrate:up -- 20250205175439-add-currency-schema.js
npm run migrate:up -- 20250205180321-add-language-schema.js
npm run migrate:up -- 20250205181432-add-setting-schema.js

# 2. Données de base
echo "2. Données de base..."
npm run migrate:up -- 20250217165651-add-initial-taxes.js
npm run migrate:up -- 20250220051939-add-categories.js
npm run migrate:up -- 20250219143260-add-service-modes.js

# 3. Modifications de structure
echo "3. Modifications de structure..."
npm run migrate:up -- 20250218102642-rename_defaultCurrency_to_currency.js
npm run migrate:up -- 20250218152915-add-currency-id-to-settings.js
npm run migrate:up -- 20250218172823-update-currency-structure-in-settings.js

# 4. Utilisateurs (base pour tout le reste)
echo "4. Utilisateurs..."
npm run migrate:up -- 20250303223322-add-user.js

# 5. Restaurants
echo "5. Restaurants..."
npm run migrate:up -- 20250214201648-add-restaurants.js

# 6. Produits et variants (avant menus et commandes)
echo "6. Produits et variants..."
npm run migrate:up -- 20250308094746-add-products.js
npm run migrate:up -- 20250326224749-create-variants-collection.js

# 7. Menus (dépend des produits)
echo "7. Menus..."
npm run migrate:up -- 20250326130667-create_menus_collection.js

# 8. Drivers
echo "8. Drivers..."
npm run migrate:up -- 20250316170917-create-drivers.js

# 9. Commandes (dépend de users, restaurants, drivers, products, menus)
echo "9. Commandes..."
npm run migrate:up -- 20250305141047-add-orders.js

# 10. Reviews (dépend de users, restaurants, orders)
echo "10. Reviews..."
npm run migrate:up -- 20250402045210-add-reviews-schema.js

# 11. Finances et transactions
echo "11. Finances et transactions..."
npm run migrate:up -- 20250327095236-create-earnings-collection.js
npm run migrate:up -- 20250327102910-create-transactions-collection.js
npm run migrate:up -- 20250327195351-create-timeslots-collection.js

# 12. Abonnements et supports
echo "12. Abonnements et supports..."
npm run migrate:up -- 20250327211555-create-subscriptions-collection.js
npm run migrate:up -- 20250328000020-create-customersupports-collection.js
npm run migrate:up -- 20250328003005-create-deliverysettings-collection.js

# 13. Paramètres d'application
echo "13. Paramètres d'application..."
npm run migrate:up -- 20250328123323-init-app-settings.js
npm run migrate:up -- 20250328150904-notification-setting-schema.js

# 14. Coupons et promotions
echo "14. Coupons et promotions..."
npm run migrate:up -- 20250401162023-add-coupons-schema.js
npm run migrate:up -- 20250401191834-add-paymentmethods-schema.js
npm run migrate:up -- 20250401200541-add-promotions-schema.js

# 15. Notifications
echo "15. Notifications..."
npm run migrate:up -- 20250402122615-add-notifications-schema.js

# 16. Reports
echo "16. Reports..."
npm run migrate:up -- 20250329202608-reports-collection.js
npm run migrate:up -- 20250329223920-salesreports-collection.js
npm run migrate:up -- 20250402165110-add-driverreports-schema.js
npm run migrate:up -- 20250402201028-add-restaurantreports-schema.js

echo "=== Toutes les migrations exécutées ==="
npm run migrate:status

