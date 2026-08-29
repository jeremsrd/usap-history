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
| `N fiches candidates … à arbitrer` | doublon en base | inspecter les deux fiches, puis `merge-players.ts --keep= --drop= --dry` |
| `[homonyme] … laissé de côté` | deux personnes, même patronyme | vérifier la fiche citée ; si ce sont bien deux hommes, laisser créer |
| `Compositions non publiées par la LNR` | archive muette | essayer `prod2.lnr.fr`, qui archive mieux ; en dernier recours, composition à la main recoupée avec les changements (cf. `seed-lineup-barrage-2022.ts`) |
| `N joueurs sur la feuille, 22 au moins` | la LNR oublie un remplaçant | accepté tel quel si les quinze titulaires sont là |
| `réalisations incohérentes` | score courant fautif | lire les faits du match ; le total final fait foi |
| `N point(s) inexpliqué(s)` | transformation non inscrite | le script la rattrape sur les deux camps ; s'il échoue encore, la feuille est fautive |
| `… hors composition` sur un auteur | essai collectif, ou composition fausse | soupçonner la base avant la source |
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
| coup d'envoi à la minute | `lireFeuille().coupDEnvoi`, et nulle part ailleurs |
| arbitre central | `lireCompositions().arbitre` |
| score après chaque fait, cartons, essais de pénalité | `lireFeuille().faits` |
| changements, avec définitif ou temporaire | `lireFeuille().changements` |
| affluence, mi-temps | **nulle part** |

Ce qu'il faut savoir avant d'écrire du code :

- **`conversionPlayer` ment** : il ne dit pas qu'il y a eu transformation, seul
  le score courant le dit. S'en servir pour *nommer* le buteur, jamais pour
  décider ;
- **le score courant déraille aussi** ; le total final tranche ;
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
| `seed-season-2020-2021.ts` | crée les 32 matchs de la saison du titre de Pro D2, phases finales comprises ; refuse d'écrire les agrégats s'ils s'écartent du classement officiel de la LNR |
| `seed-lineup-barrage-2022.ts` | la composition du barrage du 12 juin 2022, seule de la saison qu'aucune source ne publie : listes fournies à la main, recoupées avec les changements de la feuille officielle |
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
rencontres — sauf **tous ses matchs, repris le 29 août 2026** : les
31 rencontres portent leurs 46 joueurs et leur chronologie, 1 200 minutes par
camp, et des points qui retombent sur le score.

Une seule composition ne vient pas d'une source lue par machine, celle du
**barrage d'accession du 12 juin 2022** : la LNR ne la publie ni sur son site
Top 14 ni sur celui de Pro D2 — la page `/compositions` existe et ne contient
aucun joueur —, ESPN ne couvre pas le match d'accession et allrugby.com était
injoignable. Elle a été fournie à la main puis recoupée avec la feuille
officielle, qui la corrobore largement (cf. l'en-tête de
`seed-lineup-barrage-2022.ts`). **Ses numéros restent incertains** : ils ne
viennent que de la source fournie, la feuille ne les mentionnant nulle part. La mi-temps et les comptes-rendus manquent
pour toute la saison, la LNR ne les publiant pas.

Annexe du match :

| Saison | Matchs | Arbitres | Mi-temps | Vidéos | Comptes-rendus | Affluences |
|---|---|---|---|---|---|---|
| 2026-2027 | 26 à venir | — | — | — | — | — |
| 2025-2026 | 32 | 32 | 32 | 31 | 32 | 7 |
| 2024-2025 | 32 | 32 | 32 | 24 | 28 | 15 |
| 2023-2024 | 30 | 30 | 30 | 29 | 30 | 6 |
| 2022-2023 | 31 | 31 | 30 | 21 | 31 | 4 |
| 2021-2022 | 31 | 30 | 5 | 0 | 0 | 4 |
| 2020-2021 | 32 | 32 | — | — | — | — |
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

1. **Achever les deux saisons reprises.** 2021-2022 et 2020-2021 ont leurs
   matchs, leurs compositions et leur chronologie ; il leur manque la clôture
   éditoriale — entraîneur, président, bilan rédigé —, les affluences que la
   LNR ne donne pas, et les mi-temps de 2020-2021. La marche à suivre pour
   toute nouvelle saison est en tête de fichier, « Reprendre une saison ».

   Trois anomalies connues de ces deux saisons, toutes assumées :
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
     variante d'écriture laissée telle quelle comme les 49 autres.

   Deux choses que la chaîne ne fait pas : la **mi-temps**, que la LNR ne
   publie pas — elle se déduirait du dernier fait avant la 40ᵉ, mais c'est une
   inférence —, et les **notes de retour en jeu**, écrites à la main.

