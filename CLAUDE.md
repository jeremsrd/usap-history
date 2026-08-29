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
(Yato, Urdapilleta, les Lotrian, Jérémie Maurouard…).

- Créer l'adversaire avec `isActive: false` (ce drapeau signifie « actuellement
  à l'USAP »).
- **Toujours chercher un joueur existant avant d'en créer un**, sur le nom
  **normalisé** : sans accents, sans casse, sans ponctuation. Un filtre SQL
  `lastName equals` ne suffit pas — il rate « Guerois-Galisson » vs
  « Guerois Galisson », « Bécognée » vs « Becognee ». Construire un index en
  mémoire une fois, puis chercher dedans.
- **Chercher sur toute la table demande deux garde-fous**, que
  `scripts/lib/joueurs.ts` porte tous les deux. Ils ont chacun leur accident
  fondateur, l'un et l'autre découverts en relisant une feuille reprise :
  - **le nom de famille seul ne suffit pas.** « Kane Douglas », deuxième ligne
    de La Rochelle et de l'UBB, s'est retrouvé ailier de Brive le 4 septembre
    2021 parce que la feuille annonçait « Wesley DOUGLAS » : un patronyme
    commun, deux hommes. L'homonyme n'est donc retenu que si les prénoms sont
    **à une lettre l'un de l'autre** — « Mathieu » et « Matthieu » Ugena sont
    bien le même joueur ;
  - **deux mots communs ne suffisent pas non plus s'ils ne viennent pas du nom
    de famille.** « Ratu Tevita KURIDRANI », centre de Biarritz, a été rattaché
    à Tevita Ratuva, deuxième ligne de Brive : « Ratu » est le début de
    « Ratuva », et le prénom faisait le second mot commun. Tout rapprochement
    exige donc désormais un mot du **nom de famille**.

  S'y ajoute une troisième précaution, née des noms sud-africains : **les
  particules ne désignent personne.** `mots()` écarte déjà ce qui fait moins de
  trois lettres, mais « van » et « der » en font exactement trois — sans les
  écarter, « Van Der Mescht », « Van Der Westhuizen » et « Van Der Merwe » se
  valent tous, et trois hommes sans rapport deviennent candidats l'un pour
  l'autre. `joueurs.ts` porte la liste.

  Dans les trois cas, à défaut de conclure, on crée une fiche après avoir
  prévenu. C'est délibéré : un doublon se repère et se fusionne, une identité
  fausse ne se voit pas.
- `players` contient donc majoritairement des adversaires : 1 246 sur 1 370,
  quand 141 seulement ont porté le maillot catalan — 28 figurent des deux
  côtés. C'est normal. Les pages de liste filtrent déjà sur
  `isOpponent: false`.
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
  connues »).

  L'appariement compare les **noms complets mot à mot**, jamais le seul nom de
  famille : les deux sources ne coupent pas le nom au même endroit, la LNR
  écrivant « Levani Botia | VEIVUKE » là où la base porte « Levani | Botia ».
  Un mot en vaut un autre s'il en est le début (« Nafi » pour « Nafitalai »),
  ce qui absorbe les seconds prénoms des feuilles officielles — « Lewis Wesley
  LUDLAM », « Komiti junior ALAINUUESE ». Un **mot du nom de famille pèse plus
  lourd** qu'un prénom partagé : le banc bayonnais aligne Lucas Martin et Lucas
  Paulos quand la feuille annonce « Lucas Martin PAULOS ADLER ». Un seul mot
  commun ne suffit que s'il vient du nom de famille, ou si les noms de famille
  sont identiques — « Biyi Alo » pour « Akinbiyi Olabamigbe ALO ». En cas
  d'ex æquo, on échoue plutôt que de trancher : deux frères sur la même feuille
  (Moses et Paul Alo Emile) se départagent d'eux-mêmes au prénom.

  Deux patronymes sans rien de commun qui désignent la même personne relèvent
  de la table de **noms d'usage** de `scripts/lib/noms.ts`, à compléter à la
  main — jamais d'un assouplissement de la règle générale.
- **Une composition qui n'aligne pas quinze titulaires fait échouer le match.**
  Chaque titulaire de trop ajoute jusqu'à 80 minutes fictives au total de
  l'équipe, sans qu'aucun autre contrôle ne s'en aperçoive : les points
  retombent, les essais aussi. La LNR elle-même dessinait seize Lyonnais sur
  son terrain du 29 octobre 2022.
- Les statistiques agrégées de saison doivent correspondre au classement
  officiel avant d'être écrites (cf. `close-season-2025-2026.ts`).
- Après toute saisie touchant les scores ou les essais, relancer
  `npx tsx scripts/fix-bonus-points.ts --dry` : il recalcule tous les bonus et
  confronte les totaux de saison aux classements officiels connus.

### Rencontres à venir

Le calendrier d'une saison entre en base **avant** que ses matchs ne se
jouent : les 26 journées de 2026-2027 y sont depuis août 2026. Une rencontre à
venir n'a donc ni score ni résultat.

- `scoreUsap`, `scoreOpponent` et `result` sont **nullables** depuis la
  migration `match_scores_nullable`. `null` s'y lit « pas encore joué », jamais
  « zéro ».
