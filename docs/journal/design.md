# Journal — identité visuelle, page par page (sept. 2026)

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

**La fiche joueur est refaite le 6 septembre 2026**, dans la même voix, et
`JoueurCellule` avec elle. Sa seule audace est le **dos de maillot** : le
prénom au-dessus, le nom condensé en rouge, et à sa droite, en or, **le
numéro que l'homme a le plus porté** — une donnée de la base, comptée sur
ses feuilles, pas un ornement ; il ne s'affiche que s'il en a porté un. Le
cœur de la page n'est plus quatre gros chiffres centrés mais le **bilan
saison par saison**, à la manière de lfchistory.net : matchs, titularisations,
brassards quand il y en a eu, essais, points, minutes — un tiret quand la
source ne les publie pas —, et la ligne de total sous un filet rouge. Les
résultats des rencontres sont une lettre, V, N ou D, en gras **or** quand
elle est favorable au joueur — rouge jusqu'au 19 septembre 2026, cf. le
code couleur des résultats plus bas —, à la place du vert et du rouge de
Tailwind ;
les sélections et distinctions sont des lignes, plus des cartes ; les icônes
devant les titres ont disparu ; la case du portrait reste vide sans
portrait, ici comme dans les classements. La page est passée au
dictionnaire (`fiche.*`), et la provenance de ce qu'elle affirme la clôt.

**Un bandeau de chiffres sépare le dos de maillot du bilan depuis le
14 septembre 2026**, à la demande de Jérémy : matchs, victoires, nuls,
défaites, points marqués, essais — six nombres dans la voix condensée,
chacun sous son libellé, entre deux filets sur toute la largeur, les
victoires en rouge et les défaites en gris. Ce n'est pas une carte, rien
n'est bordé sur les côtés. Sous le maillot seulement, comme le bilan ; le
résultat est celui de l'USAP sur les rencontres où l'homme a joué, une
ligne de composition valant un match comme partout. Clés `fiche.bandeau*`,
en catalan aussi.

**ET SES LISTES DE RENCONTRES PORTENT LES DEUX ÉCUSSONS**, depuis le
18 septembre 2026 à la demande de Jérémy : vingt pixels à gauche de chaque
nom, dans les deux tableaux — « avec l'USAP » et « contre l'USAP » —, et
**dans l'ordre de l'affiche**, l'écusson suivant son camp selon `isHome`.
L'écusson adverse n'y a d'abord été posé seul, et Jérémy a demandé le
catalan avec : une affiche à un seul blason se lit de travers.

Trois règles du projet s'y appliquent, et aucune ne se voit au journal
d'exécution : **l'écusson adverse porte `logo-club`, celui de l'USAP non** —
sans la classe une marque sombre disparaît en thème sombre, et le blason
catalan a son propre contour d'or, comme dans le Header et sur une fiche de
match ; **pas de case vide** pour un club sans écusson, le nom se suffit,
comme sur l'accueil et à rebours des portraits des deux XV d'une fiche de
match ; et `alt=""`, l'image étant décorative puisque le nom la suit.

**ET LA LISTE DES MATCHS LES PORTE AUSSI**, depuis le même jour et à la
demande de Jérémy. Ce fichier disait le contraire deux heures plus tôt —
« cinquante lignes par page, l'écusson y encombrerait ce qu'ici il
illustre » —, et c'était mon estimation, non une règle : elle est tombée
devant la page rendue. **Le composant vit donc dans
`src/components/Ecusson.tsx`**, sorti de la fiche joueur dès qu'une seconde
page l'a demandé ; les grands écussons — 96 pixels sur une fiche de match,
48 sur l'accueil — gardent leur code, ils portent une mise en page et pas
seulement une image.

Ce qui reste vrai de l'ancienne note : « les écussons sont ailleurs sur le
site » n'est plus une règle du chantier design mais un souvenir de son
point de départ. Les pages qui **listent ou affichent une rencontre** les
portent toutes — accueil, fiche de match, fiche joueur, liste des matchs,
page de saison — et c'est désormais la règle ; une page nouvelle qui montre
une affiche devrait faire de même.

**La fiche de match est refaite le même jour.** Sa seule audace est le
**tableau d'affichage** : l'affiche en Archivo condensée, l'USAP en rouge,
l'adversaire en encre et lié à sa fiche, le score énorme entre les deux, et
pas de logos — ils sont ailleurs sur le site. **Les écussons y sont revenus
le 14 septembre 2026**, à la demande de Jérémy, de part et d'autre du score
comme il l'avait retenu sur l'accueil, à 96 pixels à l'échelle du score ;
l'adverse en `logo-club`, l'USAP avec son contour d'or, pas de case pour un
club sans écusson. En mobile, écussons, score et deux noms ne tiennent pas
sur 375 pixels : les noms passent au-dessus en une affiche, les écussons
gardent le score entre eux, et le score descend d'un cran — en 7xl il se
cassait en deux lignes. C'est une décision, à ne pas reprendre pour un
oubli de nettoyage. **La réserve qui suivait ici — « la liste des matchs,
elle, reste sans logos » — ne vaut plus** : cette liste les porte depuis le
18 septembre, et la page de saison depuis le 19.

**Et les faits portent une icône depuis le même jour**, à la demande de
Jérémy — `IconeFait`, dans `src/components/`. Ce ne sont pas les emojis que
le chantier avait retirés : quatre dessins de seize pixels au trait, en
`currentColor`, qui prennent la couleur de la ligne — rouge pour l'USAP,
gris pour l'adversaire. Le ballon pour un essai ; les poteaux pour ce qui se
marque au pied, ballon au sol pour une transformation, en l'air pour un
drop, seuls pour une pénalité ; un rectangle plein pour un carton ; deux
flèches pour un remplacement. **Le jaune du carton est une couleur en dur,
et c'est voulu** : c'est une donnée, comme les couleurs d'un club sur sa
fiche, non un jeton — un carton jaune est jaune dans les deux thèmes —, et un
liseré en `currentColor` à faible opacité le détache du fond sombre. Le
rouge du carton, lui, est `usap-sang`.

**Et les deux XV portent le portrait de chaque homme**, à la taille des
classements, **avec une silhouette au trait quand la base n'en a pas** — à
la demande de Jérémy le même jour. C'est à rebours des listes, où la case
reste vide, et c'est assumé : au milieu d'un XV en portraits, une case vide
se lirait comme un trou, quand un visage inconnu dit « un homme dont on n'a
pas la photo ». La silhouette est un dessin en `currentColor` sur
`bg-muted`, non l'icône Lucide dans un rond gris que le chantier avait
chassée. Les faits, eux, gardent leurs seules icônes : les portraits y ont
été posés d'abord, par un malentendu, et retirés le même jour. Le titre décidé par le match
est une ligne en or sous l'affiche. Tout le reste est dit en phrases puis en
tableaux : « Défaite, avec le bonus défensif. Mi-temps 6-28. Stade
Jean-Bouin, Paris, 12 065 spectateurs, arbitre Kévin Bralley. » ; le graphe
du score aux jetons du thème, sans boîte, sans puces de légende ni chips ;
le détail du score à côté ; les deux XV en deux tableaux serrés, numéro,
nom, poste, minutes avec entrée et sortie, essais, points, cartons en mots ;
les faits minute par minute en liste. Plus de pastille verte ou rouge, plus
de badge bleu pour le bonus défensif, plus d'emoji ni d'icône. Page passée
au dictionnaire (`match.*`), provenance en pied.

