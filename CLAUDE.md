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