- **Toute requête qui compte, classe ou agrège des matchs doit filtrer sur
  `MATCH_JOUE`** (`src/lib/matchs.ts`), sinon un calendrier à venir se compte
  en matchs nuls : c'est ce que faisait la série des cinq derniers résultats de
  l'accueil, qui affichait cinq N pour cinq rencontres non jouées. Le garde de
  type `estJoue()` accompagne le filtre, Prisma ne resserrant pas ses types sur
  un `where`.
- Les pages qui **listent** les rencontres, elles, les montrent avec la mention
  « à venir » : la fiche de match, le calendrier de la saison, la liste des
  matchs et l'admin.
- `fix-bonus-points.ts` les ignore : une saison sans match joué n'apparaît plus
  dans ses agrégats.

### Slugs

Toujours passer par `generatePlayerSlug(firstName, lastName, player.id)` et ses
équivalents dans `src/lib/slugs.ts`. Les pages de détail retrouvent
l'enregistrement en extrayant le CUID de la fin du slug
(`/([a-z0-9]{25,})$/`) : un suffixe fabriqué avec `Date.now()` ou un aléatoire
rend la fiche inaccessible (404). Voir `scripts/fix-broken-slugs.ts`.

**Et un slug fabriqué sans CUID du tout ne vaut pas mieux.** Il n'existait pas
de générateur pour les stades : `fix-match-venues.ts` s'était donc écrit un
`slugify(nom)` à lui, et les trois stades qu'il a créés le 27 août 2026 —
Aguiléra, Kingsholm, Guy-Boniface — ont répondu 404 jusqu'au 29. La leçon n'est
pas « faire attention » mais **fournir la fonction** : `generateVenueSlug(name,
city, id)` existe désormais, `fix-match-venues.ts` et `fix-broken-slugs.ts`
l'appellent tous deux, et la convention n'est plus écrite qu'à un seul endroit.
Le slug d'une entité ne peut de toute façon pas être calculé avant sa création,
puisqu'il porte son CUID : créer avec un slug provisoire, puis le réécrire.

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

  Trois choses ne sont pas sur la feuille elle-même :
  - le **score final** se lit sur la page de calendrier
    (`lireCalendrier(saison, phase)`), et c'est lui qui fait foi — celui que la
    feuille égrène au fil des actions saute parfois une transformation ;
  - le **coup d'envoi** à la minute près se lit dans le composant
    `header-timeline` de la feuille (`coupDEnvoi`), et nulle part ailleurs : le
    calendrier n'affiche l'horaire que des rencontres à venir. Attention, le
    bandeau de la prochaine journée porte le même champ en haut de chaque page ;
  - l'**arbitre central** est rendu comme un joueur sur `/compositions`, son
    poste portant le rôle (`lireCompositions().arbitre`).

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
  - **un changement peut porter deux noms faux à la fois.** À Aimé-Giral le
    22 février 2026, la feuille fait entrer Clément Mondinat à la 56ᵉ à la
    place de Grégoire Arfeuil : or Arfeuil ne peut pas sortir, il n'était
    jamais entré, et Mondinat ne figure ni parmi les vingt-trois publiés, ni
    sur aucun des deux terrains dessinés. Le terrain de fin de match, lui, est
    cohérent — Valentino n'y est plus, la ligne de trois-quarts a glissé et
    Arfeuil occupe le 14. Les deux noms de l'enregistrement sont décalés d'un
    cran. `seed-opponent-sheet.ts` porte une table `CHANGEMENTS_CORRIGES`
    pour ces cas-là, **vérifiés à la main** : y ajouter une ligne, c'est
    affirmer que la LNR se trompe, et il faut la démonstration sous les yeux.
    Le contrôle des minutes tranche : la version corrigée retombe sur 1 200,
    pas l'autre ;
  - **le brassard de capitaine est parfois posé sur toute l'équipe.** La
    feuille du 29 octobre 2022 désigne quinze capitaines catalans.
    `lireCompositions()` retire alors le renseignement : plus d'un capitaine
    vaut aucun, et « aucun » se lit « la feuille ne le dit pas », non
    « personne ne l'était » — `fix-opponent-lineup.ts` s'abstient de toucher
    au brassard dans ce cas, sauf si la base elle-même en porte deux ;
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

  **L'effectif d'un club** se lit sur `top14.lnr.fr/club/{club}/effectif-staff`,
  par `lireEffectif(club)`. Page en HTML ordinaire, une ancre `player-block` par
  joueur, dont le lien porte l'identifiant LNR ; le staff n'a pas de lien
  `/joueur/` et ne remonte donc pas. Le nom y est écrit « Prénom NOM », le nom
  de famille tout en capitales : c'est la **seule source qui dise où couper**,
  et elle règle les cas que les feuilles rendent ambigus — « Sama Leonardo |
  MALOLO », « Cedate | GOMES SA », « Jacobus | VAN TONDER ».

  Deux réserves. Le **poste y est plus grossier que l'enum du projet** :
  « 1ère ligne » confond les deux piliers et le talonneur, « 3ème ligne »
  englobe le numéro 8, et la fiche individuelle du joueur n'en dit pas plus. Et
  la LNR **ampute les accents** — « Noe DELLA SCHIAVA », « Theo FORNER »,
  « Jeronimo DE LA FUENTE » — : ne jamais réécrire une orthographe déjà en base
  à partir d'elle.

  **Ne pas se fier à `usap.fr` pour l'effectif.** Le 29 août 2026, sa page
  « équipe pro » affichait encore celui de la saison écoulée — Allan, Petaia,
  Ritchie et Brookes y figuraient toujours. La LNR, elle, était à jour : quatre
  des joueurs qu'elle avait retirés de Perpignan apparaissaient déjà dans
  l'effectif d'un autre club. Le site du club reste utile pour les **espoirs**,
  que la LNR ne publie pas, et pour les **postes précis** (il distingue pilier
  gauche, talonneur et pilier droit), sous réserve de sa fraîcheur.
