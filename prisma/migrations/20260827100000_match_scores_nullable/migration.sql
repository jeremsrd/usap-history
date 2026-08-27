-- Une rencontre à venir n'a ni score ni résultat : le calendrier d'une saison
-- entre en base avant que ses matchs ne se jouent. Un score nul se lit donc
-- « pas encore joué », et non « zéro point marqué ».
ALTER TABLE "matches" ALTER COLUMN "score_usap" DROP NOT NULL,
ALTER COLUMN "score_opponent" DROP NOT NULL,
ALTER COLUMN "result" DROP NOT NULL;
