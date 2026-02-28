-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "Continent" AS ENUM ('EUROPE', 'AFRIQUE', 'AMERIQUE_NORD', 'AMERIQUE_SUD', 'ASIE', 'OCEANIE');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('RECRUTEMENT', 'FORMATION', 'PRET_ENTRANT', 'PRET_SORTANT', 'FIN_CONTRAT', 'RETRAITE', 'RESILIATION', 'RETOUR_PRET', 'PIGISTE', 'ECHANGE');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('PILIER_GAUCHE', 'TALONNEUR', 'PILIER_DROIT', 'DEUXIEME_LIGNE', 'TROISIEME_LIGNE_AILE', 'NUMERO_HUIT', 'DEMI_DE_MELEE', 'DEMI_OUVERTURE', 'AILIER', 'CENTRE', 'ARRIERE');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('CHAMPIONNAT_1ERE_SERIE', 'CHAMPIONNAT_EXCELLENCE', 'GROUPE_A', 'PREMIERE_DIVISION', 'TOP_16', 'TOP_14', 'PRO_D2');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('CHAMPIONNAT', 'COUPE_EUROPE', 'CHALLENGE_EUROPE', 'COUPE_FRANCE', 'AMICAL', 'BARRAGES');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('VICTOIRE', 'DEFAITE', 'NUL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ESSAI', 'TRANSFORMATION', 'PENALITE', 'DROP', 'ESSAI_PENALITE', 'CARTON_JAUNE', 'CARTON_ROUGE', 'REMPLACEMENT_ENTREE', 'REMPLACEMENT_SORTIE');

