# Sauvegardes des Collections

Ce dossier contient les sauvegardes automatiques des collections MongoDB.

## Scripts disponibles

### Sauvegarde
```bash
# Sauvegarder les collections users et restaurants
node scripts/backup-collections.js
```

### Restauration
```bash
# Restaurer depuis une sauvegarde spécifique
node scripts/restore-collections.js 2024-01-15T10-30-00
```

## Format des fichiers

Les sauvegardes sont nommées selon le format :
- `backup-{timestamp}-users.json`
- `backup-{timestamp}-restaurants.json`

Où `{timestamp}` est au format `YYYY-MM-DDTHH-MM-SS`.

## Exemples d'utilisation

### Sauvegarde complète
```bash
cd /path/to/backend
node scripts/backup-collections.js
```

### Restauration après erreur
```bash
# Lister les sauvegardes disponibles
ls -la backups/

# Restaurer la dernière sauvegarde
node scripts/restore-collections.js 2024-01-15T10-30-00
```

## ⚠️ Attention

- La restauration **écrase complètement** les collections existantes
- Assurez-vous d'avoir une sauvegarde récente avant toute modification importante
- Testez la restauration sur un environnement de développement d'abord

