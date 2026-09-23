# Remonter avant 2006

### Remonter avant 2006 — ce qu'il faudra changer

**Réflexion du 2 septembre 2026, ouverte par Jérémy**, et **tranchée en
partie le 6 septembre 2026** : le troisième état existe (la table
`attestations`), le barème par époque existe (`baremeDeMatch`), la presse
de Gallica se lit (`lib/gallica.ts`), et **les finales de 1914 et de 1925
sont en base**, relues sur l'image, graphies tranchées par Jérémy,
attestées. Ce qui suit garde la réflexion telle qu'elle s'est posée, puis
l'inventaire des sources, puis ce que chaque pas a appris ; ce qui reste à
faire est dit à la fin de « Où reprendre ». Les autres rencontres
d'avant-guerre — 1921, 1938, les demi-finales — attendent : **Jérémy a
choisi de les faire plus tard.**

**Le constat, et il est chiffré : 99 saisons ne portent pas un seul match**,
toutes antérieures à 2006-2007, qui est la plus ancienne en base. Or ni la LNR
ni l'EPCR ne remontent là — la chaîne entière du projet, `seed-season`,
`seed-lineup`, `seed-opponent-sheet`, `seed-chronologie`, `audit-opponent-lineups`,
n'aura plus de source à interroger. Il faudra donc « être plus permissif », et
c'est vrai. Mais le mot recouvre **deux choses opposées**, et l'une des deux ne
doit pas bouger.

#### Les sources qui restent, inventoriées le 6 septembre 2026

Sondées une à une ce jour-là, à la question de Jérémy « n'a-t-on plus aucune
source pour remonter ? ». La réponse est non, mais aucune ne ressemble à la
LNR ou à l'EPCR, et chacune a son prix.

| Source | Ce qu'elle donne | Jusqu'où | Ce qu'il en coûte |
|---|---|---|---|
| **L'ancien site de la LNR**, dans la Wayback Machine (`lnr.fr/championnat/resultats.asp`, `resultats2000_d1.shtm`, `clubs/effectifs.asp`, `clubs/joueur.asp`) | les **scores** journée par journée, les **effectifs** de chaque club et des fiches joueur | 2000-2001 à 2003-2004 | aucune feuille de match, aucune composition : la page de résultats ne lie rien. Des scores officiels, et l'effectif pour apparier des noms |
| **L'ERC**, dans la Wayback Machine (`ercrugby.com/eng/12_NNNN.php`) | des **comptes rendus avec compositions**, comme ceux qui ont fait 2007-2008 | environ 1 200 pages capturées en 2006, 400 en 2007 : les Heineken Cup **2005-2006 et 2006-2007** sont là, 2004-2005 non | la page d'équipe de Perpignan n'est pas archivée et les pages de poule ne lient plus ; il faut **lire les titres un à un** — 1 600 pages à 4 secondes, deux heures de balayage — pour trouver les douze de l'USAP |
| **ESPN**, Top 14 (ligue 270559) | scores, puis compositions | scores à partir de **2007-2008** (15 matchs seulement), saison entière en 2008-2009 **sans composition**, compositions à partir de **2009-2010** | rien avant, revérifié : 2004-2005 à 2006-2007 rendent zéro match. N'apporte rien que la LNR n'ait déjà |
| **Gallica** (BnF), texte intégral | **L'Auto**, quotidien, 1900-1944 ; **Midi olympique**, 1929-1931 puis 1932-1946 ; presse régionale | tout l'avant-guerre, la période des six premiers titres | de l'OCR de journal, non des feuilles : compositions dans le corps du récit, à lire. Vérifié sur *L'Auto* du 4 mai 1925, au lendemain de la finale : « Perpignan a gagné parce qu'il avait la balle » — l'API `ContentSearch` retrouve le mot dans le fascicule (`bpt6k4684973p`), `Issues` liste les numéros d'une année. La page d'accueil rend un contrôle de sécurité aux robots ; les API passent |
| **cybervulcans.net** | des fiches de match complètes — mi-temps, affluence, arbitre, météo, remplaçants, remplacements, marqueurs — pour **les matchs de Clermont** | depuis 1971-1972 | deux rencontres par saison contre l'USAP, et souvent seul le camp clermontois est détaillé (« Détail des points non disponible » côté Narbonne en 1993). Pas de liste par adversaire, les fiches sont sous `/saison-AAAA-AAAA/matchs/…-NNN.html` |
| **Wikipédia** | une page par saison de championnat depuis 1892 : composition des poules, scores des phases finales, et la **finale avec ses deux XV** — en liste pour 1955, en récit pour 1925, sourcé sur *L'Auto* dans Gallica ; une page par Coupe d'Europe avec le classement des poules et les scores des couperets | tout | **aucun score de match de poule** avant l'ère LNR — la poule de 1955 n'est qu'une liste de clubs, la Coupe d'Europe 2005-2006 ne donne à Perpignan qu'un score, celui du quart —, quatre pages de finale seulement (1992, 2005, 2019, 2021), une seule « Saison de l'USAP » (2011-2012), et les `rugbybox` anglophones ne couvrent que les phases finales. C'est un garde-fou et quinze noms par finale, pas une feuille. Son API plafonne vite : espacer les appels |

