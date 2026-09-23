# Journal — état du projet, reprises et limites connues (août-sept. 2026)

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

**SAUF EN 2005-2006 — SUR LES CINQUANTE-TROIS MATCHS DE COUPE D'EUROPE DE 2007-2008 À 2018-2019 VENUS D'ESPN ET DE L'ERC, cf. `seed-cup-espn.ts` — ET SUR LES DEUX FINALES DE 1914 ET 1925 VENUES DE *L'AUTO*, cf. `seed-match-gallica.ts` —, OÙ IL SE LIT « LA SOURCE NE LE DIT PAS ».** Sur ces deux finales, **`positionPlayed` et `shirtNumber` sont `null` pour la même raison** : il n'y avait pas de numéros, et le journal ne distingue ni l'ailier du centre, ni le pilier du talonneur — la ligne est en `notes`, et le poste n'est porté que là où la ligne le dit sans ambiguïté. La LNR n'y
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

**2026-2027 a joué ses trois premières journées** — Stade Français 28-26
USAP le 5 septembre 2026, bonus défensif, 12 065 spectateurs et mi-temps
6-28 ; USAP 43-29 Castres le 12 septembre, six essais dont deux de Yato,
14 232 spectateurs et mi-temps 24-15, arbitre Vincent Blasco-Baqué ;
Montpellier 50-13 USAP le 19 septembre, huit essais encaissés dont six en
seconde période, deux de Delibes et deux d'Anyanwu, 11 151 spectateurs et
mi-temps 3-12, arbitre Pierre Bru —, feuille des deux camps, chronologie,
affluence et mi-temps d'après *L'Indépendant*, par la marche du « lendemain
d'un match » ; 5 points au classement, le déplacement à Montpellier n'en
rapportant aucun. **Les compositions de la J3 n'étaient pas entrées la
veille**, et `seed-lineup.ts` les a créées le lendemain sans que la chaîne
en souffre : c'est le premier temps facultatif de la marche, pas une étape
sautée. Une transformation catalane de la 47ᵉ reste sans buteur dans la
chronologie, la feuille LNR ne le nommant pas — le journal la donne à
Aucagne, dont la ligne porte bien ses cinq. **Les trois ont leur résumé
vidéo** depuis le 21 septembre 2026, liens donnés par Jérémy et posés par
`set-video.ts`. **Et n'est qu'un calendrier pour le reste** :
ses 26 journées ont leur date, leur adversaire et leur terrain, sans score. Seules les premières ont un horaire —
la LNR ne cale les coups d'envoi qu'au fil des désignations télévisées et pose
d'ici là une date de référence, que `seed-calendrier-2026-2027.ts` rafraîchit
à chaque relance. **Et ses quatre matchs de poule de Challenge Cup** depuis le
5 septembre 2026 — Dragons à Newport, Zebre et Ulster à Aimé-Giral, Cheetahs à
Bloemfontein —, par `seed-calendrier-europe-2026-2027.ts` ; la phase finale
n'existe pas encore dans le flux. **L'arbitre de la première journée, Kévin
Bralley, vient de Jérémy** et non d'une feuille, par `set-arbitre.ts` : la LNR
ne désigne l'arbitre sur sa feuille qu'après le match.

**Le piège de la J2 ne s'est pas reproduit à la J3** : les quarante-six
dossards de la LNR concordent un à un avec ceux de *L'Indépendant*, et les
seize changements s'apparient tous. Il est donc occasionnel — ce qui se
vérifie feuille à feuille, et ne se présume pas.

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
pour l'écusson d'Auch ou les stades de Dax et de Massy.

**LES TROIS PREMIÈRES JOURNÉES DE 2026-2027 LE CORROBORENT, SANS LE
DÉMONTRER.** Ce fichier attendait sa première feuille de Top 14 ; il en a
trois, toujours au n°23, et il entre chaque fois **pour Pietro Ceccarelli, le
n°3** — 74ᵉ à Paris le 5 septembre, 64ᵉ contre Castres le 12, 58ᵉ à
Montpellier le 19. Jamais pour le n°1.

