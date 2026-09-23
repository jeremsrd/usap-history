# Logos des clubs et photos des joueurs

## Logos des clubs

Les 61 adversaires ont leur logo, servi par le site lui-même depuis
`public/images/logos/{club}.{png|webp}` — 3,7 Mo au total. Ils viennent des sources
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

**ET L'ÉCUSSON CATALAN NE VIENT PLUS DE LA LNR DEPUIS LE 10 SEPTEMBRE 2026**,
mais du site du club. La LNR n'en sert que **151 × 151** — la plus petite de
toute sa série, la taille de Clermont —, et aucune variante plus grande
n'existe sur son CDN. Cela a suffi tant que le seul affichage du blason était
les 32 pixels du Header : c'est **le hero de l'accueil**, qui le montre à
160, qui a révélé le défaut — 320 pixels sur un écran Retina tirés d'une
image de 151, et les lettres de l'écusson molles. `usap.fr` publie le même
écusson en **523 × 523, PNG transparent, 47 ko**.

Deux choses à en retenir, et la seconde vaut au-delà de ce cas :

- **la source est écrite dans le script**, constante `SOURCE_USAP`, et non
  posée à la main dans `public/`. Sans cette ligne, la première relance de
  `--usap` aurait rendu le petit écusson de la LNR **et personne ne l'aurait
  vu**, le Header n'ayant besoin que de 32 pixels. C'est la même leçon que
  `generateVenueSlug` : fournir la fonction plutôt que faire attention ;
- **le script refuse désormais un écusson de moins de 400 pixels** et le
  nomme, plutôt que d'écraser le bon par un plus petit — pendant de
  `PLACEHOLDER_LNR`, qui reconnaît le bouclier gris. Une régression
  silencieuse sur une image ne se voit pas au journal d'exécution.

C'est le même arbitrage que `SOURCES_HORS_LNR` pour Albi, Bourgoin et Tarbes,
à une différence près : pour eux la LNR donne une URL qui ne mène à rien ;
ici elle donne une vraie image, seulement trop petite pour l'usage qu'on en
fait désormais.

**ET L'ICÔNE D'ONGLET EN DÉCOULE**, depuis le 10 septembre 2026 :
`src/app/favicon.ico` portait encore celle du starter Next.js.
`generate-favicon.ts` la dérive de `public/images/usap/logo.png` — donc de la
même source que le Header, le hero et le pied de page —, en quatre tailles,
16 à 64. Trois choses apprises en l'écrivant :

- **le blason est plus haut que large** (413 × 523 une fois ses marges
  transparentes retirées) et une icône est carrée : il est posé au centre d'un
  carré, `fit: "contain"`, plutôt qu'étiré — l'étirer donnait un écusson gras
  à 16 pixels ;
- **un `.ico` enveloppe des PNG**, ce que tout navigateur moderne lit, et
  c'est la seule façon d'en produire un ici : sharp n'écrit pas ce format.
  L'en-tête et la table des matières sont assemblés à la main, six octets puis
  seize par taille ;
- **et une icône ne se valide pas au journal d'exécution**, comme un écusson
  ou un portrait : la planche des quatre tailles sur fond clair et sur fond
  sombre, agrandie sans lissage, montre qu'à 16 pixels le blason garde sa
  forme et ses barres sang et or quand le mot « USAP » n'est plus lisible —
  ce qui est le sort de tous les écussons à cette taille, et acceptable.

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

**Un écusson est dessiné pour un fond clair, et le thème sombre l'a montré**
le 6 septembre 2026 : Sale, les Ospreys, Leicester, l'Ulster, Bristol, Agen,
Toulon, les Dragons se fondaient dans la carte `#211416` — contraste moyen de
1,0 à 2,8, mesuré sur une planche des 58 écussons posés sur les deux fonds —,
et Exeter comme le Munster y perdaient leur contour. Ce sont les écussons
sans fond blanc *dans le dessin* : un tigre vert sombre, un masque noir. Le
remède n'est pas une plaque claire derrière chacun — ce serait le défaut de
Clermont étendu au site entier — mais la classe **`logo-club`** de
`globals.css`, qui trace en thème sombre seulement un fin liseré clair par
l'ombre portée de la forme, couleur tirée de `--foreground`. Elle remplace
`object-contain` sur les dix balises d'écusson adverse des pages publiques ;
une nouvelle balise doit la porter, sans quoi son écusson disparaîtra en
sombre sans que rien ne le signale. **Un écusson ne se valide pas au journal
d'exécution** : la planche, comme pour les portraits.

**Et les écussons de l'EPCR font 192 pixels, sans variante plus grande** :
son CDN (`media-cdn.incrowdsports.com`) n'en sert qu'une taille, vérifié.
Sur la fiche club, affichés à 160 pixels sur un écran Retina, ils sont
agrandis et un peu flous ; Sale, les Scarlets et Worcester y ajoutent 75 à
85 % de marge transparente, qui les rapetisse dans la grille. Le seul remède
serait une autre source par club — site officiel ou Wikipédia, à arbitrer
comme pour Auch —, et il n'est pas fait.

Les logos de club sont des marques déposées. Les afficher sur un site
d'histoire non commercial est l'usage, mais c'est un choix qui appartient au
propriétaire du site.

## Photos des joueurs

