# USAP History - Base de données historique de l'USAP

## Description du projet

Site web dédié à l'histoire complète de l'USA Perpignan (USAP) depuis sa fondation en 1902.
Le site référence tous les matchs, joueurs, saisons et statistiques du club catalan.

Inspiré de :
- https://www.lfchistory.net/ (Liverpool FC - référence mondiale)
- https://www.cybervulcans.net/site/ (ASM Clermont - référence française rugby)

## Stack technique

- **Frontend** : Next.js 15 (App Router, Turbopack) + React 19, TypeScript
- **UI** : Tailwind v4, Radix UI, lucide-react ; `next-themes` pour le
  clair/sombre. shadcn/ui est installé mais très peu utilisé en pratique.
- **Base de données** : PostgreSQL sur Supabase, ORM Prisma 6
- **Auth** : Supabase (`@supabase/ssr`), protège `/admin`
- **Scripts** : TypeScript exécuté via `tsx`
- **Versioning** : Git + GitHub (`jeremsrd/usap-history`)

## Structure du projet

```
usap-history/
├── CLAUDE.md                     # Ce fichier — conventions et règles de saisie
├── prisma/schema.prisma          # Schéma de la base
├── src/
│   ├── app/                      # App Router — 33 pages
│   │   ├── page.tsx              # Accueil
│   │   ├── saisons/              # page.tsx + [label]/page.tsx
│   │   ├── matchs/               # page.tsx + [slug]/page.tsx
│   │   ├── joueurs/              # page.tsx + [slug]/page.tsx
│   │   ├── adversaires/          # page.tsx + [slug]/page.tsx
│   │   ├── arbitres/             # idem
│   │   ├── stades/               # idem
│   │   ├── entraineurs/          # idem
│   │   ├── presidents/           # idem
│   │   ├── palmares/, statistiques/
│   │   ├── login/, auth/callback/, api/upload/
│   │   └── admin/                # protégé — saisons, matchs (+ [id]), joueurs,
│   │                             #   adversaires, arbitres, stades, entraineurs,
│   │                             #   presidents, competitions, pays, palmares
│   ├── components/
│   │   ├── Header.tsx, Footer.tsx, ThemeProvider.tsx, ThemeToggle.tsx
│   │   ├── ScoreEvolution.tsx    # graphe d'évolution du score d'un match
│   │   ├── VideoEmbed.tsx        # résumé YouTube/Dailymotion en click-to-play
│   │   └── ui/ImageUpload.tsx
│   ├── lib/                      # prisma.ts, slugs.ts, utils.ts, constants.ts, supabase/
│   └── types/index.ts
├── scripts/                      # ~170 scripts d'import, un par match ou par lot
└── .claude/launch.json           # config du serveur de dev
```

Les routes de détail utilisent `[slug]` (et `[label]` pour les saisons), pas
`[id]`. Il n'y a pas de `tailwind.config.ts` : Tailwind v4 se configure dans le
CSS.

## Contexte historique de l'USAP

- **1902** : Fondation de l'Association Sportive Perpignanaise (ASP)
- **1912** : Création du Stade Olympien Perpignanais (SOP), scission de l'ASP
- **1919** : Fusion ASP + SOP = Union Sportive Perpignanaise (USP)
- **1933** : Fusion USP + Arlequin Club = USAP (Union Sportive Arlequins Perpignanais)
- **Stade** : Aimé-Giral (anciennement Stade Gilbert Brutus pour certaines périodes)
- **Couleurs** : Sang et Or (rouge et jaune/or, couleurs catalanes)
- **Surnom** : Les Catalans, Les Arlequins

### Palmarès principal
- **Champion de France** : 1914, 1921, 1925, 1938, 1944, 1955, 2009
- **Finaliste** : 1924, 1926, 1935, 1939, 1952, 1977, 1998, 2004, 2010
- **Champion Pro D2** : 2018, 2021
- **Challenge Yves du Manoir** : 1935, 1955, 1994
- **Finaliste Coupe d'Europe** : 2003