- **Chronologie détaillée, en dernier recours** : API ESPN
  `site.api.espn.com/apis/site/v2/sports/rugby/{league}/summary?event={gameId}`
  (Top 14 = 270559, Challenge = 272073). L'identifiant se retrouve par
  `scoreboard?dates=AAAAMMJJ` sur la même ligue. Donne événements,
  remplacements, cartons et compositions, mais **pas** les arbitres ni
  l'affluence.

  **N'a plus d'emploi** : la LNR couvre le championnat, l'EPCR les coupes.
  Le script qui s'en servait a été supprimé plutôt que laissé à portée de
  main, le relancer aurait réécrasé la donnée officielle. La méthode reste
  consignée ici au cas où les deux sources viendraient à manquer, et à
  recouper impérativement. Le passage
  d'ESPN à la LNR sur 2024-2025 a corrigé quatre erreurs de fond en 26 matchs :
  un essai de Théo Ntamack Muyenga attribué à **Romain Ntamack** — ESPN choisit
  le frère célèbre —, une transformation et une pénalité de Jérémy Fernandez
  portées à Louis Le Brun, un carton jaune fantôme à la minute même d'un essai,
  et un drop absent du détail. ESPN **omet aussi les essais de pénalité** de sa
  chronologie, ce qui fait manquer 7 points au contrôle, et **raccourcit les
  noms composés** (« Dany Priso » pour Priso Mouangue). Ses minutes de carton
  s'écartent de 1 à 3 minutes de l'officiel.
- **Coupes d'Europe — l'EPCR, et rien d'autre.** Ce que la LNR est au
  championnat, l'EPCR l'est aux coupes : la source officielle, plus complète
  qu'aucune autre.

  Le site `epcrugby.com` est un Nuxt en rendu serveur, mais il n'y a pas à le
  gratter — ses pages appellent un flux public alimenté par Opta, dont la clé
  d'API est celle du front, publiée dans la page :

  ```
  https://rugby-union-feeds.incrowdsports.com/v1/matches?provider=rugbyviz&compId={comp}&season={saison}
  https://rugby-union-feeds.incrowdsports.com/v1/matches/{id}?provider=rugbyviz
  ```

  avec les en-têtes `X-API-KEY`, `X-APP-ID: web` et `X-REALM: epcr`. `compId`
  vaut 1026 pour le Challenge et 1008 pour la Champions Cup ; la saison
  s'écrit `202301` pour 2023-2024. **Passer par `scripts/lib/epcr.ts`**, qui
  fait déjà tout le travail : `chercherMatchUsap(saison, jour)` puis
  `lireMatch(id)`, `entetesEpcr()` si l'on doit interroger le flux ailleurs.

  **La clé ne vit plus dans le dépôt** : elle se lit dans `EPCR_API_KEY`, à
  poser dans `.env` (cf. `env.example`). Non qu'elle soit sensible — c'est la
  clé publique du front, écrite dans la configuration de ses pages, en lecture
  seule, et elle n'est pas à nous : rien à révoquer si elle circule. Mais un
  scanner de secrets la signalait à chaque poussée, le motif `X-API-KEY`
  suffisant à déclencher l'alerte. La retrouver, si besoin : chercher
  « apiKey » dans la source d'une page de match d'`epcrugby.com`.

  Attention, `.env` et non `.env.local` : les scripts ne voient que le premier,
  chargé au passage par `@prisma/client`. `entetesEpcr()` lit la variable **à
  l'appel** et se replie sur `process.loadEnvFile()`, pour ne dépendre ni de
  l'ordre des imports ni de la présence de Prisma.

  Ce que le flux donne, et qu'aucune autre source ne donne aussi bien :
  - les **vingt-trois joueurs de chaque équipe**, avec leur dossard
    (`positionId`, 1 à 15 pour les titulaires) et le brassard ;
  - les **réalisations par joueur**, qui retombent exactement sur le score,
    essais de pénalité déduits ;
  - les **entrées et sorties**, minute par minute ;
  - l'**arbitre**, l'**affluence** et le **score à la mi-temps**, que la LNR ne
    publie pas.

  Trois réserves :
  - le type d'événement `Penalty` désigne une pénalité **concédée**, pas un
    coup de pied réussi. Compter les événements donnerait onze pénalités dans
    un match qui en compte quatre : les points se lisent dans les `stats` du
    joueur, jamais dans la chronologie ;
  - `minutesPlayedTotal` **retire les dix minutes d'un carton jaune**, ce que
    la convention du projet refuse. Les minutes sont donc reconstituées à
    partir des entrées et sorties, la valeur d'Opta ne servant que de
    contrôle ;
  - Opta signale capitaine **tout joueur qui l'a été**, si bien qu'un match
    où le brassard change de mains en désigne deux — Ben Carter et Angus
    O'Brien pour les Dragons, le 7 décembre 2025. `epcr.ts` ne garde que celui
    du coup d'envoi, c'est-à-dire, parmi les titulaires signalés, le premier
    sorti : c'est son remplacement qui a fait passer le brassard. Quand aucun
    des deux ne sort, on ne désigne personne ;
  - depuis 2025-2026 les coupes appliquent le **carton rouge de vingt
    minutes**, et Opta note alors la sortie de l'exclu à la minute où son
    suppléant entre. Pris au pied de la lettre, cela lui donnerait vingt
    minutes qu'il n'a pas jouées — Duncan Paia'aua, exclu à la 14ᵉ contre les
    Dragons le 7 décembre 2025, est remplacé à la 35ᵉ. Le carton doit être
    traité dans la chronologie, avant les changements de la même minute.
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

