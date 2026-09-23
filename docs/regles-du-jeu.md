# Règles du jeu : barèmes, bonus, remplacements

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

#### Et les règles du jeu changent, donc l'arithmétique aussi

**C'est le problème le plus grave des trois, et il attaque le seul juge qui
restait.** Soulevé par Jérémy le 2 septembre 2026 : avant, il n'y avait pas de
remplacements, les points ne valaient pas la même chose, et l'on pouvait
marquer d'un coup de pied tombé après une marque.

**`baremeDeMatch(seasonStartYear)` EXISTE DEPUIS LE 6 SEPTEMBRE 2026**, dans
`src/lib/scoring.ts`, pendant de `pointsScaleFor()` pour le classement, avec
`pointsDesRealisations()` pour faire la somme. Le barème était écrit en dur
à **neuf** endroits et non quatre — les quatre nommés ci-dessous, plus
`lib/feuilles.ts`, `lib/erc.ts`, `seed-cup-espn.ts` et la page des
réalisateurs —, et personne ne l'avait vu parce que la base ne remontait
pas avant 2004-2005. Tous appellent désormais la fonction :

| Où | Ce qui était écrit en dur | Ce qui l'appelle |
|---|---|---|
| `scripts/lib/lnr.ts`, `realisationsDepuisFaits` | essai +5, essai de pénalité +7, pénalité +3, drop +3 | `BAREME_LNR`, le barème de 2004 — l'archive de la LNR ne remonte pas plus haut, et c'est écrit là |
| `scripts/lib/feuilles.ts`, `completerRealisations` | 5, 2, 3, 3, 7 | le même, en paramètre |
| `scripts/lib/erc.ts` | 5, 2, 3, 3 par joueur | `BAREME_ERC`, le barème de 2007 |
| `scripts/seed-cup-espn.ts` | 5, 2, 3, 3, et `peutPorterQuatreEssais` | `baremeDeMatch(startYear)` de la campagne |
| `scripts/seed-opponent-sheet.ts` | `7 * essaisDePenalite`, `5 * essaisCollectifs` | `baremeDeMatch(saison.startYear)` |
| `scripts/seed-cup-sheet.ts` | `7 * essaisDePenalite` | `baremeDeMatch` de la saison du match |
| `src/app/admin/matchs/[id]/actions.ts` | `tries * 5 + conversions * 2 + …` | la saison du match, lue avant d'écrire |
| `src/app/[locale]/realisateurs/page.tsx` | `2 * transformations + 3 * (pénalités + drops)` | ligne à ligne, sous le barème de la saison de chaque feuille |
| `src/components/ScoreEvolution.tsx` | 5, 2, 3, 3, 7 | le barème de la saison, reçu en prop — découvert le jour où la finale de 1914 s'y est affichée en 12-8 |

Le barème porte aussi **l'essai de pénalité tel que la base le compte** —
essai plus transformation, sept aujourd'hui, cinq en 1925 —, pour que la
règle « la somme des joueurs égale le score » vaille à toute époque.

**Et il est vérifié au point près par *L'Auto* du 4 mai 1914** : « 8 points
(2 essais, 1 but) à 7 points (1 essai, 1 but sur coup tombé) » ne se
décompose que sous le barème de 1893-1948 — essai 3, transformation 2,
drop 4. `seed-match-gallica.ts` confronte chaque décomposition du journal
au barème de l'époque et le dit, ✓ ou ✗. Les garde-fous du site n'ont pas
bougé d'un point : `fix-bonus-points --dry` rend 0 correction, une feuille
de 2012 et une campagne de 2011-2012 se simulent sans une ligne à
modifier.

**Avant 1893-1894, la fonction lève** : les valeurs de 1886 et de 1891 sont
connues mais aucune rencontre de la base ne peut en relever, l'USAP étant
fondée en 1902, et un barème qu'on n'a pas vérifié ne s'écrit pas.

**Le barème, d'après la Wikipédia anglophone (« Laws of rugby union »), tel
que `baremeDeMatch` le porte à partir de 1893 — et recoupé, pour 1914, par
le journal lui-même :**

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
