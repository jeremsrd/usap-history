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
│   ├── app/                      # App Router — 36 pages, sous `[locale]`
│   │   ├── page.tsx              # Accueil
│   │   ├── saisons/              # page.tsx + [label]/page.tsx
│   │   ├── matchs/               # page.tsx + [slug]/page.tsx
│   │   ├── joueurs/              # page.tsx + [slug]/page.tsx
│   │   ├── adversaires/          # page.tsx + [slug]/page.tsx
│   │   ├── arbitres/             # idem
│   │   ├── stades/               # idem
│   │   ├── entraineurs/          # idem
│   │   ├── presidents/           # idem
│   │   ├── centurions/            # les joueurs à 100 matchs ou plus
│   │   ├── realisateurs/          # points, essais et points au pied
│   │   ├── records/               # records sur un match, sur une saison, séries
│   │   ├── palmares/, statistiques/
│   │   ├── login/, auth/callback/, api/upload/
│   │   └── admin/                # protégé — saisons, matchs (+ [id]), joueurs,
│   │                             #   adversaires, arbitres, stades, entraineurs,
│   │                             #   presidents, competitions, pays, palmares
│   ├── components/
│   │   ├── Header.tsx, Footer.tsx, ThemeProvider.tsx, ThemeToggle.tsx
│   │   ├── JoueurCellule.tsx     # portrait + nom + badge, pour les classements
│   │   ├── ScoreEvolution.tsx    # graphe d'évolution du score d'un match
│   │   ├── VideoEmbed.tsx        # résumé YouTube/Dailymotion en click-to-play
│   │   └── ui/ImageUpload.tsx
│   ├── i18n/                     # langues.ts — les langues et le préfixe d'URL
│   ├── lib/                      # prisma.ts, slugs.ts, utils.ts, constants.ts,
│   │                             #   periodes.ts, supabase/
│   └── types/index.ts
├── scripts/                      # ~180 scripts d'import, un par match ou par lot
│   └── lib/                      # lnr.ts (feuilles de match LNR), noms.ts
│                                 #   (rapprochement des noms entre sources)
├── .claude/launch.json           # config du serveur de dev
└── .claude/skills/               # frontend-design (Anthropic) et
                                  #   avoid-ai-design — cf. « Identité visuelle »
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
npx tsx scripts/seed-lineup.ts AAAA-MM-JJ --dry        # 46 lignes — 44 avant 2008-2009
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
| `N joueurs sur la feuille, N au moins` | la LNR oublie un remplaçant | accepté tel quel si les quinze titulaires sont là. **L'effectif attendu dépend de l'époque** — cf. `effectifDeFeuille()` |
| `réalisations incohérentes` | score courant fautif | lire les faits du match ; le total final fait foi |
| `N point(s) inexpliqué(s)` | transformation non inscrite | le script la rattrape sur les deux camps ; s'il échoue encore, la feuille est fautive |
| `… hors composition` sur un auteur | essai collectif, ou composition fausse | soupçonner la base avant la source |
| `… hors composition` sur un **carton** | la LNR sanctionne un homme qu'elle n'aligne pas | irrattachable : après démonstration, l'inscrire dans `CARTONS_HORS_COMPOSITION` de `seed-opponent-sheet.ts`, qui l'ignore et écrit le reste |
| `feuille LNR introuvable` | mauvais segment de phase | `phasesLnr()` ; vérifier le nom du segment sur le calendrier |
| minutes ≠ 1 200 | carton rouge, ou retour non enregistré | en championnat, un rouge abaisse le total de `80 − minute` ; **en coupe d'Europe, de 20 minutes au plus** (cf. ci-dessus) ; sinon signaler, ne pas inventer |
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

  - **et deux mots de patronyme communs ne suffisent pas non plus quand les
    prénoms se contredisent.** « Ignacio Fernandez Lobbe », deuxième ligne de
    Northampton, s'est retrouvé le 16 octobre 2009 sur la fiche de son frère
    Juan Martín, troisième ligne de Toulon : « Fernandez » et « Lobbe »
    faisaient les deux mots communs, tous deux du nom de famille, et le prénom
    ne pesait rien. C'est le piège du frère célèbre — celui-là même qui a
    fait écarter ESPN du championnat —, et il s'est refermé sur la première
    campagne européenne venue d'ESPN. Un prénom donné des deux côtés doit
    donc s'accorder, un mot en commun à un préfixe ou à une lettre près ; un
    prénom absent d'un côté ne contredit rien. Vérifié sans régression sur
    240 recherches de fiches à prénom composé, et sur les deux campagnes
    européennes déjà écrites. Corrigé par `reassign-match-player.ts` sur les
    deux lignes de Northampton, le 5 septembre 2026.

  S'y ajoute une quatrième précaution, née des noms sud-africains : **les
  particules ne désignent personne.** `mots()` écarte déjà ce qui fait moins de
  trois lettres, mais « van » et « der » en font exactement trois — sans les
  écarter, « Van Der Mescht », « Van Der Westhuizen » et « Van Der Merwe » se
  valent tous, et trois hommes sans rapport deviennent candidats l'un pour
  l'autre.

  **La liste vit dans `noms.ts`, et non plus dans `joueurs.ts`**, parce que
  *tout* rapprochement de noms en a besoin — `motsUtiles()`. L'appariement de
  l'effectif ne l'avait pas, et il tenait de ce fait « Jacobus Van Tonder »
  pour un candidat possible de « Martinus Jacobus Van Der Heever », deux
  hommes que seul « Van » rapproche : `sync-effectif.ts` **refusait d'écrire**
  sur cette ambiguïté, et il le faisait depuis assez longtemps pour que
  `LIENS_VERIFIES` soit resté vide. Une exception nominative l'aurait
  débloqué ; la cause était ailleurs, et la corriger a levé l'ambiguïté sans
  rien inscrire à la main.

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
- `players` contient donc majoritairement des adversaires : 3 516 fiches ont
  joué **contre** l'USAP, 325 sous son maillot — 161 des deux côtés. C'est
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
    si : le match du joueur s'arrête à la minute du carton. En **championnat**,
    où le rouge est définitif, l'équipe finit à quatorze et totalise donc
    `1200 − (80 − minute du rouge)`.
  - **Mais en coupe d'Europe, le rouge ne coûte que vingt minutes.** Le
    **carton rouge de 20 minutes** y sort le joueur pour de bon et repourvoit
    son poste au terme de la sanction : l'équipe ne finit pas à quatorze, elle
    y joue vingt minutes. **C'est le carton orange du championnat de France**,
    sous un autre nom — le joueur ne revient pas, son poste si, et le
    suppléant a le droit d'entrer vingt minutes après le carton. Le total attendu est `1200 − min(80 − minute, 20)`,
    et `minutesAttendues()` de `seed-cup-sheet.ts` porte la règle et sa
    démonstration.

    **L'oubli de cette distinction a coûté un faux positif tenace.** Le
    Dragons-Perpignan du 7 décembre 2025 — Duncan Paia'aua exclu à la 14ᵉ, Job
    Poulet entrant à la 35ᵉ — totalise 1 179 minutes. La règle du championnat
    en attendait 1 134, et l'écart de quarante-cinq minutes a figuré dans les
    anomalies de la base jusqu'à ce qu'on aille lire la feuille : il n'y avait
    rien à corriger, la base disait déjà exactement ce que dit l'EPCR, qui
    compte lui-même 1 179. **Devant un écart de minutes sur un match européen,
    vérifier la règle avant de soupçonner la donnée.**

    Une minute d'écart subsiste sur ce match, et elle n'est pas rattrapée :
    les minutes d'Opta ne se recoupent pas au ras de la minute — sa feuille
    laisse une sortie de la 63ᵉ sans entrée en regard. `seed-cup-sheet.ts` la
    signale et ne la corrige pas.
  - **Le banc n'a pas toujours compté huit remplaçants.** Une feuille porte
    **22 joueurs jusqu'en 2007-2008** et **23 depuis 2008-2009** :
    `effectifDeFeuille(saison)` de `scripts/lib/feuilles.ts` porte la règle,
    et `seed-lineup.ts` l'appelle. La base le démontre d'elle-même — 2008-2009
    compte 54 équipes-matchs à 23 pour 2 à 22, toutes les saisons postérieures
    sont à 23, et les 25 compositions lisibles de 2007-2008 sont **toutes à
    22, sur les deux camps**. Écrire 23 en dur revenait à annoncer « la LNR en
    oublie un » cinquante-quatre fois sur une saison de 2007-2008, et à y
    perdre le seul vrai oubli. **2006-2007 et 2005-2006 sont aussi à 22**,
    vérifié sur leurs feuilles : la borne basse recule de deux ans sans être
    atteinte. Sur les 52 équipes-matchs de
    2005-2006, 32 portent les 22 attendus, 12 en portent 21 et 8 en portent
    20 : la source omet davantage à mesure qu'on remonte, d'où
    `effectifMinimalDeFeuille(saison)`, qui tolère deux absents jusqu'en
    2005-2006 et un seul ensuite. **2004-2005 descend jusqu'à dix-sept** —
    les quinze titulaires et deux remplaçants —, et son plancher vaut donc
    dix-sept : il ne protège plus de grand-chose, le contrôle qui compte étant
    celui des quinze titulaires, que ses dix-sept feuilles publiées satisfont
    toutes.

    **Et elle omet aussi des titulaires.** Six feuilles de 2005-2006 n'en
    dessinent que treize ou quatorze, des dossards précis manquant à leur
    schéma du terrain. `titulairesManquantsAdmis(saison)` porte le partage :
    un titulaire **de trop** reste un échec à toute époque — il ajoute jusqu'à
    80 minutes fictives —, un titulaire **manquant** ne fabrique rien et passe
    en avertissement sur ces saisons-là. Arbitré par Jérémy le 3 septembre
    2026.
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

**La bascule de 2004-2005 est attestée depuis le 4 septembre 2026**, par la
saison elle-même : son classement porte deux colonnes BO et BD, et 18×4 + 1×2
+ 9 + 3 font les 86 points annoncés à l'USAP — le vieux barème en donnerait 67.
Le seuil défensif de sept points l'est aussi, les trois bonus défensifs du
classement se retrouvant exactement sur les scores.

Deux réserves subsistent : la **date de la décision** LNR de 2004 n'est
toujours pas sourcée — seule la saison d'application l'est —, et la date
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
- **La LNR omet parfois un titulaire**, et pas seulement un remplaçant : elle
  ne publie que quatorze Parisiens le 21 avril 2012, le n°6 manquant. Le match
  échoue alors, et c'est voulu. `TITULAIRES_MANQUANTS` de
  `scripts/lib/feuilles.ts` rend le joueur à son dossard, à la condition
  qu'une autre source donne la composition **entière** et que les autres
  concordent au dossard près. La table est partagée avec
  `audit-opponent-lineups.ts`, qui sans elle signalerait « en trop » un joueur
  délibérément ajouté.
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
- et **le score du calendrier lui-même peut être faux**, ce qui est plus grave
  puisqu'il fait foi partout ailleurs. Elle donne 40-6 au Perpignan-Narbonne du
  30 août 2006, sur son calendrier **comme dans ses faits**, quand le vrai
  score est 45-6. La démonstration est arithmétique et sans appel : avec les
  scores de la LNR, la colonne des **points encaissés** de la saison retombe
  au point près sur les 398 du classement, quand celle des **points marqués**
  vaut 488 pour 493 — et J3 est la seule rencontre où les deux sources
  divergent, de exactement cinq points. Un essai non transformé, absent du
  calendrier et des faits. `SCORES_CORRIGES` de `seed-season-2006-2007.ts`
  porte le cas ; c'est le seul du projet où une autre source l'emporte **contre**
  le score officiel, et il est démontré, pas supposé ;
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
- **un coup d'envoi avant huit heures du matin veut dire « heure inconnue »**,
  non « joué à l'aube » : la LNR en laisse ici et là, et pris au mot il recule
  le match d'un jour, minuit à +02:00 valant 22 heures la veille en temps
  universel. `momentDuMatch()` rend alors l'heure `null` et ancre la date à
  midi UTC.

  **La règle a d'abord porté sur la seule valeur 00:00, et c'était trop
  étroit** : la demi-finale du 2 juin 2006 est annoncée à **01:00**, et
  reculait au 1er juin. C'est le même trou, décalé d'une heure. Elle porte
  désormais sur une plage, et la borne est vérifiée — sur les 533 coups
  d'envoi renseignés de la base, le plus matinal est à 12h30 ;
- et **avant 2017-2018 il crédite neuf points à un essai de pénalité**, la
  transformation y étant comptée deux fois. `lireFeuille` le corrige et porte
  la démonstration, fait par fait ; sans elle, sept matchs de 2016-2017
  finissaient deux ou quatre points au-dessus de leur score officiel ;
- **les postes de `/compositions` ne sont pas fiables** : `positionPlayed` se
  déduit du numéro de maillot ;
- **ET SES COMPOSITIONS ELLES-MÊMES CESSENT DE L'ÊTRE EN 2005-2006.** Vingt-
  trois de ses vingt-six feuilles y dessinent un quinze qui n'a jamais existé —
  liste alphabétique de l'effectif du club, numérotée de 1 à 22 en serpentin,
  ou brouillée sans l'être. Un talonneur y porte le n°10, un deuxième ligne le
  n°11. **Rien dans la page ne le dit** : elle a la forme d'une vraie feuille.
  `dossardsFabriques()` reconnaît le serpentin ; `concordanceDesDossards()` de
  `lib/dossards.ts` tranche les autres, en confrontant chaque titulaire au
  numéro qu'il porte ailleurs dans la base. **Devant une saison plus ancienne,
  ne jamais tenir une composition pour vraie sans l'avoir confrontée** ;
- **elle ne publie aucun changement avant 2006-2007** : les vingt-sept feuilles
  de 2005-2006 en portent zéro, quand celles de 2006-2007 en donnent une
  douzaine par match. Les temps de jeu ne se reconstituent alors pas, et
  `seed-opponent-sheet.ts` refuse d'en écrire plutôt que de rendre 80 minutes à
  chaque titulaire — ce qui ferait retomber le total sur 1 200 sans rien
  signaler ;
- **son archive s'arrête à 2004-2005**, désormais en base :
  `/calendrier-et-resultats/2003-2004/j1` rend 404, quand 2004-2005 répond avec
  ses trente journées de Top 16 ;
- **et elle n'y publie ni fait ni changement.** Les vingt-sept feuilles de
  2005-2006 portent des faits et aucun changement ; les **trente de 2004-2005
  n'ont ni l'un ni l'autre** — pas un essai, pas un carton, pas un
  remplacement. Il n'y a donc là ni chronologie, ni réalisation par joueur, ni
  temps de jeu à écrire, et les compteurs de la rencontre restent à `null` ;
- **le Top 16 est dans la liste blanche de `phasesLnr()`** depuis 2004-2005 :
  ses journées se lisent sur les mêmes URL que celles du Top 14, sous le même
  `top14.lnr.fr`. L'omettre aurait mis toute la saison hors périmètre, en
  silence ;
- la LNR **ampute les accents** — ne jamais réécrire une orthographe déjà en
  base à partir d'elle ;
- elle **ne publie pas toutes ses compositions** : neuf journées de 2022-2023
  et le barrage 2021-2022 n'affichent que les officiels, quand ils affichent
  quelque chose ;
- un changement peut porter **deux noms faux à la fois** ; la table
  `CHANGEMENTS_CORRIGES` de `seed-opponent-sheet.ts` est faite pour ça, et ne
  s'écrit qu'avec la démonstration sous les yeux ;
- **elle écrit parfois un nom à l'envers**, capitales comprises : « Aramburu
  Federico MARTIN » pour Federico Martín **Aramburu**, dont « Martín » n'est
  que le second prénom. La convention des capitales est respectée, c'est
  l'enregistrement qui est faux, et rien ne permet de le deviner — « Martin »
  est un patronyme ordinaire, la base en porte huit. `NOMS_MAL_DECOUPES` de
  `lib/lnr.ts` redresse ces cas au découpage, et la table se vérifie à la
  main : y ajouter une ligne, c'est affirmer que la source se trompe.

  **Et il faut la brancher sur les deux chemins d'extraction.** Les
  remplaçants viennent des listes du bas, en un seul morceau, et passent par
  `separerNom` ; les titulaires viennent du schéma du terrain, où la LNR donne
  `player-pitch__first-name` et `player-pitch__last-name` **déjà séparés** —
  `separerNom` ne les voit jamais. Ne corriger que le découpage laissait
  Aramburu juste sur le banc le 3 novembre 2007 et faux comme titulaire le
  24, dans la même saison. `redresserNom()` couvre les deux.

  **Le cas le plus fréquent est la particule prise pour un patronyme** :
  « Der Merwe Ryno | VAN » et « Rensburg Charl | VAN » sur la feuille du
  5 janvier 2008, là où la même page écrit correctement « Johan | VAN ZYL ».
  Un patronyme réduit à `van`, `de`, `der`, `le`… **fait désormais échouer la
  lecture** : le message dit quoi vérifier et où l'inscrire. C'est délibéré —
  sans cet arrêt, le prochain cas passerait en silence dans une saison qu'on
  n'aurait pas balayée. Vérifié sans régression : aucune des 3 489 fiches de
  la base ne porte un tel patronyme ;
- **elle émet un gabarit `Prenom_N NOM_N` quand un joueur manque à sa propre
  base**, et l'enregistrement est alors corrompu de bout en bout : absent de
  la composition, sans fiche (`url: null`), et irrattrapable. Le cas de
  Gonçalo Uva (jeton 545) s'est résolu par ESPN ; **deux autres ne se
  résolvent pas** — le n°7 de Brive du 26 avril 2008 (jeton 303) et le n°8
  d'Auch du 30 mai 2008 (jeton 126).

  Tout a été tenté : `/joueur/303` et ses variantes rendent 404 sur les deux
  sites — la LNR exige le slug exact, et le refuse même à une fiche valide —,
  les fiches joueur vivent sur `prod2.lnr.fr` sans que cela aide, ESPN ne
  couvre pas la saison, et Wikipédia n'a pas ces effectifs. Les deux jetons
  reparaissent d'ailleurs sur d'autres feuilles de leurs clubs, J12 et J25 :
  ces deux hommes sont absents de la base de la LNR partout.

  **Ces deux rencontres restent donc sans composition**, et c'est le projet
  qui a déjà tranché : une feuille à 22 dont la LNR oublie un remplaçant est
  acceptée, une composition qui n'aligne pas quinze titulaires fait échouer le
  match. Leurs scores, bonus et agrégats sont écrits et justes ; seules les
  compositions manquent ;
