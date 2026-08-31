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

## Reprendre une saison — la marche à suivre

C'est le travail courant du projet, et il est rodé : deux saisons complètes,
2021-2022 et 2020-2021, l'ont été par cette chaîne. **Suivre l'ordre**, chaque
étape supposant la précédente.

### 0. Reconnaître le terrain

```bash
# Quelle division ? Combien de matchs déjà en base ?
npx tsx -e 'import{PrismaClient}from"@prisma/client";const p=new PrismaClient();
p.season.findFirst({where:{label:"AAAA-AAAA"},include:{_count:{select:{matches:true}}}})
.then(s=>{console.log(s);return p.$disconnect()})'
```

Puis repérer la forme de la saison sur le site de la LNR — `top14.lnr.fr` ou
`prod2.lnr.fr` selon la division : combien de journées, quelles phases
finales, y a-t-il une campagne européenne. Les segments d'URL des phases
finales sont `demi-finales`, `finale`, `barrages`, et le barrage d'accession a
changé trois fois de nom (cf. `phasesBarrage`).

### 1. Les rencontres

Écrire un `seed-season-AAAA-AAAA.ts` sur le modèle du plus proche :
`seed-season-2020-2021.ts` pour une saison de Pro D2 sans coupe,
`seed-season-2021-2022.ts` pour une saison de Top 14 avec Challenge européen.
Y placer :

- la liste des phases et le nombre de journées ;
- les clubs que la base ne connaît pas encore, **avec leurs noms relevés sur le
  classement officiel** (`{top14|prod2}.lnr.fr/classement/AAAA-AAAA`), jamais
  de mémoire ;
- le **classement officiel de l'USAP** en garde-fou des agrégats : victoires,
  nuls, défaites, points marqués et encaissés, total. Le script doit refuser
  d'écrire s'il s'en écarte. C'est le contrôle qui valide la saison entière.

```bash
npx tsx scripts/seed-season-AAAA-AAAA.ts --dry   # attendu : 0 en échec
npx tsx scripts/seed-season-AAAA-AAAA.ts         # attendu : ✔ conforme au classement
```

### 2. Compositions, feuilles, chronologies

Pour chaque match, dans cet ordre, en traitant la saison par lots de quatre
journées — un lot rate rarement, et le lot suivant profite des doublons
soldés :

```bash
npx tsx scripts/seed-lineup.ts AAAA-MM-JJ --dry        # 46 lignes attendues
npx tsx scripts/seed-lineup.ts AAAA-MM-JJ
npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA --match=AAAA-MM-JJ --usap --dry
npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA --match=AAAA-MM-JJ --usap
npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ --dry
npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ
```

Le script de feuille accepte la saison entière d'un coup une fois toutes les
compositions écrites — `npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA
--usap` —, ce qui est bien plus rapide que match par match. Pour une coupe
d'Europe, c'est `seed-cup-sheet.ts --match=AAAA-MM-JJ` à la place.

### 3. Les contrôles, et ils ne sont pas facultatifs

```bash
npx tsx scripts/fix-bonus-points.ts --dry    # 0 correction attendue
```

Et surtout, **la confrontation nom à nom de chaque composition écrite avec la
feuille officielle**. C'est ce contrôle, et lui seul, qui a rattrapé les deux
identités fausses de 2021-2022 : les sommes de minutes et de points
retombaient parfaitement dans les deux cas, puisque c'est le bon dossard qui
portait les bonnes actions. Comparer, pour chaque dossard, le nom de la base
au nom de la feuille, et regarder de près tout écart où le **nom de famille**
diffère.

### Ce qui casse, et quoi en faire

| Message | Cause | Geste |
|---|---|---|
| `N fiches candidates … à arbitrer` | doublon en base — deux fiches également couvertes par le nom officiel | inspecter les deux fiches, puis `merge-players.ts --keep= --drop= --dry` |
| `[inconnu] … ne désigne aucune des fiches proches` | homonymes partiels, aucun n'est le bon | rien à faire : la fiche est créée, c'est un homme de plus |
| `[homonyme] … laissé de côté` | deux personnes, même patronyme | vérifier la fiche citée ; si ce sont bien deux hommes, laisser créer |
| `Compositions non publiées par la LNR` | archive muette | essayer `prod2.lnr.fr`, qui archive mieux ; en dernier recours, composition à la main recoupée avec les changements (cf. `seed-lineup-barrage-2022.ts`) |
| `N joueurs sur la feuille, 22 au moins` | la LNR oublie un remplaçant | accepté tel quel si les quinze titulaires sont là |
| `réalisations incohérentes` | score courant fautif | lire les faits du match ; le total final fait foi |
| `N point(s) inexpliqué(s)` | transformation non inscrite | le script la rattrape sur les deux camps ; s'il échoue encore, la feuille est fautive |
| `… hors composition` sur un auteur | essai collectif, ou composition fausse | soupçonner la base avant la source |
| `… hors composition` sur un **carton** | la LNR sanctionne un homme qu'elle n'aligne pas | irrattachable : après démonstration, l'inscrire dans `CARTONS_HORS_COMPOSITION` de `seed-opponent-sheet.ts`, qui l'ignore et écrit le reste |
| `feuille LNR introuvable` | mauvais segment de phase | `phasesLnr()` ; vérifier le nom du segment sur le calendrier |
| minutes ≠ 1 200 | carton rouge, ou retour non enregistré | un rouge abaisse le total de `80 − minute` ; sinon signaler, ne pas inventer |
| points des joueurs < score | essai de pénalité ou essai collectif | légitime, ces essais n'ont pas d'auteur |

### Quatre pièges qui coûtent du temps

1. **`npx tsc --noEmit` ne vérifie aucun script** : `tsconfig.json` exclut
   `scripts/`, et `tsx` retire les types sans les contrôler. La commande à
   passer est dans « Commandes ».
2. **Ne pas filtrer la sortie d'un lot au point de masquer un échec.** Une
   journée de 2021-2022 est passée pour réussie parce que le filtre ne
   retenait pas son message d'erreur ; elle avait écrit une demi-composition.
3. **Lire une liste de changements en entier avant d'en conclure quoi que ce
   soit.** Une correction a été posée sur la foi d'une liste tronquée, et elle
   aggravait l'écart qu'elle prétendait réparer.
4. **Le poste de référence d'une fiche sert de repli** pour toutes ses lignes
   de remplaçant : un poste faux se propage silencieusement.

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
- **Chercher sur toute la table demande trois garde-fous**, que
  `scripts/lib/joueurs.ts` et `scripts/lib/noms.ts` portent tous les trois.
  Ils ont chacun leur accident fondateur, tous découverts en relisant une
  feuille reprise :
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
    exige donc désormais un mot du **nom de famille** ;
  - **deux mots communs doivent venir de deux mots distincts.** « Clement
    RIC », talonneur de Lyon, a été enregistré sous Ricky Riccitelli le
    13 avril 2019 : « Ricky » et « Riccitelli » sont l'un et l'autre le
    prolongement de « Ric », si bien que les deux mots communs exigés étaient
    réunis par **un seul** mot de la feuille. Un nom court attirait ainsi tous
    les noms longs qui commencent comme lui. `proximite()` consomme désormais
    chaque mot de la cible au plus une fois.

  S'y ajoute une quatrième précaution, née des noms sud-africains : **les
  particules ne désignent personne.** `mots()` écarte déjà ce qui fait moins de
  trois lettres, mais « van » et « der » en font exactement trois — sans les
  écarter, « Van Der Mescht », « Van Der Westhuizen » et « Van Der Merwe » se
  valent tous, et trois hommes sans rapport deviennent candidats l'un pour
  l'autre. `joueurs.ts` porte la liste.

  Dans tous les cas, à défaut de conclure, on crée une fiche après avoir
  prévenu. C'est délibéré : un doublon se repère et se fusionne, une identité
  fausse ne se voit pas. Cela vaut aussi quand **plusieurs** fiches se
  ressemblent sans qu'aucune ne soit désignée par le nom officiel : on ne lève
  plus, on prévient et on crée — « Jakobus Christo Janse Van Rensburg »,
  pilier de Grenoble en 2018-2019, tombait entre Röhan le centre et Nicolaas
  le troisième ligne, et n'est ni l'un ni l'autre. Deux fiches également
  couvertes par le nom officiel restent, elles, une ambiguïté, et lèvent.

  À l'inverse, deux écritures d'un même homme que rien ne rapproche relèvent
  de la table `NOMS_DUSAGE` de `noms.ts` — patronyme de rechange (Nayacalevu /
  Vuidravuwalu) ou prénom d'usage sans lettre commune avec l'état civil
  (« Paddy » pour Patrick, « Richie » pour Richard). L'abréviation ordinaire
  n'a pas besoin de la table, le préfixe suffit.