**La nuance vaut d'être tenue** : un dossard de 16 à 23 ne désigne aucune
place, c'est la règle du projet, et seul un dossard de titulaire trancherait.
Trois entrées du même côté sont une concordance, non une feuille : le poste
reste **tranché par Jérémy**, son attestation le dit, et un n°1 titulaire
vaudrait toujours correction. Relevé le 20 septembre 2026 sur les feuilles des
trois journées.

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
   point suivant. **Les totaux de minutes cités ci-dessous datent d'avant le
   6 septembre 2026** : depuis, un carton jaune retire dix minutes au joueur
   et à l'attendu de son équipe, et une feuille jaunie affiche donc dix de
   moins des deux côtés ; l'écart, lui, ne bouge pas. Trois ont été relus
   après la reprise et sont donnés à jour — Narbonne 2015, Albi 2016 et
   2017 :
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
   - **Albi totalise 1 190 minutes pour 1 164 attendues le 16 décembre 2016,
     et 1 202 pour 1 180 le 5 mars 2017.** Deux fois la même contradiction, et c'est celle de La Rochelle :
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
   - **l'USAP totalise 1 165 minutes pour 1 180 attendues à Narbonne le
     6 décembre 2015.** Encore
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
   - **la seconde source est l'ERC elle-même, par la Wayback Machine**, et
     elle vaut mieux qu'ESPN : c'est l'organisateur. Ses comptes rendus de
     2007-2008 et ses pages Match Centre de 2010 à 2013 sont archivés — cf.
     `lib/erc.ts`, et le chantier ouvert plus bas ;
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

   **Les Cavalieri Prato ont l'écusson du club d'alors depuis le 6 septembre
   2026.** Le club a fusionné en 2015 dans les Cavalieri Union Rugby Prato
   Sesto, une autre entité, et son domaine est parqué : afficher la marque
   d'aujourd'hui sur une rencontre de 2011 serait l'anachronisme évité pour
   Auch. Ce fichier a d'abord affirmé que Wikipédia n'illustrait pas le club
   d'alors, et c'était faux — l'article anglophone « Cavalieri Prato » le
   porte, 303 par 302, en JPEG sur fond blanc, marque déposée : le cas d'Auch
   trait pour trait. À une différence près, qui a permis de faire mieux :
   ici le blanc n'est pas dans le dessin, un anneau noir fermé cerne
   l'écusson, et `DETOURAGES` de `fetch-club-logos.ts` rend transparent le
   seul blanc extérieur par remplissage depuis les bords, sans jamais
   franchir le trait. Vérifié sur la planche, à 160 et à 64 pixels.

   « Rudi » Coetzee, centre catalan de 2011-2012, rejoint Manny Edmonds dans
   `NOMS_DUSAGE`.

   **2013-2014 ET 2018-2019 SONT LES CINQUIÈME ET SIXIÈME**, écrites le même
   jour. 2013-2014, Heineken Cup, poule 3, dernière avec 7 points — 1 V 5 D,
   112 marqués pour 158, un BO contre Édimbourg, deux BD —, la dernière
   campagne avant la relégation : six matchs, 276 lignes, Édimbourg en base
   avec Murrayfield, deux camps du Munster qui ne bouclent pas. 2018-2019,
   Challenge européen, poule 3, dernière avec 3 points — 0 V 1 N 5 D, 117
   pour 197, un seul BD, le nul de Chaban-Delmas —, la saison de la
   relégation : six matchs, 230 lignes, Sale en base avec l'AJ Bell Stadium,
   et Connacht enfin rattaché au Sportsground de Galway. Tous les camps de
   2018-2019 bouclent.

   **Trois choses apprises de ces deux-là.** ESPN **ne marque plus les
   titulaires en 2018-2019** — `starter` est faux pour les vingt-trois — et
   le dossard tranche alors, comme à l'EPCR, mais seulement quand aucune ligne
   de la feuille ne porte le drapeau ; il **ne libelle plus les tours** non
   plus, numérotés par la date quand toute la campagne en est dépourvue. Et
   deux de ses feuilles comptent **vingt-quatre noms dont deux sous le même
   numéro** — Connacht le 8 décembre 2018, un n°8 en double ; l'USAP le
   11 janvier 2019, un n°6 — sans dire lequel des deux hommes a joué :
   **une composition qui n'aligne pas quinze titulaires est écartée, elle
   seule**, la rencontre est écrite avec son score, ses compteurs et l'autre
   camp. Chez la LNR le match entier échouerait, mais ses deux compositions
   viennent d'une même page ; chez ESPN elles sont indépendantes, et les
   réalisations sont portées par le joueur, non par le dossard.

   Trois noms d'usage de plus dans `NOMS_DUSAGE`, tous catalans : « Sona »
   pour Faka'anaua Ki Alisona Taumalolo, « Tima » pour Lotima Faingaanuku, et
   « Boutemane », qui n'est pas un nom d'usage mais **une faute d'ESPN** sur
   Yassin Boutemmani, 69 feuilles LNR — le remède est le même, sans quoi
   chaque campagne lui refabriquerait une fiche.

   **Les colonnes d'essais de Wikipédia ne bloquent plus** : en 2012-2013
   elle compte cinq essais encaissés quand les trois feuilles adverses qui
   bouclent en donnent six, chacune arithmétiquement juste. L'écart se
   signale ; les points, les victoires et les bonus restent le garde-fou.

   **2012-2013 ET 2007-2008 SONT LES SEPTIÈME ET HUITIÈME**, écrites le même
   soir, et **les huit campagnes sont en base**. 2012-2013, Challenge
   européen, poule 1, **première** avec 25 points — 5 V 1 D, 293 marqués pour
   89, un 79-12 à Rovigo et un 90-12 contre Gernika, quatre BO —, quart gagné
   30-19 contre Toulouse et demi perdue 22-25 contre le Stade Français, tous
   deux à Aimé-Giral, arbitres et affluences d'après Wikipédia : huit matchs,
   368 lignes, Worcester, Rovigo et Gernika en base avec Sixways, le Stadio
   Mario Battaglini et l'Estadio Urbieta. 2007-2008, Heineken Cup, poule 1,
   **première** avec 22 points — 5 V 1 D, 171 pour 79, deux BO —, quart perdu
   9-20 chez London Irish au Madejski Stadium devant 16 048 personnes, Alain
   Rolland arbitre : sept matchs, 264 lignes, London Irish en base.

   **Ce qui a débloqué chacune.** Pour 2012-2013, l'arithmétique seule :
   trois camps catalans ne bouclent pas pour deux BO manquants, mais **21
   points ne peuvent pas contenir quatre essais** — vingt pour les essais, et
   aucune façon de marquer le point restant —, `peutPorterQuatreEssais()` le
   dit, et il ne reste que deux feuilles muettes pour deux bonus. Pour
   2007-2008, ESPN n'avait rien que les scores, et c'est **l'ERC par la
   Wayback Machine** qui a tout donné, cf. `lib/erc.ts` : six comptes rendus
   sur sept, douze camps qui bouclent au point près, capitaines, cartons, et
   l'essai de pénalité de London Irish du 9 décembre 2007 — cinq points sans
   auteur, comme en 2009, portés par `essaisSansAuteur`. La première
   journée, Perpignan-Dragons 23-19, **n'a pas de compte rendu archivé** —
   les pages 12_7397 à 12_7412 ont été lues une à une — et reste sans
   composition ni mi-temps : ESPN y écrit 0-0, qui veut dire « inconnu ».

   **La règle de l'ERC** : quand une rencontre a son compte rendu, ses
   compositions, ses réalisations et son affluence viennent de là et non
   d'ESPN, le score d'ESPN — validé par la poule — servant de contrôle. Une
   page a une adresse stable mais un contenu qui change, présentation
   d'avant-match puis compte rendu : l'instantané demandé doit être
   **postérieur** au match, et la table `erc` de `CAMPAGNES` porte les deux.

   **LE MATCH CENTRE EST LU, ET 2012-2013 EN EST REPRISE**, le 5 septembre
   2026 au soir. Six pages sur huit ont été retrouvées dans l'archive — une
   à une parmi les identifiants voisins de chaque journée, la page du club et
   celles des poules ne les liant plus, leurs liens étaient dynamiques :
   19178, 19383, 19944, 20166, 20340, et 20639 pour le quart, qui n'est
   archivé qu'en présentation d'avant-match. Le Worcester-Perpignan du
   6 décembre 2012 (19713) n'existe que dans cet état-là, et la demi-finale
   n'a aucune page archivée : ces deux-là restent à ESPN. Les six autres
   viennent de l'organisateur — compositions, réalisations, cartons, mi-temps,
   arbitres, affluences —, et **cinq portent une chronologie minutée**, 94
   événements qui finissent chacun sur le score, les premières de la base
   sur un match européen d'avant 2020. Le camp catalan du 40-22 contre
   Rovigo, muet chez ESPN, boucle désormais : six essais, cinq
   transformations.

   **Quatre règles sont nées de cette reprise**, toutes dans
   `seed-cup-espn.ts` :
   - **l'essai de pénalité se lit dans l'écart**, la page ne l'écrivant
     nulle part : cinq points sans auteur, comme avant 2017, et sa minute est
     celle d'une transformation que nul essai ne précède — deux
     transformations de David Mélé à la 58ᵉ pour un seul essai nommé, à
     Rovigo. Chaque essai n'absorbe qu'une transformation ;
   - **l'ERC écrit les surnoms, ESPN l'état civil** — « Goyo » Zabaloy,
     « Deccie » Cusack, « Kapu » Olaeta, « Pingui » Monje à Gernika —, et
     les deux feuilles décrivent le même match : au même dossard, sous un
     patronyme qui concorde, c'est le même homme, et il garde le prénom
     d'ESPN, qui est celui de la base. Sans cela chaque Basque aurait eu
     deux fiches ;
   - **le dossard d'ESPN prime quand le même homme y porte un autre
     numéro.** À Rovigo le 13 octobre 2012, le Match Centre permute trois
     paires entre le terrain et le banc — Batlle au 23 et Michel au 11,
     Jones et Tumiati, Calabrese et Duca — quand sa propre chronologie donne
     deux essais à Batlle dans la première demi-heure. La page de
     l'organisateur porte là l'équipe annoncée, ESPN l'équipe alignée ;
   - **une chronologie qui ne retombe pas sur le score n'est pas écrite.**

   Deux réserves. Les pages des deux premières journées ne marquent aucun
   capitaine, les quatre suivantes si : « aucun » s'y lit « la source ne le
   dit pas ». Et les minutes des joueurs restent à `null` : le Match Centre
   ne date que les réalisations, pas les changements.

   **2010-2011 ET 2011-2012 SONT REPRISES À LEUR TOUR**, le même soir. Les
   pages de 2010-2011 n'étaient pas là où on les attendait : ses quatre
   journées de décembre et janvier n'ont été archivées qu'en **juin 2012**,
   sous des identifiants qu'aucune fenêtre de dates ne désignait — c'est par
   **plage d'identifiants**, calée sur les pages datées voisines, qu'on les a
   retrouvées, et c'est ainsi qu'il faut chercher. Six pages sur huit :
   12889, 13285, 13406, 13536, 13623, 14168 ; la première journée aux
   Scarlets et la demi-finale de Milton Keynes n'ont que des pages sans
   composition. Cinq chronologies, 68 événements ; le camp catalan du 35-14
   contre Trévise, muet chez ESPN, boucle — cinq essais dont un de pénalité.
   Le quart contre Toulon garde sa composition de l'ERC mais **pas sa
   chronologie** : sa page ne porte que huit faits pour cinquante-quatre
   points, et le garde-fou l'a refusée. 2011-2012 n'a que deux pages sur
   six, 14966 et 16062 — ni Newport, ni les deux Prato, ni la réception des
   Dragons ne sont archivés —, une chronologie écrite, et celle du 15-12
   contre Exeter refusée : il y manque une pénalité de James Hook.

   **Deux règles de plus, apprises sur ces pages.** Un fait **anonyme suivi
   du même fait nommé** à la minute suivante est un doublon — une
   transformation sans nom à la 64ᵉ, puis « J Porical » à la 65ᵉ, pour un
   seul essai de pénalité à Trévise —, et la feuille des joueurs tranche.
   Et une transformation suit son essai d'une à **deux** minutes sur ces
   pages ; un essai de pénalité n'est daté à une transformation orpheline
   que si l'écart des points en réclame un, et jamais au-delà. Sans ces deux
   règles, deux chronologies justes finissaient à cinq et sept points
   au-dessus du score, et étaient refusées.

   Un n°8 des Scarlets diffère entre les deux sources le 23 janvier 2011 —
   David Lyons à l'ERC, Neil Paterson chez ESPN, deux hommes et non une
   permutation — et c'est l'organisateur qui est gardé. Le surnom qu'il
   glisse entre guillemets dans le nom d'un arbitre, « John Paul 'JP'
   Doyle », est retiré au découpage : la base porte John Paul Doyle.

   **Sur les trois saisons, 14 pages Match Centre sur 22 rencontres**, onze
   chronologies et 175 événements. Les rencontres sans page — la première et
   la demi-finale de 2010-2011, quatre de 2011-2012, deux de 2012-2013 —
   restent à ESPN, et rien ne les distingue en base d'une rencontre venue de
   l'organisateur : c'est le troisième état, « probable, d'après telle
   source », dont « Remonter avant 2006 » dit le manque.

   **Les trois écussons qui manquaient sont là depuis le 6 septembre 2026**,
   chacun de sa source, toutes dans `SOURCES_HORS_LNR` avec leur raison :
   Rovigo par le **SVG de son site officiel** — même entité et même marque
   qu'en 2012-2013, l'écusson portant 1935 et 2010, et la version que
   Wikipédia date de 2013 est identique ; le script sait désormais rendre un
   SVG en PNG, `next/image` ne servant pas les SVG. Gernika par **Wikipédia**,
   parce que le site du club n'affiche plus qu'un logo générique de 2024, un
   bandeau vert sans rapport avec l'écusson rond porté en 2013 — la réserve
   d'Auch, marque déposée, 315 pixels. Et les Cavalieri Prato par Wikipédia
   aussi, détourés, cf. 2011-2012 plus haut. Plus aucun adversaire n'est sans
   écusson. « Yoann » Vivalda, deux lettres
   d'écart avec le « Yohan » de la LNR, rejoint `NOMS_DUSAGE` ; et trois
   paires de frères — Thomas, Sidoli, Olaeta —, chacun nommé par sa propre
   feuille, sont entrées dans `DISTINCTS`.