- **certaines pages de journée sont amputées**, et la rencontre de l'USAP peut
  y manquer : celle de la J11 de 2007-2008 ne publie que 2 rencontres sur 7,
  celle de la J24 en publie 5 sur 7. Les feuilles existent pourtant, et se
  retrouvent par balayage des identifiants — ils sont séquentiels — entre ceux
  des rencontres publiées de part et d'autre. `FEUILLES_HORS_CALENDRIER` de
  `lib/lnr.ts` les donne en dur, et **`chercherFeuille` comme `lireCalendrier`
  la consultent** : toute la chaîne cherche sa feuille par le calendrier, une
  table posée dans un seul script aurait fait buter les trois autres l'un
  après l'autre ;
- et **`phasesLnr()` ne répond que pour les compétitions que la LNR couvre** —
  Top 14, Pro D2, barrage —, sur une **liste blanche**. Elle rendait
  auparavant `["finale"]` pour un « Huitième de finale » de Challenge
  européen, `/finale/i` le reconnaissant, et le match partait chercher le
  segment `finale` du championnat. Le 4 avril 2026 il n'a rien trouvé et l'a
  dit ; une saison où l'USAP dispute les deux aurait rendu la feuille de la
  finale de Top 14 et l'aurait **écrite sur le match européen, sans un mot**.
  La règle n'existait que dans `audit-opponent-lineups.ts`, sous forme de
  liste noire ; les quatre autres appelants n'avaient rien. Elle est
  désormais dans la fonction, et la liste noire a disparu du script.
  `fix-opponent-lineup.ts` et `seed-cup-sheet.ts` gardent la leur : elle y
  **route** vers l'EPCR, ce n'est pas la même règle.

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
- **allrugby.com** — **de nouveau joignable au 3 septembre 2026**, après
  l'avoir été en août. Seule source retrouvée pour le Challenge Cup 2022-2023,
  et c'est elle qui a débloqué 2006-2007.

  Ce qu'elle donne : le **calendrier d'une saison ancienne** avec le score de
  chaque rencontre, et surtout, **à côté du score, le bonus** — `<span
  class="bonus">Bo</span>` ou `Bd`, sur la fiche de match comme sur le
  calendrier. C'est la seule source connue qui attribue le bonus **match par
  match** pour ces saisons-là : le classement, lui, n'en donne que le total, et
  Wikipédia ne marque rien.

  Ses fiches de match d'avant 2010 s'arrêtent là : ni composition, ni marqueur,
  ni minute — l'« évolution du score » y est vide. Ne pas espérer en tirer une
  décomposition.

  Les URL sont `/{saison}/matchs/{domicile}-{exterieur}-{id}.html`, l'identifiant
  se relevant sur `/competitions/top-14-{annee}/calendrier.html`. Un
  `User-Agent` ordinaire suffit.

  **SA COUVERTURE COMPLÈTE COMMENCE À 2006-2007, ET PAS AVANT.** Pour
  2005-2006 (`top-14-2006`) comme pour 2004-2005 (`top-16-2005`), son
  calendrier ne publie que les rencontres d'**un seul club, Clermont** — ses
  vingt-six ou trente matchs, et rien d'autre. Il n'y a ni sélecteur de club ni
  calendrier par club pour ces saisons-là : la page `/clubs/usap/calendrier`
  n'affiche que la saison en cours. C'est ce qui empêche d'y placer les neuf
  bonus offensifs de 2004-2005.

  Son tableau de feuille de match, quand il existe, se lit **colonne par
  colonne** — treize colonnes, les réalisations de l'USAP à gauche du nom,
  celles de l'adversaire à droite, le club recevant à gauche et non l'USAP, et
  les remplacements de droite écrivent la minute avant le nom, l'inverse de la
  gauche.

  **Ce n'est pas une source officielle, et c'est sa concordance qui la vaut.**
  On ne s'en sert pas parce qu'elle affirme, mais parce qu'elle redit sans
  écart ce que les feuilles lisibles établissent déjà — et le garde-fou de la
  saison vérifie aussitôt ce qu'elle apporte en propre. Une source qui ne
  concorderait qu'à moitié ne vaudrait rien.
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

Le code réutilisable va dans `scripts/lib/` : `dossards.ts` pour vérifier
qu'une composition officielle n'est pas brouillée — il confronte chaque
titulaire au numéro qu'il porte ailleurs dans la base, et c'est le seul
instrument qui voie les compositions fausses de 2005-2006 —, `lnr.ts` pour les
feuilles de la LNR, `epcr.ts` pour le flux des coupes d'Europe, `noms.ts` pour le
rapprochement des noms entre une source et la base, `joueurs.ts` pour
retrouver ou créer une fiche à partir d'une feuille officielle, `effectif.ts`
pour rapprocher l'effectif publié par la LNR des fiches — règle plus stricte
qu'ailleurs, un mot du **nom de famille** et un mot du prénom, parce qu'elle
s'applique aux milliers de fiches de la base et non aux vingt-trois d'une
feuille —, `fusion.ts`
pour l'absorption d'une fiche par une autre, `stades.ts` pour le terrain d'une
rencontre — historique des stades et lieux particuliers compris —, et
`arbitres.ts` pour celui des arbitres — plus strict, puisqu'il exige le nom de famille : le corps
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
| `fix-player-position.ts` | corrige le **poste de référence** d'un joueur (`--joueur=`, `--poste=`, `--dry`) — et avec lui les effectifs de saison et les lignes de **remplaçant**, où `positionPlayed` reprend la fiche faute de dossard parlant. Ne touche pas aux titulaires, dont le poste vient du numéro |
| `rename-player.ts` | renomme une fiche, slug compris — un slug refait à la main sans le CUID rend la fiche introuvable |
| `reassign-match-player.ts` | change le joueur porté par un dossard sur une feuille, quand la base a mis quelqu'un d'autre et que les deux noms se ressemblent trop pour que l'audit s'en aperçoive — **le seul instrument** pour un prénom faux sous un patronyme juste, que `fix-opponent-lineup.ts --identites` ne voit pas ; il repointe aussi ce que la chronologie du match attribuait à l'ancien occupant |
| `delete-orphan-players.ts` | supprime les fiches vides de bout en bout — aucune feuille, aucun événement, aucune donnée personnelle, et pas `isActive` ; les figures historiques et les recrues à venir sont ainsi protégées |
| `close-season-2025-2026.ts` | modèle de clôture de saison, avec garde-fou sur le classement officiel |
| `seed-opponent-sheet.ts` | **le script du chantier adverse** : reprend une saison entière depuis la LNR — réalisations, cartons et temps de jeu reconstitués à partir des changements. Prend la saison en argument (`2023-2024`), `--dry` pour simuler, `--detail` pour le relevé des écarts avec la base, `--match=AAAA-MM-JJ` pour n'en reprendre qu'un, `--usap` pour traiter **aussi le camp catalan** — il passe alors deux fois, l'adverse puis l'USAP |
| `seed-lineup.ts` | crée les **deux compositions** d'un match depuis la LNR quand il n'en a aucune — dossards, titulaires, capitaine, poste déduit du numéro. Premier temps de la reprise d'une rencontre ancienne ; `--dry`, `--force` pour réécrire |
| `seed-fiches-joueurs.ts` | complète les fiches joueur depuis **Wikipédia** : date, ville et pays de naissance, taille, surnom, et une **biographie composée** — jamais recopiée, CC BY-SA exigeant l'attribution. **L'identité tient à la catégorie, pas au titre** : l'article doit porter une catégorie citant Perpignan, faute de quoi il est refusé, et les pages d'homonymie sortent d'elles-mêmes. Le poste de l'infobox ne sert qu'à la phrase, **jamais à `Player.position`** — celui-là se déduit du numéro de maillot. `--dry`, `--joueur=`, `--introuvables` |
| `seed-selections-distinctions.ts` | écrit `PlayerInternational` et `PlayerAward` depuis **Wikipédia**, seule source : 51 sélections et 7 distinctions. Tables figées dans le script, appariées au **nom exact** — `memeJoueur` est taillé pour les vingt-trois d'une feuille, pas pour 3 900 fiches, et rapprochait « Chris Cusiter » de Christophe Manas. Crée les pays et sélections manquants. 43 des 92 internationaux listés n'ont pas de fiche, la base commençant en 2004-2005 ; les Lions britanniques n'entrent pas, `NationalTeam` exigeant un pays. `--dry` |
| `seed-carrieres.ts` | déduit `CareerClub` et `PlayerStint` des feuilles de match : un passage par club, l'USAP comprise. **Trois règles arbitrées**, toutes dans son en-tête : les compteurs de matchs et d'essais ne sont écrits que du côté catalan, où ils disent vrai ; un joueur dont un passage commence en 2004-2005 n'a **aucune** carrière, la base ne sachant pas depuis quand il était là ; et un second passage ne s'ouvre qu'après trois **occasions manquées** — les saisons où ce club-là a bien rencontré l'USAP —, faute de quoi les quatre saisons de Pro D2 feraient déménager tout le Top 14. `--dry`, `--joueur=` |
| `seed-cloture-saisons.ts` | **la clôture éditoriale** : entraîneur, président et bilan de chaque saison, de 2004-2005 à 2024-2025. Écrit `Season.coachId`, `presidentId`, `notes` et le détail `SeasonCoach` — plusieurs entraîneurs par saison, avec rôle et dates. Source entière : Wikipédia, seule à publier le staff d'un club. `--dry`, `--saison=` ; n'écrase jamais un bilan existant |
| `seed-season-2004-2005.ts` | crée les 30 matchs de la **plus ancienne saison en base**, la dernière du Top 16 et la dernière que la LNR archive. Modèle pour une saison dont la source ne publie **aucun fait** : compteurs à `null` partout, bonus défensif calculé sur le seul score, bonus offensif introuvable — et **agrégats délibérément non écrits**. Porte le second `SCORES_CORRIGES` du projet, démontré deux fois |
| `seed-season-2005-2006.ts` | crée les 27 matchs de la saison suivante — 26 journées et une demi-finale, la première du Top 14. Modèle pour une saison dont la LNR ne publie ni changement ni composition fiable, et dont cinq journées sont hors calendrier |
| `seed-season-2006-2007.ts` | crée les 26 matchs d'une saison de Top 14 sans phase finale — cinquième, **la plus ancienne en base**. Porte `SCORES_CORRIGES`, seule table du projet qui contredise un score officiel, et une `FEUILLES_SANS_FAITS` dont les entrées peuvent ne valoir **que pour un camp** : son contrôle arithmétique est rendu camp par camp, un score corrigé ne dispensant plus de rien |
| `seed-season-2007-2008.ts` | crée les 27 matchs d'une saison de Top 14 **avec demi-finale** — quatrième, éliminée au Vélodrome. **Le modèle le plus récent.** Porte trois particularités : `FEUILLES_HORS_CALENDRIER` pour deux journées amputées, `FEUILLES_SANS_FAITS` pour une feuille muette, et un garde-fou Wikipédia qui sépare BO et BD |
| `seed-season-2008-2009.ts` | crée les 28 matchs de la saison du titre 2009 — **le modèle le plus récent**, et le seul dont le garde-fou vienne de Wikipédia, la LNR ne publiant aucun classement pour cette saison |
| `seed-season-2009-2010.ts` | crée les 28 matchs de la saison de la finale perdue de 2010 : Top 14 **avec phase finale**, classement à corriger des barrages, terrains neutres, et réalisations complétées |
| `seed-season-2010-2011.ts` | crée les 26 matchs d'une saison de Top 14 sans phase finale — neuvième |
| `seed-season-2011-2012.ts` | crée les 26 matchs d'une saison de Top 14 sans phase finale — onzième |
| `seed-season-2012-2013.ts` | crée les 26 matchs d'une saison de Top 14 sans phase finale — septième |
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
| `seed-calendrier-europe-2026-2027.ts` | le pendant pour la **coupe d'Europe** : les quatre matchs de poule de Challenge Cup depuis le flux de l'EPCR, sans score. Crée l'Ulster, et pose deux terrains à la main avec leur source — Ravenhill à Belfast, Rodney Parade à Newport —, l'USAP n'y ayant jamais joué. `--dry` |
| `set-arbitre.ts` | pose l'arbitre d'une rencontre quand il vient d'ailleurs que d'une feuille — la désignation de la semaine, donnée par Jérémy. `--match=AAAA-MM-JJ --nom="Prénom Nom"`, `--dry`, `--force` pour remplacer un arbitre déjà posé ; passe par `lib/arbitres.ts`, jamais par un slug refait à la main |
| `seed-season-2021-2022.ts` | crée les rencontres d'une saison entière — date et heure, compétition, adversaire, lieu, score, réalisations, résultat, bonus, arbitre — puis les agrégats de saison. Premier jalon de la phase 4 |
| `seed-cup-espn.ts` | **une campagne européenne d'avant 2020-2021, depuis ESPN** — rencontres, compositions des deux camps et réalisations par joueur, par `lib/espn.ts`. Rien ne s'écrit sans le classement de poule de Wikipédia, en dur par saison dans `CAMPAGNES`, et les réalisations d'un camp ne s'écrivent que si leur somme retombe sur son score. Minutes, minutes de carton, arbitre, affluence et chronologie restent à `null` : la source ne les donne pas. `<saison>`, `--dry`, `--match=` |
| `seed-cup-sheet.ts` | **le pendant pour les coupes d'Europe**, depuis l'EPCR : réalisations, cartons et temps de jeu des **deux camps**, plus l'arbitre, l'affluence et la mi-temps. Sans argument il reprend les dix-huit matchs européens ; `--dry`, `--detail`, `--match=AAAA-MM-JJ` comme le précédent |
| `audit-opponent-lineups.ts` | confronte les compositions adverses aux feuilles officielles LNR — les deux divisions, phases finales comprises ; lecture seule, à lancer sur une saison ou sur tout. **Zéro anomalie est l'état attendu** ; les variantes d'affichage arbitrées sont tues par sa table `VARIANTES_DAFFICHAGE`, comptées au récapitulatif et listées par `--variantes` |
| `fix-opponent-lineup.ts` | remet une composition en accord avec la feuille officielle — LNR pour le championnat, EPCR pour les coupes — (identités, dossards, titulaires, capitaine) ; `--usap` traite aussi le camp catalan |
| `fetch-player-photos.ts` | rapatrie les portraits dans `public/images/players/`, renseigne `photoUrl` et consigne auteur et licence dans `credits.json` : **la LNR pour l'effectif, Wikimedia Commons pour les anciens**. `--dry`, `--effectif` ou `--commons` pour n'en faire qu'une, `--images` pour n'écrire que les fichiers, `--planche` pour la planche contact, `--force` pour réécrire |
| `fetch-club-logos.ts` | rapatrie les logos officiels des clubs dans `public/images/logos/`, depuis les CDN de la LNR et de l'EPCR, et renseigne `Opponent.logoUrl` |
| `fix-match-venues.ts` | met les stades en ordre : fusionne les doublons, crée les manquants, rattache chaque club à son terrain — déduit des déplacements déjà enregistrés — puis complète les matchs sans lieu, par `terrainDuMatch()` |
| `seed-stades-historiques.ts` | écrit les terrains d'**avant** : les trois clubs qui ont déménagé pendant la période couverte, chacun avec sa source. À relancer après `fix-match-venues.ts` si un stade manquait |
| `sync-effectif.ts` | met l'effectif professionnel en accord avec la LNR : crée les fiches manquantes, lève `isActive` sur l'effectif et l'abaisse sur les partants, puis **inscrit l'effectif à la saison en cours** (`SeasonPlayer`, en ajout seul) ; refuse d'écrire tant qu'un doublon ou un nom douteux subsiste |
| `fix-null-penalty-tries.ts` | met à 0 les compteurs `penaltyTries` restés `null`, mais seulement là où les points retombent déjà sur le score |
| `fix-barrages-access-match.ts` | les deux trous des barrages d'accession — arbitre du 12/06/2022, mi-temps du 03/06/2023 — et la transformation que la chronologie de ce dernier avait perdue |
| `fix-carton-rouge-dragons-2025.ts` | la minute du carton rouge de Paia'aua, 35ᵉ pour 14ᵉ, dans la chronologie du 7 décembre 2025 ; porte les trois preuves concordantes |

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

**Mais la ruse a une limite, et quatre clubs la montrent.** Albi, Bourgoin,
Tarbes et Auch ont bien chacun une URL d'écusson sur le calendrier de leur
saison — et le CDN ne rend au bout qu'un **bouclier gris** de 33 par 45
pixels, le même pour les quatre, quand les autres clubs de la page rendent
leur vrai PNG. Il en va de même sur tous les calendriers archivés depuis 2012,
et sur ceux de la Pro D2 : la LNR ne garde qu'une image par club, et pour
ces quatre-là c'est le bouclier. `fetch-club-logos.ts` le reconnaît à son empreinte
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
plus compact, donc un carré blanc plus discret en thème sombre.

**Auch est le quatrième, et le seul dont le club n'existe plus.** C'est ce qui
le distingue des trois autres, qui vivent toujours et publient leur marque :
le **FC Auch Gers a été liquidé en 2017**, et son site `fcag-rugby.com` est
aujourd'hui un domaine parqué et mis en vente. Le RC Auch Rugby lui a succédé
et a bien un écusson en ligne, mais c'est un **autre club**, fondé en 2017 —
l'afficher sur une rencontre de 2007-2008 serait le même anachronisme que
celui qu'`OpponentVenue` évite sur les stades.

Son écusson vient donc de **Wikipédia**, seule entrée de la table qui ne
vienne pas du club lui-même, et avec trois réserves : **80 par 80 pixels**
quand le plus grand affichage du site en fait 48 ; **JPEG, donc sans
transparence**, le blason étant blanc cerné de rouge et le blanc faisant
partie du dessin comme pour Tarbes ; et une licence « **marque déposée** »,
l'exception d'usage propre à Wikipédia plutôt qu'une publication du club.
Arbitré par Jérémy le 1er septembre 2026.