2. **Poursuivre la phase 4** en remontant : **2020-2021 est faite** — trente
   journées de Pro D2, une demi-finale et la finale, soit 32 matchs avec leurs
   compositions et leur chronologie, conformes au classement officiel (24V 1N
   5D, 821-504, 107 points, premier). Reste 2019-2020, puis 2018-2019.
   `seed-season-2020-2021.ts` donne le modèle pour une saison de deuxième
   division, `seed-season-2021-2022.ts` pour une saison avec coupe d'Europe.
3. **Le fond** : affluences (37 matchs sur 157), photos et biographies (1
   joueur sur 144), et 113 saisons sans aucun match.

112 saisons sur 119 n'ont encore aucun match : c'est le chantier de la phase 4,
menée en remontant le temps saison par saison. Deux sont faites. Le bilan de
2021-2022 — 9V 0N 17D, 43 points, treizième — est calculé depuis les scores
officiels mais n'a pas été confronté à un classement d'époque ; celui de
2020-2021 l'a été, et le script refuse d'écrire ses agrégats s'ils s'en
écartent.

### Limites connues

**Ce que la base ne sait pas faire**

- `EventType` ne comporte pas `CARTON_ORANGE`. Le champ `MatchPlayer.orangeCard`
  existe et s'affiche, mais la sanction ne peut pas figurer dans la chronologie.
- Les modèles `CareerClub`, `PlayerStint`, `PlayerInternational` et
  `PlayerAward` existent et ne sont pas alimentés.
- Erreur d'hydratation React sur les pages de match, antérieure et non
  diagnostiquée (probablement `next-themes`).

**Ce à quoi il faut penser en écrivant une requête**

- **`players` est aux trois quarts des adversaires** : 1 738 sur 1 924 n'ont
  jamais porté le maillot, 175 l'ont porté. Toute requête sur les joueurs doit
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
  personnelle qui l'est (cf. `delete-orphan-players.ts`).
- **`isActive` se lit « dans l'effectif professionnel »**, pas « au club ».
  `sync-effectif.ts` ne connaît que la page de la LNR, qui ignore les espoirs :
  Thomas Serezat a ainsi été abaissé le 29 août 2026 alors qu'il n'a pas quitté
  l'USAP.
- **Une composition peut légitimement ne porter aucun capitaine** : sur 378,
  358 en portent exactement un, 20 aucun — les feuilles que la LNR ne publie
  pas, et le match des Dragons du 7 décembre 2025 où l'EPCR en signale deux
  sans qu'on puisse les départager. Aucune n'en porte plusieurs. « Aucun » se
  lit « la source ne le dit pas », non « personne ne l'était ».
- **`MatchEvent.playerId` n'est pas toujours renseigné** : 950 événements sur
  3 406 ne le portent pas, les plus anciens surtout — la chaîne actuelle le
  remplit systématiquement. La page publique ne le lit pas, elle affiche
  `event.description`, où le nom figure en clair ; seul l'admin s'en sert.

**Ce qui manque dans les données**

- **Les 215 matchs ont leur stade.** Le lieu se déduit du camp — Aimé-Giral à
  domicile, `Opponent.venueId` à l'extérieur —, et ne se saisit donc jamais à
  la main. Quatre clubs n'ont toujours pas de terrain rattaché : Connacht,
  Cardiff, Dragons et Lions, que l'USAP n'a reçus qu'à Aimé-Giral. Sans
  déplacement là-bas, rien ne permet de le déduire.

  Deux des stades de la liste de `fix-match-venues.ts` ne viennent pas d'une
  source officielle : Albert-Domec à Carcassonne et Robert-Diochon à Rouen,
  ces deux clubs ayant quitté la Pro D2 et leur page LNR avec. Pour Rouen,
  Wikipédia et le site du club décrivent son stade **d'aujourd'hui**, et rien
  n'a permis de vérifier qu'il y jouait déjà en 2020-2021.
- **Affluences éparses** : 36 matchs sur 215, l'EPCR ayant fourni celles des
  coupes. Peu de photos et de biographies de joueurs.
- **49 divergences d'écriture** subsistent entre la base et les feuilles
  officielles, sur 26 matchs : des variantes de bonne foi, diminutifs
  (« Billy » pour Viliami Vunipola) ou prénoms d'usage (« Paddy » pour David
  Patrick Jackson). Les anomalies graves — joueurs manquants, dossards faux,
  brassards, identités fautives — ont toutes été soldées depuis les feuilles
  officielles.

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
