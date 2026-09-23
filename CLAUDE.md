# USAP History — base de données historique de l'USA Perpignan

Site d'histoire de l'USAP depuis 1902 : matchs, joueurs, saisons, adversaires,
arbitres, stades, staff, palmarès. Modèles : lfchistory.net, cybervulcans.net.
Bilingue français / catalan (rossellonais), en ligne sur Vercel.

## Stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 (config
dans le CSS) · Prisma 6 · PostgreSQL Supabase · auth Supabase sur `/admin` ·
scripts d'import en TypeScript via `tsx`. Arborescence : `docs/architecture.md`.

## Commandes

```bash
npm run dev                            # serveur de dev
npm run lint                           # ESLint sur src/ — AVANT TOUTE POUSSÉE (Vercel échoue sinon)
npx tsc --noEmit                       # types de src/ seulement — scripts/ est exclu
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext \
  --moduleResolution bundler --esModuleInterop scripts/<script>.ts   # typer un script
npx tsx scripts/<script>.ts --dry      # toujours simuler d'abord
npx tsx scripts/etat-couverture.ts     # couverture de la base, saison par saison
npx tsx scripts/purger-cache.ts        # après toute saisie, sinon rien ne paraît avant 7 jours
scripts/sauvegarde-base.sh             # pg_dump local (aussi lancé chaque lundi par launchd)
```

## Règles non négociables

- **`DATABASE_URL` est la base de production.** Tout script écrit sur le site :
  `--dry` d'abord. Pooler saturé (`EMAXCONNSESSION`) → surcharger en port 6543.
- **Ne jamais lancer `prisma migrate dev`** : il veut réinitialiser la base.
  Migration = SQL écrit à la main + `prisma db execute` (cf. `docs/infra.md`).
- **Toute requête qui compte ou classe des matchs filtre sur `MATCH_JOUE`**
  (`src/lib/matchs.ts`) : `null` sur un score veut dire « pas encore joué ».
- **Bonus et points** : `computeBonuses()`, `pointsScaleFor()`, `baremeDeMatch()`
  de `src/lib/scoring.ts`. Jamais de barème écrit en dur.
- **Slugs** : `generate*Slug(…, id)` de `src/lib/slugs.ts`, jamais à la main.
- **Joueurs** : `players` est à 90 % des adversaires — filtrer `isOpponent`.
  Chercher sur le nom normalisé avant de créer ; `scripts/lib/joueurs.ts`.
- **Toute valeur venue d'ailleurs que la feuille officielle** porte une
  attestation (`attester()` de `scripts/lib/attestations.ts`).
- **Les faits rugby vivent dans la base**, pas ici : stades, saisons, matchs,
  palmarès, scores. Ce fichier ne porte que des règles et des pointeurs.
- **Pas de formateur** (ni prettier ni autre) : le style est tenu à la main.
- **Ne lire `docs/journal/` que sur demande de l'utilisateur.**

## Conventions

- Code en anglais, contenu et commentaires métier en français ; alias `@/` ;
  Prisma via le singleton `@/lib/prisma`.
- Dates ISO en base, JJ/MM/AAAA à l'écran ; score USAP toujours en premier.
- Server Components par défaut, Client Components pour l'interactivité seule.
- Liens internes par `@/components/Lien` ; textes par `dictionnaire()`
  (`src/i18n/fr.ts` et `ca.ts`, alignés par `scripts/verifier-dictionnaire.ts`).
- Couleurs : jetons sémantiques uniquement (`bg-background`, `usap-sang`…),
  jamais de couleur en dur ; `usap-or-vif` seulement sur fond sang.
- Toute page publique : `liensAlternatifs()` dans `generateMetadata`,
  `Signalement` en pied, `revalidate` en littéral (cf. `docs/infra.md`).
- Scripts : idempotents, `--dry`, code partagé dans `scripts/lib/` ;
  `scripts/archive/` contient des scripts à usage unique à ne pas relancer.
- Mettre à jour la doc concernée **avant** le commit, pas après.

## Le lendemain d'un match (marche courante)

```bash
npx tsx scripts/set-score.ts --match=AAAA-MM-JJ [--dry]
npx tsx scripts/seed-lineup.ts AAAA-MM-JJ [--dry]            # si les 46 lignes manquent
npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA --match=AAAA-MM-JJ --usap [--dry]
npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ [--dry]
npx tsx scripts/fix-bonus-points.ts [--dry]
npx tsx scripts/set-annexe.ts --match=… --affluence=N --mi-temps=U-A --source="…" [--dry]
npx tsx scripts/audit-opponent-lineups.ts AAAA-AAAA --usap    # 0 anomalie attendue
npx tsx scripts/detect-duplicate-players.ts                   # 0 / 0 / 0 attendu
npx tsx scripts/set-video.ts --match=… --url="…" [--dry]
npx tsx scripts/purger-cache.ts
```

Un échec de ces scripts est presque toujours un garde-fou qui a raison :
lire `docs/saisie/reprendre-une-saison.md` (« Ce qui casse ») avant de forcer.

## Où trouver le détail

| Sujet | Fichier |
|---|---|
| Arbitrages en vigueur, datés | `docs/decisions.md` |
| Reprendre une saison, lendemain de match, erreurs courantes | `docs/saisie/reprendre-une-saison.md` |
| Règles de saisie d'une feuille, contrôles, postes | `docs/saisie/feuille-de-match.md` |
| Rapprochement des noms, doublons, fusions | `docs/saisie/identites.md` |
| Barèmes, bonus, cartons, remplacements par époque | `docs/regles-du-jeu.md` |
| LNR, EPCR, ERC, ESPN, allrugby, Gallica | `docs/sources.md` |
| Table des scripts de maintenance | `docs/scripts.md` |
| Sens des champs et des `null` | `docs/modele-de-donnees.md` |
| Commandes détaillées, pooler, cache, SEO, admin | `docs/infra.md` |
| Identité visuelle et thème | `docs/design.md` · pages : `docs/pages.md` |
| Bilingue | `docs/i18n.md` · écussons et portraits : `docs/medias.md` |
| Avant 2006, presse ancienne | `docs/avant-guerre.md` · vocabulaire : `docs/glossaire.md` |