Tarbes et Auch sont donc les deux seuls écussons de la base sans
transparence, depuis que celui de Clermont a été repris à la source.

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

## Photos des joueurs

**65 fiches sur 319 sont illustrées**, dont **46 des 50 joueurs de l'effectif
professionnel**. Les images sont servies par le site lui-même depuis
`public/images/players/{slug}.webp` — 1,3 Mo au total, carrés de 400 pixels,
le plus grand affichage du site en faisant 160.

**Deux sources, et c'est l'époque du joueur qui tranche.**

### La LNR pour l'effectif actuel

`cdn.lnr.fr/joueur/{id}-{slug}/photo/photoFull.{empreinte}`, l'identifiant
venant de `/club/perpignan/effectif-staff` par `lireEffectif`. Portraits
officiels en 800×1200 WebP, buste **détouré sur fond transparent**, le joueur
sous le maillot de la saison. C'est la source officielle du projet.

**Mais elle ne conserve ses portraits que pour les joueurs récents**, et c'est
vérifié : sur la feuille Perpignan-Toulon du 25 août 2012, les fiches de
Nicolas Mas, Alasdair Strokosch, Jérémy Castex et Romain Terrain ne portent
aucune image, quand celles de la J1 de 2025-2026 en portent toutes.

**ET ELLE A UN PLACEHOLDER, COMME POUR LES ÉCUSSONS.** Quand un joueur n'a
pas encore été photographié, son CDN ne rend pas une erreur mais une
**silhouette grise** de 237×335 pixels, 5 730 octets, sous l'URL normale du
portrait — huit des cinquante joueurs de l'effectif au 2 septembre 2026, tous
des recrues. `PLACEHOLDER_LNR` la reconnaît à son empreinte SHA-256 et refuse
de l'enregistrer ; les quarante-deux autres portraits ont chacun une empreinte
distincte, le contrôle ne rejette donc rien de bon.

### Wikimedia Commons pour les anciens

Une photo de joueur est une œuvre protégée, bien davantage qu'un écusson, et
Commons est la seule source qui porte une **licence lisible par machine**. Le
script refuse toute image dont la licence n'est pas libre.

**CC BY ET CC BY-SA EXIGENT L'ATTRIBUTION.** Le crédit affiché sous la photo
sur la fiche joueur — `creditPhoto()` de `src/lib/credits-photos.ts`, nourri
par `public/images/players/credits.json` — n'est donc pas décoratif : le
retirer rendrait le site fautif. La mention couvre aussi les portraits LNR, à
qui `credits.json` attribue « © LNR, tous droits réservés » plutôt que de
taire leur provenance.

**Les droits ne sont pas les mêmes des deux côtés** : Commons donne une
licence libre, la LNR non. Afficher ses portraits relève du même arbitrage
que ses écussons — un usage toléré sur un site d'histoire non commercial, qui
appartient au propriétaire du site.

### Trois garde-fous, et le deuxième protège l'identité

1. **L'article Commons est nommé à la main**, dans `PORTRAITS`. Chercher par
   mot-clé rendait « Lucas Dubois » ou « David Marty » sans qu'on puisse dire
   de quel homme il s'agit — le piège des homonymes des feuilles de match.
2. **L'article doit mentionner Perpignan ou l'USAP.** Un titre juste ne
   prouve pas l'identité. `ARTICLES_HORS_PERPIGNAN` en dispense les recrues
   toutes fraîches, que Wikipédia n'a pas encore enregistrées — mais chaque
   ligne est une affirmation vérifiée à la main : Marco Riccioni y figure
   parce que la LNR l'inscrit à Perpignan en 1ère ligne et que l'article
   décrit un pilier droit international italien né en 1997, alors aux
   Saracens. L'article est en retard, pas faux.
3. **La licence doit être libre**, et l'image assez grande pour être un
   portrait — sans quoi un logo de club ou un drapeau passerait.

Côté LNR, l'identité vient de `apparierEffectif()` : un joueur qu'on ne sait
pas rattacher n'a pas de portrait, et il est nommé au relevé.

### Le cadrage, et pourquoi il diffère selon la source

Le site affiche la photo en carré quand les deux sources servent des
portraits verticaux.

**Sur les portraits LNR, aucune heuristique n'est nécessaire : ils sont
détourés.** Le canal alpha donne la boîte exacte du buste — on rogne dessus,
puis on prend un carré en haut, centré, à 62 % de la largeur. Sur un buste,
la tête est en haut et au milieu : c'est une propriété de l'anatomie, pas une
supposition sur l'image.

**UN CADRAGE EN FRACTIONS FIXES NE SUFFISAIT PAS**, et le contre-exemple est
net : le gabarit de la LNR **n'est pas uniforme d'un club à l'autre**. Les
portraits pris à Perpignan cadrent le buste serré, celui de Benjamin
Urdapilleta — repris de Clermont, comme sept autres recrues qui posent encore
sous leur ancien maillot — recule d'un bon tiers, et les fractions calées sur
le premier lot lui prenaient le vide au-dessus de la tête. Le détourage, lui,
dit où est l'homme quel que soit le lot.

**Sur Commons, en revanche, le recadrage a échoué une fois sur deux.**
`sharp.strategy.attention` vise le contraste et non le visage : elle a rendu
le torse de Jean-Bernard Pujol et de David Mélé — tête coupée —, les jambes
de Kisi Pulu, une mêlée sans visage pour Jean-Pierre Pérez et Tristan
Labouteley. D'où le procédé en deux temps — sur une photo plus haute que
large, ne garder d'abord que la **bande supérieure**, où la tête se trouve
nécessairement, et ne laisser à l'attention que le cadrage horizontal — puis
la table `CADRAGES`, huit recadrages relevés à la main sur l'original.

**Ces dispositifs ne remplacent pas le coup d'œil** : `--planche` écrit une
planche contact HTML, hors de `public/`, et c'est elle qui a montré les
échecs. Un portrait ne se valide pas au journal d'exécution.

**La transparence des portraits LNR est conservée**, et elle sert les deux
thèmes comme celle des écussons : le buste se détache sur le fond de la carte,
clair ou sombre, sans rectangle rapporté.

### Ce qui manque, et pourquoi

**Cinq joueurs de l'effectif n'ont aucun portrait** : Bradley Amituanai, Simon
Taty, Luke McGrath, Aisea Kubunakaravi et Diego Mascarenc — la LNR n'a que
leur silhouette, et Wikipédia soit ne leur consacre pas d'article, soit n'en
illustre pas. À reprendre quand la LNR aura photographié ses recrues : une
simple relance les servira.

**Six anciens n'ont aucune photo libre** : Alan Brazo, Guillaume Vilaceca,
Sadek Deghmache, Genesis Mamea Lemalu, Sione Piukala et Lifeimi Mafi. Ils sont
nommés dans `SANS_PORTRAIT` pour que le récapitulatif les compte — une
omission dite valant mieux qu'une omission tue. **N'y inscrire qu'un joueur
hors de l'effectif** : Lucas Dubois et Tristan Tedder y ont figuré une
journée, avant que la moisson LNR ne les serve.

**Une photo peut être libre et n'illustrer personne.** Wikipédia donne bien
une image à Lifeimi Mafi — un plan large d'un groupe pris de dos,
« Lifemi_Mafi_Munster_back.jpg ». Aucun cadrage n'en tire un portrait : elle
est écartée délibérément. Une absence vaut mieux qu'une image qui ne montre
personne.

**Une seule photo reste hébergée sur Supabase** : celle de Joseph Desclaux,
téléversée à la main avant cette chaîne. `creditPhoto()` rend `null` pour
elle et la fiche n'affiche alors aucun crédit, sa provenance n'étant pas
connue du dépôt. Aucune source ne peut la remplacer : Desclaux est une figure
d'avant-guerre, et ni la LNR ni Commons ne l'illustrent.

**Celle de Tom Ecochard l'a été jusqu'au 2 septembre 2026**, où elle a cédé la
place au portrait officiel de la LNR — il est dans l'effectif. Le script ne
l'avait pas remplacée de lui-même : **une photo téléversée à la main est un
choix, et il le signale au lieu de l'écraser** (« photo hébergée ailleurs, la
LNR en a une »). C'est `--joueur="…" --force` qui tranche, et c'est bien ainsi
que celle-ci a été remplacée, sur décision de Jérémy.

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

**Page des centurions — et ce qu'elle ne peut pas dire.** `/centurions`
recense les joueurs à cent matchs ou plus sous le maillot catalan. Un match s'y
compte **comme sur la fiche du joueur** — une ligne de composition sur une
rencontre jouée, remplaçant non entré compris —, et c'est délibéré : deux
pages qui lient l'une vers l'autre ne peuvent pas annoncer deux nombres
différents pour le même homme. Compter les seules feuilles où le joueur est
entré en jeu ferait tomber la liste de 40 à 37 noms, et le critère serait
faux là où la source ne publie pas les temps de jeu — 2004-2005 et 2005-2006
n'en ont aucun.

**Le tableau ne couvre pas l'histoire du club, et il le dit en tête.** La base
commence en 2004-2005 : les centurions d'avant n'y sont pas, et ceux qui
étaient déjà là en 2004 — Nicolas Mas, David Marty, Perry Freshwater — ont
joué plus de matchs que leur ligne n'en montre. Sans cet avertissement, la
page se lirait comme un palmarès exhaustif.

**Page des meilleurs réalisateurs — trois classements, une seule page.**
`/realisateurs` porte tout ce qui se marque : **aux points** (seuil 50,
soixante-deux joueurs), **aux essais** (seuil 10, quarante-sept) et **au pied**
(seuil 50, vingt-deux — transformations, pénalités et drops). Une page par
classement avait été essayée et défaite le 4 septembre 2026, sur l'arbitrage de
Jérémy : trois entrées de menu pour la même donnée, quand un jeu d'ancres suffit.

**Les trois ne se recopient pas**, et c'est ce qui justifie de les garder tous
les trois : les populations diffèrent — un ailier figure aux essais et pas au
pied, un buteur l'inverse —, et un même joueur y tient trois rangs distincts.
Les centurions, eux, gardent leur page : ils comptent des matchs, pas des
points.

**Un seuil, jamais un « top N ».** Un classement coupé au cinquantième tombe au
milieu d'une égalité ; un seuil se dit et se vérifie. À valeur égale, le moins
de matchs passe devant.

**La décomposition des points est sûre** : sur les 13 478 lignes du camp
catalan, `tries × 5 + conversions × 2 + penalties × 3 + dropGoals × 3` retombe
sur `totalPoints` **sans une seule exception**. Un essai de pénalité, lui, n'a
pas d'auteur et n'entre dans aucune colonne.

**La réserve de couverture y est plus lourde que sur les centurions**, et elle
est donc écrite autrement : **2004-2005 ne porte aucune réalisation**, la LNR
n'y publiant pas un seul fait de match, et 2005-2006 presque aucune. Ce n'est
pas une troncature, c'est un zéro — un buteur de ces années-là paraîtrait
n'avoir jamais marqué. Nicolas Laharrague y figure à 416 points quand ses deux
premières saisons ne comptent pour rien.

**Les extraits de `/statistiques` lient vers les sections** — plus capés vers
les centurions, meilleurs marqueurs vers `#essais`, meilleurs réalisateurs vers
`#points`. Sans ce lien, une page complète existait sans que rien n'y mène
depuis son propre résumé.

**Page des records — et ce qu'un record vaut ici.** `/records` donne dix
records **sur un match**, dix **sur une saison** et trois **séries**, chacun
lié à la rencontre, à la saison ou au joueur qui le porte.

**Ce sont les records de la période couverte, pas ceux du club**, et la page le
dit en tête : la base commence en 2004-2005 pour les rencontres, en 2005-2006
pour les bilans de saison — 2004-2005 n'ayant pas d'agrégats, faute de ses neuf
bonus offensifs. Un siècle lui échappe.

**Et les saisons ne se comparent pas à armes égales.** Les bilans portent sur
le championnat seul, phases finales exclues, mais une saison de Pro D2 compte
trente journées quand le Top 14 en compte vingt-six : les records de volume —
points marqués, victoires — penchent mécaniquement vers la Pro D2, et trois
des quatre premiers en viennent. La division et le nombre de matchs sont donc
rappelés sur chaque carte, plutôt que de laisser croire à une comparaison qui
n'en est pas une.

**Les séries ne coupent pas aux saisons** : quinze défaites d'affilée du
25 août 2018 au 26 janvier 2019, toutes compétitions confondues. C'est le
sens usuel du mot, et le contraire aurait fabriqué des séries plus courtes que
la réalité.

**Présidents et entraîneurs — chronologique, et la période affichée avec.**
Les deux listes étaient l'une alphabétique, l'autre triée sur
`President.startYear` — un champ que **deux présidents sur quatre ont vide**,
si bien qu'ils remontaient en tête devant ceux dont on connaît les dates. Les
deux se trient désormais sur **les saisons que la base leur attache**, du plus
récent au plus ancien, par `lib/periodes.ts`.

`Coach` n'a aucune colonne de dates : sa période se tire des saisons de
l'entraîneur principal **et** du staff détaillé — un adjoint n'a que les
secondes. Et elle est **affichée** sur chaque carte, sans quoi l'ordre
chronologique paraîtrait aussi arbitraire que l'ordre alphabétique.

**C'est la période couverte par la base, pas le mandat** : Marcel Dagrenat y
paraît de 2004-2005 à 2006-2007 parce que l'archive de la LNR ne remonte pas
plus haut, non parce qu'il aurait pris ses fonctions cette année-là. Le mandat
reste affiché quand la fiche le porte — « Depuis 2013 », « 2007–2012 ».

**Fiche de match — le titre qu'elle a décidé.** Une finale affiche une
bannière « Champion » ou « Finaliste » avec un lien vers le palmarès. Le
rapprochement avec `Trophy` se fait sur l'**année de fin de saison** et la
compétition ; l'expression est ancrée au début du libellé de tour, faute de
quoi une demi-finale en hériterait. Il n'y a pas de clé étrangère entre un
match et un titre : le jour où il en faudrait une, c'est là qu'elle irait.

## Bilingue français / catalan

**Le site vise le français et le catalan**, et le chantier se fait en deux
temps. Le premier est posé le 4 septembre 2026 : **la langue est dans
l'adresse**, et rien n'est encore traduit.

Pourquoi commencer par là plutôt que par les traductions : sortir un site de
son unilinguisme coûte d'autant plus cher qu'il a de pages, et celui-ci en
gagne à chaque séance. Le faire tant qu'il est petit était le moment.

**Le catalan visé est celui de Catalunya Nord**, le rossellonais. L'USAP est un
club nord-catalan, et un supporter d'ici entend la différence avec le catalan
de Barcelone.

### Ce qui est en place

- **`src/app/[locale]/`** porte toutes les pages, l'admin et la connexion
  comprises. Seuls `api/` et `auth/` restent à la racine : ce sont des
  gestionnaires de route, ils n'ont pas besoin de layout.
- **`[locale]/layout.tsx` est le layout racine** — c'est lui qui écrit
  `<html lang>`, et c'est la raison du déplacement : `lang` ne peut pas suivre
  la langue si le layout racine est au-dessus du segment.
- **`generateStaticParams` pré-rend les deux langues**, et `dynamicParams` est
  à `false` : `/es/joueurs` rend 404 plutôt que de se rabattre en silence sur
  le français. Une langue qu'on n'a pas ne s'invente pas plus qu'un score.
- **`src/middleware.ts` redirige tout chemin sans langue** vers `/fr/…`, en
  **307** et non en 308 : le jour où la langue par défaut se négociera avec le
  navigateur, une redirection permanente mise en cache serait un piège. Il
  continue par ailleurs de rafraîchir la session Supabase sur l'admin, dont le
  filtre a suivi le nouveau chemin.
- **`@/components/Lien` remplace `next/link`** dans les 35 fichiers qui en
  importaient. Il lit la langue dans l'adresse et préfixe les chemins internes,
  ce qui a évité de réécrire les cent six liens du site — et d'en oublier un.
  Il laisse passer les liens externes et **les ancres** : sans cette
  précaution, `#points` serait devenu `/fr#points` et aurait cassé la page des
  réalisateurs.
- Les six redirections de slug passent par `cheminLocalise()`, faute de quoi un
  joueur renommé sortait de sa langue.

### Le dictionnaire — second temps, commencé

`src/i18n/fr.ts` porte les phrases, `src/i18n/dictionnaire.ts` la façon d'y
puiser : `const t = await dictionnaire(langue)` puis `t("centurions.titre")`.

- **Le français est la source.** Une entrée qui manque à une autre langue
  **retombe sur le français** plutôt que d'afficher une clé nue : un lecteur
  préfère une phrase dans la mauvaise langue à `joueurs.titre`. Une clé
  *inconnue*, en revanche, est une faute de frappe et non une traduction
  manquante — elle est signalée en développement.
- **Les clés sont explicites, non les phrases françaises elles-mêmes.** Écrire
  `t("Joueurs")` eût été plus court, mais ce site porte des paragraphes
  entiers — les réserves de couverture des classements font trois lignes —, et
  une clé de trois lignes ne se relit pas.
- **Le pluriel se demande à `Intl.PluralRules`**, non à un `n > 1 ? "s" : ""`
  recopié partout. Les deux langues ne l'accordent pas pareil : le français
  écrit « 0 joueur » au singulier, le catalan « 0 jugadors » au pluriel. La
  règle appartient à la langue, pas à la page.
- **Le dictionnaire ne part pas dans le navigateur.** `dictionnaire()` est
  appelé côté serveur ; les composants clients — Header, bascule de thème,
  cellule de joueur — reçoivent leurs libellés **en props**. Trois mots de menu
  ne valent pas d'embarquer le cahier entier.
- **Le balisage ne rentre pas dans une phrase traduite.** Le `<strong>` qui
  soulignait « championnat seul » sur la page des records a été retiré : une
  chaîne à traduire qui porte du HTML se traduit mal et se relit encore moins
  bien.

**Ce qui est sorti du code au 4 septembre 2026** : l'ossature — Header, pied de
page, bascule de thème, libellés de navigation — et trois pages, `centurions`,
`realisateurs` et `records`, avec les en-têtes de tableau qu'elles partagent.

