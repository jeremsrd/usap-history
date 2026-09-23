---
paths:
  - "scripts/lib/lnr.ts"
  - "scripts/lib/epcr.ts"
  - "scripts/lib/erc.ts"
  - "scripts/lib/espn.ts"
  - "scripts/lib/gallica.ts"
  - "scripts/lib/feuilles.ts"
  - "scripts/lib/dossards.ts"
---
# Lecteurs de sources

Chaque bizarrerie d'une source est documentée **au code qui la contourne** :
lire l'en-tête du module avant d'y toucher, puis `docs/sources.md`.
- LNR : le score du calendrier fait foi ; `conversionPlayer` ment ; compositions
  non fiables avant 2006-2007 ; ampute les accents (ne pas réécrire une
  orthographe de la base d'après elle) ; `phasesLnr()` est une liste blanche.
- EPCR : rattacher par le dossard ; affluence 0 = inconnue ; clé `EPCR_API_KEY` dans `.env`.
- ESPN : complément seulement, toujours recoupé. Gallica : 30 s entre requêtes,
  tout ce qui en sort est `PROBABLE` et relu sur l'image.
- Toute table de correction (`NOMS_MAL_DECOUPES`, `CHANGEMENTS_CORRIGES`,
  `SCORES_CORRIGES`…) ne s'écrit qu'avec la démonstration sous les yeux.