**Gallica, lu de plus près le 6 septembre 2026, sur les cinq finales gagnées
d'avant 1946.** Ce qu'un numéro de *L'Auto* du lendemain donne, quand son
OCR est bon, dépasse ce qu'on espérait d'un journal : le 4 mai 1925, page 5,
« Les équipes se présentèrent comme suit », **les deux XV par lignes** —
arrière, trois-quarts, demis, troisième, deuxième, première ligne —, le
capitaine marqué « (cap.) », l'arbitre M. Vigné, le marqueur et la nature
de ses points ; le 4 mai 1914, page 3, une **chronologie à l'heure de
l'horloge** — « 4 h. 40 : essai pour Perpignan, 4 h. 41 : but par Giral » ;
le 9 mai 1938, la **mi-temps** dans le titre même, « 11 à 6 (5-6) ». Trois
réserves, toutes vues :
- **l'OCR abîme les noms propres** — « Raruis » pour Ramis, « Hi.bère » pour
  Ribère, « 1\Iontade » pour Montade, « Garcassonnaise » —, et 1914 est
  pire que 1925. Chaque nom devra être relu par un humain sur l'image, et
  c'est le **troisième état** qui manque à la base : « d'après *L'Auto* du
  4 mai 1925, relu par Jérémy » ;
- **l'OCR peut manquer tout à fait** : la page 8 du 9 mai 1938 ne rend que
  ses titres, le corps est « [texte illisible] » ligne après ligne ;
- **1944 n'y est pas** : aucun numéro de *L'Auto* autour du 26 mars 1944
  dans Gallica, et *Midi olympique* saute de 1939 à 1946.

**Par où passer** : l'API `RequestDigitalElement?O={ark}&E=ALTO&Deb={page}`
rend l'OCR d'une page en ALTO, mots et coordonnées — `texteBrut` est
derrière un contrôle de sécurité qu'un script ne passe pas ;
`services/ContentSearch?ark=&query=` dit sur quelles pages un mot figure ;
`services/Issues?ark=…/date&date=AAAA` liste les numéros d'une année ;
`ark:/12148/{cb…}/date{AAAAMMJJ}` redirige vers le fascicule du jour.
*L'Auto* est `cb327071375`, *Midi olympique* `cb34413999x`. **Gallica
plafonne à quelques requêtes par minute** — 429 « Trop de requêtes » dès la
cinquième page ALTO rapprochée —, et un balayage se fait à 30 ou
45 secondes d'intervalle, en arrière-plan.

**Le lecteur existe depuis le 6 septembre 2026** — `lib/gallica.ts` et
`seed-match-gallica.ts` —, et sa première simulation, la finale du 3 mai
1925 dans *L'Auto* du lendemain, dit à la fois ce qu'il sait faire et où
l'OCR s'arrête. Il rend le fascicule, les deux pages où Perpignan est nommé,
le score « 5 à 0 », l'arbitre M. Vigné, les deux XV par lignes avec leurs
capitaines, Jean Sebédio et « Raruis ». Carcassonne est à quinze ; **le XV
catalan n'a que quatorze noms** : l'OCR a perdu l'étiquette « demis » et
un nom avec elle, et Carbonne se retrouve cinquième trois-quarts. Le
script le signale et ne complète rien : c'est là qu'un humain doit relire
l'image. Aucun des vingt-neuf noms n'est en base, ce qui est attendu.