**Ce qui ne l'est pas** : les vingt et une autres pages publiques, qui portent
encore leur français en clair. Elles marchent, elles ne sont simplement pas
prêtes pour le catalan. **Les sortir au fil des séances**, quand on touche une
page pour autre chose — c'est ainsi que la migration se finit sans y consacrer
une journée.

**L'admin n'y entrera pas**, et c'est délibéré : c'est le bureau de Jérémy,
pas une page publique.

### Le sélecteur, et le bandeau qui va avec

`SelecteurLangue` bascule d'une langue à l'autre **sans quitter la page** —
`/fr/records` mène à `/ca/records`, non à l'accueil. Il figure deux fois dans
le Header, en bureau et en mobile.

**Deux drapeaux, et ils sont dessinés.** Le tricolore et la senyera, en SVG de
quelques lignes. Unicode n'a pas de senyera — son jeu de drapeaux régionaux
s'arrête à l'Angleterre, l'Écosse et le pays de Galles —, et rendre le catalan
par 🇪🇸 serait faux : le catalan de ce site est celui de Catalunya Nord, qui est
en France. Deux SVG règlent la question et rendent partout pareil, sans
dépendre d'une police d'emoji.

**Un drapeau seul ne se lit ni au clavier ni à voix haute** : chaque lien porte
le nom de sa langue en `aria-label`, en `title` et en texte caché, et l'actif
est marqué `aria-current` autant que par son anneau.

Le choix a d'abord été deux libellés, « FR » et « CA », au motif qu'un drapeau
désigne un État et non une langue. **Arbitré par Jérémy le 4 septembre 2026**
en faveur des drapeaux.

**Et une langue offerte mais pas traduite doit le dire.** Le layout pose sur
toute page qui n'est pas en français un bandeau : « Traducció al català en
curs. Aquesta pàgina encara està en francès. » Sans lui, le sélecteur
promettrait du catalan et rendrait du français — ce qui vaut moins que pas de
sélecteur du tout. Le bandeau disparaîtra de lui-même quand la langue par
défaut cessera d'être la seule traduite.

**Cette phrase est à faire relire par un catalanophone**, comme tout le
catalan à venir.

### Ce qui reste

- **Pas encore d'`hreflang`** dans les métadonnées.
- **Les textes de la base** — bilans de saison, biographies — sont un chantier
  à part, et le plus lourd : ils grossissent à chaque saison reprise. Une
  traduction manquante devra se voir, comme se voit une donnée que la source ne
  publie pas.
- **Les ressources pour le catalan** : Termcat pour le vocabulaire du rugby,
  le DIEC2 pour la langue générale, Softcatalà pour un premier jet. Et une
  relecture d'ici — le rossellonais n'est pas le catalan de Barcelone, et un
  supporter l'entend.

## Identité visuelle

**Le rendu actuel est jugé trop « IA »** par Jérémy, le 5 septembre 2026, et
c'est le chantier qui passe devant le bilingue, reporté à la fin. Deux skills
existants ont été installés dans `.claude/skills/` pour l'attaquer, plutôt que
d'en écrire un :

- **`frontend-design`**, le skill officiel d'Anthropic, repris tel quel du
  dépôt `anthropics/claude-code` (`plugins/frontend-design`). Il oblige à
  choisir une direction esthétique avant d'écrire du code et interdit les
  cartes arrondies à ombre douce, les libellés en capitales espacées, les
  animations éparses. C'est le skill de la page qu'on refait.
- **`avoid-ai-design`**, communautaire (`funboy322/avoid-ai-design`, MIT), qui
  travaille sur du code **existant** : audit des tics reconnaissables, puis
  réécriture à fonctionnalités constantes, ou audit seul si on le lui demande.
  Le dépôt a été élagué de ses 1,8 Mo de captures et de démos : seuls
  `SKILL.md`, `references/` et la licence sont conservés.

**Ce qu'aucun des deux ne sait** : les couleurs sémantiques et l'interdit des
couleurs en dur, ci-dessous. Une réécriture qui réintroduirait un
`bg-white/5` ou un dégradé codé casserait le thème sombre — à relire après
chaque passage. Et leur doctrine de retenue vise des pages marketing : la
densité des tableaux est voulue, il faut le leur dire. Les références
restent lfchistory.net et cybervulcans.net.

L'ordre d'essai prévu : audit seul sur une liste et une fiche, puis
`frontend-design` sur une seule page avec les deux références comme brief.

**Les deux temps sont faits, le 5 septembre 2026.** L'audit sur `/joueurs` et
une fiche a rangé les deux défauts les plus visibles **dans la couche
partagée**, pas dans les pages : Geist, la police par défaut de Next.js, seule
et sans face de titre ; et la palette slate de shadcn recopiée au code près,
la couleur primaire passée en rouge et rien d'autre — un site catalan
gris-bleu, avec en sombre un bleu marine et un hairline blanc à 10 % écrit
dans le jeton lui-même. Sur les pages : 286 joueurs sur 351 sans portrait,
chacun sous la même icône Lucide dans un rond gris, une grille de cartes
centrées, aucun état de focus nulle part, et des couleurs de résultat en
`green-500` / `red-500` de Tailwind sur la fiche.

**Ce qui a été refait, et vaut pour tout le site** :

- **une seule famille, Archivo, sur son axe de largeur.** Très condensée et
  noire pour les titres et les repères — l'utilitaire `font-display` de
  `globals.css`, 62,5 % de chasse —, normale pour le corps et les tableaux,
  avec `tabular-nums` sur les colonnes de chiffres. Le nom du site dans le
  Header est passé dans cette voix : à sa largeur normale, Archivo débordait
  sur le sélecteur de langue en mobile ;
- **la palette autour du Sang et Or, qui reste imposé.** Encre `#1b1214` et
  règles `#dccfcf` tirées vers le rouge en clair, fond blanc sans crème ; en
  sombre un noir tiré vers le sang, `#150b0d`, surfaces `#211416`, règles
  `#3b2629`. Les noms de jetons n'ont pas bougé, toutes les pages en
  héritent ; le rayon est descendu de 0,625 rem à 3 px ;
- **un état de focus global**, anneau d'or à deux pixels sur `:focus-visible`,
  dans `globals.css`. Aucun lien du site n'en avait.

**Et sur `/joueurs` seule** : une liste dense à la façon des deux références,
groupée par lettre avec un index en tête. La seule audace de la page est
cette épine alphabétique, grosses lettres condensées en rouge — c'est la
structure réelle d'une liste triée par nom. Ni carte, ni pastille, ni
portrait de remplacement : **la case reste vide** quand la LNR et Commons
n'ont rien, ce qui est la vérité. Chaque ligne porte poste, période et
nombre de matchs, comptés comme sur la fiche et sur la page des centurions.
La colonne de nationalité a été retirée avant d'être livrée : dix joueurs sur
351 en ont une, et une colonne vide à 97 % se lit comme une erreur. La page
est passée au dictionnaire par la même occasion, et **sa recherche est
corrigée** : elle écrasait le `OR` de la condition USAP et rendait aussi les
adversaires.

**Ce qui reste dans l'ancien rendu** : la fiche joueur et ses cartes, les
vingt et une autres pages, et `JoueurCellule`, qui porte encore l'icône de
remplacement dans les classements. À reprendre page par page, en relisant
chaque fois qu'aucune couleur en dur n'est revenue.


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
2014-2015, 2013-2014, 2012-2013, 2011-2012, 2010-2011, 2009-2010, 2008-2009,
2007-2008, 2006-2007 et 2005-2006 — resteront vides sur ces trois colonnes,
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
les seuls concernés.

**SAUF EN 2005-2006 — ET SUR LES VINGT-SIX MATCHS DE COUPE D'EUROPE 2008-2009 À 2011-2012 VENUS D'ESPN, cf. `seed-cup-espn.ts` —, OÙ IL SE LIT « LA SOURCE NE LE DIT PAS ».** La LNR n'y
publie aucun changement, sur aucune des vingt-sept feuilles : les temps de jeu
ne se reconstituent pas, et `seed-opponent-sheet.ts` les laisse tous à `null`,
titulaires compris. Sans cela il rendrait 80 minutes à chaque titulaire et
`null` à chaque remplaçant — soit « aucun remplacement de toute la saison »,
ce qui est faux et que **rien ne signalerait**, le total retombant pile sur les
1 200 minutes attendues puisque c'est exactement 15 × 80. Son drapeau
`sansTempsDeJeu` porte la règle ; les réalisations, elles, viennent des faits
de match et restent écrites. Arbitré par Jérémy le 3 septembre 2026. Sur `Match.scoreUsap` et `result`, « pas encore joué »,
jamais « zéro » : toute requête qui compte ou classe doit filtrer sur
`MATCH_JOUE` (`src/lib/matchs.ts`). Sur les **compteurs de réalisations** —
`triesUsap` et les siens —, « la source ne le dit pas », et c'est le cas de
cinq matchs : les quatre de Challenge européen de 2022-2023, dont la source a
disparu, et l'Albi-Perpignan du 3 novembre 2007, dont la feuille LNR ne porte
aucun fait. `fix-bonus-points` les reconnaît et laisse leur bonus offensif en
l'état.

**2026-2027 n'est qu'un calendrier** : ses 26 journées ont leur date, leur
adversaire et leur terrain, sans score. Seules les premières ont un horaire —
la LNR ne cale les coups d'envoi qu'au fil des désignations télévisées et pose
d'ici là une date de référence, que `seed-calendrier-2026-2027.ts` rafraîchit
à chaque relance. **Et ses quatre matchs de poule de Challenge Cup** depuis le
5 septembre 2026 — Dragons à Newport, Zebre et Ulster à Aimé-Giral, Cheetahs à
Bloemfontein —, par `seed-calendrier-europe-2026-2027.ts` ; la phase finale
n'existe pas encore dans le flux. **L'arbitre de la première journée, Kévin
Bralley, vient de Jérémy** et non d'une feuille, par `set-arbitre.ts` : la LNR
ne désigne l'arbitre sur sa feuille qu'après le match.

**L'effectif 2026-2027 est inscrit à sa saison** depuis le 2 septembre 2026 :
50 lignes `SeasonPlayer`, écrites par `sync-effectif.ts`, qui s'en charge
désormais en même temps qu'`isActive`.

**LA RÉSERVE QUI RETENAIT CES LIGNES ÉTAIT FAUSSE.** Ce fichier annonçait que
le modèle « porte un dossard que la LNR ne publie pas avant les premières
feuilles » — sauf qu'**aucune des 213 lignes des quatre saisons précédentes
n'en porte** : `shirtNumber` est nullable et vaut `null` partout. Rien
n'empêchait donc d'écrire l'effectif d'une saison qui commence, et l'attente
d'un champ que personne ne remplit a coûté l'invisibilité de onze joueurs.
**Vérifier dans la base avant d'inscrire un empêchement ici.**

**Car `isActive` ne suffit pas à faire exister un joueur sur le site.** Les
deux champs disent des choses différentes : `isActive` est un état — « à
l'USAP aujourd'hui » —, la ligne de saison est un fait — « a fait partie de
cet effectif-là ». Et c'est le second que la **page des joueurs** interroge,
par `usapCondition` : elle ne montre que les fiches ayant un lien avéré avec
le club — un match sous le maillot, un `usapStint`, un `careerClub` marqué
USAP, ou une ligne d'effectif de saison.

Onze des cinquante joueurs de l'effectif étaient donc **invisibles** —
`isActive`, avec fiche et portrait, et absents de la liste, dont le compteur
annonçait « Effectif actuel (39) » pour 50. Ce sont les recrues sans match
sous le maillot : Reece, Ennor, Riccioni, McGrath, Amituanai, Kubunakaravi,
Rabut, Gomes Sa, Duarte Madeira, Swinton et Garbisi — les cinq derniers ayant
bien des feuilles en base, mais **contre** l'USAP. La liste en compte
désormais 319 et l'effectif 50.

**Ces lignes ne se retirent jamais.** Un joueur parti en cours de saison a
bien fait partie de cet effectif : le script ajoute, il ne supprime pas — à la
différence d'`isActive`, qu'il abaisse sur les partants.

**Les postes de Riccioni et d'Amituanai sont tranchés** depuis le 2 septembre
2026, tous deux `PILIER_DROIT` : les 263 lignes d'effectif portent maintenant
un poste, et aucun joueur de l'effectif n'est sans poste de référence.

Les deux ne se valent pas en fiabilité, et c'est à savoir avant de s'en
servir. **Riccioni est sourcé** — la Wikipédia française le dit « pilier
droit » aux Saracens. **Amituanai ne l'est pas** : la LNR s'arrête à
« 1ère ligne », la Wikipédia anglophone à « Prop », et il n'avait aucune
feuille dont le dossard aurait tranché. C'est **Jérémy qui a décidé**, comme
pour l'écusson d'Auch ou les stades de Dax et de Massy. Sa première feuille de
Top 14 le confirmera ou l'infirmera — un n°1 vaudrait correction.

**Le côté ne se déduit pas de la morphologie**, quoi qu'en suggèrent les
180 cm pour 125 kg d'Amituanai : c'est une inférence, et le projet n'en écrit
pas.

### Où reprendre

Par ordre de valeur.

