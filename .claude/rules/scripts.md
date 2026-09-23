---
paths:
  - "scripts/**"
---
# Scripts d'import et de maintenance

- Ils écrivent sur la **base de production**. `--dry` d'abord, et une simulation
  doit agréger les valeurs *corrigées*, pas celles encore en base.
- Idempotents : effacer compositions et événements avant de les recréer. Un
  script qui efface doit **réécrire vite** (`createMany` par lots), puis
  **compter** ce qu'il a écrit plutôt que lire son code de sortie.
- Relire `docs/scripts.md` avant d'en écrire un : il existe presque toujours.
  Code partagé dans `scripts/lib/`. Ne rien lancer depuis `scripts/archive/`.
- Toute valeur venue d'ailleurs que la feuille officielle : `attester()`.
- Pooler saturé (`EMAXCONNSESSION`) : préfixer la commande de
  `DATABASE_URL="…:6543/postgres?pgbouncer=true"`. Script long exposé à `P1017` :
  `avecReconnexion()` (cf. `audit-opponent-lineups.ts`).
- Typage : `npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler --esModuleInterop scripts/<fichier>.ts`.
- Ne jamais filtrer la sortie d'un lot au point de masquer un échec ; lire une
  liste de changements en entier avant de conclure.
- Audit : saison par saison, jamais d'un bloc (la LNR plafonne le débit).
- Un échec est d'abord un garde-fou : `docs/saisie/reprendre-une-saison.md`,
  tableau « Ce qui casse ». Soupçonner la base avant la source.
- Quand une source se révèle fautive, désarmer ou supprimer le script qui s'en sert.
