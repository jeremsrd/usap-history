# 🏉 USAP History

> Base de données historique complète de l'USA Perpignan depuis 1902

Site dédié à l'histoire du club catalan : tous les matchs, joueurs, saisons et statistiques de l'USAP.

## 🚀 Démarrage rapide avec Claude Code

### Prérequis
- Node.js 18+
- Un compte Supabase (gratuit) pour la base PostgreSQL
- Un compte GitHub

### Installation

```bash
# 1. Cloner ou initialiser le projet
cd usap-history

# 2. Initialiser Next.js
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 3. Installer les dépendances
npm install prisma @prisma/client
npm install -D ts-node @types/node

# 4. Configurer Prisma
npx prisma init

# 5. Copier le schema.prisma fourni dans prisma/schema.prisma

# 6. Configurer la variable DATABASE_URL dans .env
# DATABASE_URL="postgresql://user:password@host:5432/usap_history"

# 7. Créer les tables
npx prisma db push

# 8. Lancer le seed
npx ts-node scripts/seed.ts

# 9. Démarrer le serveur de développement
npm run dev
```

### Commandes Claude Code pour démarrer

Voici les commandes à donner à Claude Code pour construire le projet étape par étape :

```
1. "Initialise le projet Next.js avec TypeScript, Tailwind et Prisma. 
    Utilise le schema.prisma et le CLAUDE.md fournis."

2. "Crée la page d'accueil avec le logo USAP, les derniers résultats, 
    et un résumé des stats clés du club."

3. "Crée la page /saisons avec la liste de toutes les saisons, 
    et la page /saisons/[id] avec le détail d'une saison."

4. "Crée la page /joueurs avec la liste searchable des joueurs, 
    et la page /joueurs/[id] avec la fiche complète d'un joueur."

5. "Crée la page /matchs avec un moteur de recherche de matchs 
    (par adversaire, date, compétition) et la fiche match."

6. "Crée la page /statistiques avec les classements : 
    plus capés, meilleurs marqueurs, bilan par adversaire."

7. "Crée l'interface admin pour saisir des matchs et des joueurs."

8. "Initialise le repo Git et pousse le projet sur GitHub."
```

## 📊 Schéma de la base de données

```
players ──────── match_players ──────── matches
    │                                      │
    └── season_players ── seasons ─────────┘
                              │
                          competitions

+ trophies (palmarès)
+ venues (stades)  
+ coaches (entraîneurs)
```

### Tables principales

| Table | Description | Volume estimé |
|-------|-------------|---------------|
| `players` | Tous les joueurs ayant porté le maillot USAP | ~2000+ |
| `matches` | Tous les matchs officiels depuis 1902 | ~4000+ |
| `match_players` | Participation de chaque joueur à chaque match | ~50 000+ |
| `seasons` | Les saisons (1902-2025) | ~120 |
| `competitions` | Types de compétitions | ~10 |
| `trophies` | Palmarès | ~30 |
| `venues` | Stades | ~50 |
| `coaches` | Entraîneurs | ~30 |

## 🎨 Identité visuelle

- **Rouge sang** : `#C8102E` (couleur principale)
- **Or catalan** : `#FFD700` (accent)
- **Fond sombre** : `#1a1a2e` (style archives)

## 📝 Sources de données

- [Wikipedia - USAP](https://fr.wikipedia.org/wiki/Union_sportive_Arlequins_perpignanais)
- [Wikipedia - Bilan par saison](https://fr.wikipedia.org/wiki/Bilan_par_saison_de_l%27Union_sportive_arlequins_perpignanais)
- [RubyStats.fr](https://www.rugbystats.fr/USAP-Perpignan-rugby.html)
- [Site officiel LNR/Top14](https://top14.lnr.fr/club/perpignan)
- [Site officiel USAP](https://www.usap.fr)
- Archives de L'Indépendant et Midi Libre

## 📄 Licence

Projet personnel - Données sportives publiques.