1. **Achever les saisons reprises.** De 2004-2005 à 2021-2022, dix-huit
   saisons ont leurs matchs, et toutes leurs compositions sauf 2005-2006, dont
   la LNR n'en publie que trois de vraies, et 2004-2005, dont elle n'en publie
   que dix-sept.

   **La clôture éditoriale est faite depuis le 4 septembre 2026** : les
   vingt-deux saisons qui portent des matchs joués ont leur entraîneur, leur
   président et leur bilan rédigé — `seed-cloture-saisons.ts`. Il leur manque
   encore les affluences que la LNR ne donne pas, et les mi-temps. La marche à suivre
   pour toute nouvelle saison est en tête de fichier, « Reprendre une
   saison ».

   Trente-trois anomalies connues **de 2008-2009 à 2021-2022**, toutes
   assumées — celles de 2007-2008 et de 2006-2007 sont avec leur saison, au
   point suivant :
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
   - **cinq matchs de 2008-2009 n'ont pas d'arbitre**, et trois compositions
     n'ont pas de capitaine : la LNR ne publie pas ces champs sur ces
     feuilles-là ;
   - **quatre feuilles de 2008-2009 ne bouclent pas leurs minutes**, et
     aucune n'est de la famille des doubles entrées : leurs listes de
     changements sont simplement incomplètes, comme celle du Racing en 2010 ;
   - **la chronologie de la finale 2009 est laissée telle quelle.** Elle
     compte 19 événements dont **8 remplacements**, que la chaîne n'écrit
     jamais — sa version n'en aurait que 11. C'est le seul match de la base
     dont la ligne de temps porte les changements, et le seul que
     `seed-chronologie.ts` doit épargner ;
   - **deux matchs de 2009-2010 n'ont pas de chronologie** — le 15 août
     contre Bayonne et le 5 novembre contre Toulon : ce sont les deux où la
     LNR omet des points, et une minute ne s'invente pas. Avec le
     Perpignan-Toulouse du 15 septembre 2012, cela fait trois matchs joués sans
     chronologie ;
   - **cinq feuilles de 2009-2010 ne bouclent pas leurs minutes.** Deux
     relèvent de la famille connue — Schuster entre deux fois le 20 février,
     Tuilagi sort deux fois en finale. Les trois autres ont des changements
     cohérents et manquent pourtant des minutes : le 8 janvier, Andrea Lo
     Cicero sort à la 6ᵉ et **personne ne le remplace**, soit exactement les 74
     minutes qui manquent au Racing ;
   - **deux essais collectifs en 2010-2011**, tous deux catalans — les
     27 janvier et 19 février 2011 ;
   - **trois feuilles qui se contredisent en 2010-2011**, toutes de la même
     famille : Biarritz totalise 1 235 minutes le 27 janvier, où Guyot sort
     deux fois — à la 13ᵉ pour Guinazu, à la 45ᵉ pour Lauret —, si bien qu'un
     maillot rend 115 minutes ; Agen 1 182 le 12 février, six sortants pour
     cinq entrants, Faaoso quittant le terrain à la 62ᵉ sans que personne ne
     le couvre ; l'USAP 1 185 le 26 mars, Freshwater et Michel entrant chacun
     deux fois ;
   - **deux matchs de 2010-2011 n'ont pas d'arbitre** — les 29 décembre et
     2 janvier : la LNR n'en publie pas les officiels. Ce sont les deux seuls
     matchs joués de la base dans ce cas ;
   - **deux essais collectifs en 2011-2012**, tous deux adverses — les
     15 octobre 2011 et 21 avril 2012 ;
   - **aucun des neuf points de Bayonne n'a d'auteur le 31 mars 2012** : trois
     pénalités que la feuille marque « n.a. ». Même cas que Bayonne le
     9 février 2013 ;
   - **le Perpignan-Toulouse du 15 septembre 2012 n'a pas de chronologie.** La
     feuille reconstitue
     32-20 pour un 34-20 officiel : elle saute une transformation, et son score
     courant ne passe jamais par 34. Les deux points sont réels — la
     composition porte bien trois transformations pour cinq essais — mais leur
     **minute est introuvable**. Les poser quelque part, ce serait choisir une
     minute que rien n'atteste et fausser tous les scores affichés après elle.
     Une chronologie doit dire *quand* ; les scripts de feuille, eux, ne
     comptent que des totaux, et rattrapent.

     **Le Perpignan-Bayonne du 19 avril 2008 est le même cas, en plus
     retors.** La feuille reconstitue 36-13 pour un 38-13 officiel, et son
     score courant est pourtant cohérent de bout en bout — chaque incrément
     est juste, c'est le total qui est court de deux points. Elle enregistre
     **deux essais non transformés**, Durand à la 35ᵉ et Candelon à la 70ᵉ, et
     rien ne dit lequel des deux portait la transformation manquante. Là où
     2012 laissait une minute inconnue, 2008 laisse un choix entre deux, ce
     qui ne vaut pas mieux. `seed-opponent-sheet` rattrape les deux points sur
     la ligne de Percy Montgomery, seul buteur des trois transformations
     inscrites — un total se rattrape, une minute ne s'invente pas.

   Deux choses que la chaîne ne fait pas : la **mi-temps**, que la LNR ne
   publie pas — elle se déduirait du dernier fait avant la 40ᵉ, mais c'est une
   inférence —, et les **notes de retour en jeu**, écrites à la main.

   **ET LES QUATRE SAISONS DE 2022-2023 À 2025-2026 ONT DÛ ÊTRE REPRISES À
   LEUR TOUR**, le 1er septembre 2026, pour une raison qui vaut d'être
   retenue : `seed-opponent-sheet.ts` y avait été passé **sans `--usap`**. Le
   camp adverse était donc reconstitué depuis la LNR — 0 ligne à corriger sur
   les 106 matchs, aux quatre saisons —, et le camp catalan était resté ce
   qu'il était. **1 279 lignes** ont été réécrites : 369 en 2025-2026, 224 en
   2024-2025, 366 en 2023-2024, 320 en 2022-2023.

   **Rien ne le signalait, et c'est le point.** Les scores retombaient, les
   essais aussi, les bonus et les agrégats de saison étaient conformes aux
   classements officiels, l'audit des compositions adverses ne voyait rien —
   il n'examine que l'adversaire. Le seul symptôme était la **somme des
   minutes d'une équipe**, qui n'atteignait pas 1 200 sur 45 équipes-matchs :
   `subIn` et `subOut` n'avaient jamais été écrits côté catalan, et
   `minutesPlayed` était posé à la louche — 80 pour un titulaire, la même
   valeur pour tout le banc. C'est le contrôle des minutes, et lui seul, qui a
   ouvert le dossier ; il mérite d'être passé après toute reprise.

   La reprise a soldé au passage quatre erreurs de fond que les totaux ne
   trahissaient pas : **deux transformations d'essai de pénalité comptées
   deux fois** sur la ligne de Tommaso Allan — le 18 novembre 2023 et le
   9 mars 2024, l'essai de pénalité valant sept points transformation
   comprise —, un **`totalPoints` périmé** pour Jake McIntyre le 20 avril 2024
   (19 pour 21 au détail), et une **transformation attribuée au mauvais
   buteur** le 14 juin 2026, rendue par la feuille à McIntyre plutôt qu'à
   Allan.

   Six anomalies subsistent sur les quatre saisons, chacune pour une raison
   distincte, et aucune n'est corrigeable sans inventer :
   - **2026-02-22 Pau, 1 248 minutes** — l'exception déjà nommée plus bas :
     la feuille se contredit sur les deux camps, le script refuse d'écrire ;
   - **2026-06-06 Bayonne, 5 points de joueur pour 7 au score** — la LNR ne
     nomme aucun buteur pour la transformation de la 49ᵉ. La base l'attribuait
     à Tristan Tedder ; la reprise a retiré cette attribution et laissé les
     deux points à l'équipe. C'est un gain : une identité inventée remplacée
     par une lacune honnête, famille « points sans auteur » ;
   - **2024-09-07 Bayonne, 1 166 minutes côté adverse**, et **2022-12-31 La
     Rochelle, 1 192** — feuilles LNR incomplètes : le script signale l'écart
     tout en n'ayant *aucune* ligne à modifier, ce qui prouve que la base dit
     déjà exactement ce que dit la source ;
   - **2023-04-22 Racing 92, 1 110 pour 1 143 attendus côté adverse** — même
     cas, sur un match à carton rouge ;
   - **2022-11-26 UBB, 1 220 minutes** — la feuille reconstitue trois essais
     quand le compteur du match en porte deux. Le script échoue et n'écrit
     rien, ce qui est le comportement voulu.

   **Une septième a été retirée de cette liste** : le Dragons-Perpignan du
   7 décembre 2025, à 1 179 minutes, n'en était pas une. Son écart venait de
   la règle du carton rouge appliquée à une compétition qui ne la suit pas —
   cf. le rouge de 20 minutes, plus haut. `seed-cup-sheet.ts` ne trouve rien
   à y modifier : la base dit déjà exactement ce que dit l'EPCR.

   Sa chronologie portait en outre **une contradiction interne, désormais
   tranchée** : elle plaçait le carton rouge de Paia'aua à la 35ᵉ, quand la
   composition, l'EPCR et l'arithmétique des minutes le placent à la 14ᵉ — la
   35ᵉ étant la minute d'entrée de son suppléant. `fix-carton-rouge-dragons-2025.ts`
   l'a corrigée, et `seed-chronologie.ts` ne peut pas la réécrire, `phasesLnr()`
   ne répondant pas pour une rencontre de coupe d'Europe.

   **Et le carton orange a fait tomber une anomalie que personne ne voyait.**
   Au barrage du 14 juin 2026, Sama Malolo prend un orange à la 33ᵉ et ne
   revient pas ; la LNR n'inscrit ni le carton ni sa sortie, et lui donne
   80 minutes — que la reprise du 1er septembre avait écrites en effaçant les
   33 minutes de la base. Rien ne pouvait le signaler : avec 80 minutes, le
   total de l'équipe retombait sur 1 200. Ce que la feuille enregistre trahit
   pourtant le carton — « Ignacio RUIZ ← Jefferson-Lee JOSEPH » à la 34ᵉ, soit
   un **talonneur qui remplace un ailier**, ce qui n'est pas une substitution
   mais la loi sur la première ligne. Malolo s'arrête à la 33ᵉ, Joseph sort à
   la 34ᵉ pour maintenir l'équipe à quatorze et revient à la 53ᵉ, au terme de
   la sanction : le total vaut 1 180, au point près. Les deux tables
   `TEMPS_DE_JEU_CORRIGES` et `PRIVATIONS_SUR_CARTON` de
   `seed-opponent-sheet.ts` portent la correction et sa démonstration — la
   première corrige les lignes, la seconde l'attendu auquel on les mesure,
   faute de quoi la relance suivante signalerait la correction comme un
   défaut.

   **Un total qui retombe n'est donc pas une preuve.** Il ne l'est que si la
   règle à laquelle on le compare est la bonne, et une sanction que la source
   passe sous silence la fausse dans les deux sens : ici elle a masqué
   47 minutes fictives, ailleurs — au Dragons-Perpignan — elle a fait passer
   des données justes pour une anomalie de 45 minutes.

   Deux autres matchs ont échoué sans laisser d'anomalie de minutes :
   **2025-09-13 Toulouse** (un changement de la 51ᵉ non apparié, et une
   feuille douteuse des deux côtés) et **2024-10-26 Racing 92** (26 points
   reconstitués pour 23 au score, sans essai de pénalité pour l'expliquer).

   Après reprise, `fix-bonus-points --dry` rend 0 correction et les quatre
   saisons restent conformes à leur classement officiel — 43 points en
   2022-2023, 58 en 2023-2024, 44 en 2024-2025, 29 en 2025-2026.

2. **Poursuivre la phase 4** en remontant.

   **2004-2005 EST LA PLUS ANCIENNE SAISON DE LA BASE**, et **la dernière que
   la LNR archive** : `/calendrier-et-resultats/2003-2004/j1` rend 404. C'est
   aussi la dernière du **Top 16** — seize clubs, trente journées —, une
   compétition qui n'existait pas en base et qu'il a fallu créer, puis inscrire
   à la liste blanche de `phasesLnr()` sans quoi toute la saison serait sortie
   du périmètre sans un mot.

   Cinquième, l'USAP ne dispute pas la phase finale. **30 matchs écrits,
   17 compositions, 16 arbitres, aucune chronologie** — et **les agrégats ne
   sont pas écrits**, pour la raison dite plus bas.

   **ELLE ATTESTE LA BASCULE DU BARÈME, QUI N'ÉTAIT QUE SUPPOSÉE.** Ce fichier
   posait plus haut que le 3/2/1 sans bonus cède au 4/2/0 avec bonus en
   2004-2005, en réservant que « seule la saison d'application est attestée par
   les classements ». C'est désormais attesté ici : le classement de Wikipédia
   porte deux colonnes BO et BD, et 18×4 + 1×2 + 9 + 3 font bien les 86 points
   annoncés — le vieux barème en donnerait 67.

   **LA LNR N'Y PUBLIE NI FAIT NI CHANGEMENT**, ce qui est un cran de plus
   qu'en 2005-2006, où les faits étaient là. Aucune des trente feuilles ne
   porte un essai, un carton ou un remplacement — vérifié sur treize d'entre
   elles, réparties d'août à mai. D'où : compteurs de réalisations à `null`
   partout, aucune chronologie, aucune réalisation par joueur, aucun temps de
   jeu.

   **ET C'EST CE QUI BLOQUE LES AGRÉGATS : LES NEUF BONUS OFFENSIFS.** Tout le
   reste du classement se retrouve exactement — 18 V 1 N 11 D, 688 points
   marqués, 583 encaissés — et **les trois bonus défensifs aussi**, puisque
   ceux-là ne dépendent que du score. L'offensif se compte en essais, la LNR
   n'en publie aucun, et `allrugby.com` — qui marque le bonus match par match à
   partir de 2006-2007 — **ne couvre de cette saison que les rencontres de
   Clermont**. Le garde-fou refuse donc d'écrire, ce qui est son rôle : c'est
   l'état où 2006-2007 est restée jusqu'à ce qu'une source revienne en ligne.

   **ET LA LNR SE TROMPE SUR UN SCORE, DÉMONTRÉ DEUX FOIS.** Elle donne 29-23
   au Bourgoin-Perpignan de la seizième journée ; Wikipédia donne 33-23. La
   colonne des points marqués de la saison retombe sur les 688 annoncés au
   point près, quand celle des encaissés vaut 579 pour 583 — et J16 est la
   seule rencontre où les deux sources divergent, de exactement quatre points.
   Le **compte des bonus défensifs** dit la même chose autrement : une défaite
   23-29 en donne un, une défaite 23-33 non ; avec le score de la LNR la saison
   en compte quatre, avec celui de Wikipédia exactement les trois du
   classement. C'est le second cas du projet où une autre source l'emporte
   contre le score officiel, et le premier démontré deux fois.

   **SES COMPOSITIONS SONT VRAIES, ET C'EST À VÉRIFIER À CHAQUE FOIS.** Leur
   indice alphabétique va de 0,27 à 0,41, le régime des saisons saines, quand
   les compositions fabriquées de 2005-2006 montaient de 0,55 à 0,95. Toutes
   portent leurs quinze titulaires, ce que 2005-2006 ne faisait pas. **La
   dégradation de la source n'est donc pas monotone** : elle s'aggrave sur les
   faits et s'améliore sur les compositions. Treize feuilles sur trente n'en
   publient simplement aucune.

   L'effectif de feuille y descend jusqu'à **dix-sept joueurs**, la LNR en
   oubliant jusqu'à cinq au banc : `effectifMinimalDeFeuille` le sait.

   **2005-2006 EST LA SAISON SUIVANTE**, close le
   3 septembre 2026 : la première du Top 14 — le championnat passe de seize
   clubs à quatorze —, vingt-six journées et une demi-finale perdue 12-9 à
   Biarritz. **Quatrième avec 84 points**, 18 V 0 N 8 D, 671 points marqués
   pour 398, 9 bonus offensifs et 3 défensifs, conforme au classement de
   Wikipédia. Biarritz est champion.

   **CINQ JOURNÉES SONT AMPUTÉES — J2, J6, J15, J17, J18 — et le balayage des
   identifiants n'y suffit plus** : les journées de février et mars ne sont pas
   jouées dans l'ordre, la J16 tombant après les J17 et J18, si bien que les
   identifiants s'entrelacent et qu'il n'y a plus de trou où lire celui qui
   manque. Ce sont les **clubs absents de la page** qui désignent la rencontre :
   les six matchs publiés nomment douze des quatorze clubs, les deux autres
   jouaient le match manquant, et l'un des deux est Perpignan. Le slug est
   alors connu, et il ne reste qu'à essayer les identifiants libres.

   **Leurs cinq scores viennent du tableau croisé de Wikipédia, et ils ne sont
   pas crus sur parole.** Les vingt et une rencontres que la LNR publie
   totalisent 584 points marqués et 304 encaissés, pour 16 V et 5 D ; le
   classement en annonce 671, 398, 18 V et 8 D. Les cinq manquantes doivent
   donc valoir exactement 87 points marqués, 94 encaissés, 2 victoires et
   3 défaites — et les cinq scores de Wikipédia donnent 87, 94, 2 et 3. Trois
   égalités indépendantes, sans marge.

   **LA LNR NE PUBLIE AUCUN CHANGEMENT SUR CETTE SAISON.** Les vingt-sept
   feuilles en portent zéro, quand celles de 2006-2007 en donnent une douzaine
   par match. Les faits de match, eux, sont là. **Les temps de jeu ne sont donc
   pas écrits** — cf. « Ce qu'un `null` veut dire ».

   **ET SES COMPOSITIONS SONT FAUSSES, VINGT-TROIS SUR VINGT-SIX.** C'est la
   découverte de la reprise, et la plus grave du projet à ce jour : la page
   `/compositions` de la LNR dessine sur son terrain des quinze où un talonneur
   porte le n°10 et un deuxième ligne le n°11. Une partie de ces listes est
   franchement **alphabétique** — la quinzième journée aligne Alvarez-Kairelis,
   Bomati, Bortolaso, Bourret et Bozzi aux numéros 2 à 6 —, et le motif est en
   **serpentin**, la LNR remplissant son schéma ligne par ligne en alternant
   les sens. Les autres sont brouillées sans l'être, et rien dans la page ne
   les distingue d'une vraie feuille.

   **Trois feuilles seulement sont bonnes** — les 20 et 26 août et le 8 octobre
   2005 —, et elles se lisent d'un coup d'œil : Freshwater 1, Konieckiewicz 2,
   Bozzi 3, Gaston 4, Hines 5. Les vingt-trois autres ont été écrites puis
   effacées le jour même. Deux garde-fous les arrêtent désormais, et il en
   fallait deux :
   - `dossardsFabriques()` de `lib/lnr.ts`, qui reconnaît le serpentin
     alphabétique sur la page seule, sans rien demander à la base ;
   - `concordanceDesDossards()` de `lib/dossards.ts`, qui confronte chaque
     titulaire au numéro qu'il porte **partout ailleurs dans la base**. C'est
     lui qui décide, et il sépare sans ambiguïté : 0,82 à 0,93 sur les trois
     vraies, 0,00 à 0,31 sur toutes les autres.

   **Un camp brouillé condamne la feuille entière**, et c'est nécessaire : le
   contrôle ne sait rien dire d'un club des années 2000, qui ne reparaît pas
   assez dans la base pour qu'on connaisse les dossards de ses joueurs. Sans
   cette règle, l'adversaire passerait faute de preuve.

   **Les chronologies, elles, sont bonnes** — 23 sur 27. Ce sont les *faits* de
   la LNR, non ses compositions, et rien ne les met en doute. Elles s'écrivent
   d'ailleurs sans composition : `MatchEvent.playerId` reste alors `null` et
   c'est la description qui nomme le joueur, ce que la page publique affiche.

   Quatre matchs n'en ont pas : le 8 octobre 2005 à Bayonne, dont la feuille ne
   porte aucun fait ; le 13 mai 2006 contre Toulon, où il manque une
   transformation ; le 27 mai à Brive, dont le score courant fait gagner neuf
   points à un essai ; et la demi-finale, dont la LNR ne publie ni fait ni
   composition ni officiel.

   **La demi-finale vient donc de Wikipédia pour trois choses** : ses
   réalisations — trois pénalités de chaque côté, plus un drop biarrot, aucun
   essai —, sa mi-temps de 6-3, et son terrain neutre, le stade de la Mosson de
   Montpellier. Son coup d'envoi, que la LNR place à **une heure du matin**,
   est traité comme « heure inconnue » : pris au mot, il reculait la rencontre
   au 1er juin (cf. `momentDuMatch`).

   **2006-2007 EST CLOSE DEPUIS LE 3 SEPTEMBRE 2026**, et c'est une source
   revenue en ligne qui l'a débloquée. Ses agrégats étaient retenus par un seul
   chiffre : les feuilles lisibles donnaient **4 bonus offensifs pour les
   5 annoncés**, le cinquième dormant dans l'une des trois rencontres dont la
   feuille LNR ne porte qu'un carton jaune pour tout fait — Perpignan-Castres
   20-16, Perpignan-Brive 24-13, Brive-Perpignan 22-22. Les trois pouvaient le
   porter, et rien ne tranchait.

   **`allrugby.com`, injoignable en août 2026, l'est de nouveau, et il marque le
   bonus match par match.** Il donne « Bo » au Perpignan-Brive du 23 septembre
   2006. La source n'est pas officielle, et **c'est sa concordance qui la
   vaut** : sa lecture des vingt-six journées redonne exactement les bonus déjà
   établis sur les feuilles lisibles — offensifs aux J3, J15, J17 et J24,
   défensifs aux J9, J14, J18 et J25 —, sans un écart. Vingt-cinq
   concordances, une seule information nouvelle, et le total tombe alors sur
   les 5 BO et 4 BD du classement. Le garde-fou l'a vérifié, et il n'aurait pas
   laissé passer une journée mal choisie.

   La saison est donc complète : 26 matchs, 25 compositions, 20 chronologies,
   l'arbitre sur 22, **16 V 1 N 9 D, 493 points marqués pour 398, 75 points,
   cinquième** — et l'audit nom à nom ne signale rien sur ses 25 compositions.

   Sept anomalies, toutes assumées :
   - **cinq feuilles ne permettent pas de reconstituer le score** — J1, J7 et
     J20, un seul fait chacune ; J8, qui ne porte que les réalisations
     albigeoises ; J25, entièrement vide. Leurs compteurs sont à `null`, elles
     n'ont ni réalisations de joueur ni chronologie ;
   - **la J3 est contradictoire, et d'un seul côté.** Son fait de la 34ᵉ est
     étiqueté « Pénalité » et vaut cinq points au score courant de la LNR
     elle-même, là où une pénalité en vaut trois ; il porte de surcroît un
     `conversionPlayer`, que les deux pénalités narbonnaises de la même feuille
     n'ont pas. Deux lectures s'ensuivent — un essai non transformé, et il
     manque un second essai non transformé ; ou une vraie pénalité, et il
     manque un essai transformé — et les deux font les 45 points établis. Rien
     ne départage, les compteurs catalans restent donc à `null` ; **ceux de
     Narbonne sont écrits**, ses deux pénalités reconstituant ses six points
     exactement.

     **Le script y écrivait auparavant une décomposition fausse en silence** —
     5 essais, 0 transformation, 1 pénalité, soit vingt-huit points pour
     quarante-cinq au score —, parce qu'un score corrigé dispensait la
     rencontre de tout contrôle arithmétique. Le contrôle est désormais rendu
     **camp par camp**, et ce qui en dispense n'est plus le score corrigé mais
     la déclaration explicite du camp indécidable ;
   - **Albi n'aligne que 21 joueurs le 7 avril 2007** : la LNR y oublie un
     remplaçant, les quinze titulaires sont là ;
   - **le Stade Français-Perpignan du 13 mai 2007 n'a aucune composition.** La
     LNR ne les publie pas, `prod2.lnr.fr` redirige, et allrugby n'en a pas
     davantage pour cette saison. Sa feuille est vide de bout en bout ; seul
     son bonus défensif se lit sur le score.

   Castres ne totalise que 1 151 minutes le 18 novembre 2006, et **ce n'en est
   pas une** : Alexandre Bias y prend un carton rouge à la 31ᵉ, et
   `1200 − (80 − 31)` fait exactement 1 151.

   **De 2007-2008 à 2020-2021,
   quatorze saisons sont faites**, toutes conformes à leur classement de
   référence : 79 points et la quatrième place en 2007-2008, éliminée en
   demi-finale par Clermont au Vélodrome, puis
   107 points et le titre de Pro D2 en 2020-2021, 76 points et la deuxième
   place en 2019-2020, arrêtée à la 23ᵉ journée par le Covid, 12 points et la
   dernière place de Top 14 en 2018-2019, reléguée directement, 97 points et
   le titre en 2017-2018, 79 points et la sixième place en 2016-2017,
   73 points et la septième en 2015-2016, 82 points et la troisième en
   2014-2015, 51 points et la treizième en 2013-2014, reléguée, 61 points et
   la septième en 2012-2013, 49 points et la onzième en 2011-2012, 63 points
   et la neuvième en 2010-2011, 80 points et la **première** en 2009-2010,
   saison de la finale perdue contre Clermont, 92 points et la **première** en
   2008-2009, saison du **titre**.

   **2008-2009 est faite** : 28 matchs, 1 286 lignes de composition, 354
   événements de chronologie, le stade partout, l'arbitre sur 23 des 28, et
   l'audit nom à nom ne signale rien. C'est la saison du titre : demi-finale
   gagnée 25-21 contre le Stade Français à Gerland, finale gagnée 22-13 contre
   Clermont au Stade de France.

   **LA LNR NE PUBLIE AUCUN CLASSEMENT POUR CETTE SAISON** — sa page existe
   mais ne porte pas une ligne de club. C'est la première fois, et le garde-fou
   vient donc de **Wikipédia**, dont la table avait été confrontée à 2009-2010
   et s'y était révélée exacte au point près. La réserve est écrite dans
   l'en-tête du script : ce n'est pas une source officielle.

   **LA BASE N'ÉTAIT PAS VIERGE**, et c'était le premier cas : la finale de
   2009 y figurait depuis longtemps, importée bien avant cette série, avec sa
   mi-temps, son affluence, son compte-rendu et ses quarante-six lignes. Le
   script l'a **retrouvée** au lieu de la dupliquer, et `preserverAnnexes` a
   empêché la relance d'effacer ce que la LNR ne donne pas.

   Deux valeurs y ont changé : l'arbitre, « Joël Mateu » en base pour
   **Jean-Pierre Matheu** selon la LNR et une source indépendante, et `isHome`,
   passé à `true` comme pour les finales de 2010 et 2018 — sur terrain neutre
   ce drapeau est conventionnel.

   **2009-2010 est faite** : 28 matchs — 26 journées, la demi-finale gagnée
   21-13 contre Toulouse et la finale perdue 6-19 contre Clermont —, 1 287
   lignes de composition, 319 événements de chronologie, le stade et l'arbitre
   partout, et l'audit nom à nom ne signale rien.

   **Première de la phase régulière, et il fallait le démontrer** : l'USAP et
   Toulon finissent à 80 points, et Toulon compte *plus de victoires* — 18
   contre 17. C'est la différence de points qui tranche, +170 contre +85. Le
   classement régulier publié par Wikipédia redonne exactement les chiffres
   obtenus en retranchant les phases finales, pour l'USAP comme pour Toulon.

   **LA LNR N'OMET PLUS SEULEMENT DES JOUEURS, ELLE OMET DES POINTS.** Deux
   feuilles ne permettaient plus de reconstituer le score. Celle de Bayonne se
   corrige d'elle-même — son score courant donne 17 après l'essai de la 77ᵉ
   pour 20 au final, donc une pénalité non inscrite. Celle de Toulon exigeait
   ESPN, qui signale un essai de pénalité à la 26ᵉ. D'où
   `REALISATIONS_COMPLETEES` dans `lib/feuilles.ts`, et **le garde-fou de la
   saison l'atteste** : le total officiel exige 12 bonus, et le compte n'y
   arrive qu'avec cet essai-là.

   Deux champs distincts y sont nécessaires, et la première version se
   trompait : `pointsSansAuteur` pour la pénalité de Bayonne,
   `essaisSansAuteur` pour l'essai de Toulon — celui-ci devant aussi entrer
   dans le **compte des essais** sans que ses points soient retranchés deux
   fois. C'est le second contrôle du script de feuille qui a relevé l'erreur,
   « 2 essais reconstitués pour 3 au compteur ».

   **Et l'essai de pénalité de 2009 est un essai, pas un `essaisDePenalite`** :
   jusqu'en 2017 il valait cinq points et se transformait (cf.
   `corrigerEssaisDePenalite`). Le compter à sept aurait faussé la répartition
   entre l'équipe et le buteur.

   **LA SOURCE SE DÉGRADE À MESURE QU'ON REMONTE**, et c'est le fait marquant
   de cette saison. La LNR y omet **quatre titulaires** — contre un seul en
   2011-2012 —, ne publie pas les officiels de deux matchs, et laisse un
   enregistrement franchement corrompu : le changement de la 44ᵉ du 28 août
   fait entrer Gorgodze à la place de « Prenom_545 NOM_545 », un gabarit et non
   un nom. Le déroulé d'ESPN donne le vrai sortant, Gonçalo Uva — c'est-à-dire
   le joueur que la LNR omettait déjà de sa composition, sa fiche étant
   corrompue de bout en bout sur ce match.

   **ESPN devient donc la source de complément**, et il faut s'en méfier : ses
   fiches de match donnent les compositions entières, les remplacements et les
   stades, mais CLAUDE.md dit ailleurs ce qu'elle vaut sur les joueurs. La
   règle appliquée est celle de `lib/feuilles.ts` — on ne retient sa
   composition que si les autres titulaires concordent avec la LNR **au
   dossard près**, ce qui prouve qu'il s'agit du même match. C'est vérifié une
   à une sur les quatre.

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

   Les modèles : `seed-season-2008-2009.ts` et `seed-season-2009-2010.ts`
   pour une saison de **Top 14 avec phase finale** — les plus complets, le
   premier étant le plus récent —,
   `seed-season-2010-2011.ts`, `seed-season-2011-2012.ts`,
   `seed-season-2012-2013.ts` et `seed-season-2013-2014.ts` quand il n'y en a
   pas, `seed-season-2014-2015.ts` pour une saison de
   deuxième division **avec une phase finale**, celui qui porte le piège du
   classement additionné, `seed-season-2015-2016.ts`,
   `seed-season-2016-2017.ts` et `seed-season-2019-2020.ts` quand il n'y en a
   pas, `seed-season-2018-2019.ts` pour une saison de Top 14 sans phase
   finale, `seed-season-2020-2021.ts` et `seed-season-2017-2018.ts` quand il y
   en a une — le second traite en plus le terrain neutre d'une finale —,
   `seed-season-2021-2022.ts` pour une saison avec coupe d'Europe.

   **Les coupes d'Europe d'avant 2020-2021 n'ont pas de source officielle,
   mais elles en ont une.** Le flux de l'EPCR ne rend rien avant 2020-2021 —
   revérifié le 5 septembre 2026 sur 2019-2020, 2018-2019, 2013-2014 et
   2009-2010, zéro match à chaque fois — et son site n'offre plus que les
   saisons récentes. **Huit campagnes manquent donc à la base** sur la période
   qu'elle couvre : Heineken Cup 2007-2008, 2008-2009, 2009-2010, 2010-2011
   et 2013-2014, Challenge européen 2011-2012, 2012-2013 et 2018-2019 —
   cinquante-trois rencontres d'après ESPN, phases finales comprises : 7, 6,
   6, 8, 6, 8, 6 et 6. Et les trois
   premières saisons de la base, 2004-2005 à 2006-2007, ont aussi eu leur
   Heineken Cup, sans qu'aucune source lue par machine ne la donne.

   **L'inventaire des sources, fait le 5 septembre 2026** :

   - **ESPN couvre les huit campagnes manquantes**, et rien avant 2007-2008.
     Ligues `271937` (Champions Cup, Heineken Cup comprise) et `272073`
     (Challenge Cup), sur `site.api.espn.com/apis/site/v2/sports/rugby/{ligue}/
     scoreboard?dates=AAAAMMJJ-AAAAMMJJ`. **Il répond sans `User-Agent` et
     rend 403 avec celui d'un navigateur** — l'inverse de la LNR. Le `summary`
     d'un match de 2009 donne les **deux compositions à 22** avec dossard,
     titulaire, capitaine et entrées-sorties, les **réalisations par joueur**
     — essais, transformations, pénalités, drops, points, cartons — et la
     **mi-temps** ; mais ni arbitre, ni affluence, ni stade, ni chronologie.
     C'est la source que le projet a écartée pour le championnat, et pour
     cause : elle attribue au frère célèbre, invente des cartons, oublie les
     essais de pénalité. Elle n'est admissible ici que faute de mieux, et
     **à recouper** — au minimum par l'arithmétique des points, au mieux par
     une seconde source ;
   - **la seconde source est l'ERC elle-même, par la Wayback Machine.**
     `ercrugby.com` publiait des feuilles de match ; l'archive en garde des
     centaines de pages entre 2008 et 2012. Elle était **hors ligne le
     5 septembre** — à réessayer, c'est ce qui permettrait de recouper ESPN ;
   - **allrugby.com** n'a de coupes d'Europe que pour la saison en cours
     (`/competitions/champions-cup/`, `/competitions/challenge-cup/`) : ses
     adresses par saison rendent 404 avant 2026-2027 ;
   - **Wikipédia** donne les scores et les classements de poule de chaque
     campagne, et sert de garde-fou comme pour 2008-2009.

   **La chaîne existe depuis le 5 septembre 2026** : `lib/espn.ts` sur le
   modèle d'`epcr.ts`, et `seed-cup-espn.ts`, qui écrit en un passage les
   rencontres, les deux compositions et les réalisations — sous la discipline
   des feuilles LNR : quinze titulaires, appariement par `lib/joueurs.ts`,
   contrôle des dossards par `lib/dossards.ts`, et **rien n'est écrit tant que
   la poule reconstituée ne redonne pas le classement de Wikipédia**.

   **2008-2009 EST LA PREMIÈRE CAMPAGNE ÉCRITE** : Heineken Cup, poule 3,
   troisième derrière Leicester et les Ospreys — 4 V 2 D, 154 points marqués
   pour 120, un bonus offensif et un défensif, 18 points, conformes à
   Wikipédia. Six matchs, 264 lignes de composition, 69 fiches adverses
   créées, et Leicester entre en base avec Welford Road, posé à la main
   d'après Wikipédia comme les autres terrains étrangers.

   **Ce qu'ESPN y donne faux, et ce que la base en fait.** Trois camps sur
   douze ne bouclent pas — l'USAP à Trévise le 10 octobre, 22 points de
   joueurs pour 27 ; les deux camps à Leicester le 6 décembre, 10 pour 27 et
   20 pour 38 ; les Ospreys à Aimé-Giral le 17 janvier, 17 pour 15. Leurs
   compteurs sont à `null`, leurs lignes portent zéro réalisation, et le
   bonus offensif de l'USAP y est indécidable : c'est le classement qui
   tranche, un seul BO, celui des huit essais de Trévise. Les dix-sept essais
   marqués du classement ne se retrouvent donc pas — onze sur les quatre
   feuilles qui bouclent —, et le script le dit sans le corriger.

   **Et ce qu'elle ne donne pas.** Aucune minute, aucune entrée ni sortie :
   `minutesPlayed` est à `null` sur les 264 lignes, titulaires compris,
   comme en 2005-2006 — « la source ne le dit pas ». Les cartons sont posés
   sans minute. Pas de capitaine sur ces feuilles-là, pas d'arbitre, pas
   d'affluence, pas de chronologie. Et **`audit-opponent-lineups.ts` ne peut
   pas les relire** : il route les coupes vers l'EPCR, qui n'en sait rien.

   **2009-2010 A SUIVI LE MÊME JOUR** : Heineken Cup, poule 1, troisième
   derrière le Munster et Northampton — 2 V 4 D, 108 points marqués pour 123,
   un bonus offensif et deux défensifs, 11 points, conformes à Wikipédia. Six
   matchs à 23 joueurs par camp cette fois, 253 lignes, 46 fiches adverses
   créées, Northampton et le Munster entrent en base avec Franklin's Gardens
   et Thomond Park. Une seule feuille ne boucle pas, l'USAP contre Northampton
   le 16 octobre, 26 points pour 29.

   **Et une composition y est écartée, mais pas sa rencontre.** À Trévise le
   10 octobre 2009, la liste de Benetton chez ESPN a perdu un pilier et tous
   ses numéros suivants sont décalés d'un cran — un deuxième ligne au 3, le
   demi de mêlée au 8, l'ouvreur au 9 —, ce que `lib/dossards.ts` a vu à
   17 % d'accord quand le camp catalan de la même feuille est à 93 %.
   **Chez ESPN, un camp brouillé n'écarte que lui**, à la différence de la
   LNR dont les deux compositions viennent d'une même page : la rencontre est
   écrite avec son score, validé par la poule, et le seul camp catalan. Et le
   contrôle passe désormais **avant** la création des fiches, sans quoi un
   camp écarté semait les siennes sans aucune feuille.

   **Les écussons des clubs européens anciens viennent des calendriers récents
   de l'EPCR** : Leicester, Northampton et le Munster jouent encore la
   Champions Cup, et `fetch-club-logos.ts` les trouve dès qu'ils sont dans
   `CLUBS_EPCR` sous le nom que l'EPCR leur donne. Un club disparu de
   l'Europe n'aura pas cette chance ; `SOURCES_HORS_LNR` est là pour lui.

   **2010-2011 EST LA TROISIÈME, ET LA PLUS BELLE** : Heineken Cup, poule 5,
   **première** devant Leicester avec quatre bonus offensifs et un nul à
   Welford Road — 4 V 1 N 1 D, 196 points marqués pour 112, 22 points —, puis
   un quart de finale gagné 29-25 contre Toulon et une demi-finale perdue 7-23
   contre Northampton. Huit matchs, 368 lignes, 58 fiches adverses, les
   Scarlets en base avec Parc y Scarlets. Trois choses nouvelles pour la
   chaîne :

   - **le classement tranche le bonus offensif d'une feuille muette**, à une
     condition stricte que `controlerLaPoule` porte : il manque exactement
     autant de BO que de rencontres où les essais catalans sont inconnus.
     Ici le classement en compte quatre, trois sont sur des feuilles qui
     bouclent, et le 35-14 contre Trévise, seul muet — 30 points de joueurs
     pour 35 —, porte le quatrième. `triesUsap` y reste à `null` : le bonus
     est attesté, le nombre d'essais non ;
   - **la phase finale a son propre garde-fou**, `phaseFinale` dans
     `CAMPAGNES` : tour, adversaire et score d'après Wikipédia, qui donne
     aussi **l'arbitre et l'affluence** que la base écrit avec cette
     provenance — Alain Rolland devant 55 000 personnes, George Clancy devant
     18 231 ;
   - **deux terrains neutres**, posés dans `TERRAINS_PARTICULIERS` : le
     Stadium MK de Milton Keynes pour la demi-finale, et pour le quart
     l'**Estadi Olímpic Lluís Companys** de Montjuïc, où l'USAP recevait
     Toulon. **ESPN y écrit « Cornella de Llobregat », et se trompe** :
     Cornellà-El Prat tient 40 000 places, l'affluence le dément.

   **ESPN écrit les noms d'usage, la LNR l'état civil**, et la campagne l'a
   montré deux fois. « Manny Edmonds » pour Manuel, l'ouvreur catalan, sur
   huit feuilles : « manny » n'est pas un préfixe de « manuel », et la paire
   est entrée dans `NOMS_DUSAGE`. Et les quatre Toulonnais du quart — Jonny
   Wilkinson, Joe Van Niekerk, Rudi Wulf, Gaby Lovobalavu — ont d'abord été
   créés à côté de leurs fiches LNR, Jonathan, Johann, Rudolffe, Gabiriele :
   `detect-duplicate-players.ts` les a sortis en FORT, même club, même
   dossard, une feuille contre six à treize. Fusionnés sous le nom d'usage,
   comme Tom Staniforth, et inscrits dans `VARIANTES_DAFFICHAGE` ; les audits
   de 2010-2011 et 2011-2012 rendent zéro anomalie.

   **2011-2012 EST LA QUATRIÈME** : Challenge européen, poule 4, deuxième
   derrière Exeter — 4 V 2 D, 153 points marqués pour 112, deux bonus
   offensifs, 18 points, conformes à Wikipédia. Six matchs, 184 lignes,
   52 fiches adverses, Exeter et les Cavalieri Prato en base avec Sandy Park
   et le Stadio Lungobisenzio.

   **Deux rencontres n'y ont aucune composition, et c'est ESPN qui n'en a
   pas** : les deux matchs contre Prato, 54-20 et 30-13, n'ont ni joueurs ni
   mi-temps — son 0-0 y veut dire « inconnu », et la base porte `null`. Elles
   sont écrites avec leur score, comme les deux matchs de 2008-2009 dont la
   LNR corrompt la composition, et **une feuille sans composition n'est plus
   un échec** pour `seed-cup-espn.ts`. Leurs deux bonus offensifs viennent du
   classement, par la règle de 2010-2011 : il en manque deux, et ce sont les
   deux seules feuilles muettes. Douze des dix-sept essais catalans de la
   poule sont donc sans détail, et le script le dit.

   **Les Cavalieri Prato n'ont pas d'écusson, et c'est délibéré.** Le club a
   fusionné en 2015 dans les Cavalieri Union Rugby Prato Sesto, une autre
   entité : afficher sa marque d'aujourd'hui sur une rencontre de 2011 serait
   l'anachronisme évité pour Auch, et Wikipédia n'illustre pas le club
   d'alors. Une absence vaut mieux qu'un écusson faux.

   « Rudi » Coetzee, centre catalan de 2011-2012, rejoint Manny Edmonds dans
   `NOMS_DUSAGE`.

   **Quatre campagnes restent à écrire**, chacune avec son classement de poule
   dans `CAMPAGNES` et ses clubs dans `CLUBS_ESPN` : 2007-2008 a un quart à
   Londres, 2012-2013 un quart et une demi de Challenge ; 2013-2014 et
   2018-2019 s'arrêtent en poule. Le rouge de vingt minutes ne vaut pas pour
   ces années-là.