Le code réutilisable va dans `scripts/lib/` : `lnr.ts` pour les feuilles de la
LNR, `epcr.ts` pour le flux des coupes d'Europe, `noms.ts` pour le
rapprochement des noms entre une source et la base, `joueurs.ts` pour
retrouver ou créer une fiche à partir d'une feuille officielle, et
`arbitres.ts` pour
celui des arbitres — plus strict, puisqu'il exige le nom de famille : le corps
arbitral français aligne assez d'Adrien pour qu'un rapprochement au prénom
confonde Adrien Marbot et Adrien Descottes. Ce dernier porte une table de **noms d'usage** — deux patronymes sans
rien de commun qui désignent la même personne, comme Waisea Nayacalevu, que la
LNR inscrit sous Vuidravuwalu. La table est **vérifiée à la main** : y ajouter
une paire, c'est affirmer que ce sont deux noms d'un même homme, et c'est le
seul moyen d'apparier ces cas-là sans relâcher la règle générale.

**Quand une source se révèle fautive, désarmer le script qui s'en servait**
plutôt que de le laisser en l'état. `seed-opponent-scorers-2024-2025.ts`, qui
tenait ses marqueurs d'ESPN, a d'abord été ramené aux seuls matchs de
Challenge après le passage à la LNR, puis **supprimé** quand l'EPCR a repris
ces matchs-là : le relancer n'aurait plus pu que réécraser de la donnée
officielle par de la donnée fautive. Même logique pour un script de match dont
on découvre qu'il inventait des noms : le réécrire sous le même nom de
fichier, pour qu'aucune ancienne version ne subsiste et ne puisse recréer les
doublons.

### Scripts de maintenance

À connaître avant d'en écrire un nouveau, et à relancer après un gros import :

