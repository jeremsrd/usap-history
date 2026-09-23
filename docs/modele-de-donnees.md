# Modèle de données — ce que les champs veulent dire

`prisma/schema.prisma` fait foi pour la structure. Ce fichier dit le **sens**,
que le schéma ne porte pas.

## Ce qu'un `null` veut dire

| Champ | `null` se lit |
|---|---|
| `Match.scoreUsap`, `scoreOpponent`, `result` | pas encore joué — jamais « zéro ». Filtrer sur `MATCH_JOUE`, garde de type `estJoue()` |
| `Match.triesUsap` et les autres compteurs | la source ne le dit pas ; `fix-bonus-points` laisse alors le bonus offensif en l'état |
| `Match.penaltyTriesUsap/Opponent` | idem — une garde `points <> score - 7 * penaltyTries` ne compare rien sur un `null` : le traiter explicitement |
| `MatchPlayer.minutesPlayed` | remplaçant non entré ; **sauf** saisons ou matchs sans changements publiés (2005-2006, coupes d'Europe venues d'ESPN/ERC, presse d'avant-guerre) : « la source ne le dit pas » |
| `MatchPlayer.subOut` | resté sur le terrain jusqu'au bout (la fin du match n'est pas une sortie) |
| `MatchPlayer.shirtNumber`, `positionPlayed` | inconnu (rencontres d'avant-guerre, sans numéros) |
| `MatchEvent.playerId` | non rattaché ; la page affiche `description`, qui nomme le joueur |
| capitaine absent d'une composition | la source ne le dit pas, non « personne ne l'était » |

## Joueurs

- `players` est aux neuf dixièmes des adversaires : filtrer par
  `MatchPlayer.isOpponent` ; la liste publique passe par `usapCondition`
  (un match sous le maillot, un passage, une carrière USAP ou une ligne d'effectif).
- `isActive` = « dans l'effectif professionnel aujourd'hui » (la LNR ignore les
  espoirs). `SeasonPlayer` = « a fait partie de cet effectif » ; ne se retire jamais.
- `Player.position` = poste de référence, **repli de toutes les lignes de
  remplaçant** : un poste faux se propage. `positionPlayed` d'un titulaire se
  déduit du numéro de maillot.
- `CareerClub` et `PlayerStint` sont **déduits des feuilles** (`seed-carrieres.ts`),
  pas sourcés. `PlayerInternational` et `PlayerAward` viennent de Wikipédia.
- Une fiche sans match n'est pas orpheline si elle porte des données personnelles
  ou `isActive` (`delete-orphan-players.ts`).

## Rencontres

- Un match **couperet** n'a pas de `matchday` et un `round` qui ne commence pas
  par « Poule » (`estCouperet()`) : pas de bonus, bloc à part sur la page de saison.
- Le stade se déduit du camp (`terrainDuMatch()` de `scripts/lib/stades.ts`) :
  `OpponentVenue` pour les déménagements, `TERRAINS_PARTICULIERS` pour les
  terrains neutres et délocalisations. Un stade porte son **nom courant**.
- Agrégats de `Season` : championnat seul, phase régulière, confrontés au
  classement officiel avant écriture.

## Provenance

`Attestation` (entité, champ, degré `OFFICIEL`/`CONCORDANT`/`PROBABLE`/`ARBITRE`,
source, qui a tranché, qui a relu). Pas de ligne = feuille officielle de la chaîne.
Affichée par `Provenance` au pied des fiches.