3. **Le fond** : affluences (36 matchs sur 573 joués), les 137 fiches joueur
   que Wikipédia ne documente pas, les onze joueurs sans portrait — six
   anciens et cinq recrues que la LNR n'a pas encore photographiées, cf.
   « Photos des joueurs » —, et les saisons sans aucun match.

Sur les 120 saisons en base, 22 seulement portent des matchs : c'est le
chantier de la phase 4, mené en remontant le temps saison par saison. Le bilan
de 2021-2022 — 9V 0N 17D, 43 points, treizième — est calculé depuis les scores
officiels mais n'a pas été confronté à un classement d'époque ; ceux de
2020-2021, 2019-2020 et 2018-2019 l'ont été, et leurs scripts refusent
d'écrire les agrégats s'ils s'en écartent.

### Remonter avant 2006 — ce qu'il faudra changer

**Réflexion du 2 septembre 2026, ouverte par Jérémy et non tranchée.** Elle
est consignée ici pour ne pas se reperdre : rien de ce qui suit n'est
implémenté.

**Le constat, et il est chiffré : 99 saisons ne portent pas un seul match**,
toutes antérieures à 2006-2007, qui est la plus ancienne en base. Or ni la LNR
ni l'EPCR ne remontent là — la chaîne entière du projet, `seed-season`,
`seed-lineup`, `seed-opponent-sheet`, `seed-chronologie`, `audit-opponent-lineups`,
n'aura plus de source à interroger. Il faudra donc « être plus permissif », et
c'est vrai. Mais le mot recouvre **deux choses opposées**, et l'une des deux ne
doit pas bouger.