| Script | Rôle |
|---|---|
| `fix-bonus-points.ts` | recalcule tous les bonus et les totaux de saison, refuse d'écrire si un classement officiel connu diverge |
| `fix-broken-slugs.ts` | réécrit les slugs dont le suffixe ne permet plus de retrouver l'entité (fiche en 404) |
| `normalize-opponent-players.ts` | rattache les anciennes lignes `opponentPlayerName` à un vrai `Player` |
| `merge-duplicate-players-2026.ts` | fusion de doublons, paires listées en dur et vérifiées à la main |
| `merge-opponents.ts` | fusionne deux fiches de club (`--keep`, `--drop`, `--nom`) ; repointe matchs, anciens noms et clubs de carrière, et fait hériter la fiche conservée des champs qu'elle n'avait pas |
| `merge-players.ts` | fusionne deux fiches désignées par leur identifiant (`--keep`, `--drop`, `--nom`) ; ne cherche rien de lui-même, refuse la fusion si les deux figurent sur un même match |
| `rename-player.ts` | renomme une fiche, slug compris — un slug refait à la main sans le CUID rend la fiche introuvable |
| `reassign-match-player.ts` | change le joueur porté par un dossard sur une feuille, quand la base a mis quelqu'un d'autre et que les deux noms se ressemblent trop pour que l'audit s'en aperçoive |
| `delete-orphan-players.ts` | supprime les fiches vides de bout en bout — aucune feuille, aucun événement, aucune donnée personnelle ; les figures historiques sans match saisi sont ainsi protégées |
| `close-season-2025-2026.ts` | modèle de clôture de saison, avec garde-fou sur le classement officiel |
| `seed-opponent-sheet.ts` | **le script du chantier adverse** : reprend une saison entière depuis la LNR — réalisations, cartons et temps de jeu reconstitués à partir des changements. Prend la saison en argument (`2023-2024`), `--dry` pour simuler, `--detail` pour le relevé des écarts avec la base, `--match=AAAA-MM-JJ` pour n'en reprendre qu'un, `--usap` pour traiter **aussi le camp catalan** — il passe alors deux fois, l'adverse puis l'USAP |
| `seed-lineup.ts` | crée les **deux compositions** d'un match depuis la LNR quand il n'en a aucune — dossards, titulaires, capitaine, poste déduit du numéro. Premier temps de la reprise d'une rencontre ancienne ; `--dry`, `--force` pour réécrire |
| `seed-chronologie.ts` | écrit la **ligne de temps** d'un match depuis la LNR : essais, transformations déduites du score courant, pénalités, drops et cartons, avec les noms tels que la base les écrit. Troisième temps ; `--dry` |
| `seed-calendrier-2026-2027.ts` | crée une saison et son calendrier de championnat **avant** qu'elle ne commence : date, heure, journée, adversaire, lieu, sans score ni résultat. Une relance met à jour les dates au fur et à mesure que la LNR les cale |
| `seed-season-2021-2022.ts` | crée les rencontres d'une saison entière — date et heure, compétition, adversaire, lieu, score, réalisations, résultat, bonus, arbitre — puis les agrégats de saison. Premier jalon de la phase 4 |
| `seed-cup-sheet.ts` | **le pendant pour les coupes d'Europe**, depuis l'EPCR : réalisations, cartons et temps de jeu des **deux camps**, plus l'arbitre, l'affluence et la mi-temps. Sans argument il reprend les dix-huit matchs européens ; `--dry`, `--detail`, `--match=AAAA-MM-JJ` comme le précédent |
| `audit-opponent-lineups.ts` | confronte les compositions adverses aux feuilles officielles LNR ; lecture seule, à lancer sur une saison ou sur tout |
| `fix-opponent-lineup.ts` | remet une composition en accord avec la feuille officielle — LNR pour le championnat, EPCR pour les coupes — (identités, dossards, titulaires, capitaine) ; `--usap` traite aussi le camp catalan |
| `fetch-club-logos.ts` | rapatrie les logos officiels des clubs dans `public/images/logos/`, depuis les CDN de la LNR et de l'EPCR, et renseigne `Opponent.logoUrl` |
| `fix-match-venues.ts` | met les stades en ordre : fusionne les doublons, crée les manquants, rattache chaque club à son terrain — déduit des déplacements déjà enregistrés — puis complète les matchs sans lieu |
| `sync-effectif.ts` | met l'effectif professionnel en accord avec la LNR : crée les fiches manquantes, lève `isActive` sur l'effectif et l'abaisse sur les partants ; refuse d'écrire tant qu'un doublon ou un nom douteux subsiste |
| `fix-null-penalty-tries.ts` | met à 0 les compteurs `penaltyTries` restés `null`, mais seulement là où les points retombent déjà sur le score |

`fix-duplicate-players.ts` existe aussi mais apparie les prénoms par préfixe et
par inclusion : trop large pour être lancé sans revue préalable.

## Logos des clubs

Les 32 adversaires ont leur logo, servi par le site lui-même depuis
`public/images/logos/{club}.png` — 3,5 Mo au total. Ils viennent des sources
officielles, que les scripts lisent déjà : `cdn.lnr.fr/club/{slug}/photo/logo.
{empreinte}` pour les clubs français, le champ `imageUrl` du flux de l'EPCR
pour les européens. `fetch-club-logos.ts` fait la moisson.

Pourquoi les héberger plutôt que pointer vers ces CDN : leurs URL portent une
empreinte qui change au gré des mises à jour, le lien direct peut être bloqué,
et un chemin local évite d'autoriser des hôtes distants dans `next.config.ts`.

Deux logos avaient été téléversés à la main sur Supabase — Clermont et
Toulon. Le script les rapatrie **tels quels** par défaut, comme tout logo déjà
en `https://` : il recopie au lieu d'aller en chercher un autre. Celui de
Clermont a ensuite été repris à la source, car c'était le seul JPEG de la
série, donc sans transparence — un rectangle blanc derrière l'écusson en thème
sombre. `--club=Clermont` force ce retéléchargement ; `--usap` fait de même
pour `public/images/usap/logo.png`, l'écusson catalan que le site affiche
partout ailleurs.

Les originaux de la LNR sont de tailles très inégales : 2000×2000 pour
Bordeaux, 151×151 pour Clermont et Perpignan. Le plus petit reste confortable
— le plus grand affichage est de 48 pixels — mais il ne faut pas s'attendre à
la même finesse partout.

Les logos de club sont des marques déposées. Les afficher sur un site
d'histoire non commercial est l'usage, mais c'est un choix qui appartient au
propriétaire du site.

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

2026-2027 n'est encore qu'un calendrier : ses 26 journées de Top 14 sont en
base avec leur date, leur adversaire et leur terrain, sans score ni résultat.
Seules les cinq premières ont un horaire — la LNR ne cale les coups d'envoi
qu'au fil des désignations télévisées, et pose d'ici là une date de référence
que le script rafraîchira à chaque relance.