### Compétitions à référencer
- Championnat de France (Top 14 / 1ère division)
- Pro D2 (2ème division)
- Coupe d'Europe (Heineken Cup / Champions Cup)
- Challenge européen (European Challenge Cup)
- Challenge Yves du Manoir / Coupe de France
- Matchs amicaux (optionnel)

## Conventions de code

- **Langue du code** : anglais (noms de variables, fonctions, composants)
- **Langue du contenu** : français (UI, textes, labels)
- **Composants** : React functional components avec TypeScript
- **CSS** : Tailwind utility classes, pas de CSS custom sauf nécessité
- **Imports** : utiliser les alias `@/` pour `src/`
- **Prisma** : toujours utiliser le singleton depuis `@/lib/prisma`
- **Dates** : format ISO en base, affichage DD/MM/YYYY côté UI
- **Scores** : toujours stocker score USAP en premier

## Saisie d'un match (feuille de match)

Règles à appliquer **sans qu'on ait à les redemander** à chaque ajout de match.

### Joueurs adverses : une seule convention

Un joueur adverse est une **vraie ligne `Player`**, reliée par
`MatchPlayer.playerId` avec `isOpponent: true`. Le champ
`MatchPlayer.opponentPlayerName` est **abandonné** : ne plus l'utiliser.

Cela permet de suivre une personne d'un club à l'autre, de compter ses
confrontations avec l'USAP, et de gérer les joueurs passés par les deux camps
(Yato, Urdapilleta, les Lotrian…).

- Créer l'adversaire avec `isActive: false` (ce drapeau signifie « actuellement
  à l'USAP »).
- **Toujours chercher un joueur existant avant d'en créer un**, sur le nom
  **normalisé** : sans accents, sans casse, sans ponctuation. Un filtre SQL
  `lastName equals` ne suffit pas — il rate « Guerois-Galisson » vs
  « Guerois Galisson », « Bécognée » vs « Becognee ». Construire un index en
  mémoire une fois, puis chercher dedans.
- `players` contient donc majoritairement des adversaires : environ 1 240 sur
  1 390, seuls ~147 ont porté le maillot catalan. C'est normal. Les pages de
  liste filtrent déjà sur `isOpponent: false`.

### Champs à remplir des deux côtés

Ne jamais remplir seulement le côté USAP :

- `minutesPlayed`, `subIn`, `subOut` — 80' pour un titulaire non remplacé, la
  minute de sortie sinon, `80 - subIn` pour un entrant, `null` si le
  remplaçant n'est pas entré
- `tries`, `conversions`, `penalties`, `dropGoals`, `totalPoints`
- `yellowCard` / `orangeCard` / `redCard` + minute
- `isCaptain`, `shirtNumber`, `positionPlayed` (poste réellement tenu :
  déduit du numéro de maillot pour les titulaires)

Sur le match : `halfTimeUsap` / `halfTimeOpponent`, `refereeId`, `videoUrl`,
`attendance`, `report`, les compteurs `triesUsap` / `triesOpponent` etc., et
`bonusOffensif` / `bonusDefensif`.

### Points de bonus : jamais saisis à la main

Utiliser `computeBonuses()` de `src/lib/scoring.ts`. Les scripts et l'action
d'enregistrement de l'admin le font déjà : la case à cocher du formulaire ne
sert plus que de repli quand le détail des essais manque.

Le barème dépend de la compétition **et de l'époque**. Pour une base qui
remonte à 1902, ce n'est pas un détail : jusqu'en 2003-2004 le championnat
français ignorait les bonus **et** comptait les points autrement.

**Championnats français**

| Période | Victoire / Nul / Défaite | Bonus offensif | Bonus défensif |
|---|---|---|---|
| jusqu'en 2003-2004 | 3 / 2 / 1 | aucun | aucun |
| 2004-2005 → 2006-2007 | 4 / 2 / 0 | 4 essais | défaite ≤ 7 pts |
| 2007-2008 → 2013-2014 | 4 / 2 / 0 | 3 essais d'écart | défaite ≤ 7 pts |
| depuis 2014-2015 | 4 / 2 / 0 | 3 essais d'écart | défaite ≤ 5 pts |

**Coupes d'Europe**