**80 fiches sur 382 sont illustrées**, dont **48 des 50 joueurs de l'effectif
professionnel** — seize portraits de plus le 22 septembre 2026, cf. « La
reprise du 22 septembre 2026 » à la fin de cette section. Les images sont servies par le site lui-même depuis
`public/images/players/{slug}.webp` — 1,7 Mo au total, carrés de 400 pixels,
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

**Deux joueurs de l'effectif n'ont aucun portrait** : Aisea Kubunakaravi et
Diego Mascarenc — la LNR n'a que leur silhouette, et Wikipédia ne les
illustre pas. **ET « UNE SIMPLE RELANCE LES SERVIRA » N'ÉTAIT PAS UNE FIGURE
DE STYLE** : ils étaient cinq, et le 22 septembre 2026 la relance en a servi
quatre — Amituanai, Taty, McGrath et Coulon, que la LNR avait photographiés
depuis. **Devant une lacune imputée à la LNR, relancer avant de chercher
ailleurs** : son CDN se remplit au fil des semaines, et le journal du jour
ne vaut que pour ce jour-là.

**Treize anciens n'ont aucune photo libre** : Alan Brazo, Guillaume Vilaceca,
Sadek Deghmache, Genesis Mamea Lemalu, Sione Piukala, Lifeimi Mafi, et les
sept partants de 2025-2026 — Akato Fakatika, Gabin Kretchmann, Sacha
Lotrian, Nemo Roelofse, Tavite Veredamu, Thomas Serezat et Simon Sol. Cinq
de ces derniers ont bien un article francophone qui les dit à Perpignan,
simplement pas illustré ; Serezat et Sol n'ont pas d'article. Ils sont
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

### La reprise du 22 septembre 2026

**Seize portraits posés**, sur les vingt-cinq fiches sans photo des effectifs
2026-2027 et 2025-2026 : la couverture passe de 65 à 80, et l'effectif du
jour de 46 à 48 sur 50. Quatre viennent de la LNR — Amituanai, Taty, McGrath
et Coulon, que son CDN ne servait pas trois semaines plus tôt —, douze de
Commons.

**Les deux sources se partagent le travail selon que le joueur est parti ou
non, et c'est nouveau.** La règle écrite plus haut — la LNR pour l'effectif,
Commons pour les anciens — vaut d'une saison à l'autre : **la LNR ne garde
pas le portrait d'un joueur qui a quitté le club**, et les vingt et un
manquants de 2025-2026 étaient donc tous hors de sa portée. Commons en a
servi douze.

**LA DISPENSE DE PERPIGNAN SE POSE AUSSI À L'AUTRE BOUT DU SÉJOUR.**
`ARTICLES_HORS_PERPIGNAN` n'existait que pour les recrues que Wikipédia
n'avait pas encore enregistrées ; le même retard se retrouve chez les
partants, dont l'article est réécrit autour du club où ils sont
**aujourd'hui**. Kieran Brookes y est toulonnais, Gela Aprasidze bayonnais,
Mahamadou Diaby bordelais — et les trois ont bien porté le maillot. La
dispense ne vaut, là encore, **que parce que l'identité est établie
autrement** : la date de naissance de l'article et celle de la fiche
concordent au jour près, le poste concorde, et chacun a de vraies feuilles
catalanes — 45 pour Brookes, 35 pour Aprasidze, 14 pour Diaby.

**ET LE SEUIL DES 300 PIXELS FAIT DES FAUX POSITIFS.** Il est là pour qu'un
logo ou un drapeau ne passe pas pour un visage — son message le dit, « sans
doute pas un portrait » —, et c'est un garde-fou de **nature**, non de
qualité. Cinq portraits avérés tombaient dessous : Beria 296×313, Lam
235×333, Hicks 235×307, Duguivalu 208×307, Poulet 175×261. Ce sont des
recadrages d'une même série — les photos du Zebre Parma-USAP de Challenge
Cup 2024-2025, versées en CC BY-SA 2.0 —, dont un contributeur a tiré un
buste par joueur : ils sont petits parce qu'ils sont **découpés dans une
photo de match**, non parce qu'ils seraient autre chose qu'un visage.

**Arbitré par Jérémy le 22 septembre 2026** en faveur d'une table nominative,
`PORTRAITS_PETITS`, plutôt que d'un seuil abaissé : descendre le seuil à 170
aurait tenu en une ligne et désarmé le contrôle pour tout le monde — le
prochain écusson de 200 pixels serait entré sans que personne ne le nomme.
C'est le raisonnement de `NOMS_DUSAGE` et de `SOURCES_HORS_LNR`, une
exception nommée plutôt qu'un relâchement de la règle générale. Y inscrire un
nom, c'est affirmer qu'on a **regardé l'image**.

**ET LE CADRAGE A DEMANDÉ TROIS ESSAIS, TOUJOURS SUR LA MÊME ERREUR.** Quatre
photos de match — Paia'aua, Petaia, Reus, Brookes — ont dû passer par
`CADRAGES`, et les deux premiers relevés ont **coupé le menton**. Le front et
les yeux sautent aux yeux quand on lit une grille, et l'on sous-estime la
mâchoire, la barbe et le cou, qui descendent d'un bon quart de plus que l'œil
ne le croit. Le geste juste est de cadrer **large, puis de resserrer** : un
carré trop grand se voit et se corrige, un menton coupé passe pour un cadrage
serré. **Aucun journal d'exécution ne signalait rien** — les trois essais ont
rendu « ✔ » avec la même assurance ; c'est la planche contact qui a arrêté
les deux premiers, et c'est exactement ce à quoi elle sert.