**Les noms de 1914 et de 1925 sont relus sur l'image, le 6 septembre 2026,
et attendent l'arbitrage de Jérémy.** L'ALTO donne la position de chaque
ligne sur la page ; IIIF découpe cette région dans l'image de Gallica
(`/iiif/ark:/12148/{ark}/f{page}/{x},{y},{w},{h}/full/0/native.jpg`, les
coordonnées de l'ALTO valant pour l'image pleine) ; les deux découpes ont été
lues par Claude et confrontées aux XV que Wikipédia donne des deux finales,
prénoms compris. **Quinze sur quinze pour les quatre équipes**, dans l'ordre
du journal — l'OCR avait perdu « demis : Pascot » en 1925, l'image le rend.
Seules divergent des graphies : le journal écrit Sicard, Seyroux, Couffe,
Amillat, Serres, Fournier, Nauté, Galiay, Wikipédia Sicart, Sayrou, Couffé,
Amilhat, Serre, Fournié, Naute, Gallay. **Une neuvième s'est tranchée
d'elle-même** : « Du-four », coupé en fin de ligne dans la composition
tarbaise, est « Duffour » deux fois dans le même numéro, au récit et à la
chronologie — le pilier du Stadoceste que Wikipédia donne capitaine, sorti
sur côte fracturée. Jérémy ne le connaissait pas, et pour cause : c'est un
Tarbais. Devant un nom coupé par une césure, chercher ses autres
occurrences dans le numéro avant de le comparer à quoi que ce soit. La table
`RELECTURES` de `seed-match-gallica.ts` porte les deux, ligne par ligne,
avec l'adresse de l'image relue, et `valide: false` : la simulation les
affiche en regard, ≈ pour une variante à trancher, ✗ pour deux hommes, et
**rien ne s'écrit avant que Jérémy n'ait tranché la graphie** — c'est lui
qui deviendra `reluPar` dans l'attestation.

**LES FINALES DE 1914 ET DE 1925 SONT EN BASE**, écrites le 6 septembre
2026 par `seed-match-gallica.ts` après que Jérémy a tranché les graphies —
celles de Wikipédia, avec le prénom, celle du journal en note de chaque
ligne. Ce sont les deux premières rencontres d'avant 2004, et les seules :
elles portent chacune une attestation `PROBABLE` sur l'ensemble et sur la
composition, l'image relue pour adresse, `CONCORDANT` sur le stade,
l'arbitre, la mi-temps et l'affluence quand journal et Wikipédia les
donnent tous deux ; 59 fiches créées, chacune attestée de même, et Aimé
Giral — figure citée pour mémoire jusque-là — retrouvé sur sa finale, deux
points au pied.

Ce que la base en dit, et ne dit pas : les XV dans l'ordre du journal,
ligne par ligne, **sans numéro de maillot** ; le poste réellement tenu
n'est porté que là où la ligne le dit sans ambiguïté — arrière, deuxième
ligne, et les demis de 1914 que le journal annote « (ouverture) » et
« (mêlée) » —, un trois-quarts, un troisième ligne ou un pilier restant
sans poste plutôt que d'en recevoir un deviné, la ligne étant en note ;
aucune minute de jeu ; et pour 1914 une **chronologie en minutes déduites
de l'horloge** — reprise à 4 h 00, la minute de jeu vaut 40 plus les
minutes écoulées, ce qui suppose que l'horloge ne s'arrête pas —, chaque
fait gardant son heure en clair, la transformation de Giral tombant ainsi
à la 81ᵉ. Deux stades créés, les Ponts-Jumeaux à Toulouse et Maraussan à
Narbonne. Le barème est celui de l'époque, et c'est lui qui a mis au jour
un **neuvième endroit** où il était en dur : `ScoreEvolution`, qui
recomptait la finale de 1914 en 12-8 — il reçoit désormais le barème de
la saison.

**Les trois autres finales, simulées le 6 septembre 2026, ont appris au
lecteur que *L'Auto* n'écrit pas toujours ses XV de la même façon.** En
1914, « LES EQUIPES » en titre, chaque club seul sur sa ligne en
capitales, les demis annotés « (ouverture) » et « (mêlée) », les avants
par ligne ; en 1921, « se présentèrent dans l'ordre suivant », et les
avants en un seul bloc de huit sans ligne ; en 1925, « comme suit » et le
tiret. Le lecteur connaît les trois, et une liste de noms s'arrête au point
qui la clôt en fin de ligne, sauf si l'en-tête suivant vient aussitôt —
c'est ce qui sépare « Galiay. » de « Les Tarbais sont en blanc ».

Ce que chacune rend : **1914**, les deux XV complets, quinze et quinze,
zéro avertissement, le score « 8 à 7 » avec sa décomposition — « 2 essais,
1 but » contre « 1 essai, 1 but sur coup tombé » —, la mi-temps 0-0 et
l'arbitre M. Gondouin, tous deux conformes à Wikipédia, plus treize faits
à l'heure de l'horloge, du coup d'envoi à 3 h 03 au but de Giral à 4 h 41.
**1921**, le pire OCR des quatre : « Arrière » rendu « AITIÙIO »,
« trois-quarts » « txrM-qua-rte », douze Toulousains et quatorze Catalans
dont quatre sans ligne, et le score n'est pas retrouvé dans les pages
lues ; la page vaut par ses avants, lisibles, et par une note de
remplacement — « Martorel entre en remplacement de Constant, blessé ».
**1938**, rien que le titre : « 11 à 6 (5-6) », la page des équipes étant
illisible. Le lecteur ne retient un club que s'il le reconnaît — « Arrière : »
lisible, ou l'un des deux noms attendus suivi d'un tiret long —, sans
quoi le récit de 1914 fournissait « Tarbes av- » comme troisième équipe.

