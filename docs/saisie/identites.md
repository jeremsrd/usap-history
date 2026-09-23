# Joueurs adverses et identités

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