**La page de saison est refaite le même jour.** Sa seule audace est la
**frise des résultats** : sous le millésime en rouge condensé, la saison
entière en une ligne de lettres — **V en or**, N en encre, D en gris —,
chacune liée à sa rencontre. C'est la structure réelle d'une saison, et
elle se lit d'un coup d'œil : les vingt défaites en vingt et une rencontres
de l'automne 2018 s'y voient sans qu'on les nomme. Le titre décidé est une ligne en or — « Champion
de Pro D2, promu » —, et une relégation seule s'écrit en gris, l'or n'étant
pas pour elle. Le classement et le bilan du championnat tiennent en une
phrase, le staff en une autre, le bilan rédigé suit ; les rencontres par
compétition, phase finale à part, en tableaux serrés — **avec les deux
écussons depuis le 19 septembre 2026**, cf. plus bas ; trois
classements courts — réalisateurs, essais, plus utilisés — ; et
**l'effectif en un seul tableau**, chaque homme avec ses matchs,
titularisations et brassards, minutes, réalisations et cartons en mots. Les
onze listes de cartes de l'ancienne page y tiennent en douze colonnes, et
les onze `groupBy` en une seule lecture des lignes. L'effectif réunit les
inscrits et ceux qui ont joué sans l'être — avant 2021-2022 il n'y a pas de
ligne d'effectif, ce sont les feuilles qui disent qui était là. La colonne
des minutes disparaît quand la source n'en publie aucune, 2004-2005 et
2005-2006, et la note le dit. Plus de flèche verte ni rouge pour la montée
et la descente, plus de neuf cases de chiffres centrés. Page passée au
dictionnaire (`saison.*`), provenance en pied, saisons voisines en tête.

**Et un bandeau de chiffres suit son en-tête depuis le 16 septembre 2026**,
à la demande de Jérémy — la forme de celui de la fiche joueur, dix nombres
condensés entre deux filets, et le contenu du bilan de l'accueil, dont il
reprend les libellés `accueil.bilan*` : joués, victoires, nuls, défaites,
points pour et contre, différence, essais, bonus, points au classement en
rouge. Dessous, **le partage domicile / extérieur** en une ligne
(`saison.bandeauDomicile`, `bandeauExterieur`), que la page ne disait pas.
Championnat seul, phase régulière, comme le classement officiel ; la
réserve suit quand la saison compte d'autres compétitions. Trois choses à
savoir :

- **tout est compté sur les rencontres, non lu dans les agrégats de
  `Season`** : la saison en cours n'a pas encore les siens, et les saisons
  closes ont vérifié par leur garde-fou que les deux concordent ;
- **deux valeurs se taisent quand la source ne les dit pas** — les essais
  s'il manque le compteur d'une seule rencontre, les bonus et les points de
  classement quand `Season.totalPoints` est `null`. Sans cette garde,
  2004-2005, dont les neuf bonus offensifs sont introuvables, afficherait
  « 0/3 » et un total faux avec le même aplomb que les autres ;
- **les phrases de chiffres de l'en-tête sont parties** — matchs joués,
  points marqués, bonus, points au classement — puisqu'elles redisaient
  ligne pour ligne ce que le bandeau montre juste dessous. Le classement
  reste en phrase, avec le compte des journées à venir.

En mobile, dix nombres sur trois colonnes laissent le dixième seul à
gauche : il prend la ligne et se centre, ici comme sur le bilan de
l'accueil, qui avait le même orphelin.

**ET LE CODE COULEUR DES RÉSULTATS EST PASSÉ À L'OR LE 19 SEPTEMBRE
2026**, arbitré par Jérémy : **V en or, N en encre, D en gris**, là où la
victoire était en sang depuis le chantier design.

La raison vaut au-delà de ce cas : **le sang est la couleur de l'USAP
partout ailleurs sur le site** — le titre d'une page, un nom de joueur, un
lien au survol. Dans une frise il ne disait donc pas « gagné », il disait
« nous », et rien ne permettait au lecteur de le deviner. L'or ne sert,
lui, qu'à ce qui est acquis — un titre sous une saison, une distinction en
haut d'une fiche —, et il garde ce sens ici. C'est `usap-or` et non
`usap-or-vif` : la frise vit sur le fond de la page, qui suit le thème.

**Et le code vivait en huit exemplaires.** La fonction `lettre()` était
recopiée dans la page de saison, la fiche adversaire, la fiche stade, la
fiche arbitre, la fiche entraîneur, la fiche président, la liste des
matchs et l'accueil — huit fois les mêmes trois lignes et les mêmes trois
classes. Elle vit désormais dans `lettreResultat()` de `src/lib/matchs.ts`,
et les huit pages l'appellent ; la fiche joueur, qui colorait sa lettre
selon qu'elle est favorable à l'homme, suit la même couleur. **Un code
couleur en huit exemplaires ne se change pas : il se réécrit sept fois et
on en oublie une.**

Le regroupement a fait tomber une divergence que personne n'avait vue :
**trois des huit rendaient la défaite par défaut** — accueil, présidents,
entraîneurs — quand les cinq autres rendaient `null`. Une rencontre sans
résultat s'y serait affichée « D », c'est-à-dire « perdue » pour un match
pas encore joué. La fonction partagée rend `null`, comme partout ailleurs
dans ce projet, et les trois appels s'en accommodent.

**Et les comptes de victoires ont suivi le même jour**, sur la même
décision : les colonnes des tableaux de liste — adversaires, stades,
arbitres, entraîneurs, présidents, statistiques — et le bandeau de la
fiche joueur, neuf endroits en tout. Ils étaient en sang, et la question
se posait dès lors que la lettre passait à l'or : une page qui dit la
victoire en or dans sa frise et en rouge dans sa colonne n'a pas de code
couleur, elle en a deux. Les trois couleurs sont donc les mêmes partout et
sur les deux objets, la lettre comme le nombre — **or, encre, gris**.


