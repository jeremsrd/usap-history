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
├── scripts/                      # ~180 scripts d'import, un par match ou par lot
│   └── lib/                      # lnr.ts (feuilles de match LNR), noms.ts
│                                 #   (rapprochement des noms entre sources)
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
`MatchPlayer.opponentPlayerName` est **abandonné** : ne plus l'utiliser. Plus
aucune ligne de la base ne s'en sert, la colonne ne subsiste que pour le
schéma.

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
- `players` contient donc majoritairement des adversaires : environ 1 236 sur
  1 380, seuls ~144 ont porté le maillot catalan. C'est normal. Les pages de
  liste filtrent déjà sur `isOpponent: false`.
- **Un import qui cherche sur le nom exact fabrique des doublons à chaque
  passage.** C'est arrivé pour de bon : un script relancé après une fusion a
  recréé « Max Hicks » à côté de « Maxwell Hicks », « Matteo Le Corvec » à côté
  de « Mattéo Le Corvec ». Le nom normalisé ne suffit pas non plus à distinguer
  « Jean Baptiste Gros » de « Jean-Baptiste Gros » : pour une fusion, se fonder
  sur le nom **exact** ; pour une recherche, sur le nom **normalisé**.

### Champs à remplir des deux côtés

Ne jamais remplir seulement le côté USAP :

- `minutesPlayed`, `subIn`, `subOut` — 80' pour un titulaire non remplacé, la
  minute de sortie sinon, `80 - subIn` pour un entrant, `null` si le
  remplaçant n'est pas entré. Trois précisions :
  - **La fin du match n'est pas une sortie.** Un joueur resté sur le terrain
    jusqu'au coup de sifflet garde `subOut` à `null` — sinon la fiche affiche
    « 80'(→80') », ce qui se lit comme un remplacement.
  - **Un joueur peut sortir puis revenir** (sang, protocole commotion). Le
    modèle ne porte qu'une entrée et qu'une sortie : `minutesPlayed` additionne
    les intervalles réellement joués, `subIn` et `subOut` gardent la première
    entrée et la première sortie, et `notes` explique le retour. La somme des
    minutes d'une équipe doit alors toujours retomber sur 1 200 (15 × 80).
  - **Un carton jaune ne se déduit pas** des minutes jouées ; un carton rouge,
    si : le match du joueur s'arrête à la minute du carton. Une équipe qui
    finit à quatorze totalise donc `1200 − (80 − minute du rouge)`.
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
  attendu et le porter sur `penaltyTriesUsap` / `penaltyTriesOpponent`. Ces
  compteurs sont **nullables et parfois `null`** (9 matchs à ce jour) : une
  garde écrite `points <> score - 7 * penaltyTries` ne compare alors rien du
  tout et laisse passer la ligne en silence. Traiter le `null` explicitement.
- Déduire les réalisations de la chronologie plutôt que de les ressaisir, et
  signaler tout marqueur absent de la composition.
- **Un nom de la source qui ne s'apparie à aucune ligne de la composition doit
  faire échouer le match entier**, pas seulement la ligne. Sur un changement,
  un nom non reconnu fausse les minutes des deux joueurs concernés ; et le plus
  souvent, c'est la composition en base qui est fausse (voir « Limites
  connues »). L'appariement se fait sur le nom **normalisé**, en acceptant
  qu'un nom soit contenu dans l'autre — les sources officielles écrivent
  « Lewis Wesley LUDLAM » ou « Komiti junior ALAINUUESE » — à condition que la
  correspondance reste unique. Deux frères sur la même feuille (Moses et Paul
  Alo Emile) se départagent au prénom.
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

**Pour tout match de championnat — Top 14, Pro D2, barrage d'accession — la
LNR est la source à utiliser, et rien d'autre en première intention.** C'est
la seule source officielle : les autres se trompent sur les noms, oublient des
actions et décalent les minutes. Le reste de cette liste ne sert qu'aux
compétitions que la LNR ne couvre pas, ou aux informations qu'elle ne donne
pas (affluence).