| Période | Bonus offensif | Bonus défensif |
|---|---|---|
| jusqu'en 2025-2026 | 4 essais | défaite ≤ 7 pts |
| depuis 2026-2027 | 3 essais d'écart | défaite ≤ 7 pts |

2004-2005 est une bascule complète : abandon du 3/2/1 historique, où une
défaite rapportait encore un point, au profit du 4/2/0 international avec
bonus — alignement sur l'hémisphère Sud et la Coupe du monde 2003. Le vieux
barème récompensait la participation, le nouveau le résultat et la manière.
Le différentiel de 3 essais arrive en 2007-2008, pour empêcher les deux
équipes de prendre le bonus offensif dans le même match. Le seuil défensif
descend à 5 points en 2014-2015 : l'équipe menée n'est plus qu'à un essai de
la victoire, ce qui l'incite à jouer plutôt qu'à gérer.

`pointsScaleFor(seasonStartYear)` donne le barème, `matchPoints()` les points
d'une rencontre. Ne jamais recoder un `wins * 4 + draws * 2` en dur : c'est
faux avant 2004-2005.

Trois réserves à lever avant d'attaquer les saisons anciennes :
la date de la décision LNR de 2004 n'est pas sourcée (seule la saison
d'application est attestée par les classements) ; la Wikipédia française
laisse 2004-2007 dans le flou sur le seuil défensif, il faudrait les
règlements LNR de ces saisons, qui ne sont plus en ligne ; et la date
d'introduction des bonus dans les coupes d'Europe n'a pas été vérifiée.

**Aucun bonus sur un match couperet** : phase finale européenne, barrage
d'accession, finale. Dans le modèle, une rencontre est un couperet si elle n'a
pas de `matchday` et que son `round` ne commence pas par « Poule ».

### Contrôles à faire systématiquement

- La somme des points par joueur doit retomber sur le score de l'équipe.
  Un **essai de pénalité** (7 pts) n'a pas de marqueur : le déduire du total
  attendu et le porter sur `penaltyTriesUsap` / `penaltyTriesOpponent`.
- Déduire les réalisations de la chronologie plutôt que de les ressaisir, et
  signaler tout marqueur absent de la composition.
- Les statistiques agrégées de saison doivent correspondre au classement
  officiel avant d'être écrites (cf. `close-season-2025-2026.ts`).
- Après toute saisie touchant les scores ou les essais, relancer
  `npx tsx scripts/fix-bonus-points.ts --dry` : il recalcule tous les bonus et
  confronte les totaux de saison aux classements officiels connus.

### Slugs

Toujours passer par `generatePlayerSlug(firstName, lastName, player.id)` et ses
équivalents dans `src/lib/slugs.ts`. Les pages de détail retrouvent
l'enregistrement en extrayant le CUID de la fin du slug
(`/([a-z0-9]{25,})$/`) : un suffixe fabriqué avec `Date.now()` ou un aléatoire
rend la fiche inaccessible (404). Voir `scripts/fix-broken-slugs.ts`.

### Où trouver les données

- **Feuille de match officielle** (compositions + arbitres) :
  `top14.lnr.fr/feuille-de-match/{saison}/{phase}/{id}-{dom}-{ext}/compositions`.
  La phase est `j{N}` pour une journée, `access` en 2022-2023 et
  `access-top-14` en 2025-2026 pour un barrage — le segment a changé de nom.
  L'identifiant se retrouve sur
  `top14.lnr.fr/calendrier-et-resultats/{saison}/{phase}`. L'onglet
  `/resumes-replays` du même match porte les « faits de match » : chronologie
  complète avec score courant après chaque action, et les changements notés
  **entrant | sortant | minute**. Pages rendues en JS : les charger dans un
  navigateur, pas en `curl`.
- **Chronologie détaillée** : API ESPN
  `site.api.espn.com/apis/site/v2/sports/rugby/{league}/summary?event={gameId}`
  (Top 14 = 270559, Challenge = 272073). Donne événements, remplacements,
  cartons et compositions, mais **pas** les arbitres ni l'affluence.
