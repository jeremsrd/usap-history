-- Le troisième état : d'où vient un fait, et ce qu'il vaut.
--
-- La base ne savait dire que « affirmé » ou `null`. Cette table dit
-- « probable, d'après telle source, tranché par telle personne », pour tout
-- modèle, par nom et identifiant, sans clé étrangère. L'absence de ligne se
-- lit « source officielle de la chaîne ».
--
-- Purement additive : aucune table existante n'est modifiée.
CREATE TYPE "DegreAttestation" AS ENUM ('OFFICIEL', 'CONCORDANT', 'PROBABLE', 'ARBITRE');

CREATE TABLE "attestations" (
    "id" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entite_id" TEXT NOT NULL,
    "champ" TEXT NOT NULL DEFAULT '',
    "degre" "DegreAttestation" NOT NULL,
    "source" TEXT NOT NULL,
    "source_url" TEXT,
    "note" TEXT,
    "decide_par" TEXT,
    "relu_par" TEXT,
    "relu_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attestations_entite_entite_id_champ_key" ON "attestations"("entite", "entite_id", "champ");

CREATE INDEX "attestations_entite_entite_id_idx" ON "attestations"("entite", "entite_id");