**ET LA PHOTO OFFICIELLE DE L'ÉQUIPE SUIT SON EN-TÊTE DEPUIS LE
21 SEPTEMBRE 2026**, à la demande de Jérémy — une par saison pour
l'instant, deux colonnes sur `Season`, `photoUrl` et `photoCredit`,
migration `20260921100000_season_photo` posée à la main. La première est
celle de 2008-2009, l'équipe au Stade de France devant le panneau
« Finale 2009 », donnée par Jérémy comme provisoire — « pas géniale, j'en
trouverai une meilleure ». Elle va d'un bord à l'autre comme les tableaux,
entre l'en-tête et le bandeau de chiffres, sans cadre ; dessous, la
légende (`saison.photoLegende`) et **le crédit du photographe**
(`saison.photoCredit`, « Photo Tonton Jo », lu sur l'image même). Une
photo d'équipe est une œuvre : le crédit s'affiche comme celui d'un
portrait de joueur, et `set-photo-saison.ts` l'exige. Sans photo, rien ne
s'affiche — pas de case vide.

Deux chemins pour en poser une : **l'admin**, où le formulaire de saison a
gagné `ImageUpload` (dossier `saisons`, dans Supabase, dont l'hôte est déjà
admis par `next.config.ts`) et un champ de crédit — la limite de 2 Mo de
`/api/upload` vaut aussi pour elle ; ou **le dépôt**, `public/images/
saisons/AAAA-AAAA.jpg` puis `set-photo-saison.ts`, comme pour les écussons.
`width` et `height` de la balise sont ceux de la première photo, 2000 × 1327,
et `h-auto` laisse l'image suivre son propre rapport : une photo d'un autre
format s'affiche juste, au prix d'un léger décalage au chargement. Le jour
où il faudra plusieurs photos par saison, ce sera une table
`season_photos`, et les deux colonnes y migreront.

**ET SES LIGNES DE RENCONTRE PORTENT LES DEUX ÉCUSSONS DEPUIS LE
19 SEPTEMBRE 2026**, à la demande de Jérémy — vingt pixels devant chaque
nom, dans l'ordre de l'affiche, par `Ecusson` comme la fiche joueur et la
liste des matchs la veille. Ils valent pour **tous** les tableaux de la
page, la phase finale et les coupes comme le championnat, le même code les
rendant tous.

Ce fichier portait le contraire à trois endroits — « en tableaux serrés
sans logos » ici, « des logos dans les lignes de match » parmi ce que la
page ne fait plus, et « la liste des matchs, elle, reste sans logos »
sur la fiche de match, phrase déjà fausse depuis la veille. Les trois sont
corrigés du même geste : **une règle qui se renverse laisse ses traces
ailleurs que là où on la renverse**, et une note fausse se lit comme une
note à jour.

Les trois précautions du composant s'appliquent, et aucune ne se voit au
journal d'exécution : `logo-club` sur l'adverse et non sur le blason
catalan, pas de case vide pour un club sans écusson, `alt=""` puisque le
nom suit. La requête gagne `logoUrl` sur `opponent`, sans quoi les
écussons manqueraient en silence.

**L'accueil est refait le même jour.** Sa seule audace est le **palmarès
écrit en grand** : sous le titre, « Sept fois champion de France » en rouge
et les sept années du Bouclier en or condensé, chacune liée à sa saison —
c'est ce qui fait ce club, et un site d'histoire n'a pas de meilleure
ouverture qu'une date. Les finales, la Pro D2, le Manoir et l'Europe
suivent en une phrase, puis la présentation dit la source et l'étendue de
la base en chiffres lus dans la base, avec la réserve de couverture. Puis,
dans l'ordre où un supporter les cherche : le dernier match et **le
prochain**, qui n'y était pas, en une ligne chacun ; la saison en cours
avec la même frise que sur sa page ; ce jour dans l'histoire en tableau ;
et six entrées pour explorer, en texte, la grille de cartes à icône
doublant le Header. La section « palmarès » à badges a disparu, absorbée
par l'en-tête ; le slogan centré sur dégradé, le bouton rouge, les cartes
de chiffres, les pastilles vertes et rouges aussi. Le nombre de titres est
écrit en lettres dans le dictionnaire (`accueil.champion`) et se réécrira
le jour d'un huitième. Dictionnaire `accueil.*`. **Ce paragraphe décrit
l'accueil du 6 septembre 2026 ; le palmarès en est parti depuis, et la clé
`accueil.champion` avec lui — cf. plus bas.**

**ET LE SERMENT L'OUVRE DEPUIS LE 10 SEPTEMBRE 2026**, demandé par Jérémy :
en tête de page, avant le palmarès, l'écusson d'un côté et de l'autre les
mots que le club fait siens — « Je m'engage à servir l'USAP avec foi et
dévouement… » —, dans la voix condensée des titres, le tout clos d'un filet.
Deux colonnes dès `sm`, l'une sous l'autre en mobile : un écusson et quatre
lignes ne tiennent pas côte à côte sur 375 pixels. Le palmarès garde son or
et reste l'audace de la page ; le serment l'annonce.

Trois choses arbitrées au passage :

- **la phrase est dans le dictionnaire d'une seule pièce**, guillemets
  compris (`accueil.serment`). Colorer « sang » en rouge et « or » en or
  aurait été joli et aurait demandé du balisage dans une chaîne à traduire —
  ce que la règle du projet interdit ;
- **elle n'est pas attribuée.** Jérémy a donné le texte, non sa source ; une
  légende qui le nommerait affirmerait quelque chose que rien n'atteste ;
- **l'écusson y est à 160 pixels**, et c'est ce qui a fait découvrir que
  celui du dépôt n'en faisait que 151 — cf. « Logos des clubs ».

L'accueil a eu son catalan le 14 septembre 2026, serment compris — traduit,
et à faire relire en premier.

**ET LE HERO EST PASSÉ SANG ET OR LE 10 SEPTEMBRE 2026**, à la demande de
Jérémy : bandeau rouge d'un bord à l'autre, écusson à gauche, serment en or.
Deux choses à savoir avant d'y toucher :

- **il est hors du conteneur de la page**, dans un fragment, avec sa propre
  doublure `mx-auto max-w-6xl` — un rectangle rouge à l'intérieur des marges
  se lirait comme une carte, ce dont le chantier design a justement débarrassé
  le site, et la doublure aligne l'écusson sur le titre qui suit ;
- **son or est `usap-or-vif`, non `usap-or`**, cf. « Thème clair/sombre » : le
  second est illisible sur le sang en thème clair.

**ET UN JOUEUR AU HASARD**, demandé le même jour. Il a d'abord été posé
entre « ce jour dans l'histoire » et « Explorer », puis **remonté le
11 septembre 2026 en troisième colonne du bloc « dernier match / prochain
match »**, à la demande de Jérémy : les trois choses qu'un supporter regarde
en premier, sur une même ligne, et une colonne sous le titre en `md`. Nom
dans la voix du dos de maillot, portrait quand il y en a un, matchs, points
et essais. **Le nom est en 4xl, un cran sous le score des deux autres
colonnes, et c'est mesuré** : en 5xl, « Kubunakaravi » fait 298 pixels
quand un tiers de page moins le portrait en laisse 240, et un patronyme ne
se coupe pas au milieu ; le prénom au-dessus rend au bloc la hauteur du
score.

**Et la colonne est un bandeau sang**, demandé par Jérémy le même jour — la
seconde surface colorée de la page après le hero, et elle en reprend la
règle : la surface impose son encre. Titre et nom en `usap-or-vif`, le dos
de maillot tel qu'il est ; prénom et bilan en `primary-foreground`, blanc
dans les deux thèmes — c'est le jeton du site pour du texte sur du sang, et
il n'y en a pas d'autre. La grille étire la colonne à la hauteur des deux
voisines, ce qui fait le cadre sans bordure ; et le bandeau **déborde de
son rembourrage en haut et en bas** (`md:-my-5`), sans quoi son titre
descendait de vingt pixels sous les deux autres. En mobile les blocs
s'empilent et il garde ses marges. `Titre` a gagné une variante `sang` pour
cela. Trois choses arbitrées :

- **le tirage porte sur les hommes qui ont joué**, au moins une feuille sur
  une rencontre jouée, non sur les 381 fiches liées au club : une recrue sans
  match afficherait trois zéros, ce qui n'est pas un portrait ;
- **la case du portrait reste vide sans photo**, comme sur `/joueurs`. Ne
  tirer que parmi les 80 fiches illustrées aurait été plus joli et **faux** :
  48 d'entre elles sont l'effectif du jour, et « au hasard » aurait presque
  toujours rendu un joueur de cette saison ;
- **les compteurs suivent la règle de la fiche joueur et de `/centurions`** —
  une ligne de composition sur une rencontre jouée vaut un match, remplaçant
  non entré compris. Deux pages qui lient l'une vers l'autre ne peuvent pas
  annoncer deux nombres différents pour le même homme.

Le pluriel passe par `Intl.PluralRules`, **trois clés pour trois compteurs** :
la fonction ne s'applique qu'à un `{n}` à la fois, et « 1 matchs » se verrait.

**ET « LE DERNIER MATCH / LE PROCHAIN » PORTE LES DEUX ÉCUSSONS**, le même
jour et à la même demande. Ils encadrent le score — et « À venir » pour le
prochain —, à 48 pixels, façon tableau d'affichage. **Le choix s'est fait sur
pièce** : les deux dispositions possibles ont été posées l'une sous l'autre
sur la page, l'écusson collé au nom du club ou l'écusson encadrant le score,
et Jérémy a retenu la seconde — contre l'avis que j'avais donné, qui tenait à
ce que la première lie l'écusson au club plutôt qu'au nombre.

**C'est une exception assumée**, et il fallait l'écrire dans le code : la
fiche de match et la liste des matchs se sont débarrassées de leurs logos
pendant le chantier design, « les écussons sont ailleurs sur le site ». Ici
les deux blocs ne montrent qu'une rencontre chacun, et l'écusson illustre au
lieu d'encombrer. Sans cette note, la prochaine relecture y verra un oubli de
nettoyage et le « corrigera ».

Trois précautions dans ces quelques lignes, toutes déjà des règles du
projet : l'écusson **adverse** porte `logo-club`, celui de l'USAP non — il a
son propre contour d'or, comme dans le Header et dans le hero ; un club sans
écusson ne laisse **pas** de case vide, le nom se suffit ; et `shrink-0`,
faute de quoi le score écrase l'écusson dans la colonne étroite du mobile.
L'ordre vient de `isHome`, lu au même endroit pour les deux appels : l'écusson
et le score ne peuvent pas se désynchroniser.

Le bloc était **déjà en deux colonnes** avant cette séance, avec son score en
grand : seuls les écussons manquaient.

**ET « FACE À » — LE TÊTE-À-TÊTE AVEC LE PROCHAIN ADVERSAIRE**, ajouté le
11 septembre 2026 à la demande de Jérémy, sous la ligne des trois colonnes et
avant la saison en cours : l'affiche, puis qui on affronte, puis où on en
est. C'est ce qu'un supporter se demande sitôt l'adversaire connu, et le
bloc change de lui-même à chaque journée. Il porte le bilan en une phrase
**avec les clés de la fiche adversaire** (`adversaire.bilan`, `plusLarge`,
`plusLourde`), **les cinq dernières confrontations** en lignes courtes —
date, affiche, score, lettre —, le plus large succès et la plus lourde
défaite, et **un bouton** vers le tête-à-tête complet. Un club jamais
rencontré n'efface pas le bloc, il le dit : « première rencontre entre les
deux clubs » est une information — ce sera le cas de l'Ulster en janvier.
Le titre est en encre, comme celui de la fiche adversaire : le rouge est
celui de l'USAP. Quatre clés `accueil.faceA*`.

Trois choses arbitrées par Jérémy le même jour :

- **la frise des confrontations a été essayée et défaite** — trente-deux
  lettres pour Castres, « indigeste ». Sur la fiche du club elle est
  l'audace de la page ; ici elle encombrait un bloc qui n'est pas le sujet.
  Les cinq dernières disent la tendance sans le mur ;
- **le bloc est en deux moitiés** dès `md` : à gauche le tête-à-tête, à
  droite **les cinq meilleurs réalisateurs catalans contre ce club**, dans
  le tableau de la fiche adversaire (`adversaire.realisateursTitre`,
  `JoueurCellule`). Choisi contre les joueurs passés par les deux camps,
  dont la liste serait énorme pour certains clubs. Le libellé « Les cinq
  dernières confrontations » est visible au-dessus du petit tableau — cinq
  lignes sans titre se lisent comme une liste tronquée —, et le bouton est
  centré sous sa colonne. **Le titre de droite est en rouge**, celui de
  gauche en encre : deux titres noirs côte à côte font fade, et les
  réalisateurs sont des Catalans — le rouge est le leur ;
- **le lien est un bouton**, le seul du site public, et il en fixe la
  forme : plein sang, texte `primary-foreground`, or vif au survol — le
  couple du hero —, dans la voix condensée des titres, au rayon du site.
  Pas de bouton fantôme ni d'ombre. Le chantier design avait retiré « le
  bouton rouge » de l'ancien accueil ; celui-ci est demandé, et il mène à
  une page précise plutôt qu'à un slogan.

**ET LA FRISE DE LA SAISON A QUITTÉ L'ACCUEIL**, le 11 septembre 2026 :
Jérémy n'aime pas les lettres V, N, D en rangée ici — elle reste l'audace
de la page de saison et de la fiche adversaire. À sa place, **le bilan en
chiffres** : une rangée de dix nombres dans la voix condensée, chacun sous
son libellé en petit — joués, victoires, nuls, défaites, points pour et
contre, différence, essais pour/contre, bonus offensifs/défensifs, points au
classement, ce dernier en rouge. **Championnat seul, phase régulière** — les
rencontres de type `CHAMPIONNAT` qui portent une journée —, comme l'en-tête
de la page de saison et le classement officiel, et la note le dit ; les
journées à venir sont comptées à côté de la division. Les essais ne
s'affichent que si la source les a dits sur chaque rencontre, un tiret sinon ;
les points de classement viennent de `matchPoints()`, jamais d'un
`4 × victoires` en dur. Trois colonnes en mobile, cinq en `sm`, dix en `lg`,
**chaque nombre centré sur son libellé**, et sous la rangée le bouton « Voir
la saison entière », centré — la même classe `BOUTON` que le tête-à-tête,
écrite une fois dans la page. Clés `accueil.bilan*`.

**ET LA SAISON EN COURS PORTE SES TROIS CLASSEMENTS**, depuis le
11 septembre 2026 à la demande de Jérémy, qui voulait « un truc en trois
colonnes » : sous la frise, réalisateurs, marqueurs d'essais et plus
utilisés — ceux de la page de saison, à cinq noms, mêmes clés de titre et de
valeur (`saison.realisateursTitre`, `valeurPoints`…), même règle d'égalité.
Les titres sont des h3 en encre, plus petits que le h2 rouge de la section :
une hiérarchie, pas une répétition. **« Actuel » y est tu** : dans la saison
en cours chacun l'est par définition, et la mention quatorze fois n'annonce
rien — `JoueurCellule` reçoit `isActive={false}`. Après une journée le bloc
est mince, en mai c'est le palmarès de la saison ; il prolonge le bloc au
lieu d'en ajouter un, l'accueil étant déjà long.

**ET « CE JOUR DANS L'HISTOIRE » EST EN TROIS COLONNES**, depuis le
11 septembre 2026 à la demande de Jérémy — c'était le bloc le plus faible de
la page, un tableau de trois lignes souvent vide. Les rencontres jouées un
même jour de l'année restent la première colonne. La deuxième donne **les
anniversaires de la semaine** — les sept jours autour d'aujourd'hui, la
date sur chaque ligne, le jour même en gras, l'âge **fêté** et non celui
d'aujourd'hui, un disparu gardant son année. **La semaine et non le jour,
et c'est compté** : 211 naissances tombent sur 155 jours distincts, la
colonne du seul jour aurait été vide six jours sur dix ; la semaine en
donne quatre en moyenne. La troisième donne **la rencontre la plus proche
il y a dix, vingt, cinquante et cent ans**, à trois semaines près — un jour
précis tomberait à côté —, en une seule requête sur les quatre fenêtres ;
cinquante et cent ans ne rendent rien tant que la base s'arrête à
2004-2005 et aux deux finales d'avant-guerre, et la colonne s'allongera
d'elle-même quand elles rendront. Une colonne vide le dit plutôt que de
disparaître : les trois gardent leur place d'un jour à l'autre. Les titres
de colonne sont des h3 en encre, `SousTitre`, partagés avec les classements
de la saison. Clés `accueil.ceJour*`.

**ET UN BANDEAU SANG ET OR FERME LA PAGE**, depuis le 14 septembre 2026 à
la demande de Jérémy — le pendant du hero, sous « Explorer » et avant le
pied de page : le hero dit qui on est, celui-ci ce qu'on a fait. « Depuis
1902 » en blanc, puis **cinq nombres en or vif** dans la voix condensée,
chacun sous son libellé en blanc — Boucliers de Brennus, rencontres jouées,
victoires, points marqués, joueurs —, tous lus dans la base : les Boucliers
sur la table `Trophy` comme sur la page du palmarès, `PALMARES` en repli, le
reste en agrégats des rencontres jouées. Hors du conteneur comme le hero,
d'un bord à l'autre, doublure alignée ; même règle d'encre, `usap-or-vif` et
`primary-foreground`. Cinq colonnes en `sm`, deux en mobile.

Deux choses à savoir : **ce sont des nombres, non des cartes** — une seule
ligne, pas de case, pas d'icône, ce qui les distingue des « cartes de
chiffres » que le chantier design a retirées ; et **les Boucliers y sont
bien que le palmarès ait quitté le haut de page** — ici c'est un nombre
parmi quatre autres, à l'autre bout de la page, non un bloc qui redit le
serment. Trois des cinq nombres paraissent aussi dans la note du chapeau,
sous « en cours de saisie » ; là ils datent le chantier, ici ils le
mesurent. **L'effectif en portraits a été écarté** le même jour, Jérémy le
jugeant trop lourd visuellement — cinquante bustes sous trois classements
feraient un mur ; s'il revenait, ce serait en une seule rangée à 40 pixels
ou en une phrase. Clés `accueil.cloture*`.

**ET LA PAGE EST EN BANDES**, le même jour, sur une remarque de Jérémy :
« beaucoup d'informations sur peu d'espace ». Le conteneur unique a cédé la
place à sept bandes d'un bord à l'autre, chacune avec sa doublure alignée
sur le hero — `Bande`, dans la page — et **les fonds alternent** : le hero
sang ; présentation et ligne des trois colonnes sur le fond de la page ;
tête-à-tête sur la surface `usap-carte` — celle du pied de page, gris rosé
en clair, sang sombre en sombre —, cernée d'un filet haut et bas parce
qu'en clair la teinte seule ne se voit presque pas ; la saison sur le
fond ; « ce jour » sur la surface ; la clôture sang. **La bande
« Explorer » est partie le même jour**, à la demande de Jérémy — six entrées
en texte que le Header et le pied de page portent déjà, et sept clés
`accueil.explorer*` avec elle, dans les deux cahiers. **L'espacement a doublé** : `py-12` puis `py-16` par bande, contre
`mb-10` entre les blocs. Ce ne sont pas des cartes — rien n'est bordé
dans les marges —, ce sont des bandes, comme le hero l'était déjà. Le
`-mb-16` de la clôture et le `md:-my-5` du joueur au hasard survivent au
découpage.

**ET LA PAGE A ÉTÉ RELUE D'ENSEMBLE LE 14 SEPTEMBRE 2026**, après trois jours
où elle a doublé de longueur bloc par bloc. Trois défauts, tous en mobile
ou à la jointure des blocs, aucun dans un bloc pris seul : un blanc entre
le bandeau de clôture et le pied de page — le `Footer` porte un `mt-16`
pour toutes les pages, et le bandeau le mange par `-mb-16` plutôt que de
retirer la marge aux trente-cinq autres ; « 381 joueurs » seul à gauche
sur sa ligne en mobile, cinq nombres sur deux colonnes — le dernier prend
la ligne et se centre ; et « 14 septembre » coupé sous « Ce jour dans
l'histoire » sur 375 pixels — la date passe sous le titre en mobile, à sa
suite dès `sm`. **Relire l'ensemble après une série de blocs, pas seulement
chaque bloc** : c'est aux jointures que ça casse. L'ordre des sections et
le rythme rouge / encre des titres n'ont pas eu à bouger.

**ET LE PALMARÈS A QUITTÉ L'ACCUEIL**, le même jour, sur décision de Jérémy.
Il en était l'audace depuis le 6 septembre — « Sept fois champion de France »
en rouge et les sept années du Bouclier en or condensé, chacune liée à sa
saison —, plus la phrase des finales, de la Pro D2, du Manoir et de l'Europe.
La raison : le serment ouvre désormais la page, et trois choses s'y disaient
coup sur coup ce que fait ce club.

Deux conséquences, l'une et l'autre assumées :

- **l'accueil ne mène plus directement à `/palmares`.** La page reste
  atteignable de partout par le Header et par le pied de page — et la
  section « Explorer », qui ne le listait pas, est partie à son tour le
  14 septembre 2026 ;
- **six clés du dictionnaire sont parties avec le bloc** — `champion`,
  `finaliste`, `proD2`, `manoir`, `europe`, `palmares` —, vérifiées comme
  n'ayant aucun autre appelant dans `src/`, ainsi que l'import de `PALMARES`
  et les aides `saisonDe` et `listeAnnees`. Une clé morte dans le cahier se
  recopie ensuite en catalan et se traduit pour rien.

L'accueil n'a donc plus qu'une audace, et c'est **le serment**.

**ET SON CHAPEAU DIT LE PROJET, NON SON AVANCEMENT**, arbitré par Jérémy le
même jour. La phrase de présentation promet « chaque rencontre, chaque joueur
et chaque saison de l'USA Perpignan », et une **note en italique** dessous dit
que les données sont en cours de saisie et de recherche, avec les chiffres du
jour — matchs, joueurs, saisons couvertes sur le total, tous lus dans la base.

**Le défaut n'était pas l'ambition, c'était de la démentir trois fois de
suite.** L'ancienne version promettait tout, retirait 95 saisons trois mots
plus loin — « {saisons} saisons documentées sur {total} » —, puis le redisait
une troisième fois dans la réserve : une promesse, un démenti et une
explication en trois lignes. J'avais proposé de borner la promesse à
2004-2005 ; Jérémy a tranché l'inverse, et il a raison — une promesse rabotée
rapetisse le projet à son avancement du jour, quand une note qui dit où l'on
en est le date sans le réduire.

**Les chiffres sont donc dans la note et non dans le chapeau** : collés à la
promesse ils la contredisent, sous « en cours de saisie » ils la datent — ce
ne sont plus des trous, c'est un chantier. La clé `accueil.chiffres` a
disparu, absorbée par `accueil.reserve`.

Et c'est ce qui rend cohérente la `description` du site, « Base de données
historique **complète** de l'USA Perpignan » : elle est dans le même registre
que le chapeau. Avec une promesse bornée elle aurait détonné, dans la phrase
la plus lue du site.

**La liste des saisons est refaite le même jour**, sur le modèle exact de
`/joueurs` : **l'épine des décennies**, grosses années condensées en rouge
avec un index en tête — c'est ainsi qu'on cherche dans cent vingt saisons,
« les années 50 ». Une ligne par saison : division, classement, victoires,
nuls, défaites et points du championnat, entraîneur principal lié à sa
fiche, **le fait marquant en mots** — les titres en or, champion de France,
de Pro D2, Challenge du Manoir, d'après `PALMARES` ; finaliste, promu,
relégué en gris —, et **le nombre de rencontres que la base porte**, qui
montre d'un coup d'œil où la couverture s'arrête. Le trophée et les deux
flèches vertes et rouges à côté du millésime ont disparu, les V verts et
les D rouges aussi. Dictionnaire `saisons.*`.

**La liste des matchs est refaite le même jour**, sur le même modèle :
**l'épine des saisons**, le millésime en rouge condensé au-dessus de ses
rencontres et lié à sa page, cinquante rencontres par page. Ce que la page
gagne : **le bilan de la sélection** — filtrer sur un adversaire rend ses
confrontations et leur compte, victoires, nuls, défaites, points pour et
contre, plus les rencontres à venir —, et le résultat en liens plutôt qu'en
menu, « À venir » compris. Saison, compétition et adversaire restent des
menus, cent vingt saisons et soixante adversaires ne tenant pas en liens ;
les adversaires y sont triés sur le nom affiché, « Béziers » et non « AS
Béziers ». **Un piège pris au passage** : le bilan se calcule sur
`{ AND: [where, MATCH_JOUE] }` et non sur un étalement — `MATCH_JOUE` porte
`result`, qu'un filtre de résultat porte aussi, et le second écrasait le
premier en silence, le filtre « victoires » annonçant 311 défaites. Plus de
pastilles. Dictionnaire `matchs.*`.

**Les deux écussons sont revenus dans ses lignes le 18 septembre 2026**, à
la demande de Jérémy et par `Ecusson` — vingt pixels devant chaque nom,
dans l'ordre de l'affiche, comme sur la fiche joueur. La page les avait
perdus au chantier design, et ce fichier a soutenu deux heures durant
qu'ils y encombreraient : la page rendue a tranché l'inverse.

**La fiche adversaire est refaite le même jour.** Sa seule audace est la
**frise des confrontations** sous le nom du club, la même que sur la page
de saison — c'est le tête-à-tête d'un coup d'œil, et les vingt-sept
Toulon-USAP se lisent en une ligne. Le bilan tient en une phrase, le plus
large succès et la plus lourde défaite liés à leur rencontre en une autre ;
l'écusson garde sa place, à gauche du nom en encre — le rouge est celui de
l'USAP —, et la case reste vide sans écusson. Les confrontations en
tableau, les réalisateurs catalans contre ce club en une lecture des
lignes, et **les joueurs passés par les deux clubs, tous et non les vingt
premiers**. **Un défaut de fond pris au passage** : cette liste rendait
tous les joueurs du club adverse, puisque `seed-carrieres.ts` écrit un
passage par club à chacun ; elle exige désormais aussi le lien avéré avec
l'USAP, la condition de la liste des joueurs. Plus de sept cases de
chiffres, plus de cartes verte et rouge pour les records, plus de drapeau
en emoji. Dictionnaire `adversaire.*`.

**La liste des adversaires est refaite le même jour**, sur le modèle de
`/joueurs` : **l'épine des pays**, la France en tête puis les autres par
ordre alphabétique, chaque pays en rouge condensé au-dessus de ses clubs.
Une ligne par club : l'écusson à la taille d'un portrait, le nom lié, la
ville, la période des confrontations, et **le tête-à-tête** — matchs,
victoires, nuls, défaites, points pour et contre —, que la grille de cartes
ne disait pas ; deux `groupBy` sur les rencontres jouées le donnent pour
tous les clubs d'un coup. Les filtres sont des liens, Tous, Rencontrés,
Clubs disparus, avec leur compte ; la recherche reste. Le titre est un cran
plus petit qu'ailleurs en mobile, onze lettres ne tenant pas en `text-7xl`
condensé sur 375 pixels. Plus de cartes centrées, plus de bouclier gris,
plus de drapeau en emoji, plus de pastilles. Dictionnaire `adversaires.*`.

**La fiche stade est refaite le même jour.** Sa seule audace est la
**frise des rencontres jouées là**, sous le nom du stade — à Aimé-Giral un
mur de trois cent trente-quatre lettres, et c'est bien l'histoire du lieu.
Le bilan en une phrase ; **l'affluence en une autre**, moyenne sur les
rencontres où elle est connue et record lié à sa rencontre, ce que la page
ne calculait pas ; et qui reçoit là, aujourd'hui et avant, d'après
`OpponentVenue`, lié à la fiche du club — « le Stade Français y recevait
jusqu'en 2012-2013 ». Les rencontres en tableau avec l'arbitre et
l'affluence, le résultat en liens, le compte de la sélection, la
provenance en pied. Plus de quatre cases vertes et rouges, plus d'épingle
grise à la place d'une photo qu'aucun stade n'a. Dictionnaire `stade.*`.

**La liste des stades est refaite le même jour**, sur le modèle de la liste
des adversaires : **l'épine des pays**, la France en tête et Aimé-Giral en
tête de la France. Une ligne par stade : le nom lié, la ville, la capacité,
qui y reçoit — l'USAP en rouge, le club adverse lié à sa fiche —, la
période où l'USAP y a joué, et **le bilan du terrain**, que la grille de
cartes ne disait pas, par deux `groupBy` sur les rencontres jouées. Plus
d'épingle grise, plus de pastille « Domicile USAP ». Dictionnaire
`stades.*`.

**Le palmarès est refait le même jour.** Sa seule audace est **la
chronologie** : une colonne d'années en grand caractère condensé — en or
les titres, en encre les finales perdues, en gris les dates du club,
fondation de 1902, scission de 1912, fusions de 1919 et 1933 —, et en
regard ce qui s'est passé, l'adversaire, le score, le lieu, et **la
rencontre quand la base la porte** : les six finales en base y sont liées,
1914 et 1925 comprises. Le lecteur y voit d'un coup d'œil les années 1920
et 1930 dorées, puis le long silence jusqu'en 2009. Le résumé tient en une
phrase comptée sur la table `Trophy`, et chaque compétition a son tableau ;
le championnat y réunit ses deux libellés de base, « Championnat de
France » et « … Top 14 ». Les constantes de `PALMARES` restent le repli si
la table était vide. Plus de quatre cases à trophée, plus de badges
d'années, plus de frise à pastilles. Dictionnaire `palmares.*`.

**La page des statistiques est refaite le même jour.** C'est un
carrefour, et sa seule audace est **les trois scores de record en tableau
d'affichage** — le plus large succès, la plus lourde défaite, le plus gros
score, chacun en grand caractère condensé comme sur la fiche de match,
les quatre suivants en lignes dessous : un record est un score et se lit
comme tel. Le bilan tient en une phrase puis en un tableau à trois lignes,
toutes rencontres, domicile, extérieur, avec les points et le taux de
victoires ; les classements courts mènent aux classements complets ; les
réalisateurs adverses ont leur section ; les adversaires les plus
rencontrés leur tableau, lié aux fiches. **Un défaut pris au passage** : ce
tableau comptait les rencontres à venir, son `groupBy` n'ayant pas de
filtre. Plus de quatre cases à icône, plus de V verts ni de D rouges,
plus de cartes de joueur ni de record. Dictionnaire `statistiques.*`.

**ET LE BILAN SE LIT AUSSI COMPÉTITION PAR COMPÉTITION**, depuis le
9 septembre 2026 et pour la même raison que les records : le global et ses
deux camps restent en tête, un second tableau donne chaque compétition avec
sa période, et chaque ligne mène à ses rencontres dans la liste des matchs,
dont le bilan de sélection redonne exactement les mêmes chiffres.

**Toutes les compétitions y figurent, sans seuil**, à la différence des
records — et c'est la distinction à retenir : **un bilan se lit sur
n'importe quel nombre de rencontres, un record en demande assez pour en
être un.** Quatre barrages d'accession font un bilan honnête, ils ne font
pas un record. Les sept compétitions sont donc là, jusqu'aux deux finales
d'avant-guerre.

**Le tableau se vérifie de lui-même** : la somme de ses sept lignes
retombe au point près sur la ligne « toutes rencontres » — 686 jouées,
352 V, 23 N, 311 D, 15 598 points pour 14 588 —, et sa ligne de Top 16
redonne les 18 V, 1 N, 11 D et 688-583 que ce fichier documente par
ailleurs. Une seule requête le nourrit, les rencontres jouées tenant en
quelques centaines de lignes de cinq champs, et il faut de toute façon
leurs saisons pour la période.

**La fiche arbitre et la liste des arbitres sont refaites le 7 septembre
2026.** Le nom de l'arbitre est en **encre**, non en rouge — le rouge est
celui de l'USAP, et un arbitre n'a pas de camp —, le prénom au-dessus comme
sur le dos de maillot de la fiche joueur, sans le numéro. La seule audace
de la fiche est la frise des rencontres sifflées, la même que sur la page
de saison et la fiche stade. Le bilan tient en une phrase, la part des
désignations sur une réception et sur un déplacement en une autre, et
**les cartons qu'il a distribués** en une troisième — jaunes et rouges,
des deux camps, comptés sur les feuilles de ses rencontres, sans jamais
écrire « 0 rouge » : c'est la seule donnée de la base qui soit propre à un
arbitre, et l'ancienne page ne la disait pas. Les rencontres en tableau,
avec le stade lié à sa fiche, les cartons du match en mots et l'affluence ;
`Provenance` accepte désormais `Referee`, la table n'en portant encore
aucune. Aucun filtre : la médiane est à trois rencontres, le maximum à
vingt-deux. La liste est sur le modèle exact de `/joueurs`, l'épine
alphabétique et l'index, une ligne par arbitre avec la période, le bilan
catalan sous son sifflet et ses cartons ; le chapeau nomme le plus souvent
désigné et compte les rencontres jouées sans arbitre, l'un et l'autre lus
dans la base. **Pas de colonne de portrait** : aucun des cent deux
arbitres n'en a, et une case vide à cent pour cent se lit comme une erreur
— la colonne de nationalité de `/joueurs` avait été retirée pour la même
raison. Plus de silhouette grise, plus de quatre cases dont deux en vert
et rouge de Tailwind, plus de pastilles. Dictionnaire `arbitres.*` et
`arbitre.*`.

**La fiche entraîneur et la liste des entraîneurs sont refaites le
7 septembre 2026.** Le nom est en rouge comme celui d'un joueur — c'est un
homme du club —, et sous le nom ses rôles et leurs périodes en une phrase,
**en séquences contiguës** : « entraîneur principal de 2005-2006 à
2006-2007, puis de 2023-2024 à 2025-2026 ; adjoint de 2007-2008 à
2009-2010 » pour Azéma, et jamais « de 2005-2006 à 2025-2026 » d'un homme
parti treize ans entre les deux. Le titre décidé sous son banc en or,
comme sur la page de saison. La seule audace de la fiche est **la frise
des rencontres jouées sous son banc, bornée à ses dates de prise et de fin
de fonction** : Azéma a quitté le banc le 2 novembre 2025, et les
rencontres suivantes sont celles de Labit — sans cette borne la même
défaite comptait deux fois dans deux bilans, ce que l'ancienne page
faisait. La règle vit dans `src/lib/staff.ts` — `passagesDe()` unifie le
staff détaillé et la relation d'entraîneur principal, `sousSonBanc()`
filtre les rencontres, `sequences()` découpe les saisons —, et les deux
pages l'appellent. Le bilan tient en une phrase, toutes compétitions ; la
saison par saison en tableau, rôle avec ses dates au mois près, division,
classement, bilan du championnat, fait marquant en mots ; la note dit que
les deux bilans ne comptent pas la même chose. `Provenance` accepte
`Coach`.

La liste est sur le modèle des saisons, mais **l'épine est celle des
rôles** — entraîneurs principaux, puis ceux qui n'ont été qu'adjoints,
puis Gilbert Brutus sous « avant les saisons saisies » —, du plus récent
au plus ancien sous chacune. **Une épine des décennies a été essayée et
défaite** : vingt-deux saisons tiennent en trois décennies, et Azéma,
arrivé en 2005, tombait dans les années 2000 en tête de liste alors qu'il
est le dernier parti. Qui dirigeait le banc est la vraie question d'une
liste d'entraîneurs. Une ligne par homme : rôles en mots — « adjoint puis
principal » —, période en séquences, saisons, le bilan des rencontres sous
son banc, et le fait marquant de ses saisons, les titres en or et
regroupés — « Champion de Pro D2 2018 et 2021 ». Pas de colonne de
portrait, aucun des vingt et un n'en ayant. Plus de cartes à icône, plus
de cinq cases dont deux en vert et rouge, plus d'encadré or à trophée,
plus d'emoji ni de flèches. Dictionnaire `entraineurs.*` et
`entraineur.*`, les libellés de rôle repris de `saison.role*`.

**La fiche président et la liste des présidents sont refaites le
7 septembre 2026**, sur le modèle des entraîneurs. La fiche : le nom en
rouge, le mandat en une phrase quand la fiche le porte — « Président de
2007 à 2012 » —, sinon les saisons que la base couvre et la réserve qui
dit que ce n'est pas la même chose ; le titre décidé sous sa présidence
en or ; la frise des rencontres jouées sous sa présidence, quatre cents
lettres pour Rivière ; le bilan en une phrase ; la saison par saison avec
l'entraîneur principal lié et le fait marquant. `Provenance` accepte
`President`. **La liste n'a pas d'épine** : quatre hommes sur vingt-deux
saisons, une épine n'aurait rien à structurer. C'est **une chronologie**,
à la manière du palmarès — les années en grand caractère condensé en
tête de chaque ligne, en rouge quand c'est le mandat que la fiche porte
(« 2013– », « 2007–2012 »), en gris quand ce ne sont que les saisons
couvertes (Dagrenat, Besson), et la réserve dit la différence ; puis le
nom, les saisons, le bilan et le fait marquant. Plus de cartes à icône
avec le mandat en or, plus de trois cases, plus d'encadré à trophée, plus
d'emoji ni de flèches. Dictionnaire `presidents.*` et `president.*`.

**Les centurions sont refaits le 7 septembre 2026.** Sa seule audace est
**le nombre de matchs en grand caractère condensé en tête de chaque
ligne**, en rouge : c'est ce qui fait un centurion et la clé du
classement, le rang n'en étant que l'ombre, en gris à côté. À matchs
égaux, le plus ancien passe devant. La réserve de couverture, qui tenait
dans un encadré gris, est un paragraphe sous le chapeau comme sur toutes
les listes. Plus d'icône de bouclier, plus de tableau bordé et arrondi.
La page portait déjà son dictionnaire.

**Les réalisateurs sont refaits le 7 septembre 2026**, sur le modèle des
centurions : la valeur du classement — points, essais, points au pied —
en grand caractère condensé en rouge en tête de chaque ligne, le rang en
gris à côté ; chaque classement sous un titre rouge et son filet, son
critère en une phrase, le détail en colonnes aux **en-têtes écrits en
mots** — essais, transformations, pénalités, drops — plutôt qu'en lettres
à légende, les deux légendes ayant disparu du dictionnaire. Les trois
ancres sont des liens condensés en tête avec leur compte, les réserves
des paragraphes sous le chapeau, et la réserve du barème dit désormais
qu'il est celui de chaque saison. Plus de cible, de médaille ni
d'empreinte de pas devant les titres, plus de puces bordées, plus
d'encadré gris, plus de tableaux arrondis.

**Les records sont refaits le 7 septembre 2026, et c'était la dernière
page de l'ancien rendu.** Sa seule audace est la valeur du record en
grand caractère condensé en rouge en tête de chaque ligne — un record est
un nombre, et c'est lui qu'on grossit. Le reste est en lignes : ce que le
record mesure, qui le porte, lié à la rencontre, à la saison ou au joueur,
et où et quand ; trois tableaux sous un titre rouge et son filet — sur un
match, sur une saison, les séries. **Deux valeurs en dur en sont sorties** :
le nombre de rencontres à affluence connue, que la note disait « 36 »
quand la base en compte davantage, et la division d'une saison, que la
page réduisait à Pro D2 ou Top 14 quand 2004-2005 est un Top 16 — les
deux sont lus dans la base. Plus de flamme, de calendrier ni de trophée
devant les titres, plus d'encadré gris, plus de vingt-trois cartes
bordées à libellé en capitales espacées.

**Le chantier est clos le 7 septembre 2026** : les trente-six pages
publiques sont dans la même voix. Ce qui reste est le bilingue, reporté
à la fin, et une relecture de chaque page nouvelle pour qu'aucune couleur
en dur n'y revienne.

**LE PIED DE PAGE EST REFAIT LE 10 SEPTEMBRE 2026**, à la demande de
Jérémy : c'était le dernier morceau de la couche partagée que le chantier
n'avait pas touché — une ligne grise centrée, la mention et rien d'autre.
Sa seule audace est **le nom en grand**, dans la voix du dos de maillot,
la même que celle des titres de page à ceci près qu'ici elle clôt au lieu
d'ouvrir ; puis quatre colonnes sous leur filet rouge. Il porte trois
choses que le site n'avait nulle part où dire, faute de page « à propos » :

- **le plan du site**, les quatorze entrées à plat — les huit du menu
  « Explorer » comprises, que le Header cache derrière un bouton et
  qu'aucun robot ne suit ;
- **d'où viennent les données**, source par compétition et lien vers
  chacune — LNR, EPCR, Gallica. C'est le pendant général de la section
  « Sources et arbitrages » que `Provenance` pose au pied des fiches ;
- **l'étendue de la base, lue dans la base** — rencontres jouées,
  saisons, première et dernière —, avec la réserve de couverture. Ces
  chiffres bougent à chaque saison reprise : écrits en dur ils se
  périmeraient sans que rien ne le dise, comme le « 36 » des affluences
  sur la page des records. Ils passent par `unstable_cache`, une heure :
  le pied paraît sur les trente-six pages, et trois agrégats à chaque
  chargement pour trois nombres qui bougent d'un match par semaine
  seraient du gaspillage.

**Les mentions de droits sont là et pas ailleurs**, arbitré par Jérémy le
même jour : les écussons de club sont des marques déposées, les portraits
appartiennent à leurs auteurs. Le crédit de chaque photo reste sur la
fiche du joueur — CC BY-SA l'exige nommément —, le pied dit ce qu'une
fiche ne peut pas répéter. La phrase « site non officiel, sans lien avec
l'USAP » a été écartée du même mouvement : elle se posera à part, si elle
se pose.

**LES DEUX PAGES LÉGALES EXISTENT DEPUIS LE 14 SEPTEMBRE 2026**,
`/mentions-legales` et `/confidentialite`, liées depuis la colonne
« Mentions » du pied, en français et en catalan, avec leurs `hreflang` —
rendues par `PageLegale`, un titre et des sections dont tout le texte vient
du dictionnaire (`mentions.*`, `confidentialite.*`), chaque section donnant
son nombre de paragraphes plutôt que de sonder des clés. Ce que Jérémy a
donné : éditeur et directeur de la publication Jérémy Sardà, à titre
personnel et non professionnel, contact jeremsrd@gmail.com. L'hébergeur,
Vercel, est lu dans les en-têtes du site en production. La phrase « site
indépendant, sans lien avec l'USAP », écartée du pied le 10 septembre, est
là, dans les mentions.

**PAS DE BANDEAU COOKIES, ET C'EST UNE DÉCISION FONDÉE SUR UN CONSTAT** :
le site ne dépose aucun cookie sur ses pages publiques — vérifié dans le
code et sur les en-têtes de production —, n'a ni mesure d'audience ni
script tiers, et le thème est en `localStorage`, une préférence d'interface
exemptée. Le seul cookie est la session Supabase de l'administrateur, posée
à sa connexion, strictement nécessaire. Un bandeau affirmerait le contraire
de la réalité ; la politique de confidentialité dit en une phrase qu'il n'y
en a pas. **Le jour où une mesure d'audience entrerait**, le bandeau
devient dû, et la politique est à réviser — sa date est écrite dedans.

Ce que la politique dit des joueurs, et qui vaut d'être su : le site publie
des données personnelles — nom, naissance, taille, portrait — sur le
fondement de l'intérêt légitime et des traitements à des fins historiques
(articles 6.1.f et 89 du RGPD), depuis des sources publiques, et toute
personne concernée peut demander rectification, effacement ou opposition à
l'adresse de contact, réponse dans le mois.

**Et les deux-points sont dans le libellé, non dans le composant** :
« Championnat&nbsp;: LNR » en français, « Campionat: LNR » en catalan —
le français fait précéder les deux-points d'une espace insécable, le
catalan non. La ponctuation appartient à la langue, comme le pluriel.