- **Coupes d'Europe** : `epcrugby.com/fr/challenge-cup/matchs` (ou
  `/champions-cup/`). Choisir la saison dans le menu « Saison », puis la phase.
  La fiche d'un match, `/matchs/{id}/actualite`, donne **arbitre, affluence et
  score à la mi-temps** dans son en-tête ; l'onglet `/equipes` donne les
  compositions et les remplacements. Site Nuxt en SSR, à charger dans un
  navigateur. Le sélecteur de saison se pilote mal par script : passer par une
  recherche web restreinte au domaine pour retrouver l'id du match.
- **Saisons anciennes** : `allrugby.com/saison-{saison}/matchs/{dom}-{ext}-{id}.html`,
  l'identifiant venant de `allrugby.com/competitions/{compétition}/calendrier.html`.
  Seule source retrouvée pour le Challenge Cup 2022-2023. Trois pièges :
  le tableau doit être **parsé colonne par colonne** (13 colonnes, les
  réalisations de l'USAP à gauche du nom, celles de l'adversaire à droite) —
  mis à plat, on ne sait plus à qui attribuer une minute ; le **club recevant
  est à gauche**, pas l'USAP ; et les remplacements de la colonne droite
  écrivent la **minute avant le nom**, l'inverse de la gauche. Ni arbitre, ni
  affluence, ni score à la mi-temps.
- **Direct commenté** : rugbyrama.fr, ici.fr — utiles pour l'arbitre, le score
  à la mi-temps et les faits de match.
- **Résumé vidéo** : chaîne YouTube « TOP 14 - Officiel ». **Vérifier chaque
  identifiant** via `https://www.youtube.com/oembed?url=…&format=json` avant
  de l'enregistrer : le HTML de recherche YouTube désaligne titres et
  identifiants.

### Scripts

Un script par match ou par lot cohérent, dans `scripts/`, **idempotent**
(supprime compositions et événements avant de les recréer), avec en en-tête le
récapitulatif du match et les sources. Prévoir un `--dry` pour tout script qui
modifie des données existantes en masse — et vérifier que la simulation agrège
bien les valeurs *corrigées*, pas celles encore en base, sinon le garde-fou ment.

### Scripts de maintenance

À connaître avant d'en écrire un nouveau, et à relancer après un gros import :

| Script | Rôle |
|---|---|
| `fix-bonus-points.ts` | recalcule tous les bonus et les totaux de saison, refuse d'écrire si un classement officiel connu diverge |
| `fix-broken-slugs.ts` | réécrit les slugs dont le suffixe ne permet plus de retrouver l'entité (fiche en 404) |
| `normalize-opponent-players.ts` | rattache les anciennes lignes `opponentPlayerName` à un vrai `Player` |
| `merge-duplicate-players-2026.ts` | fusion de doublons, paires listées en dur et vérifiées à la main |
| `close-season-2025-2026.ts` | modèle de clôture de saison, avec garde-fou sur le classement officiel |

`fix-duplicate-players.ts` existe aussi mais apparie les prénoms par préfixe et
par inclusion : trop large pour être lancé sans revue préalable.

## Identité visuelle

