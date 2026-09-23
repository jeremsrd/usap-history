# Ce que les pages affichent

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

**Les séries ne coupent pas aux saisons**, et elles comptent toutes les
compétitions : douze défaites d'affilée du 27 octobre 2018 au 26 janvier
2019. Ce fichier a dit « quinze, du 25 août » tant que la campagne
européenne de 2018-2019 n'était pas en base ; depuis le 5 septembre 2026,
le nul de Chaban-Delmas du 20 octobre 2018 coupe la série en huit puis
douze, et la page le dit d'elle-même. C'est le sens usuel du mot, et le
contraire aurait fabriqué des séries plus courtes que la réalité.

**ET LES RECORDS SE LISENT AUSSI COMPÉTITION PAR COMPÉTITION**, depuis le
9 septembre 2026, à la demande de Jérémy. Le bloc global reste en tête,
inchangé — c'est lui qu'on vient chercher —, et l'épine des compétitions
suit, chacune sous son nom en rouge condensé avec son compte de rencontres
et sa période, sur le modèle des ancres de `/realisateurs`. Cinq
compétitions y figurent : Top 14, Pro D2, Challenge européen, H-Cup,
Top 16.

Trois choses arbitrées au passage, et elles valent d'être retenues :

- **les bilans de saison ne s'y découpent pas.** Ils sont stockés sur
  `Season` et portent le championnat seul, phases finales exclues, pour
  coller au classement officiel : il n'existe pas d'agrégat de saison par
  compétition, et en fabriquer un ici en inventerait un que la base ne
  tient pas. Le bloc reste global, et le chapeau le dit ;
- **une série de compétition ignore ce qui n'en est pas, elle ne s'y coupe
  pas** — ni les rencontres des autres compétitions, ni les saisons passées
  dans une autre division. D'où **dix-sept défaites d'affilée en Top 14, du
  19 avril 2014 au 26 janvier 2019**, qui enjambent les quatre saisons de
  Pro D2 : les dix-sept rencontres de Top 14 de cet intervalle sont bien
  toutes des défaites, vérifié à part. C'est le sens utile, et la page
  l'annonce ;
- **une compétition de moins de dix rencontres n'a pas de records**, et
  l'omission est dite plutôt que tue — les barrages d'accession (4) et le
  championnat de 1ère série (2) sont nommés avec leur compte. Sur deux
  rencontres, chacun des dix records est porté par l'une des deux, et le
  tableau ne mesure plus rien.

**UN RECORD À ZÉRO N'EST PAS UN RECORD, ET LE TOP 16 L'A MONTRÉ.** La LNR ne
publie aucun fait de match sur 2004-2005 : toutes les lignes de composition y
valent zéro point et zéro essai, et le maximum tombait sur la première venue
— « 0 points d'un joueur, Ludovic Loustau ». Un homme se voyait attribuer un
record qu'il ne détient pas, faute de source, et rien ne le signalait : le
calcul était juste, c'est la donnée qui était absente. Les aides de la page
rendent désormais `null` sur une mesure nulle, la ligne disparaît, et le
chapeau dit pourquoi. **Le même piège attend toute page qui prend un maximum
sur une colonne que la source peut laisser à zéro.**

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

**Fiche de match, fiche joueur, fiche adversaire — d'où vient ce qu'elles
affirment.** Depuis le 6 septembre 2026, chacune se clôt d'une section
« Sources et arbitrages », rendue par `Provenance`, qui liste les
attestations de l'entité — champ, degré, source, qui a tranché, qui a relu —
et **ne s'affiche pas quand il n'y en a aucune** : l'absence se lit
« feuille officielle », et c'est le cas ordinaire. Le quart de finale de
2011 y dit que son stade vient de Wikipédia contre ESPN, la fiche
d'Amituanai que son poste est tranché par Jérémy, celle de Dax que son
terrain est celui d'aujourd'hui.