Son **effectif**, lui, est à jour au 29 août 2026 : 50 joueurs portent
`isActive`, repris de la LNR par `sync-effectif.ts`. Six fiches ont été créées
à cette occasion — Riccioni, Amituanai, McGrath, Reece, Kubunakaravi, Ennor —
et neuf réactivées, dont plusieurs qui n'existaient en base que comme
adversaires. Trente-trois joueurs de 2025-2026 ont été abaissés. Deux points
restent ouverts : les postes de Riccioni et d'Amituanai, que la LNR range en
« 1ère ligne » sans trancher entre pilier et talonneur, et l'absence de lignes
`SeasonPlayer` pour 2026-2027 — le modèle est alimenté de 2022-2023 à
2025-2026, mais il porte un dossard que la LNR ne publie pas avant les
premières feuilles.

**Les matchs de 2022-2023 à 2025-2026 ont leurs 46 joueurs et leur
chronologie.** 2021-2022, première saison de la phase 4, n'a que ses
rencontres — sauf **tout son championnat, repris le 29 août 2026** : les
26 journées de Top 14 portent chacune leurs 46 joueurs et leur chronologie.
Restent les quatre matchs de Challenge européen et le barrage d'accession,
que la chaîne actuelle ne sait pas traiter (cf. « Où reprendre »). La mi-temps et les comptes-rendus manquent
pour toute la saison, la LNR ne les publiant pas.

Annexe du match :

| Saison | Matchs | Arbitres | Mi-temps | Vidéos | Comptes-rendus | Affluences |
|---|---|---|---|---|---|---|
| 2026-2027 | 26 à venir | — | — | — | — | — |
| 2025-2026 | 32 | 32 | 32 | 31 | 32 | 7 |
| 2024-2025 | 32 | 32 | 32 | 24 | 28 | 15 |
| 2023-2024 | 30 | 30 | 30 | 29 | 30 | 6 |
| 2022-2023 | 31 | 31 | 30 | 21 | 31 | 4 |
| 2021-2022 | 31 | 30 | 4 | 0 | 0 | 4 |
| 2008-2009 | 1 | 1 | 1 | 0 | 1 | 1 |

**Tous les arbitres sont renseignés.** Les quatre qui manquaient à 2022-2023
étaient ceux de ses matchs de Challenge, que le flux de l'EPCR a fournis — il
remonte plus loin que son site, dont le sélecteur de saison s'arrête à
2023-2024. La seule mi-temps encore vide est celle du barrage 2022-2023, que
la LNR ne donne pas.

Détail des joueurs adverses — le vrai chantier restant sur les saisons déjà
saisies. « Cohérents » compte les matchs dont la somme des points adverses
retombe sur le score, essais de pénalité déduits :

| Saison | Lignes avec minutes | Marqueurs | Matchs cohérents |
|---|---|---|---|
| 2025-2026 | 733 / 736 | 155 | 32 / 32 |
| 2024-2025 | 728 / 736 | 117 | 32 / 32 |
| 2023-2024 | 690 / 690 | 115 | 30 / 30 |
| 2022-2023 | 706 / 713 | 135 | 31 / 31 |

**Le chantier adverse est fini sur les quatre saisons saisies : leurs 126
matchs sont cohérents**, championnat depuis la LNR, coupes d'Europe depuis
l'EPCR. Les 31 matchs de 2021-2022 n'ont pas encore de composition. Les lignes sans
minutes sont celles des remplaçants qui ne sont pas entrés en jeu — `null` y
vaut « n'a pas joué », et non « on ne sait pas ».

Attention en reprenant une saison ancienne : le segment de phase du barrage a
changé trois fois — `match-daccession` en 2021-2022, `access` en 2022-2023,
`access-top-14` depuis 2024-2025. `seed-opponent-sheet.ts` essaie les deux
derniers.

### Où reprendre

Par ordre de valeur.