- **Couleur principale** : Rouge sang (#C8102E) - couleur dominante USAP
- **Couleur secondaire** : Or/Jaune (#FFD700 dark, #b8860b light) - accent catalan
- **Fond** : adaptatif via CSS variables (clair par défaut)
- **Texte** : adaptatif via CSS variables (sombre sur fond clair, clair sur fond sombre)
- **Police titres** : font-bold, uppercase pour les titres de section
- **Style général** : sobre, professionnel, orienté données (pas de fioritures)

## Thème clair/sombre

- **Thème par défaut** : clair (light)
- **Gestion** : `next-themes` avec `attribute="class"` sur `<html>`
- **Stockage préférence** : localStorage (automatique via next-themes)
- **Fallback** : préférence système (prefers-color-scheme)
- **Toggle** : bouton Sun/Moon dans le Header
- **Convention** : toujours utiliser les couleurs sémantiques Tailwind (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-muted`, etc.) plutôt que des couleurs hardcodées
- **USAP brand** : `usap-sang`, `usap-or`, `usap-fond`, `usap-carte` sont définis via CSS variables et s'adaptent au thème
- **Interdit** : `border-white/10`, `bg-white/5`, ou toute couleur hardcodée qui ne s'adapte pas au thème

## Postes de rugby

L'enum `Position` ne distingue **pas** les numéros au sein d'une même ligne :

```
PILIER_GAUCHE          # 1
TALONNEUR              # 2
PILIER_DROIT           # 3
DEUXIEME_LIGNE         # 4 et 5
TROISIEME_LIGNE_AILE   # 6 et 7
NUMERO_HUIT            # 8
DEMI_DE_MELEE          # 9
DEMI_OUVERTURE         # 10
AILIER                 # 11 et 14
CENTRE                 # 12 et 13
ARRIERE                # 15
```

Les libellés d'affichage sont dans `src/lib/constants.ts` (`POSITIONS`).

`MatchPlayer.positionPlayed` = poste **réellement tenu ce jour-là**, déduit du
numéro de maillot pour les titulaires — un joueur fiché troisième ligne qui
porte le 4 est enregistré `DEUXIEME_LIGNE` sur cette feuille de match.
`Player.position` reste son poste de référence.

## État du projet

Phases 1 à 3 terminées : schéma, pages publiques, admin complet avec
authentification Supabase, statistiques et recherche. Reste la phase 4
(enrichissement historique) et la phase 5 (SEO, performances, PWA).

### Couverture des données

**Tous les matchs en base ont leur feuille de match complète** (46 joueurs,
minutes, réalisations, chronologie). Ce qui varie, c'est l'annexe :

| Saison | Matchs | Arbitres | Vidéos | Comptes-rendus | Affluences |
|---|---|---|---|---|---|
| 2025-2026 | 32 | 32 | 31 | 32 | 6 |
| 2024-2025 | 32 | 32 | 24 | 28 | 14 |
| 2023-2024 | 30 | 30 | 29 | 30 | 2 |
| 2022-2023 | 31 | 27 | 21 | 31 | 0 |
| 2008-2009 | 1 | 1 | 0 | 1 | 1 |

Les 4 arbitres manquants de 2022-2023 sont ceux des matchs de Challenge Cup :
l'EPCR ne remonte pas au-delà de 2023-2024 et allrugby ne les publie pas.

114 saisons sur 119 n'ont encore aucun match : c'est le chantier de la phase 4,
menée en remontant le temps saison par saison.

### Limites connues

- `EventType` ne comporte pas `CARTON_ORANGE`. Le champ `MatchPlayer.orangeCard`
  existe et s'affiche, mais la sanction ne peut pas figurer dans la chronologie.
- Les fiches joueur affichent séparément « Matchs avec l'USAP » et « Matchs
  contre l'USAP ». Les statistiques ne comptent que les premiers. Toute nouvelle
  requête sur les joueurs doit filtrer `isOpponent: false`, sinon les ~1 240
  adversaires présents dans `players` faussent le résultat.
- Erreur d'hydratation React sur les pages de match, antérieure et non
  diagnostiquée (probablement `next-themes`).
- Affluences quasi absentes ; peu de photos et de biographies de joueurs.
- Les modèles `CareerClub`, `PlayerStint`, `PlayerInternational` et
  `PlayerAward` existent mais ne sont pas alimentés.

## Commandes

```bash
npm run dev                          # serveur de développement (Turbopack)
npx tsc --noEmit                     # vérification des types
npx tsx scripts/<script>.ts          # exécuter un script d'import
npx tsx scripts/<script>.ts --dry    # simulation, pour les scripts de masse
```

⚠️ `DATABASE_URL` pointe sur la base Supabase **de production** : un script
lancé écrit directement sur les données du site. Toujours passer par `--dry`
d'abord quand le script modifie de l'existant.

## Notes pour Claude Code

- Toujours créer des composants réutilisables
- Favoriser les Server Components Next.js pour les pages de lecture
- Utiliser les Client Components uniquement quand nécessaire (interactivité)
- Prévoir la pagination pour les listes longues (matchs, joueurs)
- Les images joueurs sont optionnelles (placeholder si absente)
- Penser responsive dès le départ (mobile-first)
- Commenter le code en français pour les parties métier complexes
