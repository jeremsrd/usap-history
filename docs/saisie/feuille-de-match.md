# Saisie d'une feuille de match

## Saisie d'un match (feuille de match)

Règles à appliquer **sans qu'on ait à les redemander** à chaque ajout de match.

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
  - **Un carton jaune retire dix minutes**, ou ce qu'il en reste avant la
    sortie du joueur ou la fin du match — `privationDuJaune()` de
    `lib/feuilles.ts`, que les deux scripts de feuille et `lib/epcr.ts`
    appellent —, et l'équipe totalise dix minutes de moins par jaune.
    **C'est la règle depuis le 6 septembre 2026, et c'était l'inverse
    avant** : « un carton jaune ne se déduit pas des minutes jouées », et un
    titulaire jauni resté jusqu'au bout comptait 80 — 441 lignes. Jérémy l'a
    fait tomber sur Mattéo Le Corvec, jauni à la 40ᵉ du Stade Français-USAP
    du 5 septembre 2026 : un joueur au banc de touche ne joue pas. Opta le
    retirait déjà, et `minutesOpta` concorde désormais avec les minutes
    reconstituées. `fix-minutes-cartons-jaunes.ts` a repris la base.

    Un carton rouge, lui, arrête le match du joueur à sa minute. En
    **championnat**, où le rouge est définitif, l'équipe finit à quatorze et
    totalise donc `1200 − (80 − minute du rouge)`.
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