- **LNR — feuille de match officielle**, `top14.lnr.fr/feuille-de-match/{saison}/{phase}/{id}-{dom}-{ext}`.
  La phase est `j{N}` pour une journée, `access` en 2022-2023 et
  `access-top-14` depuis 2024-2025 pour un barrage — le segment a changé de
  nom. L'identifiant se retrouve sur
  `top14.lnr.fr/calendrier-et-resultats/{saison}/{phase}`, où il suffit de
  chercher le lien contenant `perpignan`. Deux onglets utiles :
  `/compositions` (compositions numérotées et officiels de match, dont
  l'arbitre) et `/resumes-replays` (faits de match et changements).

  **Passer par `scripts/lib/lnr.ts`**, qui fait déjà tout le travail :
  `chercherFeuille(saison, phase)` puis `lireFeuille(url)`.

  Contrairement à ce que laisse croire une lecture rapide du site, **une
  requête `fetch` suffit, pas besoin de navigateur** : les pages sont rendues
  côté serveur et embarquent la charge utile JSON du composant, échappée en
  entités HTML (`&quot;`). Le JavaScript ne fait que l'afficher. Le module
  décode les entités puis isole chaque objet par comptage d'accolades.

  Ce que la feuille donne, et que personne d'autre ne donne aussi bien :
  - le **score après chaque fait de match** (`score`, `[recevant, visiteur]`),
    la seule donnée vraiment sûre de la feuille — voir plus bas ;
  - les **essais de pénalité**, marqués `essai-de-penalite` sans auteur
    (« n.a. ») ;
  - les cartons, avec leur minute officielle ;
  - les changements avec **camp, minute, entrant, sortant**, et surtout le
    type **définitif ou temporaire** — indispensable pour reconstituer les
    minutes quand un joueur sort puis revient.

  Cinq réserves :
  - **`conversionPlayer` ment.** On l'a longtemps pris pour le transformateur
    de l'essai : il l'est souvent, pas toujours. Il porte parfois un joueur de
    l'**autre équipe** (l'essai lyonnais de Monty Ioane, le 20 avril 2024, est
    donné transformé par Jake McIntyre, ouvreur catalan) ; il se pose parfois
    sur un fait qui n'est pas un essai — un carton — pour désigner en réalité
    la transformation de l'essai précédent ; et il manque parfois alors que la
    transformation a bien eu lieu. **Ne jamais s'en servir pour décider qu'il y
    a eu transformation** : seul le `score` le dit. Tout reliquat de deux
    points entre le score affiché et les points reconstitués est une
    transformation, à porter au dernier essai qui n'en a pas. Ne se servir de
    `conversionPlayer` que pour **nommer** le buteur, et seulement s'il figure
    dans la composition de l'équipe concernée ; sinon, prendre le buteur de
    l'équipe le plus proche dans le temps ;
  - le score courant lui-même déraille : à Toulouse le 13 septembre 2025, deux
    points sont inscrits **avant** l'essai qui les vaut, et le 6 mai 2023 à
    Lyon la dernière transformation du match n'apparaît nulle part. Le total
    final du match, lui, est toujours juste : c'est lui qui doit trancher ;
  - un retour de remplacement temporaire n'est pas toujours enregistré. Le
    total des minutes d'une équipe tombe alors sous 1 200 — le signaler, ne
    pas inventer la minute manquante ;
  - les **postes affichés sur `/compositions` ne sont pas fiables** (un ailier
    y est donné « demi de mêlée »). Ils décrivent le poste de référence du
    joueur, pas celui du jour : continuer à déduire `positionPlayed` du numéro
    de maillot ;
  - `/compositions` est du **HTML classique**, pas du JSON embarqué :
    `lireCompositions()` s'en charge à part. Le camp de chaque joueur du XV se
    lit dans l'URL de son maillot ; les listes du bas, qui portent les
    remplaçants, ne mentionnent aucun club et se rattachent en comparant leur
    XV à celui du terrain. La LNR **ne publie pas** ces compositions pour
    toutes ses archives : neuf journées de 2022-2023 n'affichent que les
    officiels de match. Certaines feuilles dessinent deux terrains — le XV de
    départ, puis l'équipe telle qu'elle a fini —, et le second introduit
    parfois un dossard que la liste des remplaçants oublie : Alfred Parisien,
    entré avec le 22 à Aimé-Giral le 29 octobre 2022, donnait seize titulaires
    à Lyon. `lireCompositions()` s'en tient désormais à quinze et verse le
    surnuméraire au banc.

  Ce que la LNR ne donne pas : l'**affluence**.