**Ce qui est mort ou vide** : `usap.fr` d'avant 2005 n'a laissé qu'un forum
dans l'archive ; `finalesrugby.com` est un domaine parqué ; `rugbyarchive.net`
ne répond pas ; `allrugby.com` ne remonte pas avant 2006-2007 (cf. « Où
trouver les données ») ; le site de la LNR d'aujourd'hui s'arrête à
2004-2005.

**Ce que cela dessine.** Deux couches, séparées par un trou. **De 2000 à
2004**, on peut écrire les rencontres — scores officiels par l'ancienne LNR,
classements par Wikipédia — sans aucune composition, comme 2004-2005 l'est
déjà à moitié ; et l'ERC peut rendre les compositions des deux campagnes
européennes de 2005-2007, au prix d'un balayage. **Avant 1944**, la presse
numérisée porte les compositions des grands matchs — finales, demi-finales —
dans ses récits, et c'est là que vivent les six premiers titres. Entre
1944 et 2000, rien de lu par machine n'a été trouvé : c'est le trou, et il
est large de cinquante-six ans.

C'est exactement la situation que la réflexion ci-dessous anticipait : les
sources qui restent sont des récits et des tableaux, non des feuilles, et
c'est le **troisième état** — « probable, d'après telle source » — qu'il
faudra savoir écrire avant d'y toucher.

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

**Il existe depuis le 6 septembre 2026 : la table `attestations`.** Ce qui
suit décrit le manque tel qu'il se posait, et la forme retenue est la
première des deux proposées plus bas — la table, parce qu'elle vaut pour
les stades, les écussons et les postes autant que pour les rencontres.

- **Le modèle** : `Attestation` désigne une entité par son nom de modèle et
  son identifiant, sans clé étrangère, et un champ — `venueId`,
  `refereeId`, `position`, `score`… — ou l'entité entière quand le champ
  est vide. Elle porte un **degré** — `OFFICIEL` (publication de
  l'organisateur, même hors chaîne : l'ERC archivé, une désignation
  d'arbitre), `CONCORDANT` (source secondaire recoupée : un classement de
  Wikipédia qui retombe, ESPN validé par la poule), `PROBABLE` (un récit, un
  OCR, un terrain d'aujourd'hui posé sur hier), `ARBITRE` (tranché par une
  personne) —, la source en toutes lettres, une adresse, une note, qui a
  tranché, qui a relu l'original et quand. Une ligne par entité et par
  champ. **L'absence de ligne se lit « feuille officielle de la chaîne »**,
  ce qui reste le cas ordinaire.
- **La migration** est posée à la main comme `opponent_venues`,
  `prisma/migrations/20260906090000_attestations`, purement additive.
- **`lib/attestations.ts`** écrit — `attester()`, qui remplace — et lit.
  **Tout script qui écrit une valeur venue d'ailleurs que de la feuille
  officielle doit désormais poser son attestation** ; c'est la règle qui
  remplace « le consigner ici ».
- **`seed-attestations.ts`** a versé dans la table ce que ce fichier
  portait à sa place : 126 lignes le 6 septembre 2026 — les postes tranchés,
  ce que Jérémy a donné à la main, les terrains d'aujourd'hui posés sur des
  rencontres d'hier, les terrains neutres, les écussons hors LNR et EPCR,
  les scores corrigés contre la LNR, ce que Wikipédia donne des couperets,
  les 53 rencontres européennes d'ESPN et de l'ERC, les saisons dont le
  garde-fou n'est pas la LNR. Chaque ligne y est accompagnée de sa
  démonstration, et le script est idempotent.
- **Les pages l'affichent** : le composant `Provenance` clôt la fiche de
  match, la fiche joueur et la fiche adversaire d'une section « Sources et
  arbitrages », et se tait quand il n'y a rien. C'est le point de tout ceci :
  l'incertitude devient lisible.

Ce que la table ne fait pas encore : les compositions de la presse
d'avant-guerre n'y entrent pas, aucun nom n'ayant été relu sur l'image —
le barème par époque, lui, existe depuis le même jour ; et les
attestations existantes ne portent que les cas documentés ici, non ceux
qu'un script antérieur aurait posés sans le dire.

La base ne savait dire que deux choses : le fait est **affirmé**, ou il est
`null`, c'est-à-dire inconnu. Elle ne savait pas dire « **probable, d'après
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