3. **Le fond** : affluences (36 matchs sur 573 joués), les 137 fiches joueur
   que Wikipédia ne documente pas, les quinze joueurs sans portrait — treize
   anciens et deux recrues que la LNR n'a pas encore photographiées, cf.
   « Photos des joueurs » —, et les saisons sans aucun match.

4. **L'avant-guerre, quand Jérémy le décidera.** La chaîne existe et a
   servi deux fois : `seed-match-gallica.ts --match=AAAA-MM-JJ --dry` sur le
   numéro du lendemain, découpe de l'image par IIIF aux coordonnées de
   l'ALTO, relecture à l'œil confrontée aux XV de Wikipédia, graphies
   soumises à Jérémy, écriture avec attestations. Ce qui attend, dans
   l'ordre où c'est accessible : **la finale de 1921** — deux XV lisibles
   sur l'image sans doute, l'OCR seul ne l'étant pas — ; **la finale de
   1938**, dont la page des équipes est illisible à l'OCR et devra être lue
   entièrement sur l'image ; **1944**, hors de Gallica ; puis les
   demi-finales et finales perdues, dont Wikipédia donne les dates. Les
   postes des trois-quarts, troisièmes lignes et piliers des XV écrits
   resteront vides tant qu'une source ne les distingue pas.

