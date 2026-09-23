---
paths:
  - "prisma/**"
---
# Schéma et migrations

- **Ne jamais lancer `prisma migrate dev`** : le dossier `migrations/` ne décrit
  pas l'état réel et Prisma proposerait de réinitialiser la base de production.
- Ajouter une table ou une colonne : `prisma migrate diff --from-schema-datasource
  … --to-schema-datamodel … --script`, **relire** le SQL (il contient la dérive),
  le déposer dans `prisma/migrations/<horodatage>_<nom>/migration.sql`, l'appliquer
  seul par `prisma db execute --file …`, puis `prisma generate`. Détail : `docs/infra.md`.
- Documenter le sens des nouveaux champs dans `docs/modele-de-donnees.md`.
