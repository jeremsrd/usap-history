# USAP History - Base de données historique de l'USAP

## Description du projet

Site web dédié à l'histoire complète de l'USA Perpignan (USAP) depuis sa fondation en 1902.
Le site référence tous les matchs, joueurs, saisons et statistiques du club catalan.

Inspiré de :
- https://www.lfchistory.net/ (Liverpool FC - référence mondiale)
- https://www.cybervulcans.net/site/ (ASM Clermont - référence française rugby)

## Stack technique

- **Frontend** : Next.js 14+ (App Router) avec TypeScript
- **UI** : Tailwind CSS + shadcn/ui
- **Base de données** : PostgreSQL (via Supabase ou Railway)
- **ORM** : Prisma
- **Déploiement** : Vercel (frontend) + Supabase (BDD)
- **Versioning** : Git + GitHub

## Structure du projet

```
usap-history/
├── CLAUDE.md                    # Ce fichier
├── prisma/
│   └── schema.prisma            # Schéma de la base de données
├── src/
│   ├── app/                     # Pages Next.js (App Router)
│   │   ├── layout.tsx           # Layout principal (header, nav, footer)
│   │   ├── page.tsx             # Page d'accueil
│   │   ├── joueurs/
│   │   │   ├── page.tsx         # Liste des joueurs (avec recherche/filtres)
│   │   │   └── [id]/page.tsx    # Fiche joueur individuelle
│   │   ├── matchs/
│   │   │   ├── page.tsx         # Recherche de matchs
│   │   │   └── [id]/page.tsx    # Fiche match individuelle
│   │   ├── saisons/
│   │   │   ├── page.tsx         # Liste des saisons
│   │   │   └── [id]/page.tsx    # Détail d'une saison
│   │   ├── statistiques/
│   │   │   └── page.tsx         # Stats globales (meilleurs marqueurs, plus capés, etc.)
│   │   ├── palmares/
│   │   │   └── page.tsx         # Palmarès et trophées
│   │   └── admin/               # Interface d'administration (protégée)
│   │       ├── page.tsx         # Dashboard admin
│   │       ├── matchs/page.tsx  # Saisie de matchs
│   │       └── joueurs/page.tsx # Gestion des joueurs
│   ├── components/              # Composants réutilisables
│   │   ├── ui/                  # Composants shadcn/ui
│   │   ├── PlayerCard.tsx       # Carte joueur
│   │   ├── MatchCard.tsx        # Carte match
│   │   ├── SeasonNav.tsx        # Navigation par saison
│   │   ├── StatsTable.tsx       # Tableau de statistiques
│   │   └── SearchBar.tsx        # Barre de recherche globale
│   ├── lib/
│   │   ├── prisma.ts            # Client Prisma singleton
│   │   ├── utils.ts             # Fonctions utilitaires
│   │   └── constants.ts         # Constantes (postes, compétitions, etc.)
│   └── types/
│       └── index.ts             # Types TypeScript
├── public/
│   ├── images/
│   │   ├── players/             # Photos des joueurs
│   │   ├── logos/               # Logos clubs adverses
│   │   └── usap/                # Assets USAP (blason, etc.)
│   └── favicon.ico
├── scripts/
│   ├── seed.ts                  # Script de seed initial
│   └── import-csv.ts            # Import de données CSV
├── .env.local                   # Variables d'environnement (ne pas committer)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

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
- `players` contient donc majoritairement des adversaires (~1170 sur ~1320).
  C'est normal. Les pages de liste filtrent déjà sur `isOpponent: false`.

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

### Contrôles à faire systématiquement

- La somme des points par joueur doit retomber sur le score de l'équipe.
  Un **essai de pénalité** (7 pts) n'a pas de marqueur : le déduire du total
  attendu et le porter sur `penaltyTriesUsap` / `penaltyTriesOpponent`.
- Déduire les réalisations de la chronologie plutôt que de les ressaisir, et
  signaler tout marqueur absent de la composition.
- Les statistiques agrégées de saison doivent correspondre au classement
  officiel avant d'être écrites (cf. `close-season-2025-2026.ts`).

### Slugs

Toujours passer par `generatePlayerSlug(firstName, lastName, player.id)` et ses
équivalents dans `src/lib/slugs.ts`. Les pages de détail retrouvent
l'enregistrement en extrayant le CUID de la fin du slug
(`/([a-z0-9]{25,})$/`) : un suffixe fabriqué avec `Date.now()` ou un aléatoire
rend la fiche inaccessible (404). Voir `scripts/fix-broken-slugs.ts`.

### Où trouver les données

- **Feuille de match officielle** (compositions + arbitres) :
  `top14.lnr.fr/feuille-de-match/{saison}/j{N}/{id}-{dom}-{ext}/compositions`.
  L'identifiant se retrouve sur
  `top14.lnr.fr/calendrier-et-resultats/{saison}/j{N}`. Page rendue en JS :
  la charger dans un navigateur, pas en `curl`.
- **Chronologie détaillée** : API ESPN
  `site.api.espn.com/apis/site/v2/sports/rugby/{league}/summary?event={gameId}`
  (Top 14 = 270559, Challenge = 272073). Donne événements, remplacements,
  cartons et compositions, mais **pas** les arbitres ni l'affluence.
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
modifie des données existantes en masse.

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

## Postes de rugby (pour la BDD)

```
PILIER_GAUCHE = "Pilier gauche"        # 1
TALONNEUR = "Talonneur"                # 2
PILIER_DROIT = "Pilier droit"          # 3
DEUXIEME_LIGNE_4 = "2ème ligne"        # 4
DEUXIEME_LIGNE_5 = "2ème ligne"        # 5
TROISIEME_LIGNE_AILE_6 = "3ème ligne aile" # 6
TROISIEME_LIGNE_AILE_7 = "3ème ligne aile" # 7
TROISIEME_LIGNE_CENTRE = "N°8"        # 8
DEMI_DE_MELEE = "Demi de mêlée"       # 9
DEMI_OUVERTURE = "Demi d'ouverture"    # 10
AILIER_11 = "Ailier"                   # 11
CENTRE_12 = "Centre"                   # 12
CENTRE_13 = "Centre"                   # 13
AILIER_14 = "Ailier"                   # 14
ARRIERE = "Arrière"                    # 15
```

## Priorités de développement

1. **MVP** : Schéma BDD + pages de base (saisons, matchs, joueurs) avec données de la saison 2024-2025
2. **Phase 2** : Interface admin pour saisie de données + import CSV
3. **Phase 3** : Statistiques avancées + recherche + "CatalanOmètre"
4. **Phase 4** : Enrichissement historique (saisons anciennes)
5. **Phase 5** : SEO, performances, PWA

## Notes pour Claude Code

- Toujours créer des composants réutilisables
- Favoriser les Server Components Next.js pour les pages de lecture
- Utiliser les Client Components uniquement quand nécessaire (interactivité)
- Prévoir la pagination pour les listes longues (matchs, joueurs)
- Les images joueurs sont optionnelles (placeholder si absente)
- Penser responsive dès le départ (mobile-first)
- Commenter le code en français pour les parties métier complexes
