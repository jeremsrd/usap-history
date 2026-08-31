-- Historique des terrains d'un club.
--
-- `opponents.venue_id` ne porte qu'un stade, celui d'aujourd'hui, et la
-- déduction du lieu d'un déplacement s'en trouve fausse dès qu'on remonte.
-- Cette table dit où un club recevait avant.
--
-- Purement additive : aucune table existante n'est modifiée.
CREATE TABLE "opponent_venues" (
    "id" TEXT NOT NULL,
    "opponent_id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "from_season" INTEGER,
    "until_season" INTEGER,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "opponent_venues_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "opponent_venues_opponent_id_idx" ON "opponent_venues"("opponent_id");

CREATE UNIQUE INDEX "opponent_venues_opponent_id_venue_id_from_season_key" ON "opponent_venues"("opponent_id", "venue_id", "from_season");

ALTER TABLE "opponent_venues" ADD CONSTRAINT "opponent_venues_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "opponents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "opponent_venues" ADD CONSTRAINT "opponent_venues_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