#### Ce qui doit se relâcher : l'exigence de complétude

Sans réserve, et le projet sait déjà le faire : une feuille à 22 est acceptée,
`pointsSansAuteur` encaisse un score dont personne ne porte les points, deux
matchs de 2008-2009 vivent sans composition. Il faudra étendre — un match sans
aucune composition, une date au mois près, un joueur sans prénom, les comptes
rendus d'avant-guerre écrivant « Ribère » et rien d'autre.

**Et la forme existe déjà dans le code.** `effectifDeFeuille(saison)` et
`pointsScaleFor(seasonStartYear)` font dépendre une règle de l'époque ; le
même motif donnerait un `exigenceDeSaisie(saison)`. Les contrôles ne
disparaissent pas, leur seuil suit la source disponible — c'est très
différent de les désarmer.

#### Ce qui ne doit pas se relâcher : l'appariement d'identité

Et c'est contre-intuitif : **le risque augmente quand la source s'appauvrit.**
Des noms courts, souvent sans prénom, multiplient les homonymes — la règle des
« deux mots communs » n'a plus qu'un mot à se mettre sous la dent, et c'est
exactement la configuration des accidents fondateurs de `noms.ts` (Kane
Douglas / Wesley Douglas, Clement Ric / Ricky Riccitelli).

L'asymétrie qui fonde la doctrine du projet ne change pas avec l'époque : **un
doublon se repère et se fusionne, une identité fausse ne se voit pas.** Elle
empire, même — sans feuille officielle à confronter,
`audit-opponent-lineups.ts` n'a plus rien pour rattraper l'erreur, et c'est
lui qui a démasqué les 22 faux hommes du 30 août 2026.

#### Le vrai manque n'est pas la permissivité, c'est un troisième état

La base ne sait dire que deux choses : le fait est **affirmé**, ou il est
`null`, c'est-à-dire inconnu. Elle ne sait pas dire « **probable, d'après
telle source** ».

**Le symptôme est déjà visible**, et il ne demande pas d'attendre 1927 : le
stade de Dax et celui de Massy, l'écusson d'Auch, le poste de Bradley
Amituanai, les terrains de Tarbes et de Carcassonne — ces arbitrages vivent
dans ce fichier et dans les messages de commit, **pas dans la base**. Sur deux
ou trois cas c'est tenable. Sur 99 saisons où presque tout sera un arbitrage,
ça ne l'est plus, et le site afficherait avec le même aplomb un score officiel
de 2015 et une reconstitution de 1927.

Deux formes possibles, à trancher le jour venu :

- une table **`Attestation`** — quelle entité, quel champ, quelle source, quel
  degré, tranché par qui et quand. Plus lourde, mais elle rend l'incertitude
  **affichable**, donc honnête vis-à-vis du lecteur ;
- plus léger, un `sourceNote` sur `Match` et un enum de confiance sur les
  champs les plus disputés.

La première a un mérite que la seconde n'a pas : elle vaut aussi pour les
stades, les écussons et les postes, c'est-à-dire pour tout ce que ce fichier
porte aujourd'hui faute de place en base.

#### Et les règles du jeu changent, donc l'arithmétique aussi

**C'est le problème le plus grave des trois, et il attaque le seul juge qui
restait.** Soulevé par Jérémy le 2 septembre 2026 : avant, il n'y avait pas de
remplacements, les points ne valaient pas la même chose, et l'on pouvait
marquer d'un coup de pied tombé après une marque.

**LE BARÈME DE MATCH EST EN DUR À QUATRE ENDROITS**, et c'est exactement le
piège que ce fichier dénonce déjà pour les points de classement — « ne jamais
recoder un `wins * 4 + draws * 2` en dur : c'est faux avant 2004-2005 ». Le
même défaut existe pour les points du jeu, et personne ne l'a vu parce que la
base ne remonte pas avant 2006-2007 :

| Où | Ce qui est écrit en dur |
|---|---|
| `scripts/lib/lnr.ts`, `realisationsDepuisFaits` | essai +5, essai de pénalité +7, pénalité +3, drop +3 |
| `scripts/seed-opponent-sheet.ts` | `7 * essaisDePenalite`, `5 * essaisCollectifs` |
| `scripts/seed-cup-sheet.ts` | `7 * essaisDePenalite` |
| `src/app/admin/matchs/[id]/actions.ts` | `tries * 5 + conversions * 2 + penalties * 3 + dropGoals * 3` |

Il faudra un **`baremeDeMatch(seasonStartYear)`**, pendant de
`pointsScaleFor()` pour le classement, et l'appeler partout plutôt que de
recopier les valeurs.

**Le barème, d'après la Wikipédia anglophone (« Laws of rugby union »), et à
recouper :**

| Période | Essai | Transf. | Pénalité | Drop |
|---|---|---|---|---|
| jusqu'en 1891 | 1 | 2 | 2 | 4 |
| 1891 → 1893 | 2 | 3 | 3 | 4 |
| 1893 → 1971 | 3 | 2 | 3 | 4 puis 3 (1948) |
| 1971 → 1992 | 4 | 2 | 3 | 3 |
| depuis 1992 | 5 | 2 | 3 | 3 |

**Deux façons de marquer ont disparu, et le modèle ne sait pas les dire** :
le but au pied depuis le sol en jeu ouvert, possible **jusqu'en 1905**, et le
**but après une marque** — trois points —, aboli **en 1977**. Ce dernier n'est
pas un drop ordinaire : le ranger dans `dropGoals` fausserait le compte des
drops. `EventType` n'a ni l'un ni l'autre, et `MatchPlayer` n'a pas de colonne
pour eux.

**DEUX RÉSERVES, du même ordre que celles déjà posées sur les bonus.** Ces
dates sont celles des **lois internationales** : le championnat de France a pu
les appliquer avec décalage, et rien ici ne l'établit. Et Wikipédia n'est pas
une source officielle — le projet l'a déjà admise en garde-fou pour 2008-2009,
avec la même réserve écrite.

#### Les remplacements, et les trois âges qu'ils dessinent

**Cherché et trouvé le 2 septembre 2026**, sur
`rugbyfootballhistory.com/laws.htm` et le musée de World Rugby, qui
concordent :

| Période | Ce qui est permis |
|---|---|
| jusqu'en 1967-1968 | **rien** : quinze joueurs, et l'équipe finit à quatorze si l'un sort |
| **1968-1969** | remplacement des **blessés** seulement, **deux au plus**, sur avis médical (loi 12) |
| **1996** | remplacements **tactiques**, trois — puis une montée par paliers jusqu'à huit |

Le premier remplacement d'un test est celui de Mike Gibson pour Barry John,
Lions–Afrique du Sud à Pretoria, en 1968. Et ce n'est pas faute d'y avoir
pensé plus tôt : la Nouvelle-Zélande l'avait proposé dès **1924**, refusé au
motif que cela pesait sur les capitaines et prêtait à l'abus. Les
remplacements **sanguins** arrivent au début des années 1990, entre les deux.

**Ce qui reste à établir**, et il n'y a pas de source en ligne : les paliers
intermédiaires entre trois et huit remplaçants, et surtout **la date
d'application en France**. Aucune des sources consultées ne parle du
championnat.

**Mais on n'a pas besoin de la trouver ailleurs : la base la donnera.** C'est
exactement ainsi que la borne de `effectifDeFeuille()` a été établie — en
comptant les joueurs sur les feuilles de 2008-2009, puis de 2007-2008, puis de
2006-2007. Le jour où l'on saisira une saison des années 1960 ou 1970, le
nombre de noms sur la feuille dira la règle, et **c'est une meilleure preuve
qu'un article** : elle porte sur le championnat lui-même.

**Ce que l'absence de remplacements change, et ce n'est pas ce qu'on croit.**
La somme des minutes vaut toujours 15 × 80 tant que personne ne sort — mais un
blessé sortait alors **sans être remplacé**, et l'équipe finissait à quatorze.
Le total tombe donc sous 1 200 sans qu'aucun carton ne l'explique, alors que
`minutesAttendues()` ne connaît aujourd'hui que la privation sur carton.

Et entre 1968-1969 et 1996, une sortie est **toujours une blessure**, jamais
un choix : une composition de cette période qui montrerait un troisième
changement, ou un remplacement de confort, est fautive — c'est un contrôle
gratuit, que le modèle actuel ne fait pas.

`effectifDeFeuille(saison)` devra donc descendre à **17 entre 1968-1969 et
1996**, puis à **15 avant** — sa borne basse est aujourd'hui à 22, attestée
jusqu'à 2006-2007 sans qu'on sache jusqu'où elle recule.

**Et la déduction des transformations cesse de fonctionner.**
`realisationsDepuisFaits` retrouve les transformations en prenant le reliquat
entre le score final et les faits inscrits, puis en le divisant par deux —
cela ne marche que parce qu'aucune autre action ne vaut un nombre pair. Avec
un **drop à quatre points**, donc avant 1948, un reliquat de 4 peut être deux
transformations **ou** un drop, et l'inférence devient ambiguë. C'est le
genre de silence qu'il faut prévoir : elle ne se plaindrait pas, elle
répondrait faux.

#### Ce qui tient malgré tout : les identités, pas les coefficients

Il faut distinguer les deux, sans quoi la section précédente aurait l'air de
tout emporter. Ce qui change, ce sont les **coefficients** — combien vaut un
essai, combien de joueurs sur le terrain. Ce qui tient, ce sont les
**identités** : la somme des points des joueurs égale le score de l'équipe, la
somme des minutes égale le temps de jeu disponible, les agrégats de la saison
égalent le classement publié. Ces égalités-là ne dépendent d'aucune source et
d'aucune époque.

Autrement dit, les contrôles ne disparaissent pas : ils deviennent
**paramétrés**. Un `baremeDeMatch(saison)` et un `effectifDeFeuille(saison)`
justes, et toute la chaîne de vérification continue de fonctionner en 1927
comme en 2026 — c'est déjà ce que `pointsScaleFor()` fait pour le classement
depuis qu'on est descendu sous 2004-2005.

Et ils deviennent **plus** précieux quand la source faiblit, puisqu'ils en
sont alors le seul juge. Les classements d'époque existent, Wikipédia et les
almanachs les donnent bien avant 2006 — comme pour 2008-2009, où la LNR n'en
publie aucun.

**Mais un contrôle paramétré ne vaut que son paramètre.** Ce fichier porte
déjà la démonstration du danger : au barrage du 14 juin 2026, le total des
minutes retombait sur 1 200 et cachait quarante-sept minutes fictives, parce
que la règle à laquelle on le comparait ignorait un carton orange. **Un total
qui retombe n'est une preuve que si la règle est la bonne** — et en remontant
d'un siècle, c'est la règle qu'on connaîtra le moins bien.

### Limites connues

**Ce que la base ne sait pas faire**

- `EventType` ne comporte pas `CARTON_ORANGE`. Le champ `MatchPlayer.orangeCard`
  existe et s'affiche, mais la sanction ne peut pas figurer dans la chronologie.
- **Les quatre modèles de carrière sont alimentés depuis le 4 septembre 2026**,
  et aucun ne l'est de la même façon. `PlayerInternational` porte 51
  sélections et `PlayerAward` 7 distinctions, **tirées de Wikipédia** et non de
  la base : une sélection en équipe nationale et un Oscar du Midi olympique
  sont extérieurs au club, il n'y a là rien à calculer
  (cf. `seed-selections-distinctions.ts`). Le compte de sélections est celui
  obtenu **sous le maillot de l'USAP**, pas sur une carrière — la fiche le dit,
  faute de quoi le nombre serait faux. `CareerClub` et `PlayerStint`, eux, le sont depuis le 4 septembre 2026,
  **par déduction et non par source** : 4 931 lignes de carrière et 295
  passages à l'USAP, tirés des feuilles de match (cf. `seed-carrieres.ts`).
  Ce sont des modèles de **contrat** nourris de **traces** — la nuance est
  écrite sur chaque ligne, et désormais affichée sous la table de la fiche.
- **L'ERREUR D'HYDRATATION N'EN EST PAS UNE, ET C'EST DIAGNOSTIQUÉ** — le
  4 septembre 2026. Ce fichier l'a longtemps annoncée « sur les pages de
  match, probablement `next-themes` » : la cause était à moitié juste, le
  périmètre faux, et la permanence fausse.

  **Sur un chargement ordinaire, il n'y a aucune erreur.** Vérifié dans un
  onglet neuf sur `/stades`, `/presidents`, `/matchs` et une fiche de match,
  en thème clair comme en thème sombre posé par `localStorage` : la console
  reste vide.

  Elle n'apparaît que lorsque la **préférence de couleur du système change au
  moment d'un chargement** — ce qui, dans cette session, venait de
  `resize_window colorScheme` de l'outil de navigation, et non du site.
  `next-themes` est bien en cause, mais par `enableSystem` : son script écrit
  la classe et le `color-scheme` sur `<html>` avant l'hydratation, d'après la
  préférence système. Si celle-ci bascule entre le rendu serveur et
  l'hydratation, React trouve un arbre qu'il n'a pas produit. Le cas ordinaire
  est couvert par le `suppressHydrationWarning` posé sur `<html>`.

  **Il n'y a donc rien à corriger dans le code.** Retirer `enableSystem`
  supprimerait la course résiduelle, mais aussi la faculté de suivre le
  réglage du système : c'est un arbitrage de produit, pas un correctif.

  **ET LA MÉTHODE COMPTE PLUS QUE LA CONCLUSION.** Le tampon de console de
  l'outil est **cumulatif** : lu avec `onlyErrors` et une petite limite, il
  rend le même message ancien à chaque appel. Trois bissections — retirer le
  `ThemeToggle`, puis le `Header`, puis le `ThemeProvider` — ont ainsi paru
  échouer alors qu'elles ne prouvaient rien. **Compter les occurrences avant
  et après, ou ouvrir un onglet neuf**, avant de conclure quoi que ce soit
  d'un message de console.

**Ce à quoi il faut penser en écrivant une requête**

- **`players` est aux neuf dixièmes des adversaires** : 3 463 fiches sur
  3 788 n'ont jamais porté le maillot, 325 l'ont porté. Toute requête sur les joueurs doit
  filtrer `isOpponent: false`, sinon le résultat est faux. Les fiches
  affichent séparément « Matchs avec l'USAP » et « Matchs contre l'USAP », et
  les statistiques ne comptent que les premiers ; le tableau « contre » ne
  montre ni minutes ni réalisations, ce détail n'étant visible que sur les
  pages de match.
- **`delete-orphan-players.ts --dry` rend 76 candidates au 5 septembre 2026**,
  toutes antérieures à ce jour et sans rapport avec les campagnes
  européennes — Phil Davies, Sylvain Barthes, Alessandro Stoica… Elles n'ont
  pas été supprimées : leur origine n'a pas été établie, et une suppression
  ne se relit pas. À arbitrer avant de relancer le script sans `--dry`.
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
- **Une composition peut légitimement ne porter aucun capitaine** : sur 1 040,
  1 016 en portent exactement un, 24 aucun — les feuilles que la LNR ne publie
  pas, et le match des Dragons du 7 décembre 2025 où l'EPCR en signale deux
  sans qu'on puisse les départager. Aucune n'en porte plusieurs. « Aucun » se
  lit « la source ne le dit pas », non « personne ne l'était ».
- **`MatchEvent.playerId` n'est pas toujours renseigné** : 1 031 événements sur
  8 225 ne le portent pas, les plus anciens surtout — la chaîne actuelle le
  remplit systématiquement. La page publique ne le lit pas, elle affiche
  `event.description`, où le nom figure en clair ; seul l'admin s'en sert.