1. **Compléter 2021-2022** : ses 31 rencontres existent, il leur manque les
   compositions, la chronologie et la clôture éditoriale — entraîneur,
   président, bilan rédigé. La LNR publie les compositions de la saison, et le
   flux de l'EPCR celles des matchs de Challenge.

   **La chaîne est en place et éprouvée sur la J1** (Brive-USAP 36-15, le
   4 septembre 2021), en trois temps :

   ```bash
   npx tsx scripts/seed-lineup.ts AAAA-MM-JJ --dry
   npx tsx scripts/seed-opponent-sheet.ts 2021-2022 --match=AAAA-MM-JJ --usap --dry
   npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ --dry
   ```

   Compositions, puis réalisations et temps de jeu des deux camps, puis ligne
   de temps. Chacun a son `--dry`, et le second refuse d'écrire si les points
   ne retombent pas sur le score.

   **Restent cinq matchs, qu'elle ne sait pas traiter**, et pour deux raisons
   distinctes :
   - les **quatre matchs de Challenge européen** (11 décembre 2021, 15 et
     22 janvier, 9 avril 2022) relèvent de l'EPCR, que la LNR ne couvre pas.
     `seed-cup-sheet.ts` lit déjà réalisations et minutes depuis ce flux, mais
     aucun script ne crée la composition : il manque l'équivalent EPCR de
     `seed-lineup.ts` ;
   - le **barrage d'accession du 12 juin 2022** contre Mont-de-Marsan n'a pas
     de `matchday`, or `seed-lineup.ts` déduit la phase de ce champ. Son
     segment d'URL est `match-daccession` pour cette saison-là — le nom a
     changé trois fois depuis.

   **Relire la composition écrite, systématiquement** : c'est ce contrôle, et
   lui seul, qui a rattrapé les deux identités fausses des deux premières
   journées. Confronter chaque dossard au nom de la feuille, et regarder de
   près tout écart où le nom de famille ou le prénom diffère vraiment. Sur les
   vingt-six journées de championnat, il ne reste qu'un écart, répété à chaque
   feuille où il figure : « Matthieu Ugena » sur la feuille pour « Mathieu »
   en base — variante d'écriture, laissée telle quelle comme les 49 autres de
   la base.

   **Un contrôle trop naïf crie au loup**, et il y a deux façons de se
   tromper :
   - **les minutes ne font 1 200 que si personne n'a été exclu.** Pau n'en
     totalise que 1 147 le 2 octobre 2021, et c'est juste : Aminiasi Tuimaba a
     pris un rouge à la 27ᵉ, l'équipe a fini à quatorze — 1 200 − (80 − 27) ;
   - **la somme des points par joueur ne fait le score que sans essai de
     pénalité.** L'UBB en marque un le 23 octobre 2021 : 32 points répartis
     entre ses joueurs, 39 au tableau. Un essai de pénalité n'a pas de
     marqueur, il vit dans `penaltyTriesOpponent`.

   **Une seule anomalie réelle sur ces dix journées**, et elle vient de la
   source : le 30 octobre 2021, La Rochelle totalise 1 206 minutes. Sa feuille
   se contredit — Victor Vito sort **définitivement** à la 25ᵉ sur protocole
   commotion, puis elle le fait sortir encore à la 35ᵉ et rentrer deux fois.
   Aucune correction n'a été posée : on peut démontrer que la feuille est
   fausse, pas ce qui s'est réellement passé, et `CHANGEMENTS_CORRIGES` ne
   s'écrit qu'avec la démonstration sous les yeux. L'avertissement du script
   suffit.

   Deux choses que la chaîne ne fait pas : la **mi-temps**, que la LNR ne
   publie pas — elle se déduirait du dernier fait avant la 40ᵉ, mais c'est une
   inférence, pas une donnée —, et les **notes de retour en jeu**, écrites à
   la main comme les six autres de la base.
2. **Poursuivre la phase 4** en remontant : 2020-2021 (Pro D2, titre et
   montée), puis 2019-2020. `seed-season-2021-2022.ts` donne le modèle — mais
   la LNR sépare le Top 14 de la Pro D2, et `lnr.ts` ne connaît que le premier.
3. **Le fond** : affluences (37 matchs sur 157), photos et biographies (1
   joueur sur 144), et 113 saisons sans aucun match.

113 saisons sur 119 n'ont encore aucun match : c'est le chantier de la phase 4,
menée en remontant le temps saison par saison. 2021-2022 est la première
reprise ; son bilan, 9V 0N 17D et 43 points pour une treizième place, est
calculé depuis les scores officiels mais n'a pas encore été confronté à un
classement d'époque — le tableau de `fix-bonus-points.ts` ne le connaît pas.

### Limites connues

- `EventType` ne comporte pas `CARTON_ORANGE`. Le champ `MatchPlayer.orangeCard`
  existe et s'affiche, mais la sanction ne peut pas figurer dans la chronologie.
- Les fiches joueur affichent séparément « Matchs avec l'USAP » et « Matchs
  contre l'USAP ». Les statistiques ne comptent que les premiers. Toute nouvelle
  requête sur les joueurs doit filtrer `isOpponent: false`, sinon les 1 246
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
  | ÉCRITURE | ~70 | 49 |

  Les dossards, les brassards de capitaine et les identités fautives ont été
  repris depuis les feuilles officielles. Restent les ÉCRITURE, réparties sur
  26 matchs, qui sont des variantes de bonne foi — diminutifs (« Billy » pour
  Viliami Vunipola, « Tom » pour Thomas Staniforth) ou prénom d'usage
  (« Jonny » pour Jonathan Gray, « Paddy » pour David Patrick Jackson).

  **Une divergence d'écriture peut cacher un doublon.** La composition de
  Grenoble au barrage 2024-2025 en portait dix-sept, toutes sur le prénom, le
  nom de famille étant juste. Neuf d'entre elles n'étaient pas des fautes
  d'orthographe mais des **fiches en double** de joueurs déjà en base sous
  leur vrai prénom — Zack Gauthier, Mathis Sarragallet, Pio Muarua, Wilfried
  Hulleu, Julien Hériteau, Julien Farnoux, Tommy Raynaud, Giorgi Javakhia,
  Eric Escande —, fusionnées depuis. Une dixième était une confusion de
  personnes : le 9 grenoblois était rattaché à **Baptiste** Couilloud, demi de
  mêlée de Lyon, au lieu de son frère **Barnabé**. Devant un prénom qui
  diverge, chercher d'abord si le bon joueur n'existe pas déjà ailleurs.

  Neuf feuilles de 2022-2023 restent illisibles, la LNR n'en publiant pas les
  compositions. Les dix-huit matchs de coupe, eux, ont été confrontés au flux
  de l'EPCR par `fix-opponent-lineup.ts` : aucune identité fautive, mais des
  dossards intervertis des deux côtés — quatre matchs pour l'adversaire, six
  pour l'USAP.

  Devant un nom qui ne s'apparie pas, soupçonner la base avant la source.
