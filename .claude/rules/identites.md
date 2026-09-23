---
paths:
  - "scripts/lib/noms.ts"
  - "scripts/lib/joueurs.ts"
  - "scripts/lib/effectif.ts"
  - "scripts/lib/fusion.ts"
  - "scripts/merge-*.ts"
  - "scripts/reassign-match-player.ts"
  - "scripts/detect-duplicate-players.ts"
---
# Rapprochement des noms et identités

Lire `docs/saisie/identites.md` avant toute modification. L'essentiel :
- Chercher sur le nom **normalisé** (sans accents, casse, ponctuation) dans un
  index en mémoire ; jamais un `equals`/`contains` SQL. Fusionner sur le nom **exact**.
- Un rapprochement exige un mot du **nom de famille** ; deux mots communs doivent
  venir de deux mots distincts ; des prénoms donnés des deux côtés doivent s'accorder ;
  les particules (van, der, de, le…) ne comptent pas.
- En cas de doute : créer une fiche et prévenir. Une identité fausse ne se voit pas.
- Ne jamais assouplir la règle générale pour un cas : `NOMS_DUSAGE` (mots) ou
  `VARIANTES_DAFFICHAGE` (noms complets deux à deux), vérifiés à la main.
- Après tout import ou fusion : `detect-duplicate-players.ts` (0 / 0 / 0 attendu).