- `players` contient donc majoritairement des adversaires : 2 937 fiches ont
  joué **contre** l'USAP, 276 sous son maillot — 127 des deux côtés. C'est
  normal. Les pages de liste filtrent déjà sur `isOpponent: false`.
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
  remplaçant n'est pas entré. Quatre précisions :
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
  - **Un couperet peut aller en prolongations**, et le match dure alors
    **100 minutes**. La somme des minutes d'une équipe vaut 1 500 et non
    1 200 : c'est le cas de la demi-finale du 17 mai 2015 contre Agen, seule
    rencontre de la base dans ce cas. Une rencontre de championnat, elle, ne
    se prolonge jamais — un fait tardif n'y est qu'un arrêt de jeu, la LNR
    additionnant les minutes additionnelles à la minute du fait.
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
pas de `matchday` et que son `round` ne commence pas par « Poule » —
`estCouperet()` de `src/lib/matchs.ts` porte la règle, et sert aussi à
détacher la phase finale de la phase régulière sur la page de saison.

### Contrôles à faire systématiquement

- La somme des points par joueur doit retomber sur le score de l'équipe.
  Un **essai de pénalité** (7 pts) n'a pas de marqueur : le déduire du total
  attendu et le porter sur `penaltyTriesUsap` / `penaltyTriesOpponent`.
  **Il n'a valu sept points d'office que depuis 2017** : avant, c'était un
  essai à cinq points qu'il fallait encore transformer, et les feuilles de la
  LNR en nomment le buteur. La base le garde malgré tout à sept,
  transformation comprise et non comptée, pour que la règle ci-dessus vaille
  sur toute la base — ce qui suppose la transformation réussie. **Un essai de
  pénalité manqué vaudrait cinq points** : l'arithmétique ne retomberait plus,
  et les scripts échoueraient bruyamment, ce qui est le comportement voulu.
  Aucun des huit de 2016-2017 n'est dans ce cas ; c'est en remontant plus haut
  qu'il faut s'y attendre. Ces
  compteurs sont **nullables et parfois `null`** (9 matchs à ce jour) : une
  garde écrite `points <> score - 7 * penaltyTries` ne compare alors rien du
  tout et laisse passer la ligne en silence. Traiter le `null` explicitement.
- **La LNR écrit « n.a. » quand elle ne sait pas qui a marqué**, et pas
  seulement sur un essai de pénalité : le Bayonne-Perpignan du 9 février 2013
  ne nomme aucun de ses trois marqueurs bayonnais. Ces points comptent pour
  l'équipe et pour personne — la somme des joueurs tombe alors sous le score,
  légitimement. À ne pas confondre avec un nom que la composition ignore, qui
  fait toujours échouer le match.
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

**Une source par compétition, et rien d'autre en première intention** : la LNR
pour le championnat — Top 14, Pro D2, barrage —, l'EPCR pour les coupes
d'Europe. Ce sont les seules sources officielles ; les autres se trompent sur
les noms, oublient des actions et décalent les minutes.

**Les modules font le travail, et portent les démonstrations.** Chaque
bizarrerie de chaque source est documentée dans `scripts/lib/lnr.ts` et
`scripts/lib/epcr.ts`, au code qui la contourne — c'est là qu'il faut aller
avant de toucher à l'un d'eux, pas ici.

#### La LNR — championnat

