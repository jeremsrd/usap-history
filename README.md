# 🏉 USAP Historia

> Base de données historique de l'USA Perpignan depuis 1902

Site dédié à l'histoire du club catalan : matchs, joueurs, saisons, adversaires,
arbitres, stades, entraîneurs, présidents et palmarès.

Inspiré de [lfchistory.net](https://www.lfchistory.net/) (Liverpool FC) et
[cybervulcans.net](https://www.cybervulcans.net/site/) (ASM Clermont).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 6 ·
PostgreSQL sur Supabase · authentification Supabase pour l'admin.

## Démarrage

```bash
npm install
npx prisma generate
npm run dev
```

Le fichier `.env` doit contenir `DATABASE_URL` (Supabase) ainsi que les clés
Supabase — voir `env.example`.

⚠️ `DATABASE_URL` pointe sur la base **de production**. Les scripts du dossier
`scripts/` écrivent donc directement sur les données du site.

## Commandes

```bash
npm run dev                          # serveur de développement
npm run build                        # build de production
npm run lint                         # ESLint
npx tsc --noEmit                     # vérification des types
npx tsx scripts/<script>.ts          # exécuter un script d'import
npx tsx scripts/<script>.ts --dry    # simulation (scripts de masse)
```

## Contenu actuel

| Saison | Matchs | État |
|---|---|---|
| 2025-2026 | 32 | complète et clôturée — 13e du Top 14, maintien à l'access match |
| 2024-2025 | 32 | complète |
| 2023-2024 | 30 | complète |
| 2022-2023 | 31 | complète — 13e, maintien au barrage contre Grenoble |
| 2008-2009 | 1 | finale du championnat |

Tous ces matchs ont leur feuille complète : compositions des deux équipes,
temps de jeu, réalisations, cartons et chronologie.

126 matchs, 1 391 joueurs (dont 147 ayant porté le maillot catalan),
5 796 feuilles de match et 2 489 événements.

Les 114 autres saisons restent à documenter : c'est le chantier en cours, mené
en remontant le temps saison par saison.

## Ajouter un match

Les règles de saisie — convention pour les joueurs adverses, champs
obligatoires des deux côtés, contrôles de cohérence, sources de données — sont
décrites dans [CLAUDE.md](CLAUDE.md), section « Saisie d'un match ». Chaque
match ou lot de matchs fait l'objet d'un script idempotent dans `scripts/`.

## Schéma de la base

```
players ──── match_players ──── matches ──── seasons
                                   │            │
                              match_events   season_players
                                   │         season_coaches
              opponents ───────────┤
              venues ──────────────┤
              referees ────────────┘
              competitions

+ trophies, coaches, presidents, countries, national_teams
+ career_clubs, player_stints, player_internationals, player_awards
```

## Sources

- [Wikipédia — USAP](https://fr.wikipedia.org/wiki/Union_sportive_Arlequins_perpignanais)
- [Feuilles de match LNR](https://top14.lnr.fr/) — compositions officielles et arbitres
- [ESPN Rugby](https://www.espn.com/rugby/) — chronologies détaillées
- Directs commentés : rugbyrama.fr, ici.fr
- Chaîne YouTube TOP 14 Officiel — résumés vidéo

## Licence

Projet personnel. Données sportives publiques.