Sur les 120 saisons en base, 24 portent des matchs — 22 saisons entières
de 2004-2005 à 2025-2026, et les deux finales de 1914 et de 1925, seules
rencontres d'avant 2004 : c'est le chantier de la phase 4, mené en
remontant le temps saison par saison. Le bilan
de 2021-2022 — 9V 0N 17D, 43 points, treizième — est calculé depuis les scores
officiels mais n'a pas été confronté à un classement d'époque ; ceux de
2020-2021, 2019-2020 et 2018-2019 l'ont été, et leurs scripts refusent
d'écrire les agrégats s'ils s'en écartent.

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

  **Il y avait pourtant une vraie erreur d'hydratation, trouvée le
  6 septembre 2026 sur la finale de 1914** — et elle n'avait rien de
  `next-themes` : les `<title>` des points du graphe `ScoreEvolution`
  étaient écrits en plusieurs enfants JSX, `{minute}&apos; — {label}…`, et
  **React 19 sert vide un `<title>` à plusieurs enfants** — le serveur
  rendait `<title></title>`, le client le texte, et l'arbre était refait.
  Une seule chaîne par `<title>` règle le cas. Le diagnostic est venu de
  l'overlay de Next, ouvert par son bouton « Issue » et lu dans son shadow
  DOM : il donne l'arbre jusqu'au nœud fautif, `<circle> <title> + 66`.

  **Pour le reste, il n'y a rien à corriger dans le code.** Retirer `enableSystem`
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

  **ET UNE RÉCEPTION PEUT ÊTRE DÉLOCALISÉE, SANS QUE RIEN NE LE DISE.**
  L'USAP a reçu trois fois au stade olympique de Montjuïc, à Barcelone, et une
  seule était en base — le quart de finale de Heineken Cup du 9 avril 2011
  contre Toulon, posé pour son affiche. Les deux autres sont des rencontres de
  championnat, et une réception délocalisée reste une réception : la déduction
  par le camp les plaçait à Aimé-Giral, en silence, comme elle plaçait la
  finale de Pro D2 2018 chez le recevant désigné. **Signalé par Jérémy le
  9 septembre 2026**, et corrigé par `fix-matchs-barcelone.ts` :

  |  | Rencontre | Affluence |
  |---|---|---|
  | 15/09/2012 | J5, Perpignan 34-20 Toulouse | ~23 000 |
  | 19/04/2014 | J25, Perpignan 31-46 Toulon | ~24 000 |

  Trois sources concordantes, dont deux nomment les trois délocalisations
  ensemble et redonnent les scores déjà en base : Wikipédia, « Stade olympique
  Lluís-Companys » ; RugbyPass, qui liste les trois précédents avec leurs
  scores et leurs affluences ; France 3 Occitanie du 19 avril 2014, qui annonce
  « la troisième délocalisation » — ce qui borne la liste autant qu'il la
  confirme. ESPN nomme Montjuïc sur celle de 2014 également.

  **Les affluences ne sont pas écrites**, et c'est délibéré : la source ne les
  donne qu'en ordre de grandeur, quand la colonne porte ailleurs des comptes à
  l'unité — 12 065 à Jean-Bouin. Elles vivent dans l'attestation, où
  l'approximation se lit. `isNeutralVenue` reste à `false` : l'USAP y est bien
  recevante.

  **Ce qu'il faut en retenir pour la suite.** Un stade juste ne se démontre par
  aucun contrôle interne — les scores, les minutes et les points retombent
  quel que soit le lieu écrit. Devant une affiche qui a pu remplir plus grand
  qu'Aimé-Giral, aller voir plutôt que déduire.

  **UN STADE EST UNE LIGNE ET UN NOM, CELUI D'AUJOURD'HUI.** Le modèle ne date
  aucun nom de terrain, et la base le montre d'elle-même : Castres y figure
  sous « Stade Pierre Fabre », son nom courant, et non sous Pierre-Antoine.
  Deux clubs ont ainsi **changé de nom sans déménager** — Montpellier
  (Yves-du-Manoir → Altrad Stadium → GGL Stadium → Septeo Stadium) et Castres
  (Pierre-Antoine → Pierre-Fabre) —, et cela ne relève pas d'`OpponentVenue`,
  qui ne décrit que les déménagements.

  **Le nom est donc rétroactif, et c'est assumé** : une rencontre jouée là en
  2012 porte le nom de 2026. C'est l'inverse de ce que le projet fait
  ailleurs — l'écusson d'Auch, les terrains de Dax —, et la raison est qu'un
  nom daté exigerait ses dates : elles ne sont publiées nulle part de sûr, et
  Jérémy ne les a pas. Une table de noms datés serait le bon modèle le jour
  où les dates existeraient ; sans elles, elle n'écrirait que des suppositions.

  **Montpellier est en retard d'un nom au 20 septembre 2026** : sa ligne porte
  encore « GGL Stadium » quand *L'Indépendant* écrit « Septeo Stadium » sur le
  Montpellier-USAP du 19 septembre. La convention étant le nom courant, la
  ligne est à reprendre par l'admin — Jérémy ne sait pas depuis quand le
  terrain a changé de nom, **et cela n'empêche rien**, puisque le modèle ne
  date aucun nom. **Un renommage ne casse pas la fiche**, le slug portant le
  CUID par lequel la page retrouve le stade ; il laisse seulement l'ancien
  libellé dans l'URL jusqu'à ce que `generateVenueSlug` soit réappliqué.

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

  **Quatre lieux de 2017-2018 et deux de 2016-2017 viennent de Jérémy** —
  et la table `attestations` le dit désormais sur chaque fiche de club —,
  et d'aucune source lue par machine : le stade de la finale, où il était, les
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

  **Les 70 stades ont un pays depuis le 7 septembre 2026.** Cinquante-quatre
  n'en avaient pas, dont tous ceux de France hors Aimé-Giral, et la page des
  stades les rangeait sous « Pays inconnu » : aucun script de stade n'écrivait
  `countryId`. Il n'y avait rien à chercher — le club qui y reçoit a un pays
  en base, et les quatre terrains neutres se situent par leur ville —, et
  `fix-venue-countries.ts` le recopie. Il a fusionné au passage deux doublons
  que rien ne signalait : « Murrayfield », créé par `seed-challenge-2022-2023`
  pour le Glasgow-USAP de 2022, à côté du « Murrayfield Stadium » de
  `seed-cup-espn` pour l'Edinburgh-USAP de 2014 ; et le « Stade Olympique de
  Montjuïc » du `seed.ts` initial, sans match, à côté de l'« Estadi Olímpic
  Lluís Companys » du quart de 2011. Les deux scripts d'origine cherchent
  désormais le nom conservé, sans quoi une relance recréerait le doublon —
  c'est le sinistre déjà connu des joueurs. **Un script qui crée un stade
  doit lui donner son pays**, et chercher le stade par le nom que la base
  porte déjà.

  Deux clubs n'ont toujours pas de terrain rattaché : Cardiff et les Lions,
  que l'USAP n'a reçus qu'à Aimé-Giral. Sans déplacement là-bas, rien ne
  permet de le déduire — mais aucun match n'en souffre, ces deux-là n'ayant
  jamais reçu l'USAP. Connacht en était un troisième jusqu'au 5 septembre
  2026, où le Galway-Perpignan du 8 décembre 2018 lui a valu le Sportsground. **Les Dragons en avaient un quatrième jusqu'au
  5 septembre 2026** : l'USAP va à Newport le 16 octobre, et Rodney Parade a
  été posé à la main, comme Ravenhill pour l'Ulster reçu le 10 janvier — deux
  terrains d'aujourd'hui d'après Wikipédia, avec la réserve habituelle sur
  l'époque, cf. `seed-calendrier-europe-2026-2027.ts`. Welford Road, pour le
  Leicester-Perpignan du 6 décembre 2008, Thomond Park et Franklin's Gardens
  pour les déplacements de 2009-2010, Parc y Scarlets pour celui de 2010-2011,
  Sandy Park et le Stadio Lungobisenzio pour ceux de 2011-2012, Murrayfield
  pour 2013-2014, l'AJ Bell Stadium et le Sportsground pour 2018-2019, le
  Madejski Stadium pour 2007-2008, Sixways, le Stadio Mario Battaglini et
  l'Estadio Urbieta pour 2012-2013, viennent de la même source par
  `seed-cup-espn.ts` — et ses deux terrains
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
  des coupes. **Soixante-treize matchs joués n'ont pas d'arbitre** au
  7 septembre 2026 — vingt-trois de championnat, huit en 2005-2006, quatre en
  2006-2007, quatre en 2007-2008, cinq en 2008-2009, deux en 2010-2011, la LNR
  n'en publiant pas les officiels ; quatorze en 2004-2005, où elle n'en publie
  pas davantage ; et trente-six rencontres européennes de 2007-2008 à
  2018-2019, ESPN ne donnant jamais l'arbitre et l'ERC seulement sur ses
  pages Match Centre. C'est une lacune qui s'aggrave en remontant, et la
  liste des arbitres en donne le compte, lu dans la base. **80 fiches sur
  382 sont illustrées** — dont 48 des 50 joueurs de l'effectif, cf.
  « Photos des joueurs ».

  **Et un arbitre posé peut être faux, sans que rien ne le signale.** Le
  9 septembre 2026, Jérémy a relevé Christophe Berdos sur le Perpignan-Bristol
  du 9 décembre 2022 : Berdos a sifflé son dernier match professionnel le
  16 mai 2015, atteint par la limite d'âge. La même poule de Challenge portait
  Evan Urruzmendi, arbitre français, sur le Perpignan-Glasgow du 14 janvier
  2023 — l'EPCR ne désigne pas un arbitre français sur un club français. Les
  deux noms ne venaient d'aucun script : une saisie à la main, d'avant les
  attestations. Chris Busby et Craig Evans les remplacent, d'après Wikipédia
  et les désignations de rugbyreferee.net, concordantes, par
  `fix-arbitres-challenge-2022-2023.ts`. Deux signaux à connaître, faute de
  feuille officielle sur ces quatre matchs : un écart de sept ans ou plus
  entre deux rencontres d'une même fiche d'arbitre — Berdos était le seul de
  toute la base —, et un arbitre français sur un match européen de l'USAP.

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

  **ET LE PIÈGE DU FRÈRE SE REFERME AUSSI DANS LE CAMP CATALAN**, où aucun
  audit ne passe. Quatre feuilles de 2025-2026 donnaient **Sacha Lotrian**
  sous le maillot de l'USAP — n°16 contre Benetton et Newcastle, n°16 à Pau,
  n°2 au Stade Français — alors qu'il est à **Clermont depuis 2024**. Ce sont
  les feuilles de son frère **Mathys**, talonneur du club. Les quatre sources
  officielles le disent sans exception, et l'EPCR par le **dossard**, donc
  sans appariement de noms : identifiant Opta 251178, « Mathys Lotrian ».
  Corrigé par `reassign-match-player.ts` sur les quatre dossards, le
  22 septembre 2026.

  **Deux signaux le trahissaient, et aucun contrôle ne les lit.** Le premier
  est le **poste** : ces quatre lignes portent `TALONNEUR` quand la fiche de
  Sacha est `PILIER_GAUCHE` — un poste qui détonne, comme le pilier aligné
  en centre de Carlu Johann Sadie. Le second est plus fort encore : le
  20 décembre 2025, Sacha figure **dans le camp adverse** de Clermont, n°17.
  Un homme ne joue pas des deux côtés dans la même saison, et la base le
  disait en toutes lettres à qui regardait les deux listes ensemble.

  **`audit-opponent-lineups.ts` ne pouvait rien voir : il n'examinait que
  l'adversaire.** C'est la même lacune qui avait laissé quatre saisons sans
  `--usap`, et c'est de là que venaient les erreurs qui durent. Celle-ci a
  été relevée par Jérémy, en lisant une liste de joueurs sans portrait.

  **LE CAMP CATALAN A SON AUDIT DEPUIS LE 23 SEPTEMBRE 2026**, à la demande
  de Jérémy, et c'est l'option `--usap` du même script. Le chiffre qui le
  justifiait : **14 666 lignes adverses relues, 14 692 lignes catalanes
  jamais** — la moitié de la table, et celle qui porte les fiches joueur,
  les centurions, les réalisateurs et les records.

  **Il ne coûte aucune requête de plus**, et c'est pourquoi il vit dans ce
  script plutôt que dans un autre : la page `/compositions` de la LNR porte
  les vingt-trois de chaque camp, le script la téléchargeait déjà en entier
  et en jetait la moitié. Mesuré sur 2025-2026 — 44 s pour le seul camp
  adverse, 33 s pour les deux, le surcoût est dans le bruit de mesure.

  **Son premier passage a rendu ce qu'on pouvait en espérer** : le camp
  catalan est conforme, et ses anomalies sont des variantes d'écriture
  répétées sur *toutes* les feuilles d'un même homme — treize fois « Jamie
  Ritchie » pour « James Thomas Ritchie », quatorze fois « Mathieu Ugena »
  pour « Matthieu ». C'est la signature d'une variante et non d'une erreur :
  **une faute de saisie se fait une fois**. Deux sont entrées dans
  `VARIANTES_DAFFICHAGE` ; **la troisième n'était pas une variante mais un
  doublon** — « Jean-Pascal Baraque », deux feuilles, doublait « Jean-Pascal
  Barraqué », dix-huit feuilles, Biarritz puis Clermont puis l'USAP. Fusionné
  le 23 septembre 2026.

  **ET LE CHEMIN POUR Y ARRIVER A COÛTÉ UN DOUBLON DE PLUS, PAR L'ERREUR QUE
  CE FICHIER DOCUMENTE DEPUIS LE DÉBUT.** La fiche a d'abord été *renommée*
  « Barraque », sur la foi d'une recherche `lastName contains "araque"` qui
  n'avait rendu qu'une fiche : un `contains` SQL est **littéral**, et
  « Barraqué » ne contient pas « araque », l'accent final étant un autre
  caractère. C'est mot pour mot l'accident déjà consigné — « un filtre SQL
  `lastName equals` ne suffit pas, il rate Bécognée vs Becognee ; construire
  un index en mémoire et chercher dedans ». `detect-duplicate-players.ts`
  l'a sorti en CERTAIN au passage suivant, ce qui est exactement son office.

  Le renommage était faux deux fois, car il perdait aussi l'accent — et
  **la LNR ampute les accents**, sa feuille écrivant « Barraque » pour cette
  seule raison. Avant de corriger une orthographe d'après une feuille
  officielle, se demander laquelle de ses amputations connues on est en
  train de recopier : accents, apostrophes, ponctuation. Ce qu'elle
  n'ampute pas — une consonne doublée, une voyelle en trop — reste, lui,
  un vrai écart à trancher.

  **Et il porte un contrôle qui ne dépend d'aucune source** : les **camps
  entrelacés**. Un homme ne joue pas des deux côtés en alternance. Le
  critère n'est pas « deux camps la même saison » — le mercato le fait
  légitimement quatre fois dans la base, Chiocci et Lyon en 2021, Gray et
  l'UBB en 2025 — mais le **nombre de bascules** : un transfert en fait une,
  ses feuilles se rangeant en deux blocs ; deux ou plus, c'est un
  entrelacement, et cela n'arrive pas. Sacha Lotrian en avait deux.

  Ce contrôle-là confronte la base à elle-même, pas à une source : il tourne
  toujours, et couvre donc **les coupes d'Europe** et les rencontres dont la
  LNR ne publie aucune composition — deux des quatre feuilles de Lotrian
  étaient européennes, hors de portée de l'audit des feuilles.

  **ET LE BALAYAGE DES VINGT-TROIS SAISONS A TROUVÉ LE CAS INVERSE**, le
  26 août 2023 à Clermont : la feuille LNR donne « Mathys Lotrian » au n°17
  catalan quand c'est **Sacha** qui joue, et cette fois c'est la base qui dit
  vrai. Trois choses le montrent, et la première est celle que Jérémy a
  relevée : **le n°17 est le dossard du pilier gauche remplaçant**, or Sacha
  est pilier gauche et Mathys talonneur — le n°16 de cette même feuille est
  déjà Victor Montgaillard. La feuille de la J1, une semaine plus tôt, donne
  Sacha au n°17 : le banc n'a pas changé de pilier entre deux journées. Et
  Mathys, né en 2004, n'a alors aucune feuille professionnelle, la première
  étant de janvier 2025.

  **La LNR ne se trompe donc pas seulement de nom : elle pointe la fiche du
  frère**, `/joueur/1967-mathys-lotrian`, ce qui rend l'erreur invisible à
  qui se fierait à son identifiant. Sur les deux frères, chaque source s'est
  trompée une fois et dans un sens opposé — **un identifiant stable n'est
  pas une preuve d'identité**, c'est une preuve de constance.

  L'anomalie est tue par `COMPOSITIONS_ARBITREES`, qui accepte depuis ce
  jour-là un **dossard** : seule la ligne du n°17 est écartée, les
  vingt-deux autres restent confrontées. Taire la composition entière pour
  un homme aurait été le remède pire que le mal.

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

  **Un douzième l'est depuis le 6 septembre 2026 : Tanginoa Halaifonua.** Le
  détecteur le sortait en FORT après les campagnes ESPN — même patronyme, même
  club, même n°6, jamais sur une même feuille —, mais la paire ne venait pas
  d'ESPN : « Tanginoa Halaifonua », cinq feuilles du Stade Français de 2024 à
  2026, et « Tanginoa Palu Halaifonua », quatre feuilles de Grenoble de 2020 à
  2023 — deux écritures de la LNR du même deuxième ligne tongien, le second
  prénom en plus à Grenoble. Les neuf feuilles se suivent sans se chevaucher,
  les dossards vont de 4 à 6 et de 18 à 19 : un seul homme, un seul poste.
  Fusion sous le nom court, **poste de référence `DEUXIEME_LIGNE` sur
  arbitrage de Jérémy** — la fiche conservée portait `NUMERO_HUIT`, qu'aucune
  de ses feuilles ne justifiait, et une ligne de banc l'avait hérité. Inscrit
  dans `VARIANTES_DAFFICHAGE`.

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