- **Les deux compositions sont désormais alignées sur les feuilles
  officielles**, l'USAP comprise : 131 lignes reprises sur une quarantaine de
  matchs de championnat, presque toutes des dossards de remplaçants dans le
  désordre et des brassards de capitaine. Sur 252 compositions, 239 portent
  exactement un capitaine, 13 aucun — les neuf feuilles que la LNR ne publie
  pas, et le match des Dragons du 7 décembre 2025, où l'EPCR en signale deux
  sans qu'on puisse les départager. Aucune n'en porte plusieurs.
- **La feuille LNR du 22 février 2026 se contredit sur les deux camps.**
  Côté palois elle fait entrer un vingt-quatrième homme (cf. la table
  `CHANGEMENTS_CORRIGES`) ; côté catalan, ses changements font entrer Victor
  Montgaillard et Kieran Brookes, qui ne figurent pas davantage sur les
  vingt-trois qu'elle publie, et sortir Mathys Lotrian qui n'était pas entré.
  La composition de l'USAP y est donc **laissée telle quelle** : la base
  garde Montgaillard au 17 là où la feuille met James Hall au 20. C'est le
  seul match dont `fix-opponent-lineup.ts --usap --identites` reste écarté.
- **`MatchEvent.playerId` ne sert presque à rien en l'état.** 922 des 1 086
  événements adverses ne le renseignent pas, mais la page publique du match ne
  le lit pas : elle affiche `event.description`, où le nom du marqueur est déjà
  écrit en clair. Seul le gestionnaire d'événements de l'admin s'en sert, pour
  afficher le nom à côté de la ligne. Le remplir ne se justifiera que le jour
  où la chronologie renverra vers les fiches joueur — c'est le travail
  d'interface qui a de la valeur, pas la colonne. Les réalisations par joueur
  adverse, elles, sont complètes : elles vivent dans `MatchPlayer`.
- **Onze fiches ne sont rattachées à aucun match, et c'est normal.** Cinq sont
  des figures citées pour mémoire, avec date de naissance et biographie — Dan
  Carter, Joseph Desclaux, Aimé Giral, Percy Montgomery et Jean-François
  Imbernon. Les six autres sont les recrues de 2026-2027, créées par
  `sync-effectif.ts` avant leur premier match. Ne pas les prendre pour des
  débris d'import : `players` sans `matchAppearances` n'est pas un critère
  suffisant, c'est l'absence de toute donnée personnelle qui l'est (cf.
  `delete-orphan-players.ts`).
- **`isActive` se lit « dans l'effectif professionnel », pas « au club ».**
  `sync-effectif.ts` ne connaît que la page de la LNR, qui ignore les espoirs :
  un joueur versé chez les jeunes est donc abaissé alors qu'il n'a pas quitté
  l'USAP. Thomas Serezat est dans ce cas — abaissé le 29 août 2026, il figure
  sur la page espoirs d'`usap.fr`. Simon Taty et Diego Mascarenc, eux,
  apparaissent sur les deux listes et restent actifs.
- Erreur d'hydratation React sur les pages de match, antérieure et non
  diagnostiquée (probablement `next-themes`).
- Affluences éparses — 37 matchs sur 157, l'EPCR ayant fourni celles des
  coupes ; peu de photos et de biographies de joueurs.
- **Le lieu d'un match ne se saisit pas à la main** : il se déduit du camp —
  Aimé-Giral à domicile, `Opponent.venueId` à l'extérieur. Les 157 matchs ont
  désormais leur stade. Quatre clubs n'ont pas encore de terrain rattaché —
  Connacht, Cardiff, Dragons, Lions —, l'USAP ne les ayant reçus qu'à
  Aimé-Giral : `fix-match-venues.ts` déduit un terrain des déplacements
  enregistrés, il ne peut rien pour ceux-là.
- Les modèles `CareerClub`, `PlayerStint`, `PlayerInternational` et
  `PlayerAward` existent mais ne sont pas alimentés.

## Commandes

```bash
npm run dev                          # serveur de développement (Turbopack)
npx tsc --noEmit                     # vérification des types — src/ SEULEMENT
npx tsx scripts/<script>.ts          # exécuter un script d'import
npx tsx scripts/<script>.ts --dry    # simulation, pour les scripts de masse

# Les scripts, que tsconfig.json exclut : à typer explicitement
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext \
  --moduleResolution bundler --esModuleInterop scripts/<script>.ts
```

⚠️ `tsconfig.json` porte `"exclude": ["node_modules", "scripts"]` : un
`npx tsc --noEmit` **ne vérifie aucun script**, et `tsx` ne fait que retirer
les types sans les contrôler. Un script peut donc être exécuté cent fois sans
qu'une erreur de typage se manifeste — deux `possibly null` dormaient ainsi
dans `seed-opponent-sheet.ts`. D'où la seconde commande, à passer sur les
scripts touchés. Deux erreurs préexistantes subsistent dans
`fix-opponent-lineup.ts` (`Bilan` inféré `never`), sans effet à l'exécution.

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