`{top14|prod2}.lnr.fr/feuille-de-match/{saison}/{phase}/{id}-{dom}-{ext}`,
l'identifiant venant de `/calendrier-et-resultats/{saison}/{phase}`. Deux
onglets : `/compositions` (les vingt-trois, numérotés, et l'arbitre central) et
`/resumes-replays` (faits de match et changements). Un simple `fetch` suffit.

Par `scripts/lib/lnr.ts` : `chercherFeuille` puis `lireFeuille`,
`lireCompositions`, `lireCalendrier`, `lireEffectif`, `phasesLnr`,
`utiliserDivision`.

| Donnée | Où |
|---|---|
| score final | `lireCalendrier` — **il fait foi**, la feuille saute parfois une transformation |
| coup d'envoi à la minute | `lireFeuille().coupDEnvoi`, par `momentDuMatch()` — **00:00 veut dire « inconnu »** |
| arbitre central | `lireCompositions().arbitre` |
| score après chaque fait, cartons, essais de pénalité | `lireFeuille().faits` |
| changements, avec définitif ou temporaire | `lireFeuille().changements` |
| affluence, mi-temps | **nulle part** |

Ce qu'il faut savoir avant d'écrire du code :

- **`conversionPlayer` ment** : il ne dit pas qu'il y a eu transformation, seul
  le score courant le dit. S'en servir pour *nommer* le buteur, jamais pour
  décider ;
- **le score courant déraille aussi** ; le total final tranche ;
- **le classement d'une saison ancienne peut additionner les phases finales**,
  et il ne le dit pas : celui de 2014-2015 donne 31 journées à Perpignan et à
  Albi, 32 à Mont-de-Marsan et à Agen — les quatre demi-finalistes —, quand son
  titre annonce « J30 ». Ceux de 2017-2018 et de 2020-2021, eux, s'arrêtent
  bien à la trentième. **Toujours regarder la colonne des journées avant de
  fonder un garde-fou dessus**, et retrancher les phases finales le cas
  échéant ;
- **un couperet peut être allé en prolongations**, et le match dure alors
  **cent minutes**, non quatre-vingts. `dureeDuMatch()` de
  `seed-opponent-sheet.ts` porte la règle et sa démonstration ;
- **un coup d'envoi à 00:00 veut dire « heure inconnue »**, non « joué à
  minuit » : la LNR en laisse ici et là, et pris au mot il recule le match
  d'un jour, minuit à +02:00 valant 22 heures la veille en temps universel.
  `momentDuMatch()` rend alors l'heure `null` et ancre la date à midi UTC.
  Un seul cas connu, le Perpignan-Dax du 21 août 2015 ;
- et **avant 2017-2018 il crédite neuf points à un essai de pénalité**, la
  transformation y étant comptée deux fois. `lireFeuille` le corrige et porte
  la démonstration, fait par fait ; sans elle, sept matchs de 2016-2017
  finissaient deux ou quatre points au-dessus de leur score officiel ;
- **les postes de `/compositions` ne sont pas fiables** : `positionPlayed` se
  déduit du numéro de maillot ;
- la LNR **ampute les accents** — ne jamais réécrire une orthographe déjà en
  base à partir d'elle ;
- elle **ne publie pas toutes ses compositions** : neuf journées de 2022-2023
  et le barrage 2021-2022 n'affichent que les officiels, quand ils affichent
  quelque chose ;
- un changement peut porter **deux noms faux à la fois** ; la table
  `CHANGEMENTS_CORRIGES` de `seed-opponent-sheet.ts` est faite pour ça, et ne
  s'écrit qu'avec la démonstration sous les yeux.

**La Pro D2 est sur un autre site**, `prod2.lnr.fr`, de structure identique :
`utiliserDivision("prod2")` avant tout appel, ce que les trois scripts de la
chaîne font d'eux-mêmes d'après `Season.division`. Il **archive mieux que
celui du Top 14** — il publie les compositions de 2020-2021, et c'est lui qui
a fourni les prénoms manquants du barrage 2021-2022 : y penser dès que le
site Top 14 reste muet sur un match qui concerne un club de deuxième division.

#### L'EPCR — coupes d'Europe

Flux public alimenté par Opta, `rugby-union-feeds.incrowdsports.com`, appelé
par les pages d'`epcrugby.com`. Par `scripts/lib/epcr.ts` :
`chercherMatchUsap`, `lireMatch`, `lireEvenements`, `entetesEpcr`.

Il donne les vingt-trois de chaque camp avec dossard et brassard, les
réalisations par joueur, les entrées et sorties, la chronologie, **et ce que
la LNR ne donne pas : arbitre, affluence, mi-temps**. Les joueurs y portent un
identifiant Opta, qu'on rattache à la composition **par le dossard** — aucun
rapprochement de noms, donc aucune erreur d'identité possible.

- **Le flux ne remonte pas avant 2020-2021.** Il ne rend rien sur 2019-2020 et
  au-delà, et le site de l'EPCR n'offre plus que les saisons récentes : les
  campagnes européennes antérieures n'ont, à ce jour, aucune source lisible.
- **La clé d'API se lit dans `EPCR_API_KEY`**, à poser dans `.env` et **non**
  dans `.env.local`, que les scripts ne voient pas. Clé publique du front, sans
  rien de sensible ; elle est sortie du dépôt parce qu'un scanner de secrets la
  signalait à chaque poussée.
- **Une affluence à zéro veut dire « inconnue »**, pas « aucun spectateur ».

#### Les autres, et ce qu'elles valent

- **`usap.fr`** — à ne pas croire sur l'effectif : le 29 août 2026 sa page
  « équipe pro » affichait encore celui de la saison écoulée. Utile pour les
  **espoirs**, que la LNR ne publie pas, et pour les **postes précis**, sous
  réserve de sa fraîcheur.
- **ESPN** (`site.api.espn.com/apis/site/v2/sports/rugby/{league}/summary`,
  Top 14 = 270559) — **n'a plus d'emploi**, et son script a été supprimé
  plutôt que laissé à portée de main. Le passage d'ESPN à la LNR sur
  2024-2025 a corrigé quatre erreurs de fond en 26 matchs : ESPN attribue les
  essais au frère célèbre, invente des cartons, oublie les essais de pénalité
  et raccourcit les noms composés. À ne ressortir que si les deux sources
  officielles venaient à manquer, et à recouper impérativement.
- **allrugby.com** — seule source retrouvée pour le Challenge Cup 2022-2023,
  mais **injoignable au 29 août 2026** (son hôte `www` ne répond plus). Si
  elle revient : son tableau se lit **colonne par colonne** — treize colonnes,
  les réalisations de l'USAP à gauche du nom, celles de l'adversaire à droite,
  le club recevant à gauche et non l'USAP, et les remplacements de droite
  écrivent la minute avant le nom, l'inverse de la gauche.
- **Direct commenté** : rugbyrama.fr, ici.fr — pour l'arbitre, la mi-temps et
  les faits de match.
- **Résumé vidéo** : chaîne YouTube « TOP 14 - Officiel ». **Vérifier chaque
  identifiant** par `youtube.com/oembed?url=…&format=json` : le HTML de
  recherche désaligne titres et identifiants.

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
retrouver ou créer une fiche à partir d'une feuille officielle, `fusion.ts`
pour l'absorption d'une fiche par une autre, et `arbitres.ts` pour
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
| `etat-couverture.ts` | lecture seule : l'état de la couverture saison par saison, ce que les tableaux de CLAUDE.md faisaient à la main |
| `fix-bonus-points.ts` | recalcule tous les bonus et les totaux de saison, refuse d'écrire si un classement officiel connu diverge |
| `fix-broken-slugs.ts` | réécrit les slugs dont le suffixe ne permet plus de retrouver l'entité (fiche en 404) |
| `normalize-opponent-players.ts` | rattache les anciennes lignes `opponentPlayerName` à un vrai `Player` |
| `detect-duplicate-players.ts` | **cherche les fiches en double**, lecture seule : nom complet identique (CERTAIN), ou même patronyme + même club + même dossard ou poste, jamais sur la même feuille (FORT), ou même poste et clubs différents (`--tout`, À VOIR). Ne fusionne ni ne propose rien ; sa table `DISTINCTS` retient les paires déjà arbitrées comme étant deux hommes. **À relancer après tout import et après toute fusion** |
| `merge-duplicate-players-2026.ts` | fusion de doublons, paires listées en dur et vérifiées à la main |
| `merge-duplicate-players-2026-08.ts` | **l'attestation des 25 fusions du 30 août 2026** : le lot en dur, chaque ligne accompagnée du nom que la source officielle écrit. Déjà appliqué, donc sans effet ; il ne vaut que par ce qu'il consigne, et pour rejouer le lot sur une base repartie de zéro |
| `merge-opponents.ts` | fusionne deux fiches de club (`--keep`, `--drop`, `--nom`) ; repointe matchs, anciens noms et clubs de carrière, et fait hériter la fiche conservée des champs qu'elle n'avait pas |
| `merge-players.ts` | fusionne deux fiches désignées par leur identifiant (`--keep`, `--drop`, `--nom`) ; ne cherche rien de lui-même, refuse la fusion si les deux figurent sur un même match. Simple ligne de commande au-dessus de `lib/fusion.ts` |
| `rename-player.ts` | renomme une fiche, slug compris — un slug refait à la main sans le CUID rend la fiche introuvable |
| `reassign-match-player.ts` | change le joueur porté par un dossard sur une feuille, quand la base a mis quelqu'un d'autre et que les deux noms se ressemblent trop pour que l'audit s'en aperçoive — **le seul instrument** pour un prénom faux sous un patronyme juste, que `fix-opponent-lineup.ts --identites` ne voit pas ; il repointe aussi ce que la chronologie du match attribuait à l'ancien occupant |
| `delete-orphan-players.ts` | supprime les fiches vides de bout en bout — aucune feuille, aucun événement, aucune donnée personnelle, et pas `isActive` ; les figures historiques et les recrues à venir sont ainsi protégées |
| `close-season-2025-2026.ts` | modèle de clôture de saison, avec garde-fou sur le classement officiel |
| `seed-opponent-sheet.ts` | **le script du chantier adverse** : reprend une saison entière depuis la LNR — réalisations, cartons et temps de jeu reconstitués à partir des changements. Prend la saison en argument (`2023-2024`), `--dry` pour simuler, `--detail` pour le relevé des écarts avec la base, `--match=AAAA-MM-JJ` pour n'en reprendre qu'un, `--usap` pour traiter **aussi le camp catalan** — il passe alors deux fois, l'adverse puis l'USAP |
| `seed-lineup.ts` | crée les **deux compositions** d'un match depuis la LNR quand il n'en a aucune — dossards, titulaires, capitaine, poste déduit du numéro. Premier temps de la reprise d'une rencontre ancienne ; `--dry`, `--force` pour réécrire |
| `seed-season-2012-2013.ts` | crée les 26 matchs d'une saison de Top 14 sans phase finale — septième ; **le modèle le plus récent** |
| `seed-season-2013-2014.ts` | crée les 26 matchs de la saison de la relégation de 2014 — première saison de Top 14 reprise en remontant |
| `seed-season-2014-2015.ts` | crée les 31 matchs d'une saison de Pro D2 **avec demi-finale** — troisième. Porte la démonstration du classement LNR qui additionne les phases finales |
| `seed-season-2015-2016.ts` | crée les 30 matchs d'une saison de Pro D2 sans phase finale — septième ; premier à passer par `momentDuMatch()` |
| `seed-season-2016-2017.ts` | crée les 30 matchs d'une saison de Pro D2 **sans phase finale pour l'USAP** — sixième, à une place des quatre qualifiés |
| `seed-season-2017-2018.ts` | crée les 32 matchs de la saison du titre de Pro D2 et de la remontée — 30 journées, demi-finale et finale, pas de barrage. Porte une table `TERRAIN_NEUTRE` qui nomme le stade d'une finale, que la LNR ne donne pas |
| `seed-season-2018-2019.ts` | crée les 26 matchs de la saison de la relégation, la seule de Top 14 reprise en remontant ; aucune phase finale, l'USAP finit dernière et descend sans access match |
| `seed-season-2019-2020.ts` | crée les 23 matchs de la saison arrêtée par le Covid — aucune phase finale, la LNR n'en publie pas |
| `seed-season-2020-2021.ts` | crée les 32 matchs de la saison du titre de Pro D2, phases finales comprises ; refuse d'écrire les agrégats s'ils s'écartent du classement officiel de la LNR, et pose `champion` et `promoted` |
| `seed-lineup-barrage-2022.ts` | la composition du barrage du 12 juin 2022, seule de la saison qu'aucune source ne publie : listes fournies à la main, recoupées avec les changements de la feuille officielle |
| `seed-chronologie.ts` | écrit la **ligne de temps** d'un match depuis la LNR : essais, transformations déduites du score courant, pénalités, drops et cartons, avec les noms tels que la base les écrit. Troisième temps ; `--dry` |
| `seed-calendrier-2026-2027.ts` | crée une saison et son calendrier de championnat **avant** qu'elle ne commence : date, heure, journée, adversaire, lieu, sans score ni résultat. Une relance met à jour les dates au fur et à mesure que la LNR les cale |
| `seed-season-2021-2022.ts` | crée les rencontres d'une saison entière — date et heure, compétition, adversaire, lieu, score, réalisations, résultat, bonus, arbitre — puis les agrégats de saison. Premier jalon de la phase 4 |
| `seed-cup-sheet.ts` | **le pendant pour les coupes d'Europe**, depuis l'EPCR : réalisations, cartons et temps de jeu des **deux camps**, plus l'arbitre, l'affluence et la mi-temps. Sans argument il reprend les dix-huit matchs européens ; `--dry`, `--detail`, `--match=AAAA-MM-JJ` comme le précédent |
| `audit-opponent-lineups.ts` | confronte les compositions adverses aux feuilles officielles LNR — les deux divisions, phases finales comprises ; lecture seule, à lancer sur une saison ou sur tout. **Zéro anomalie est l'état attendu** ; les variantes d'affichage arbitrées sont tues par sa table `VARIANTES_DAFFICHAGE`, comptées au récapitulatif et listées par `--variantes` |
| `fix-opponent-lineup.ts` | remet une composition en accord avec la feuille officielle — LNR pour le championnat, EPCR pour les coupes — (identités, dossards, titulaires, capitaine) ; `--usap` traite aussi le camp catalan |
| `fetch-club-logos.ts` | rapatrie les logos officiels des clubs dans `public/images/logos/`, depuis les CDN de la LNR et de l'EPCR, et renseigne `Opponent.logoUrl` |
| `fix-match-venues.ts` | met les stades en ordre : fusionne les doublons, crée les manquants, rattache chaque club à son terrain — déduit des déplacements déjà enregistrés — puis complète les matchs sans lieu |
| `sync-effectif.ts` | met l'effectif professionnel en accord avec la LNR : crée les fiches manquantes, lève `isActive` sur l'effectif et l'abaisse sur les partants ; refuse d'écrire tant qu'un doublon ou un nom douteux subsiste |
| `fix-null-penalty-tries.ts` | met à 0 les compteurs `penaltyTries` restés `null`, mais seulement là où les points retombent déjà sur le score |
| `fix-barrages-access-match.ts` | les deux trous des barrages d'accession — arbitre du 12/06/2022, mi-temps du 03/06/2023 — et la transformation que la chronologie de ce dernier avait perdue |

`fix-duplicate-players.ts` existe aussi mais apparie les prénoms par préfixe et
par inclusion : trop large pour être lancé sans revue préalable.

## Logos des clubs

Les 47 adversaires ont leur logo, servi par le site lui-même depuis
`public/images/logos/{club}.{png|webp}` — 3,2 Mo au total. Ils viennent des sources
officielles, que les scripts lisent déjà : `cdn.lnr.fr/club/{slug}/photo/logo.
{empreinte}` pour les clubs français, le champ `imageUrl` du flux de l'EPCR
pour les européens. `fetch-club-logos.ts` fait la moisson, sur les calendriers
du Top 14 **et de la Pro D2** — c'est de ce dernier que viennent les écussons
de Carcassonne, Rouen, Colomiers, Nevers, Béziers, Aurillac, Angoulême et
Valence-Romans.

**Un calendrier archivé sert encore les écussons d'un club disparu du
championnat.** Dax, Massy et Narbonne ont quitté la Pro D2 et leurs pages de
club avec, mais `prod2.lnr.fr/calendrier-et-resultats/2017-2018/j1` porte
toujours leurs trois logos. C'est la même ruse que pour Agen, dont l'écusson
vient du calendrier 2018-2019 : quand un club manque, chercher la saison où il
jouait plutôt que sa page d'aujourd'hui.

**Mais la ruse a une limite, et trois clubs la montrent.** Albi, Bourgoin et
Tarbes ont bien chacun une URL d'écusson sur le calendrier de leur saison — et
le CDN ne rend au bout qu'un **bouclier gris** de 33 par 45 pixels, le même
pour les trois, quand les autres clubs de la page rendent leur vrai PNG. Il en
va de même sur tous les calendriers archivés depuis 2012 : la LNR ne garde
qu'une image par club, et pour ces trois-là c'est le bouclier. `fetch-club-logos.ts` le reconnaît à son empreinte
(`PLACEHOLDER_LNR`) et refuse de l'enregistrer — sans quoi il se serait écrit
sous `albi.png` et `bourgoin.png`, en WebP malgré l'extension.

**Leur écusson vient donc du site officiel du club**, par la table
`SOURCES_HORS_LNR`, qui passe avant la moisson : la LNR donne bien une URL
pour eux, elle ne mène simplement à rien. C'est la source la plus autorisée
qui soit pour une marque de club, simplement pas celle que la chaîne
interroge d'office. Albi y a son écusson complet (300×300, transparent).
Bourgoin n'a que **le dauphin seul**, sans son nom, et c'est un choix : la FFR
publie bien l'écusson complet sur Mon Club House, mais avec un **fond blanc
incrusté** — le défaut de Clermont, déjà corrigé une fois, un rectangle blanc
derrière l'écusson en thème sombre. Le dauphin transparent va aux deux
thèmes.

**Tarbes, lui, n'avait pas ce choix** : ni le club ni la FFR ne publient son
écusson autrement que sur fond blanc opaque, et le blanc fait partie du
dessin — l'ours est blanc —, on ne peut donc pas le détourer. Entre l'écusson
complet de la FFR et le rond STADO du club, c'est le rond qui a été retenu :
plus compact, donc un carré blanc plus discret en thème sombre. C'est le seul
écusson de la base sans transparence depuis que celui de Clermont a été repris
à la source.

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

Les originaux de la LNR sont de tailles très inégales — 5420×6346 pour
Carcassonne, 151×151 pour Clermont — et **`fetch-club-logos.ts` réduit ce qui
dépasse 1 200 pixels**. Le plus grand affichage du site est de 48 pixels et
`next/image` sert des variantes optimisées : l'original ne pèse que sur le
dépôt.

Deux précautions dans ce redimensionnement, apprises à la dure. L'encodage PNG
par défaut de sharp est **plus lourd** que celui de la LNR : réduire dix
écussons sans y penser a fait passer leur total de 2 724 à 2 911 Ko, alors que
les images étaient plus petites. Un écusson est une image à plat : la palette
lui va, et Carcassonne tombe alors de 1 093 à 94 Ko. Et l'on ne garde le
résultat **que s'il est réellement plus léger**, l'original ayant sinon tout
pour lui — plus fin, et moins gros.

Le passage sur les onze écussons de plus de 1 200 pixels a ramené leur total
de 3 817 à 1 299 Ko.

Les logos de club sont des marques déposées. Les afficher sur un site
d'histoire non commercial est l'usage, mais c'est un choix qui appartient au
propriétaire du site.

## Ce que les pages affichent

**Page de saison — deux séries de chiffres, et ce n'est pas une incohérence.**
L'en-tête porte les agrégats stockés sur `Season` : le **championnat seul**,
pour coller au classement officiel de la LNR. La liste des matchs, elle, est
groupée par compétition, la phase finale formant son propre bloc, et **chaque
bloc porte son bilan recalculé** sur ses rencontres jouées.

D'où, pour 2020-2021, un en-tête à « 30 joués, 24V 1N 5D, 107 points » et une
liste de 32 matchs :

```
Pro D2                    30 joués — 24V 1N 5D — 821 pts pour, 504 contre
Pro D2 — phase finale      2 joués — 2V 0N 0D — 60 pts pour, 29 contre
```

Les 107 points sont ceux du classement, la demi-finale et la finale n'en
donnent pas. Mais elles ont fait le titre, et elles ne pouvaient pas rester
noyées au milieu des trente journées — le premier de la phase régulière ne
monte plus d'office.

Le découpage vient d'`estCouperet()` (`src/lib/matchs.ts`), la même règle qui
prive un match couperet de points de bonus. Il ne s'applique qu'aux
compétitions qui ont les deux phases : un barrage d'accession, seul match de
sa compétition, garde son intitulé, et une poule de coupe d'Europe reste d'un
bloc. Les bilans ne comptent que les rencontres **jouées** (`estJoue`), un
calendrier à venir ne pesant pas dans un bilan.

**Fiche de match — le titre qu'elle a décidé.** Une finale affiche une
bannière « Champion » ou « Finaliste » avec un lien vers le palmarès. Le
rapprochement avec `Trophy` se fait sur l'**année de fin de saison** et la
compétition ; l'expression est ancrée au début du libellé de tour, faute de
quoi une demi-finale en hériterait. Il n'y a pas de clé étrangère entre un
match et un titre : le jour où il en faudrait une, c'est là qu'elle irait.

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

**Un poste de référence faux se propage.** Le numéro ne dit rien du poste d'un
remplaçant — 16 à 23 ne désignent aucune place sur le terrain —, si bien que
`positionPlayed` reprend alors `Player.position`. Matteo Rodor était fiché
`NUMERO_HUIT` alors qu'il est demi de mêlée, accessoirement ouvreur : quatorze
de ses cinquante-huit feuilles le donnaient numéro 8, toutes des lignes de
banc. Fiche et lignes corrigées le 29 août 2026. Avant de créer une fiche
depuis une feuille officielle, se rappeler que son poste servira de repli sur
tous ses futurs remplacements.

## État du projet

Phases 1 à 3 terminées : schéma, pages publiques, admin complet avec
authentification Supabase, statistiques et recherche. Reste la phase 4
(enrichissement historique) et la phase 5 (SEO, performances, PWA).

### Couverture des données

**Les chiffres se lisent dans la base, ils ne se recopient pas ici.** Cette
section portait trois tableaux qu'il fallait tenir à jour à chaque saison
reprise, et qui se contredisaient dès qu'on en oubliait un. Un script les
remplace :

```bash
npx tsx scripts/etat-couverture.ts
```

Il donne, par saison : matchs, compositions et chronologies écrites, puis
l'annexe — arbitre, mi-temps, vidéo, compte-rendu, affluence.

Ce qui ne se déduit pas de la base, en revanche :

**Ce que les sources ne publient pas.** La LNR ne donne ni affluence, ni score
à la mi-temps, ni compte-rendu : les saisons qui n'ont qu'elle pour source —
2021-2022, 2020-2021, 2019-2020, 2018-2019, 2017-2018, 2016-2017, 2015-2016,
2014-2015, 2013-2014 et 2012-2013 — resteront vides sur ces trois colonnes,
sauf à trouver ailleurs. L'EPCR, lui, donne les trois, d'où les mi-temps et les
affluences des matchs de coupe d'Europe. Les vidéos viennent de la chaîne
YouTube « TOP 14 - Officiel », qui ne remonte pas au-delà de 2022-2023.

**Et « ailleurs », c'est parfois Jérémy.** Les deux derniers manques isolés des
238 matchs joués — l'arbitre du barrage du 12 juin 2022 et la mi-temps de celui
du 3 juin 2023 — ne venaient d'aucune source lue par machine : la LNR ne publie
pas la feuille d'un access match. Ils ont été fournis à la main, et
`fix-barrages-access-match.ts` les porte avec leur provenance. Arbitre et
mi-temps sont désormais complets sur toutes les saisons reprises.

**Un fait donné à la main peut en démasquer un autre.** « Grenoble menait 16-11
à la pause » ne concordait pas avec la chronologie du 3 juin 2023, qui donnait
14-11 à la 40ᵉ et finissait à 17-33 quand le match dit 19-33. Deux points, du
même côté, à partir de la 36ᵉ : une transformation manquante. La preuve était
déjà en base — la composition enregistre Romain Trouilloud à 11 points, soit
1 transformation et 3 pénalités, et la somme des points de Grenoble retombe sur
19. L'essai de Barthelemy à la 36ᵉ avait bien été transformé ; seule la
chronologie l'ignorait. C'est le défaut LNR connu — la feuille saute parfois
une transformation, et son score courant déraille avec elle — pris pour la
première fois par recoupement plutôt que par hasard. **Un score de mi-temps
donné de l'extérieur est donc aussi un contrôle** : il faut le confronter à la
chronologie avant de l'écrire.

**Ce qu'un `null` veut dire.** Sur `MatchPlayer.minutesPlayed`, « n'est pas
entré en jeu », et non « on ne sait pas » — les remplaçants non utilisés sont
les seuls concernés. Sur `Match.scoreUsap` et `result`, « pas encore joué »,
jamais « zéro » : toute requête qui compte ou classe doit filtrer sur
`MATCH_JOUE` (`src/lib/matchs.ts`).

**2026-2027 n'est qu'un calendrier** : ses 26 journées ont leur date, leur
adversaire et leur terrain, sans score. Seules les premières ont un horaire —
la LNR ne cale les coups d'envoi qu'au fil des désignations télévisées et pose
d'ici là une date de référence, que `seed-calendrier-2026-2027.ts` rafraîchit
à chaque relance.

**Deux points ouverts sur l'effectif 2026-2027** : les postes de Riccioni et
d'Amituanai, que la LNR range en « 1ère ligne » sans trancher entre pilier et
talonneur, et l'absence de lignes `SeasonPlayer` pour la saison — le modèle
est alimenté de 2022-2023 à 2025-2026, mais il porte un dossard que la LNR ne
publie pas avant les premières feuilles.

### Où reprendre

Par ordre de valeur.

1. **Achever les saisons reprises.** De 2013-2014 à 2021-2022, neuf saisons
   ont leurs matchs, leurs compositions et leur chronologie ; il leur manque
   la clôture éditoriale — entraîneur, président, bilan rédigé —,
   les affluences que la LNR ne donne pas, et les mi-temps. La marche à suivre
   pour toute nouvelle saison est en tête de fichier, « Reprendre une
   saison ».

   Dix-huit anomalies connues de ces saisons, toutes assumées :
   - **La Rochelle totalise 1 206 minutes le 30 octobre 2021.** Sa feuille se
     contredit — Victor Vito sort *définitivement* à la 25ᵉ sur protocole
     commotion, puis elle le fait sortir encore à la 35ᵉ et rentrer deux fois.
     Aucune correction posée : on peut démontrer que la feuille est fausse,
     pas ce qui s'est passé, et `CHANGEMENTS_CORRIGES` ne s'écrit qu'avec la
     démonstration sous les yeux ;
   - **la composition du barrage du 12 juin 2022 ne vient d'aucune source
     lue par machine** et ses numéros restent incertains (cf. l'en-tête de
     `seed-lineup-barrage-2022.ts`) ;
   - **« Matthieu Ugena » sur les feuilles pour « Mathieu » en base**,
     variante d'écriture laissée telle quelle comme les 42 autres ;
   - **l'USAP totalise 1 183 minutes à Clermont le 4 mai 2019.** La feuille
     sort Alivereti Duguivalu à la 17ᵉ sur protocole commotion et n'enregistre
     jamais son retour, alors qu'elle fait « entrer » une seconde fois son
     suppléant Lotima Faingaanuku à la 63ᵉ. Même raison qu'à La Rochelle : la
     feuille est démontrablement fausse, la minute du retour ne l'est pas ;
   - **Albi totalise 1 226 minutes le 16 décembre 2016 et 1 222 le 5 mars
     2017.** Deux fois la même contradiction, et c'est celle de La Rochelle :
     la feuille fait sortir un joueur déjà sorti. Le 16 décembre, Vlad
     Alexandru Nistor cède sa place à Max Curie à la 46ᵉ, puis la feuille le
     fait sortir encore à la 54ᵉ pour Nomani Tonga — à la 54ᵉ où elle le fait
     aussi *rentrer* à la place de Curie. Le 5 mars, Sione Tunufai Tavalea
     sort à la 47ᵉ pour Curie, revient à la 58ᵉ pour Beka Sheklashvili, et la
     même 58ᵉ le fait sortir une seconde fois pour Daniel Faleafa. Aucune
     correction posée, pour la raison habituelle ;
   - **Albi marque 21 points de joueur pour 26 au score le 5 mars 2017**, et
     c'est légitime : le dernier essai est un **essai collectif**, que la LNR
     n'attribue à personne. Cinq points sans auteur, la transformation ayant
     le sien ;
   - **la feuille du 16 octobre 2016 donne un carton rouge à un homme qu'elle
     n'aligne pas.** Béziers y prend deux rouges à la 40ᵉ, l'un pour Joshua
     Valentine qui porte bien le 9, l'autre pour Manuel Edmonds, absent des
     vingt-trois que la même LNR publie sur ce match. Le second est ignoré —
     cf. `CARTONS_HORS_COMPOSITION` — et Béziers totalise donc 1 160 minutes,
     non 1 120 ;
   - **l'USAP totalise 1 185 minutes à Narbonne le 6 décembre 2015.** Encore
     une feuille qui se contredit : Enzo Forletta y entre deux fois sans
     jamais sortir, le même changement — Mailau pour André — est inscrit à la
     54ᵉ *et* à la 55ᵉ, et André sort une troisième fois à la 65ᵉ. Rien de
     démontrable derrière, donc rien de corrigé ;
   - **huit essais collectifs en 2015-2016**, et autant d'écarts de cinq
     points entre la somme des joueurs et le score. C'est légitime : la LNR
     n'attribue pas ces essais-là, seule leur transformation a un auteur. Ils
     tombent les 28 août, 10 septembre, 13 novembre et 6 décembre 2015, deux
     fois le 11 décembre et deux fois le 17 janvier 2016 ;
   - **Provence n'a pas de capitaine le 13 mai 2016** : la LNR n'en publie
     pas. « Aucun » se lit « la source ne le dit pas » ;
   - **l'USAP totalise 1 186 minutes le 24 août 2014.** La feuille fait entrer
     Loïc Charlon à la 34ᵉ pour Karl Château, puis **une seconde fois** à la
     66ᵉ pour Kirill Kulemin, sans l'avoir jamais fait sortir. Le script garde
     la première entrée, et le remplacement de Kulemin reste à découvert —
     soit les 14 minutes manquantes ;
   - **quatre essais collectifs en 2014-2015**, tous adverses, et autant
     d'écarts de cinq points — les 1er février, 1er et 15 mars et 25 avril
     2015. Même raison qu'en 2015-2016 ;
   - **quatre essais collectifs en 2013-2014**, deux de chaque côté — les
     8 septembre, 29 novembre, 29 décembre 2013 et 1er mars 2014 ;
   - **l'USAP totalise 1 186 minutes au Stade Français le 29 décembre 2013.**
     Encore une feuille qui fait entrer deux fois le même homme : Sébastien
     Taofifenua à la 29ᵉ pour Daniel Leo, puis à la 66ᵉ pour Taumalolo, sans
     l'avoir fait sortir. Les 14 minutes manquantes sont exactement le
     remplacement de Taumalolo laissé à découvert. **Et ce ne sont pas deux
     frères confondus** : Romain Taofifenua, deuxième ligne n°5, figure sur la
     même feuille et la base les distingue bien, avec 33 feuilles chacun ;
   - **deux compositions à 22 joueurs en 2013-2014** — Grenoble le
     4 septembre, l'USAP le 22 novembre : la LNR y oublie un remplaçant. Les
     quinze titulaires sont là dans les deux cas, ce qui est le critère
     d'acceptation ;
   - **cinq essais collectifs en 2012-2013**, et autant d'écarts de cinq
     points — les 24 août, 8 et 15 septembre, 30 novembre 2012 et 4 mai 2013 ;
   - **aucun des treize points de Bayonne n'a d'auteur le 9 février 2013.**
     La feuille marque « n.a. » sur ses deux pénalités et sur son essai, dont
     la transformation n'a pas davantage de buteur. Les points comptent pour
     l'équipe et pour personne — cf. `pointsSansAuteur` dans
     `seed-opponent-sheet.ts` ;
   - **le Perpignan-Toulouse du 15 septembre 2012 n'a pas de chronologie**, et
     c'est le seul match joué de la base dans ce cas. La feuille reconstitue
     32-20 pour un 34-20 officiel : elle saute une transformation, et son score
     courant ne passe jamais par 34. Les deux points sont réels — la
     composition porte bien trois transformations pour cinq essais — mais leur
     **minute est introuvable**. Les poser quelque part, ce serait choisir une
     minute que rien n'atteste et fausser tous les scores affichés après elle.
     Une chronologie doit dire *quand* ; les scripts de feuille, eux, ne
     comptent que des totaux, et rattrapent.

   Deux choses que la chaîne ne fait pas : la **mi-temps**, que la LNR ne
   publie pas — elle se déduirait du dernier fait avant la 40ᵉ, mais c'est une
   inférence —, et les **notes de retour en jeu**, écrites à la main.

2. **Poursuivre la phase 4** en remontant. **De 2012-2013 à 2020-2021, neuf
   saisons sont faites**, toutes conformes au classement officiel de la LNR :
   107 points et le titre de Pro D2 en 2020-2021, 76 points et la deuxième
   place en 2019-2020, arrêtée à la 23ᵉ journée par le Covid, 12 points et la
   dernière place de Top 14 en 2018-2019, reléguée directement, 97 points et
   le titre en 2017-2018, 79 points et la sixième place en 2016-2017,
   73 points et la septième en 2015-2016, 82 points et la troisième en
   2014-2015, 51 points et la treizième en 2013-2014, reléguée, 61 points et
   la septième en 2012-2013.

   **2012-2013 est faite** : 26 matchs, 1 196 lignes de composition, 388
   événements de chronologie, l'arbitre et le stade partout, et l'audit nom à
   nom ne signale rien. **Vingt-cinq chronologies sur vingt-six**, le match du
   15 septembre restant sans, pour la raison dite plus haut.

   Deux relâchements ont été nécessaires, l'un et l'autre bornés : le score
   courant d'avant 2017-2018 sur l'essai de pénalité, déjà en place, et
   l'acceptation des **points que la source n'attribue à personne**. Un nom que
   la composition ignore fait toujours échouer le match — c'est le garde-fou
   qui a rattrapé les identités fausses ; seul le cas « la source ne désigne
   personne » est admis.

   **Les deux bornes du barème de bonus sont désormais attestées de part et
   d'autre.** 2014-2015 est la première saison du bonus défensif à cinq points
   — sa défaite 12-19 à sept points n'en donne pas —, et 2013-2014 la dernière
   à sept — ses défaites 23-30 et 12-19, à exactement sept points, en donnent.
   Les deux totaux de bonus le vérifient, et les deux scripts refuseraient
   d'écrire si la borne était fausse.

   **Cette saison-là a coûté deux corrections de fond**, l'une et l'autre dans
   `lib/lnr.ts` : le score courant y crédite neuf points à un essai de
   pénalité — qu'il fallait encore transformer avant 2017, et dont la feuille
   compte la transformation deux fois —, et `realisationsDepuisFaits` ne
   déduit plus ses transformations du score courant mais du score final, seul
   à faire foi. Les deux valent pour toutes les saisons antérieures, et les
   cinq déjà en base ont été repassées sans changer d'un point.

   Les modèles : `seed-season-2012-2013.ts` et `seed-season-2013-2014.ts`
   pour une saison de **Top 14** — le premier est le plus récent —, `seed-season-2014-2015.ts` pour une saison de
   deuxième division **avec une phase finale**, celui qui porte le piège du
   classement additionné, `seed-season-2015-2016.ts`,
   `seed-season-2016-2017.ts` et `seed-season-2019-2020.ts` quand il n'y en a
   pas, `seed-season-2018-2019.ts` pour une saison de Top 14 sans phase
   finale, `seed-season-2020-2021.ts` et `seed-season-2017-2018.ts` quand il y
   en a une — le second traite en plus le terrain neutre d'une finale —,
   `seed-season-2021-2022.ts` pour une saison avec coupe d'Europe.

   **Attention aux coupes d'Europe d'avant 2020-2021 : il n'y a pas de
   source.** Le flux de l'EPCR ne rend rien avant la saison 2020-2021, et son
   site n'offre plus que les saisons récentes. La campagne européenne de
   2018-2019 est donc restée hors base, et il en ira de même en remontant tant
   qu'aucune source officielle ne les rouvre.
3. **Le fond** : affluences (36 matchs sur 413 joués), photos et biographies
   (1 joueur sur 276), et les saisons sans aucun match.

Sur les 120 saisons en base, 16 seulement portent des matchs : c'est le
chantier de la phase 4, mené en remontant le temps saison par saison. Le bilan
de 2021-2022 — 9V 0N 17D, 43 points, treizième — est calculé depuis les scores
officiels mais n'a pas été confronté à un classement d'époque ; ceux de
2020-2021, 2019-2020 et 2018-2019 l'ont été, et leurs scripts refusent
d'écrire les agrégats s'ils s'en écartent.

### Limites connues

**Ce que la base ne sait pas faire**

- `EventType` ne comporte pas `CARTON_ORANGE`. Le champ `MatchPlayer.orangeCard`
  existe et s'affiche, mais la sanction ne peut pas figurer dans la chronologie.
- Les modèles `CareerClub`, `PlayerStint`, `PlayerInternational` et
  `PlayerAward` existent et ne sont pas alimentés.
- Erreur d'hydratation React sur les pages de match, antérieure et non
  diagnostiquée (probablement `next-themes`).

**Ce à quoi il faut penser en écrivant une requête**

- **`players` est aux neuf dixièmes des adversaires** : 2 821 fiches sur
  3 097 n'ont jamais porté le maillot, 276 l'ont porté. Toute requête sur les joueurs doit
  filtrer `isOpponent: false`, sinon le résultat est faux. Les fiches
  affichent séparément « Matchs avec l'USAP » et « Matchs contre l'USAP », et
  les statistiques ne comptent que les premiers ; le tableau « contre » ne
  montre ni minutes ni réalisations, ce détail n'étant visible que sur les
  pages de match.
- **Onze fiches ne sont rattachées à aucun match, et c'est normal** : cinq
  figures citées pour mémoire, avec biographie — Dan Carter, Joseph Desclaux,
  Aimé Giral, Percy Montgomery, Jean-François Imbernon —, et six recrues de
  2026-2027 créées avant leur premier match. `players` sans `matchAppearances`
  n'est donc pas un critère d'orphelin ; c'est l'absence de toute donnée
  personnelle **et** de drapeau `isActive` qui l'est (cf.
  `delete-orphan-players.ts`). Ce second garde-fou manquait jusqu'au 30 août
  2026 : les cinq figures historiques étaient protégées par leur biographie,
  les six recrues par rien du tout, et ce fichier les disait pourtant à
  l'abri.