**Ce qui manque dans les données**

- **Les 546 matchs ont leur stade, et c'est celui d'alors.**
  `Opponent.venueId` ne porte qu'**un** terrain par club et ignore le temps :
  la déduction vieillissait mal en remontant, et donnait le Racing 92 au Paris
  La Défense Arena — **ouvert en 2017** — pour des matchs de 2013. La table
  `OpponentVenue` dit désormais où un club recevait **avant**, et
  `terrainDuMatch()` de `scripts/lib/stades.ts` est le seul endroit où la
  règle est écrite : les dix scripts de saison et `fix-match-venues.ts`
  l'appellent tous.

  Trois clubs seulement ont déménagé sur la période couverte : le Racing 92
  (Colombes jusqu'en 2016-2017), le Stade Français (Charléty jusqu'en
  2012-2013, Jean-Bouin étant en reconstruction) et Lyon (Vénissieux jusqu'en
  2016-2017). `seed-stades-historiques.ts` les écrit, chacun avec sa source.

  **Un club peut avoir deux terrains à la fois, et cela ne relève pas de cette
  table** mais du match. L'UBB recevait au stade André-Moga **et** à
  Chaban-Delmas la même saison, au gré de l'affiche, jusqu'à son installation
  définitive à Chaban en 2015 : ce n'est pas un déménagement, aucune période ne
  le décrit, et il faut vérifier match par match. Ses trois réceptions de
  l'USAP d'avant 2015 sont à Moga le 12 mai 2012, à Chaban le 24 août 2012 et
  le 29 mars 2014. Ces cas-là, avec la finale de Pro D2 2018 sur terrain
  neutre, sont dans `TERRAINS_PARTICULIERS`, qui prime sur tout le reste.

  Deux clubs ont **changé de nom de stade sans déménager**, et n'ont rien à y
  faire : Montpellier (Yves-du-Manoir → Altrad Stadium → GGL Stadium) et
  Castres (Pierre-Antoine → Pierre-Fabre).

  Aucune de ces dates ne vient d'une source officielle : ni la LNR ni l'EPCR
  ne donnent le stade d'une rencontre, et le calendrier de la LNR ne porte
  aucun champ de lieu — vérifié. C'est de la presse et de Wikipédia, au même
  titre que l'Albert-Domec de Carcassonne. Le lieu se déduit du camp —
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

  Trois clubs n'ont toujours pas de terrain rattaché : Connacht, Cardiff et
  Lions, que l'USAP n'a reçus qu'à Aimé-Giral. Sans déplacement là-bas, rien
  ne permet de le déduire — mais aucun match n'en souffre, ces trois-là
  n'ayant jamais reçu l'USAP. **Les Dragons en avaient un quatrième jusqu'au
  5 septembre 2026** : l'USAP va à Newport le 16 octobre, et Rodney Parade a
  été posé à la main, comme Ravenhill pour l'Ulster reçu le 10 janvier — deux
  terrains d'aujourd'hui d'après Wikipédia, avec la réserve habituelle sur
  l'époque, cf. `seed-calendrier-europe-2026-2027.ts`. Welford Road, pour le
  Leicester-Perpignan du 6 décembre 2008, Thomond Park et Franklin's Gardens
  pour les déplacements de 2009-2010, Parc y Scarlets pour celui de 2010-2011,
  Sandy Park et le Stadio Lungobisenzio pour ceux de 2011-2012, viennent de
  la même source par `seed-cup-espn.ts` — et ses deux terrains
  neutres de 2011, Montjuïc et Milton Keynes, de `TERRAINS_PARTICULIERS`.

  Trois des stades de la liste de `fix-match-venues.ts` ne viennent pas d'une
  donnée officielle : Albert-Domec à Carcassonne et Robert-Diochon à Rouen,
  ces deux clubs ayant quitté la Pro D2 et leur page LNR avec, et Armandie à
  Agen, que la LNR nomme bien mais dans un article, ni sa page de club ni ses
  feuilles de match ne portant de lieu. Même réserve pour Rouen et pour Agen :
  ces sources décrivent le stade **d'aujourd'hui**, et rien n'a permis de
  vérifier qu'ils y recevaient déjà, en 2020-2021 pour l'un, le 2 septembre
  2018 pour l'autre.
- **Affluences éparses** : 36 matchs sur 600 joués, l'EPCR ayant fourni celles
  des coupes. **Vingt-trois matchs joués n'ont pas d'arbitre** — huit en
  2005-2006, quatre en 2006-2007, quatre en 2007-2008, cinq en 2008-2009, deux
  en 2010-2011 —, la LNR n'en publiant pas les officiels ; c'est une lacune qui
  s'aggrave en remontant, et les cinq saisons les plus anciennes en portent la
  totalité. **65 fiches sur 319 sont illustrées** — dont
46 des 50 joueurs de l'effectif, cf. « Photos des joueurs ».

  **214 fiches sur 351 portent une biographie** depuis le 4 septembre 2026, et
  autant une date de naissance, une taille et un lieu de naissance
  (cf. `seed-fiches-joueurs.ts`). Les 137 autres n'ont pas d'article Wikipédia,
  ou en ont un que le contrôle d'identité refuse. **Le poids reste vide sur
  toutes** : le modèle `Infobox Rugbyman` ne porte pas ce champ, et ce n'est
  pas un défaut de lecture.
- **L'audit des compositions adverses ne signale plus rien**, saison par
  saison, 2007-2008 et 2006-2007 comprises depuis le 3 septembre 2026.

  **Le nombre examiné bouge, celui des anomalies non.** L'audit écarte les
  **rencontres à venir** — il filtre sur `MATCH_JOUE` —, les matchs de coupe
  d'Europe, les journées dont la LNR ne publie pas les compositions, et les
  rencontres dont la base n'a aucune composition adverse. Le premier chiffre
  suit donc la base et se périme tout seul, le second est le seul à porter un
  signal. Il est à zéro sur chaque saison, et tout écart nouveau se voit.

  **CES DEUX SAISONS N'AVAIENT JAMAIS ÉTÉ AUDITÉES**, la boucle de « Commandes »
  s'arrêtant à 2008-2009 quand elles étaient déjà en base. Le premier passage y
  a trouvé une identité fausse — cf. Ruan Smith, plus bas.

  **Le filtre sur les rencontres à venir date du 1er septembre 2026**, et il
  a supprimé un bruit qui masquait le signal : sans lui, l'audit allait
  chercher à chaque passage les vingt-six feuilles vides du calendrier
  2026-2027 et les rangeait en « feuille non lue ». Vingt-six avertissements
  par exécution, qui n'annonçaient rien. Leur compte est désormais rendu au
  récapitulatif — « N rencontre(s) à venir, sans composition à auditer » —,
  une omission dite valant mieux qu'une omission tue.

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

  Restent **59 variantes d'affichage** : la base porte le nom d'usage, la
  feuille l'état civil — « Tom » pour Thomas Staniforth, « Cobus » pour
  Jacobus Meyer Reinach, « Nacho » pour Juan Ignacio Brex —, ou la LNR ampute
  une apostrophe (« Marvin O Connor »). Elles ne sont plus comptées en
  anomalie mais **tues explicitement** : leur total figure au récapitulatif,
  et `--variantes` les affiche une à une, avec les paires de noms qu'elles
  mettent en regard — leur nombre ne se recopie pas ici, il se lit là.

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

  **ESPN a rouvert le sujet le 5 septembre 2026**, sur le quart de finale
  européen de 2011 : il écrit les Toulonnais sous leur nom d'usage — Jonny,
  Joe, Rudi, Gaby — là où la LNR avait donné Jonathan Wilkinson, Johann Van
  Niekerk, Rudolffe Wulf et Gabiriele Lovobalavu. Quatre doublons d'une
  feuille, sortis par le détecteur, fusionnés sous le nom d'usage et inscrits
  ici. **Après toute campagne venue d'ESPN, relancer le détecteur** : ses
  diminutifs ne s'apparient pas, et c'est voulu.

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

  **ET L'ACCIDENT S'EST REPRODUIT EN REMONTANT, À L'IDENTIQUE.** « Ruan
  Smith » portait cinq feuilles : le n°3 des Lions en Challenge européen le
  10 décembre 2023 — le pilier australien, apparié au **dossard** par l'EPCR,
  donc sans erreur possible —, et quatre lignes de Montauban de 2006 à 2008,
  où la LNR écrit « Ryan Smith » sur chacune. Deux hommes, quinze ans et un
  continent d'écart, réunis par la règle du prénom « à une lettre près » qui
  fonde `joueurs.ts` — celle-là même qui rend « Mathieu » et « Matthieu » Ugena
  au même homme.

  **Le poste de référence avait propagé la faute**, comme il le fait toujours :
  les deux lignes de banc du fly-half montalbanais étaient enregistrées
  `PILIER_DROIT`, reprises de la fiche du pilier. `reassign-match-player.ts`
  sur les quatre dossards, puis `fix-player-position.ts --poste=DEMI_OUVERTURE`
  — son n°10 titulaire du 30 septembre 2006 le dit — ont soldé les deux.

  **Ce cas dit à quoi sert d'auditer une saison qu'on vient d'écrire.** Aucun
  autre contrôle ne l'aurait vu : les scores retombaient, les minutes aussi,
  les points par joueur également.

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

`detect-duplicate-players.ts` rend **CERTAIN 0, FORT 0, À VOIR 0**. C'est
l'état attendu, et tout écart nouveau se verra.

**2006-2007 lui a valu quatre paires de plus, toutes arbitrées comme étant
deux hommes**, et toutes par la lecture des feuilles officielles :

- **Rouet** — Sébastien, n°9 de Bayonne le 3 septembre 2006 puis de Narbonne
  de 2014 à 2017, et Guillaume, n°9 de Bayonne de 2013 à 2023. Le n°9
  bayonnais les rapprochait ; la LNR écrit « Sebastien Rouet » sur la feuille
  de 2006, et Guillaume, né en 1990, avait alors seize ans ;
- **Todeschini** — Joaquín, n°20 de Montpellier le 11 novembre 2006, une seule
  feuille, et Federico, l'ouvreur international argentin du même club de 2008
  à 2010. Une fiche à feuille unique mérite qu'on regarde à deux fois : la LNR
  y écrit bien « Joaquin Todeschini », et l'homme existe — il entraîne
  aujourd'hui au Chili ;
- **Smith**, deux paires — Ryan à Montauban de 2006 à 2008, Fletcher à Lyon en
  2022, Chris aux Lions en 2026 : trois demis d'ouverture, trois clubs, trois
  époques, chacun tenant son prénom de sa propre source officielle.

**2005-2006 en a valu une cinquième** : Trevor Brennan, troisième ligne
irlandais de Toulouse, n°19 le 23 septembre 2005 et n°5 le 9 septembre 2006, et
**Joshua**, son fils, deuxième ligne du même club, cinq feuilles depuis 2021
dont un n°19. Le père et le fils, comme les Tuilagi, et quinze ans séparent la
dernière feuille de l'un de la première de l'autre.

**La fiche neuve tombe dans le lot À VOIR sitôt son poste posé** — « même
poste, clubs différents » —, et c'est le fonctionnement voulu : les deux
paires Smith ne sont apparues qu'après la correction de Ryan. Arbitrer une
identité en crée donc à arbitrer ; il faut relancer le détecteur **après** la
correction, pas seulement après l'import.

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

⚠️ **La base est distante, et elle coupe les connexions oisives.** Un script
qui tient une connexion Prisma pendant une longue moisson HTTP la voit tomber
en cours de route : Prisma rend alors `P1017`, « Server has closed the
connection », et tout le travail est perdu. C'est arrivé à
`audit-opponent-lineups.ts` le 1er septembre 2026, après vingt minutes et
sans qu'une seule ligne de résultat ait été écrite — il télécharge 488
feuilles entre ses requêtes.

Il porte depuis `avecReconnexion()`, qui rejoue la requête après une attente
croissante et **annonce la reprise** par une ligne `↻` — une connexion qui
lâche à répétition dit quelque chose du réseau, un script qui s'en remet en
silence le cacherait. Tout script long qui interroge la base entre deux
appels réseau est exposé de la même façon ; le remède est là, à recopier.

⚠️ **LA LNR PLAFONNE LE DÉBIT, et `lirePage` attend entre ses tentatives.**
Elle réessayait trois fois **sans aucune attente** — trois requêtes de plus
dans le même instant, ajoutées à celles qui venaient de déclencher la
limitation, et les trois tentatives épuisées en quelques millisecondes. Une
reprise de 2007-2008 est morte ainsi à la dix-huitième journée, emportant les
dix-sept précédentes. Elle attend désormais 2, 4 puis 8 secondes et annonce
la reprise par une ligne `↻`. Un statut HTTP refusé y compte comme une panne :
c'est sous cette forme que le plafonnement se manifeste.

⚠️ **L'AUDIT COMPLET SE LANCE SAISON PAR SAISON, JAMAIS D'UN BLOC.**

```bash
for S in 2026-2027 2025-2026 2024-2025 2023-2024 2022-2023 2021-2022 \
         2020-2021 2019-2020 2018-2019 2017-2018 2016-2017 2015-2016 \
         2014-2015 2013-2014 2012-2013 2011-2012 2010-2011 2009-2010 \
         2008-2009 2007-2008 2006-2007 2005-2006 2004-2005; do
  npx tsx scripts/audit-opponent-lineups.ts "$S"
done
```

**LA BOUCLE S'OUBLIE, ET ELLE A COÛTÉ QUATRE FAUX HOMMES.** Elle s'arrêtait à
2008-2009 quand 2007-2008 et 2006-2007 étaient entrées en base : ces deux
saisons n'avaient donc **jamais** été auditées, et personne ne s'en apercevait
puisque le total global, lui, ne se lit nulle part. Le premier passage y a
trouvé « Ruan Smith » là où la LNR écrit « Ryan Smith », sur quatre feuilles de
Montauban de 2006 à 2008 (cf. « Limites connues »). **Ajouter la saison à la
boucle fait partie de sa reprise**, au même titre que ses compositions.

`npx tsx scripts/audit-opponent-lineups.ts` sans argument parcourt toutes les
rencontres en une fois, et **la LNR le plafonne** : le 1er septembre 2026,
trois tentatives d'affilée ont rendu 175, 54 puis 268 matchs examinés, pour
323, 444 et 44 feuilles « injoignables ». Le réseau était sain avant et après
chaque exécution — ce n'est pas une panne, c'est une limitation de débit.
Vingt-deux processus courts passent sous le seuil là où un seul long ne passe
plus, et la même journée l'a vérifié deux fois.

La boucle a deux autres mérites : une coupure ne coûte qu'une saison au lieu
de tout, et elle **donne le détail par saison**, que l'exécution globale ne
donne pas. L'état attendu est **0 anomalie sur chaque saison** ; les
26 rencontres de 2026-2027 sont écartées comme à venir, et 22 matchs de coupe
d'Europe sortent du périmètre LNR. Le nombre d'examinés, lui, suit la base et
se périme tout seul — il ne se recopie pas ici.

**Une rencontre dont la base n'a aucune composition adverse est comptée à
part**, et non auditée : la confronter ligne à ligne rendrait vingt et un
« MANQUANT » qui n'annoncent rien. Elles sont dix-sept, et pour de bon — le
Brive-Perpignan du 26 avril 2008 et l'Auch-Perpignan du 30 mai 2008, dont la
LNR corrompt un enregistrement qu'aucune source ne répare, plus les quinze
rencontres de 2005-2006 dont elle publie une composition fabriquée. Sans ce cas à part,
elles portaient quarante-deux anomalies à chaque exécution et le total cessait
d'être un signal, exactement comme les vingt-six rencontres à venir de
2026-2027 avant qu'on ne les écarte.

**Le Stade Français-Perpignan du 13 mai 2007 n'y est pas**, bien qu'il n'ait
pas davantage de composition : la LNR n'en publie aucune non plus, si bien que
la lecture échoue avant la confrontation et qu'il sort en « feuille non lue ».
Les deux états se distinguent — l'un dit que la source manque, l'autre que la
base manque là où la source est lisible.

Trois choses à regarder sur chaque saison, dans cet ordre : `0 avec au moins
une anomalie`, qui est le seul chiffre à porter un signal ; **aucune ligne
`LNR injoignable`**, sans quoi la saison n'a pas été vue en entier quel que
soit le total affiché ; et **aucune ligne `↻`**, qui annoncerait que la base
a lâché et que la suite peut échouer. Si une saison échoue, laisser passer un
moment avant de la relancer : c'est l'enchaînement rapide qui fait tomber les
deux services, pas la charge d'une saison isolée.

⚠️ **`prisma migrate dev` VEUT RÉINITIALISER CETTE BASE. Ne pas le lancer.**
Le dossier `prisma/migrations/` ne décrit pas l'état réel : des colonnes y
manquent — les `slug` de plusieurs tables, des index de `season_coaches` —,
posées en leur temps sans migration. Prisma lit donc une dérive, conclut que
la base doit être reconstruite et propose d'effacer toutes les données. Il
s'arrête avant d'agir, mais il ne faut pas s'en remettre à cela.

**La bonne façon d'ajouter une table** est d'écrire le SQL, de le déposer dans
`prisma/migrations/<horodatage>_<nom>/migration.sql` pour la trace, puis de
l'appliquer seul :

```bash
# le SQL, sans rien appliquer
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
# l'appliquer, et lui seul
npx prisma db execute --file prisma/migrations/<...>/migration.sql \
  --schema prisma/schema.prisma
# le client, en local
npx prisma generate
```

C'est ainsi qu'`opponent_venues` a été créée le 31 août 2026. **Relire le SQL
avant de l'exécuter** : `migrate diff` rend tout l'écart entre le schéma et la
base, dérive comprise, et pas seulement ce qu'on croit ajouter.

## Notes pour Claude Code

- Toujours créer des composants réutilisables
- Favoriser les Server Components Next.js pour les pages de lecture
- Utiliser les Client Components uniquement quand nécessaire (interactivité)
- Prévoir la pagination pour les listes longues (matchs, joueurs)
- Les images joueurs sont optionnelles (placeholder si absente)
- Penser responsive dès le départ (mobile-first)
- Commenter le code en français pour les parties métier complexes
