# Sources de données

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
- **et elle écrit des prénoms qui n'existent pas, qu'il ne faut pas corriger
  de mémoire.** « Ramiro **Efouardo** Pez », n°16 catalan du Bayonne-Perpignan
  du 8 octobre 2005 : le mot n'est un prénom dans aucune langue, et l'œil y
  lit « Eduardo » aussitôt. Sauf que la LNR l'écrit ainsi **dans sa
  composition et dans l'adresse de sa propre fiche joueur**
  (`/joueur/17806-ramiro-efouardo-pez-1`) — ce n'est donc pas une coquille de
  page, c'est son enregistrement —, et que **Wikipédia ne lui connaît aucun
  second prénom**, ni en français ni en anglais : « Ramiro Pez », rien de
  plus. Aucune source ne dit « Eduardo ».

  La fiche reste donc telle que la source officielle l'écrit. Corriger, ce
  serait affirmer que la LNR se trompe **et** inventer ce qu'elle aurait dû
  écrire — c'est ce que `NOMS_MAL_DECOUPES` exige de démontrer avant d'y
  inscrire une ligne. Relevé le 10 septembre 2026 en tirant le joueur au
  hasard de l'accueil, et laissé en l'état faute de seconde source ;
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

#### Gallica — la presse d'avant-guerre

**La seule source lue par machine avant 2004, et ce n'est pas une feuille :
c'est un journal.** *L'Auto* de 1900 à 1944 et *Midi olympique* de 1929 à
1946 y sont en texte intégral, et le numéro du lendemain d'une finale donne
les deux XV par lignes, le capitaine, l'arbitre, le score décomposé, la
mi-temps, l'affluence, parfois une chronologie à l'heure de l'horloge. Par
`scripts/lib/gallica.ts` : le fascicule d'un jour, les pages où un mot
figure, l'OCR d'une page en ALTO — et, quand l'OCR ne suffit pas, l'image
elle-même, découpée par IIIF aux coordonnées de l'ALTO et **relue à l'œil**.

Ce qu'il faut savoir avant de s'en servir :

- **l'OCR abîme les noms propres**, « Raruis » pour Ramis, et peut manquer
  tout à fait — la page des équipes de 1938 est « [texte illisible] » ligne
  à ligne. Rien n'entre en base sans relecture sur l'image, ni sans que
  Jérémy ait tranché la graphie ; la table `RELECTURES` de
  `seed-match-gallica.ts` porte la relecture, `valide` son arbitrage ;
- **le journal n'écrit pas ses XV de la même façon d'une année à l'autre** —
  trois tournures connues, 1914, 1921, 1925 —, et un nom coupé par une
  césure se cherche ailleurs dans le numéro avant d'être comparé à quoi que
  ce soit : « Du-four » était « Duffour » deux fois plus loin ;
- **le barème est celui de l'époque**, `baremeDeMatch`, et le journal le
  vérifie lui-même par ses décompositions — « 2 essais, 1 but » font 8 en
  1914 ;
- **Gallica plafonne à quelques requêtes par minute** : trente secondes
  entre deux, cache sur disque, balayages en arrière-plan ;
- et **tout ce qui en sort est attesté `PROBABLE`**, l'image relue pour
  adresse, Jérémy pour relecteur — cf. « Le troisième état ».

Le détail des API, des numéros lus et de ce que chacun rend est dans
« Remonter avant 2006 », plus bas ; la marche à suivre pour la prochaine
rencontre est celle de 1914 et 1925 : simuler, découper l'image, relire,
soumettre les graphies, écrire.