-- CreateEnum
CREATE TYPE "TrophyType" AS ENUM ('CHAMPION', 'FINALISTE', 'DEMI_FINALISTE', 'QUART_FINALISTE', 'VAINQUEUR_COUPE', 'FINALISTE_COUPE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "flag_url" TEXT,
    "continent" "Continent",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "national_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "short_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "national_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_internationals" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "national_team_id" TEXT NOT NULL,
    "total_caps" INTEGER NOT NULL DEFAULT 0,
    "first_cap_date" TIMESTAMP(3),
    "last_cap_date" TIMESTAMP(3),
    "total_points" INTEGER,
    "total_tries" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_internationals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opponents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "official_name" TEXT,
    "city" TEXT,
    "country_id" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "stadium_name" TEXT,
    "founded_year" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "total_matches" INTEGER DEFAULT 0,
    "total_wins" INTEGER DEFAULT 0,
    "total_draws" INTEGER DEFAULT 0,
    "total_losses" INTEGER DEFAULT 0,
    "total_points_for" INTEGER DEFAULT 0,
    "total_points_against" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opponents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opponent_aliases" (
    "id" TEXT NOT NULL,
    "opponent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "used_from" INTEGER,
    "used_until" INTEGER,

    CONSTRAINT "opponent_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "death_date" TIMESTAMP(3),
    "birth_place" TEXT,
    "birth_country_id" TEXT,
    "nationality_id" TEXT,
    "position" "Position",
    "height" INTEGER,
    "weight" INTEGER,
    "photo_url" TEXT,
    "biography" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_clubs" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "club_name" TEXT NOT NULL,
    "opponent_id" TEXT,
    "is_usap" BOOLEAN NOT NULL DEFAULT false,
    "country_id" TEXT,
    "city" TEXT,
    "division" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "transfer_type" "TransferType",
    "transfer_fee" TEXT,
    "is_loan" BOOLEAN NOT NULL DEFAULT false,
    "loan_from_club" TEXT,
    "appearances" INTEGER,
    "tries" INTEGER,
    "total_points" INTEGER,
    "position" "Position",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_stints" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "arrival_date" TIMESTAMP(3),
    "departure_date" TIMESTAMP(3),
    "arrival_type" "TransferType",
    "departure_type" "TransferType",
    "transfer_fee" TEXT,
    "career_club_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_stints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_awards" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "year" INTEGER NOT NULL,
    "season_label" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "final_ranking" INTEGER,
    "promoted" BOOLEAN NOT NULL DEFAULT false,
    "relegated" BOOLEAN NOT NULL DEFAULT false,
    "champion" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "matches_played" INTEGER,
    "wins" INTEGER,
    "draws" INTEGER,
    "losses" INTEGER,
    "points_for" INTEGER,
    "points_against" INTEGER,
    "bonus_offensif" INTEGER,
    "bonus_defensif" INTEGER,
    "total_points" INTEGER,
    "coach_id" TEXT,
    "president_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "type" "CompetitionType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kickoff_time" TEXT,
    "season_id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "matchday" INTEGER,
    "round" TEXT,
    "leg" INTEGER,
    "is_home" BOOLEAN NOT NULL,
    "venue_id" TEXT,
    "is_neutral_venue" BOOLEAN NOT NULL DEFAULT false,
    "opponent_id" TEXT NOT NULL,
    "score_usap" INTEGER NOT NULL,
    "score_opponent" INTEGER NOT NULL,
    "half_time_usap" INTEGER,
    "half_time_opponent" INTEGER,
    "result" "MatchResult" NOT NULL,
    "bonus_offensif" BOOLEAN NOT NULL DEFAULT false,
    "bonus_defensif" BOOLEAN NOT NULL DEFAULT false,
    "referee_id" TEXT,
    "attendance" INTEGER,
    "report" TEXT,
    "man_of_the_match" TEXT,
    "tries_usap" INTEGER,
    "conversions_usap" INTEGER,
    "penalties_usap" INTEGER,
    "drop_goals_usap" INTEGER,
    "penalty_tries_usap" INTEGER,
    "tries_opponent" INTEGER,
    "conversions_opponent" INTEGER,
    "penalties_opponent" INTEGER,
    "drop_goals_opponent" INTEGER,
    "penalty_tries_opponent" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_events" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "type" "EventType" NOT NULL,
    "player_id" TEXT,
    "is_usap" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "related_player_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "shirt_number" INTEGER,
    "is_starter" BOOLEAN NOT NULL,
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "position_played" "Position",
    "minutes_played" INTEGER,
    "sub_in" INTEGER,
    "sub_out" INTEGER,
    "tries" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "penalties" INTEGER NOT NULL DEFAULT 0,
    "drop_goals" INTEGER NOT NULL DEFAULT 0,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "yellow_card" BOOLEAN NOT NULL DEFAULT false,
    "yellow_card_min" INTEGER,
    "red_card" BOOLEAN NOT NULL DEFAULT false,
    "red_card_min" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_players" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "shirt_number" INTEGER,
    "position" "Position",
    "is_loan" BOOLEAN NOT NULL DEFAULT false,
    "loan_from" TEXT,
    "loan_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referees" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trophies" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "competition" TEXT NOT NULL,
    "achievement" "TrophyType" NOT NULL,
    "opponent" TEXT,
    "score" TEXT,
    "venue" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trophies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country_id" TEXT,
    "capacity" INTEGER,
    "year_opened" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_home_ground" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaches" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT,
    "photo_url" TEXT,
    "biography" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presidents" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "start_year" INTEGER,
    "end_year" INTEGER,
    "photo_url" TEXT,
    "biography" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "national_teams_name_key" ON "national_teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "player_internationals_player_id_national_team_id_key" ON "player_internationals"("player_id", "national_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "opponents_name_key" ON "opponents"("name");

-- CreateIndex
CREATE INDEX "players_last_name_first_name_idx" ON "players"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "career_clubs_player_id_idx" ON "career_clubs"("player_id");

-- CreateIndex
CREATE INDEX "career_clubs_opponent_id_idx" ON "career_clubs"("opponent_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_stints_career_club_id_key" ON "player_stints"("career_club_id");

-- CreateIndex
CREATE INDEX "player_stints_player_id_idx" ON "player_stints"("player_id");

-- CreateIndex
CREATE INDEX "player_awards_player_id_idx" ON "player_awards"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_start_year_end_year_key" ON "seasons"("start_year", "end_year");

-- CreateIndex
CREATE INDEX "matches_date_idx" ON "matches"("date");

-- CreateIndex
CREATE INDEX "matches_season_id_idx" ON "matches"("season_id");

-- CreateIndex
CREATE INDEX "matches_opponent_id_idx" ON "matches"("opponent_id");

-- CreateIndex
CREATE INDEX "matches_competition_id_idx" ON "matches"("competition_id");

-- CreateIndex
CREATE INDEX "match_events_match_id_idx" ON "match_events"("match_id");

-- CreateIndex
CREATE INDEX "match_players_player_id_idx" ON "match_players"("player_id");

-- CreateIndex
CREATE INDEX "match_players_match_id_idx" ON "match_players"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_match_id_player_id_key" ON "match_players"("match_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_players_season_id_player_id_key" ON "season_players"("season_id", "player_id");

-- CreateIndex
CREATE INDEX "referees_last_name_idx" ON "referees"("last_name");

-- AddForeignKey
ALTER TABLE "national_teams" ADD CONSTRAINT "national_teams_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_internationals" ADD CONSTRAINT "player_internationals_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_internationals" ADD CONSTRAINT "player_internationals_national_team_id_fkey" FOREIGN KEY ("national_team_id") REFERENCES "national_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_aliases" ADD CONSTRAINT "opponent_aliases_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "opponents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_birth_country_id_fkey" FOREIGN KEY ("birth_country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_clubs" ADD CONSTRAINT "career_clubs_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_clubs" ADD CONSTRAINT "career_clubs_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "opponents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_clubs" ADD CONSTRAINT "career_clubs_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stints" ADD CONSTRAINT "player_stints_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_awards" ADD CONSTRAINT "player_awards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_president_id_fkey" FOREIGN KEY ("president_id") REFERENCES "presidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "opponents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "referees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_players" ADD CONSTRAINT "season_players_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_players" ADD CONSTRAINT "season_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
