-- La photo officielle de l'équipe d'une saison, et son crédit.
--
-- Demandé par Jérémy le 21 septembre 2026, pour la page de chaque saison :
-- une photo pour l'instant, deux colonnes suffisent. Le jour où il en
-- faudra plusieurs, ce sera une table `season_photos`, et ces deux colonnes
-- y migreront.
--
-- Purement additive : aucune ligne existante n'est modifiée.
ALTER TABLE "seasons" ADD COLUMN "photo_url" TEXT;
ALTER TABLE "seasons" ADD COLUMN "photo_credit" TEXT;