- **`isActive` se lit « dans l'effectif professionnel »**, pas « au club ».
  `sync-effectif.ts` ne connaît que la page de la LNR, qui ignore les espoirs :
  Thomas Serezat a ainsi été abaissé le 29 août 2026 alors qu'il n'a pas quitté
  l'USAP.
- **Une composition peut légitimement ne porter aucun capitaine** : sur 826,
  805 en portent exactement un, 21 aucun — les feuilles que la LNR ne publie
  pas, et le match des Dragons du 7 décembre 2025 où l'EPCR en signale deux
  sans qu'on puisse les départager. Aucune n'en porte plusieurs. « Aucun » se
  lit « la source ne le dit pas », non « personne ne l'était ».
- **`MatchEvent.playerId` n'est pas toujours renseigné** : 1 013 événements sur
  6 851 ne le portent pas, les plus anciens surtout — la chaîne actuelle le
  remplit systématiquement. La page publique ne le lit pas, elle affiche
  `event.description`, où le nom figure en clair ; seul l'admin s'en sert.

**Ce qui manque dans les données**

- **Les 439 matchs ont leur stade — mais le stade d'aujourd'hui.**
  `Opponent.venueId` ne porte qu'**un** terrain par club et ignore le temps,
  si bien que la déduction vieillit mal en remontant : le Racing 92 est en
  base au Paris La Défense Arena, **ouvert en 2017**, et jouait à Colombes en
  2012-2013 ; le Stade Français est à Jean-Bouin, alors en reconstruction, et
  recevait à Charléty. Ce n'est plus l'incertitude admise pour Carcassonne ou
  Agen — « c'est le terrain d'aujourd'hui, rien ne dit qu'il y recevait
  déjà » —, c'est une erreur démontrable. Un historique de terrains est
  décidé, pas encore fait. Le lieu se déduit du camp —
  Aimé-Giral à domicile, `Opponent.venueId` à l'extérieur —, et ne se saisit
  donc jamais à la main. **Sauf une finale**, jouée sur terrain neutre : la
  déduction y est fausse, et la feuille de la LNR n'aide pas puisqu'elle
  désigne quand même un recevant. La finale de Pro D2 2021,
  « Perpignan-Biarritz » sur la feuille, s'est jouée au GGL Stadium de
  Montpellier ; celle de 2018, « Perpignan-Grenoble », au stade Ernest-Wallon
  de Toulouse.

  **Et une telle correction ne se pose pas sur le match, elle se pose dans le
  script.** `seed-season-2017-2018.ts` recalcule le lieu de chaque rencontre à
  chaque relance : un stade saisi à la main aurait été effacé au passage
  suivant. D'où sa table `TERRAIN_NEUTRE`, qui associe un tour à son stade et
  admet `null` pour « terrain neutre, stade inconnu » — mieux qu'un lieu faux.
  Sa demi-finale, elle, garde Aimé-Giral : en Pro D2 le mieux classé reçoit,
  et l'USAP a fini première.

  **Quatre lieux de 2017-2018 et deux de 2016-2017 viennent de Jérémy**, et
  d'aucune source lue par machine : le stade de la finale, où il était, les
  terrains de Dax (Maurice-Boyau), Massy (Jules-Ladoumègue) et Narbonne (Parc
  des Sports et de l'Amitié), et ceux d'Albi (Stadium municipal) et de
  Bourgoin (Pierre-Rajon) — cinq clubs sortis de Pro D2, dont les pages LNR ne
  nomment plus le stade. Même réserve que pour Carcassonne, Rouen et Agen : ce
  sont les terrains d'aujourd'hui, et rien ne permet de vérifier par machine
  qu'ils y recevaient déjà en 2017-2018, ni en 2016-2017.

  **Tarbes, arrivé avec 2015-2016, tient de Carcassonne plutôt que d'eux** :
  son Maurice-Trélut n'est pas donné de mémoire mais par Wikipédia, et
  l'adresse que la FFR publie sur Mon Club House — avenue Pierre-de-Coubertin,
  65000 Tarbes — est bien celle de ce stade. Deux sources concordantes, aucune
  officielle au sens du projet, et la même réserve sur l'époque.

  Quatre clubs n'ont toujours pas de terrain rattaché : Connacht, Cardiff,
  Dragons et Lions, que l'USAP n'a reçus qu'à Aimé-Giral. Sans déplacement
  là-bas, rien ne permet de le déduire — mais aucun match n'en souffre, ces
  quatre-là n'ayant jamais reçu l'USAP.

  Trois des stades de la liste de `fix-match-venues.ts` ne viennent pas d'une
  donnée officielle : Albert-Domec à Carcassonne et Robert-Diochon à Rouen,
  ces deux clubs ayant quitté la Pro D2 et leur page LNR avec, et Armandie à
  Agen, que la LNR nomme bien mais dans un article, ni sa page de club ni ses
  feuilles de match ne portant de lieu. Même réserve pour Rouen et pour Agen :
  ces sources décrivent le stade **d'aujourd'hui**, et rien n'a permis de
  vérifier qu'ils y recevaient déjà, en 2020-2021 pour l'un, le 2 septembre
  2018 pour l'autre.
- **Affluences éparses** : 36 matchs sur 413 joués, l'EPCR ayant fourni celles
  des coupes. Peu de photos et de biographies de joueurs.
- **L'audit des compositions adverses ne signale plus rien** : 381 matchs
  examinés, 381 conformes.

  **Il n'en voyait que 150 jusqu'au 30 août 2026, et il ne le disait pas.**
  Deux angles morts, dans le script dont c'est le seul métier : il cherchait
  toutes ses feuilles sur `top14.lnr.fr` sans jamais appeler
  `utiliserDivision`, si bien que **les trois saisons de Pro D2 — 85 matchs —
  n'avaient jamais été auditées**, et il annonçait poliment « feuille
  introuvable » ; et il recalculait la phase au lieu d'appeler `phasesLnr()`,
  ne connaissant que la journée et le barrage, d'où des demi-finales et des
  finales rangées en « hors périmètre ». `fix-opponent-lineup.ts` portait
  exactement les deux mêmes défauts, la logique de phase étant écrite trois
  fois. Les deux appellent désormais `phasesLnr()`.

  **Ce que l'ouverture a trouvé** : un seul vrai défaut sur 88 rencontres
  jamais vues, le brassard de la finale 2009 — la base donnait Mario Ledesma
  capitaine de Clermont, la feuille donne Aurélien Rougerie. Corrigé, avec six
  dossards catalans permutés sur la même feuille. Manquants, joueurs en trop, dossards faux,
  brassards, écritures — toutes catégories soldées.

  Restent **46 variantes d'affichage**, sur 16 paires de noms : la base porte
  le nom d'usage, la feuille l'état civil — « Tom » pour Thomas Staniforth,
  « Cobus » pour Jacobus Meyer Reinach, « Nacho » pour Juan Ignacio Brex —, ou
  la LNR ampute une apostrophe (« Marvin O Connor »). Elles ne sont plus
  comptées en anomalie mais **tues explicitement** : leur total figure au
  récapitulatif, et `--variantes` les affiche une à une.

  **Pourquoi ce détour plutôt que d'assumer un compteur qui monte.** La fusion
  des dix doublons du 30 août 2026 avait fait passer les ÉCRITURE de 21 à 31,
  sans qu'aucune donnée ne se dégrade : un homme réuni sous son nom d'usage
  diverge désormais de la LNR sur *chacune* de ses feuilles, là où seule la
  moins fournie de ses deux fiches était comptée avant. Le compteur mesurait
  donc le contraire du travail accompli, et un audit dont on apprend à ignorer
  le total ne garde plus rien — c'est exactement ainsi que 22 faux hommes ont
  vécu en ÉCRITURE jusqu'au 30 août. La table rend au total sa valeur de
  signal : il est à zéro, et tout écart nouveau se voit.

  **Et pourquoi une table propre à l'audit**, quand `NOMS_DUSAGE` de
  `lib/noms.ts` semblait faite pour ça : cette table-là nourrit `memeMot`, dont
  dépendent `joueurs.ts`, `seed-opponent-sheet.ts` et `sync-effectif.ts` pour
  arbitrer des **identités**. Y déclarer « tom = thomas », « joe = joseph » ou
  « nick = nicholas », c'est rendre équivalents des prénoms parmi les plus
  répandus du rugby et rouvrir l'accident Kane Douglas / Wesley Douglas.
  `VARIANTES_DAFFICHAGE` n'apparie pas des mots mais des **noms complets deux
  à deux** : « Tom Staniforth » ne vaut que pour « Thomas Staniforth », et
  « Joe Powell » ne couvre même pas « Joseph Powell », seulement le « Joseph
  Patrick Powell » de la feuille. L'arbitrage d'identité n'est pas touché.

  Au passage, `lib/noms.ts` affirmait que « l'abréviation ordinaire n'a pas
  besoin de la table : "Tom" couvre déjà "Thomas" par le préfixe ». C'est
  **faux** — « thomas » ne commence pas par « tom », ni « joseph » par
  « joe », ni « nicholas » par « nick » — et c'est cette phrase qui fondait
  l'attente d'un compteur bas. Corrigée.

  **Il a fallu y venir : « ÉCRITURE » ne voulait pas dire « bénin ».** Le
  30 août 2026, 22 de ces écarts étaient en réalité **d'autres hommes** sous
  le même patronyme, concentrés sur quatre compositions dont le banc avait été
  deviné plutôt que lu : UBB le 18 octobre 2025 (9), Oyonnax le 23 mars 2024
  (6), Racing 92 le 20 septembre 2025 (5), Lyon le 21 mars 2026 (2). Vingt-deux
  fiches de joueurs qui n'ont jamais existé en étaient nées — « Maxime
  Barlot », « Tevita Palu », « Loni Falatea »… Dossards rendus à la feuille
  officielle, coquilles supprimées, et `update-match-2023-2024-j19.ts`
  corrigé : il portait encore les six noms inventés d'Oyonnax, en annonçant la
  LNR pour source.

  **Comment on les départage**, puisque aucun contrôle ne le fait tout seul :
  interroger l'histoire des deux fiches. Un prénom inventé ne paraît que sur
  **cette feuille-là**, quand celui de la source a une carrière au même club
  et souvent au même dossard — Gaëtan Barlot en portait sept, « Maxime » une.
  Une vraie variante, elle, laisse deux fiches également fréquentées, ou une
  seule.

  **Pourquoi rien ne les voyait.** `fix-opponent-lineup.ts --identites` tient
  deux noms pour la même personne dès qu'un patronyme concorde — il le faut,
  sans quoi il prendrait tous les diminutifs des feuilles pour des erreurs —,
  et l'audit range l'écart en ÉCRITURE, la catégorie la plus douce. Le seul
  instrument est `reassign-match-player.ts`, ligne par ligne, une fois la
  démonstration faite.

  **Et un doublon peut en cacher un troisième homme.** « Carlu Johann Sadie »
  portait quatre feuilles : trois fois le pilier droit de l'UBB, que la LNR
  écrit ainsi en toutes lettres, et une fois le n°13 d'Agen du 2 septembre
  2018 — que la même LNR nomme « Johann Sadie », le centre sud-africain, un
  autre homme. Le patronyme et le prénom « Johann » avaient suffi à
  `joueurs.ts` pour les confondre, et l'audit rangeait l'écart en ÉCRITURE
  comme les autres. Fusionner sans regarder aurait donné au pilier un match
  qu'il n'a jamais joué : la ligne d'Agen a d'abord été rendue à une fiche
  « Johann Sadie », et les deux Carlu réunis seulement ensuite. **Avant toute
  fusion, relire les feuilles des deux fiches** — un poste qui détonne, ici un
  pilier aligné en centre, est le signal.

  Les **dix doublons** que ces écarts ont révélés au passage — un même homme
  sous deux fiches — sont **fusionnés depuis le 30 août 2026** : Tom / Thomas
  Staniforth, Cobus / Jacobus Meyer Reinach, Billy / Viliami Vunipola, Harry /
  Harrison Plummer, Joe / Joseph Powell, Tolu / Silatolu Latu, Tom / Thomas
  Willis, Cheick / Cheikh Tiberghien, Andrea / Adrea Cocagi, Carlu / Carlu
  Johann Sadie. Chacun relevait de `merge-players.ts` et non d'une
  réattribution : les deux fiches portaient de vrais matchs. La fiche la mieux
  fournie a été conservée et renommée du nom d'usage, jamais de l'orthographe
  de la LNR. Un onzième est soldé : Richie Arnold et Richard Tamanui Arnold, la
  même deuxième ligne de Toulouse sur cinq feuilles, fusionnés sous son nom
  d'usage — son jumeau Rory, présent à ses côtés le 5 février 2022, reste
  bien distinct.

**Deux exceptions nommées**

- **La feuille LNR du 22 février 2026 se contredit sur les deux camps.** Côté
  catalan, ses changements font entrer deux joueurs absents des vingt-trois
  qu'elle publie et sortir un joueur jamais entré. La composition de l'USAP y
  est donc **laissée telle quelle**, et c'est le seul match dont
  `fix-opponent-lineup.ts --usap --identites` reste écarté.
- **La composition du barrage du 12 juin 2022 ne vient d'aucune source lue par
  machine** : elle a été fournie à la main puis recoupée avec les changements
  officiels. Ses numéros restent incertains (cf. l'en-tête de
  `seed-lineup-barrage-2022.ts`).

**Une fusion réarme les scripts à usage unique.** Les 151 `update-*` et
`add-*` de `scripts/` cherchent leur joueur par `findFirst` sur prénom **et**
nom exacts, puis `player.create` si rien ne répond. Fusionner « Thomas
Staniforth » dans « Tom Staniforth » rend donc le nom en dur introuvable, et
une relance recréerait le doublon — c'est le sinistre déjà survenu, « Max
Hicks » recréé à côté de « Maxwell Hicks ». Sept scripts étaient dans ce cas
au soir du 30 août 2026, corrigés depuis : `update-match-2023-2024-j7`,
`-j11`, `-j20`, `-j25`, `update-match-2022-2023-j7`, `-j11`, `-j26`.

**Et rien ne l'aurait vu.** Un doublon ainsi recréé porte le nom que la
feuille officielle écrit : `audit-opponent-lineups.ts` le lit conforme et se
tait, `delete-orphan-players.ts` aussi, la fiche portant un vrai match. D'où
`detect-duplicate-players.ts`, qui cherche les doublons pour eux-mêmes plutôt
que d'attendre qu'un nom coince sur autre chose. Son premier passage a sorti
**42 paires** que rien ne signalait — 25 en CERTAIN et FORT, 17 en À VOIR —,
**toutes arbitrées le 30 août 2026** : 25 fusions, la table passant de 2 186
fiches à 2 161, dont
six doublons d'un joueur de l'USAP lui-même : Alivereti Duguivalu, Siosiua
Halanukonuka, Alistair Crossdale, Eddie Sawailau, Maafu Fia, Brad Shields.

**Le test qui a tranché, et il est mécanique** : lire la feuille officielle de
chaque match de la fiche la moins fournie, et compter **combien d'hommes y
portent ce patronyme**. Un seul à chaque fois, sur les vingt-trois paires
lisibles : un homme, deux fiches. Le nom que la source écrit départage
ensuite — « Siosiaia Ma'afu Fia » pour Maafu Fia, « Alexander James Moon »
pour Alex Moon, « Etuale Manusamoa Tuilagi » pour Manu Tuilagi. La fiche la
mieux fournie est conservée et porte le nom d'usage.

**Le seul cas sans source : les trois Simone de Clermont.** « Irae Vincynt
Simone » et « Irae Simone » se confirment par les feuilles. Mais « Ioane
Simone » ne paraît que sur celle du 7 janvier 2023, l'une des neuf de
2022-2023 que la LNR ne publie pas — donc une composition devinée. Tranché
par la méthode du projet, pas par une source : un prénom inventé ne paraît que
sur cette feuille-là, quand celui de la source a une carrière au même club et
souvent au même dossard. « Irae » a six feuilles à Clermont dont le même n°12,
« Ioane » en a une. Rattaché à Irae, comme « Maxime » Barlot l'avait été à
Gaëtan.

**Le lot À VOIR est soldé lui aussi**, et il n'était pas que du bruit : sur
ses 17 paires, seize étaient bien deux hommes — chaque prénom confirmé par sa
propre feuille, souvent deux frères, Jonathan et Richie Gray, Jack et Tom
Willis, Jules et Clovis Le Bail. Elles sont passées dans la table `DISTINCTS`
du détecteur, qui ne les reproposera plus. **La dix-septième était un vrai
doublon** que le niveau FORT ne pouvait pas voir, les clubs différant :
Elliott / Elliot Stooke, une lettre d'écart, Bristol en 2022 puis Montpellier
en 2023 — et les deux sources, EPCR et LNR, écrivent « Elliott ».

`detect-duplicate-players.ts` rend désormais **CERTAIN 0, FORT 0, À VOIR 0**.
C'est l'état attendu, et tout écart nouveau se verra.

**Une règle qui vaut pour tout ce qui précède** : devant un nom qui ne
s'apparie pas, **soupçonner la base avant la source** — et devant un prénom
qui diverge, chercher d'abord si le bon joueur n'existe pas déjà ailleurs sous
son vrai prénom. C'est ainsi qu'on a trouvé neuf doublons dans la seule
composition de Grenoble au barrage 2024-2025.

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