- **Chronologie détaillée, en dernier recours** : API ESPN
  `site.api.espn.com/apis/site/v2/sports/rugby/{league}/summary?event={gameId}`
  (Top 14 = 270559, Challenge = 272073). L'identifiant se retrouve par
  `scoreboard?dates=AAAAMMJJ` sur la même ligue. Donne événements,
  remplacements, cartons et compositions, mais **pas** les arbitres ni
  l'affluence.

  **À n'employer que là où la LNR est muette**, et à recouper. Le passage
  d'ESPN à la LNR sur 2024-2025 a corrigé quatre erreurs de fond en 26 matchs :
  un essai de Théo Ntamack Muyenga attribué à **Romain Ntamack** — ESPN choisit
  le frère célèbre —, une transformation et une pénalité de Jérémy Fernandez
  portées à Louis Le Brun, un carton jaune fantôme à la minute même d'un essai,
  et un drop absent du détail. ESPN **omet aussi les essais de pénalité** de sa
  chronologie, ce qui fait manquer 7 points au contrôle, et **raccourcit les
  noms composés** (« Dany Priso » pour Priso Mouangue). Ses minutes de carton
  s'écartent de 1 à 3 minutes de l'officiel.
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
bien les valeurs *corrigées*, pas celles encore en base, sinon le garde-fou ment
(le script d'une feuille qui fusionne des doublons doit, en simulation, exclure
de son index les fiches qu'il aurait absorbées).

Le code réutilisable va dans `scripts/lib/` : `lnr.ts`, client des feuilles de
match de la LNR, et `noms.ts`, rapprochement des noms entre une source et la
base. Ce dernier porte une table de **noms d'usage** — deux patronymes sans
rien de commun qui désignent la même personne, comme Waisea Nayacalevu, que la
LNR inscrit sous Vuidravuwalu. La table est **vérifiée à la main** : y ajouter
une paire, c'est affirmer que ce sont deux noms d'un même homme, et c'est le
seul moyen d'apparier ces cas-là sans relâcher la règle générale.

**Quand une source se révèle fautive, restreindre le script qui s'en servait**
plutôt que de le laisser en l'état : `seed-opponent-scorers-2024-2025.ts` a été
ramené aux seuls matchs de Challenge après le passage à la LNR, sans quoi le
relancer aurait réécrasé la donnée officielle par celle d'ESPN. Même logique
pour un script de match dont on découvre qu'il inventait des noms : le
réécrire sous le même nom de fichier, pour qu'aucune ancienne version ne
subsiste et ne puisse recréer les doublons.

### Scripts de maintenance

À connaître avant d'en écrire un nouveau, et à relancer après un gros import :

| Script | Rôle |
|---|---|
| `fix-bonus-points.ts` | recalcule tous les bonus et les totaux de saison, refuse d'écrire si un classement officiel connu diverge |
| `fix-broken-slugs.ts` | réécrit les slugs dont le suffixe ne permet plus de retrouver l'entité (fiche en 404) |
| `normalize-opponent-players.ts` | rattache les anciennes lignes `opponentPlayerName` à un vrai `Player` |
| `merge-duplicate-players-2026.ts` | fusion de doublons, paires listées en dur et vérifiées à la main |
| `merge-players.ts` | fusionne deux fiches désignées par leur identifiant (`--keep`, `--drop`, `--nom`) ; ne cherche rien de lui-même, refuse la fusion si les deux figurent sur un même match |
| `rename-player.ts` | renomme une fiche, slug compris — un slug refait à la main sans le CUID rend la fiche introuvable |
| `close-season-2025-2026.ts` | modèle de clôture de saison, avec garde-fou sur le classement officiel |
| `seed-opponent-sheet.ts` | **le script du chantier adverse** : reprend une saison entière depuis la LNR — réalisations, cartons et temps de jeu reconstitués à partir des changements. Prend la saison en argument (`2023-2024`), `--dry` pour simuler, `--detail` pour le relevé des écarts avec la base, `--match=AAAA-MM-JJ` pour n'en reprendre qu'un |
| `seed-opponent-scorers-2024-2025.ts` | même travail depuis ESPN, restreint au Challenge européen faute de couverture LNR ; pas de temps de jeu |
| `audit-opponent-lineups.ts` | confronte les compositions adverses aux feuilles officielles LNR ; lecture seule, à lancer sur une saison ou sur tout |
| `fix-opponent-lineup.ts` | remet la composition adverse d'un match en accord avec la feuille officielle (identités, dossards, titulaires, capitaine) |

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

**Tous les matchs en base ont leurs 46 joueurs et leur chronologie.** Ce qui
varie, c'est le côté adverse et l'annexe.

Annexe du match :

| Saison | Matchs | Arbitres | Vidéos | Comptes-rendus | Affluences |
|---|---|---|---|---|---|
| 2025-2026 | 32 | 32 | 31 | 32 | 6 |
| 2024-2025 | 32 | 32 | 24 | 28 | 14 |
| 2023-2024 | 30 | 30 | 29 | 30 | 2 |
| 2022-2023 | 31 | 27 | 21 | 31 | 0 |
| 2008-2009 | 1 | 1 | 0 | 1 | 1 |

Les 4 arbitres manquants de 2022-2023 sont ceux des matchs de Challenge Cup :
l'EPCR ne remonte pas au-delà de 2023-2024 et allrugby ne les publie pas.

Détail des joueurs adverses — le vrai chantier restant sur les saisons déjà
saisies. « Cohérents » compte les matchs dont la somme des points adverses
retombe sur le score, essais de pénalité déduits :

| Saison | Lignes avec minutes | Marqueurs | Matchs cohérents |
|---|---|---|---|
| 2025-2026 | 733 / 736 | 156 | 32 / 32 |
| 2024-2025 | 729 / 736 | 117 | 32 / 32 |
| 2023-2024 | 598 / 690 | 103 | 26 / 30 |
| 2022-2023 | 700 / 713 | 135 | 30 / 31 |

**Les quatre saisons sont reprises côté championnat, sans exception.** Les 92
lignes manquantes de 2023-2024 sont exactement ses quatre matchs de Challenge
européen, que la LNR ne couvre pas, et les cinq matchs restés incohérents sont
tous des matchs de coupe. Ce qui reste vide relève désormais de l'EPCR, pas de
la LNR.

Attention en reprenant une saison ancienne : avant 2024-2025, le segment de
phase d'un barrage s'écrit `access` et non `access-top-14`.
`seed-opponent-sheet.ts` essaie les deux.

### Où reprendre

Par ordre de valeur.

1. **Fusionner `feat/feuilles-adverses-lnr`** dans `master` — rien n'est
   poussé sur `origin`.
2. **Brancher l'EPCR.** C'est tout ce qui reste du chantier adverse : les
   quatre matchs de Challenge 2023-2024 n'ont aucun détail adverse, ceux de
   2022-2023 sont partiels, et ceux de 2024-2025 et 2025-2026 n'ont pas de
   temps de jeu digne de ce nom. Bonne nouvelle : leurs pages embarquent aussi
   leur charge utile dans le HTML, `curl` suffit — la doc ci-dessus, qui parle
   encore de navigateur, sera à corriger le jour où ce sera fait.
3. **Un seul match de championnat reste bloqué** : Pau, 22 février 2026. La
   feuille fait entrer Clément Mondinat à la 56ᵉ, qui ne figure pas sur les 23
   qu'elle publie elle-même. Tant que ce vingt-quatrième homme n'est pas
   arbitré, la ligne de Quentin Valentino reste vide.
4. **Corriger les prénoms de la composition grenobloise** du barrage
   2024-2025 : quatorze sont inventés pour les bons joueurs.
   `fix-opponent-lineup.ts` ne les voit pas, il ne traite que les identités
   franchement fausses ; l'audit les classe en ÉCRITURE.
5. **Arbitrer les doublons de fiches** que l'audit a fait apparaître :
   Alainu'uese (Brian / Junior / Komiti), Javakhia (Giorgi / Grigol),
   Maurouard (Jérémie / Jérémy), Rey (Jérôme / Joël / Lucas), et le choix
   entre « Nacho Brex » et « Juan Ignacio Brex ». Huit fiches ne sont
   rattachées à aucune feuille et peuvent disparaître. `merge-players.ts`
   exécute la fusion une fois la paire vérifiée, `rename-player.ts` pose le nom
   retenu.
6. **Mettre à 0 les neuf compteurs `penaltyTries` restés `null`**, là où le
   détail des points retombe sans essai de pénalité. Tant qu'ils sont `null`,
   toute garde écrite avec `<>` reste muette sur ces matchs.
7. **Relier les événements adverses à leurs joueurs** : 247 en 2024-2025,
   258 en 2023-2024, 264 en 2022-2023 n'ont pas de `playerId`.
8. **Le fond** : affluences (23 matchs sur 126), photos et biographies (1
   joueur sur 144), et la phase 4 — 114 saisons sans aucun match.

114 saisons sur 119 n'ont encore aucun match : c'est le chantier de la phase 4,
menée en remontant le temps saison par saison.

### Limites connues

- `EventType` ne comporte pas `CARTON_ORANGE`. Le champ `MatchPlayer.orangeCard`
  existe et s'affiche, mais la sanction ne peut pas figurer dans la chronologie.
- Les fiches joueur affichent séparément « Matchs avec l'USAP » et « Matchs
  contre l'USAP ». Les statistiques ne comptent que les premiers. Toute nouvelle
  requête sur les joueurs doit filtrer `isOpponent: false`, sinon les ~1 236
  adversaires présents dans `players` faussent le résultat. Le tableau « contre
  l'USAP » n'affiche d'ailleurs ni minutes ni réalisations : le détail saisi
  côté adverse n'est visible que sur les pages de match.
- **Des compositions adverses ont été inventées par d'anciens imports.**
  `audit-opponent-lineups.ts` a confronté les 98 feuilles que la LNR publie à
  leur original. Le compte, à jour :

  | Anomalie | Au départ | Aujourd'hui |
  |---|---|---|
  | MANQUANT / EN TROP | 8 matchs | **0** |
  | NUMÉRO | ~100 | **0** |
  | CAPITAINE | 78 | **0** |
  | ÉCRITURE | ~70 | 66 |

  Les dossards, les brassards de capitaine et les neuf identités fautives ont
  été repris depuis les feuilles officielles. Restent les ÉCRITURE, qui sont
  pour l'essentiel des variantes de bonne foi — diminutifs (« Billy » pour
  Viliami Vunipola, « Tom » pour Thomas Staniforth) ou prénom d'usage. Une
  exception connue : la composition de Grenoble au barrage 2024-2025, dont
  quatorze prénoms sont inventés pour les bons joueurs.

  Devant un nom qui ne s'apparie pas, soupçonner la base avant la source.
- **Les matchs de coupe d'Europe sont le seul trou qui reste côté adverse.**
  La LNR ne les couvre pas : les quatre matchs de Challenge de 2023-2024 n'ont
  aucun détail, ceux de 2022-2023 sont partiels, et ceux de 2024-2025 tiennent
  leurs marqueurs d'ESPN sans temps de jeu. L'EPCR reste à brancher.
- Les événements de la chronologie ne sont reliés à un joueur que du côté USAP
  sur la plupart des saisons (2024-2025 : 247 événements adverses sans
  `playerId`). Les nouvelles saisies relient les deux camps.
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