**ET TOUTES LES PAGES PUBLIQUES INVITENT À SIGNALER UNE ERREUR**, depuis le
18 septembre 2026 à la demande de Jérémy. `Signalement`
(`src/components/`) pose au pied de chacune une ligne sous un filet : « Une
erreur ? Ces pages sont saisies à la main, feuille de match après feuille de
match, et les sources elles-mêmes se trompent parfois… » puis un lien
`mailto:` vers l'adresse de contact, `COURRIEL_CONTACT` de
`lib/constants.ts` — la même que les mentions légales. Les vingt-quatre le
portent, **les deux pages légales comprises** : elles n'affichent rien qui
vienne de la base, mais c'est là qu'on arrive quand on cherche à qui écrire,
et l'adresse y est noyée dans un paragraphe de loi — `PageLegale` l'appelle
pour les deux. Sur l'accueil il suit la note de couverture, sans filet
(`sansFilet`), au fil du chapeau.

Quatre choses arbitrées :

- **ce n'est ni la réserve de couverture, ni `Provenance`**, et les trois se
  suivent sans se recopier : la réserve dit ce que la base n'a pas encore,
  `Provenance` d'où vient ce qu'une fiche affirme quand ce n'est pas d'une
  feuille officielle, le signalement que ce qui est là peut être faux.
  L'une borne l'étendue, l'autre la provenance, le troisième la confiance ;
- **l'objet du courriel porte la page** — le nom du joueur, l'affiche de la
  rencontre, le titre de la liste —, faute de quoi un signalement arrive
  sans dire de quoi il parle. Le **chemin n'y est pas**, et c'est délibéré :
  le lire demanderait `headers()`, qui rendrait dynamiques les trente-six
  pages du site pour une ligne de courriel ;
- **l'adresse est répétée en clair à côté du lien** : un `mailto:` n'ouvre
  rien chez qui n'a pas de client de messagerie associé — cas courant sur un
  ordinateur de bureau —, et le lecteur resterait devant un lien mort sans
  savoir à qui écrire. Les parenthèses sont dans le composant et non dans le
  dictionnaire, à la différence des deux-points du pied de page : les deux
  langues les écrivent pareil ;
- **le ton est une invitation, non un avertissement encadré.** Pas de carte,
  pas d'icône, pas de fond jaune — le chantier design a débarrassé le site de
  tout cela ; le titre est dans la voix condensée, le lien souligné d'or
  comme ceux de `Provenance`. Le site n'a pas à s'excuser d'être un
  chantier, il a à dire qu'on peut le corriger.

Clés `signalement.*` dans les deux cahiers. **Une page publique nouvelle doit
le porter** : rien ne le signalera, comme pour `hreflang`.

**C'est en ligne depuis le 18 septembre 2026**, et vérifié sur le site
lui-même plutôt qu'au journal d'un déploiement : l'accueil, une liste et une
fiche joueur, dans les deux langues, le `mailto:` décodé pour lire son objet
— « USAP Historia — une erreur sur « Adrien Plante » », « … un error a
«Adrien Plante» ». C'est la règle des écussons et des portraits, étendue à
une page : **ce qui s'affiche ne se valide pas au journal d'exécution.**

Une chose qu'aucune vérification de ce côté-ci ne couvre : **qu'un clic
ouvre réellement un client de messagerie.** Cela ne dépend plus du site mais
du poste du lecteur, et c'est précisément pourquoi l'adresse est aussi en
clair.

**Fiche de match — le titre qu'elle a décidé.** Une finale affiche une
bannière « Champion » ou « Finaliste » avec un lien vers le palmarès. Le
rapprochement avec `Trophy` se fait sur l'**année de fin de saison** et la
compétition ; l'expression est ancrée au début du libellé de tour, faute de
quoi une demi-finale en hériterait. Il n'y a pas de clé étrangère entre un
match et un titre : le jour où il en faudrait une, c'est là qu'elle irait.
