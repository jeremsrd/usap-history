"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateMatchSlug } from "@/lib/slugs";
import type { MatchResult } from "@prisma/client";

// --- Helpers ---

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  return dbUser;
}

const VALID_RESULTS = ["VICTOIRE", "DEFAITE", "NUL"];

// --- Types ---

export type MatchActionState = {
  error?: string;
  success?: boolean;
};

// --- Parsing helpers ---

function parseOptionalInt(val: string | null): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function parseFormData(formData: FormData) {
  const dateStr = formData.get("date") as string;
  const kickoffTime = (formData.get("kickoffTime") as string)?.trim() || null;
  const seasonId = (formData.get("seasonId") as string) || null;
  const competitionId = (formData.get("competitionId") as string) || null;
  const opponentId = (formData.get("opponentId") as string) || null;
  const venueId = (formData.get("venueId") as string) || null;
  const isHome = formData.get("isHome") === "true";
  const isNeutralVenue = formData.get("isNeutralVenue") === "on";
  const matchday = parseOptionalInt(formData.get("matchday") as string);
  const round = (formData.get("round") as string)?.trim() || null;
  const leg = parseOptionalInt(formData.get("leg") as string);

  const scoreUsapStr = formData.get("scoreUsap") as string;
  const scoreOpponentStr = formData.get("scoreOpponent") as string;
  const scoreUsap = parseInt(scoreUsapStr, 10);
  const scoreOpponent = parseInt(scoreOpponentStr, 10);
  const halfTimeUsap = parseOptionalInt(formData.get("halfTimeUsap") as string);
  const halfTimeOpponent = parseOptionalInt(
    formData.get("halfTimeOpponent") as string,
  );
  const result = (formData.get("result") as string) || null;
  const bonusOffensif = formData.get("bonusOffensif") === "on";
  const bonusDefensif = formData.get("bonusDefensif") === "on";

  const refereeId = (formData.get("refereeId") as string) || null;
  const attendance = parseOptionalInt(formData.get("attendance") as string);
  const report = (formData.get("report") as string)?.trim() || null;
  const manOfTheMatch =
    (formData.get("manOfTheMatch") as string)?.trim() || null;

  // Détail scoring USAP
  const triesUsap = parseOptionalInt(formData.get("triesUsap") as string);
  const conversionsUsap = parseOptionalInt(
    formData.get("conversionsUsap") as string,
  );
  const penaltiesUsap = parseOptionalInt(
    formData.get("penaltiesUsap") as string,
  );
  const dropGoalsUsap = parseOptionalInt(
    formData.get("dropGoalsUsap") as string,
  );
  const penaltyTriesUsap = parseOptionalInt(
    formData.get("penaltyTriesUsap") as string,
  );

  // Détail scoring adversaire
  const triesOpponent = parseOptionalInt(
    formData.get("triesOpponent") as string,
  );
  const conversionsOpponent = parseOptionalInt(
    formData.get("conversionsOpponent") as string,
  );
  const penaltiesOpponent = parseOptionalInt(
    formData.get("penaltiesOpponent") as string,
  );
  const dropGoalsOpponent = parseOptionalInt(
    formData.get("dropGoalsOpponent") as string,
  );
  const penaltyTriesOpponent = parseOptionalInt(
    formData.get("penaltyTriesOpponent") as string,
  );

  return {
    dateStr,
    kickoffTime,
    seasonId,
    competitionId,
    opponentId,
    venueId,
    isHome,
    isNeutralVenue,
    matchday,
    round,
    leg,
    scoreUsap,
    scoreOpponent,
    halfTimeUsap,
    halfTimeOpponent,
    result,
    bonusOffensif,
    bonusDefensif,
    refereeId,
    attendance,
    report,
    manOfTheMatch,
    triesUsap,
    conversionsUsap,
    penaltiesUsap,
    dropGoalsUsap,
    penaltyTriesUsap,
    triesOpponent,
    conversionsOpponent,
    penaltiesOpponent,
    dropGoalsOpponent,
    penaltyTriesOpponent,
  };
}

function validate(data: ReturnType<typeof parseFormData>): string | null {
  if (!data.dateStr) return "La date du match est obligatoire.";
  if (!data.seasonId) return "La saison est obligatoire.";
  if (!data.competitionId) return "La compétition est obligatoire.";
  if (!data.opponentId) return "L'adversaire est obligatoire.";
  if (isNaN(data.scoreUsap) || data.scoreUsap < 0)
    return "Le score USAP est invalide.";
  if (isNaN(data.scoreOpponent) || data.scoreOpponent < 0)
    return "Le score adversaire est invalide.";
  if (!data.result || !VALID_RESULTS.includes(data.result))
    return "Le résultat est invalide.";

  // Cohérence score / résultat
  if (data.scoreUsap > data.scoreOpponent && data.result !== "VICTOIRE")
    return "Le résultat ne correspond pas au score (devrait être Victoire).";
  if (data.scoreUsap < data.scoreOpponent && data.result !== "DEFAITE")
    return "Le résultat ne correspond pas au score (devrait être Défaite).";
  if (data.scoreUsap === data.scoreOpponent && data.result !== "NUL")
    return "Le résultat ne correspond pas au score (devrait être Nul).";

  // Mi-temps <= score final
  if (data.halfTimeUsap !== null && data.halfTimeUsap > data.scoreUsap)
    return "Le score mi-temps USAP ne peut pas dépasser le score final.";
  if (
    data.halfTimeOpponent !== null &&
    data.halfTimeOpponent > data.scoreOpponent
  )
    return "Le score mi-temps adversaire ne peut pas dépasser le score final.";

  if (data.attendance !== null && data.attendance < 0)
    return "L'affluence ne peut pas être négative.";
  if (data.matchday !== null && data.matchday < 1)
    return "La journée doit être positive.";

  return null;
}

// --- Actions ---

export async function createMatch(
  _prev: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  await requireAdmin();

  const data = parseFormData(formData);
  const error = validate(data);
  if (error) return { error };

  const date = new Date(data.dateStr);

  // Récupérer les noms pour générer le slug
  const [competition, opponent] = await Promise.all([
    prisma.competition.findUnique({
      where: { id: data.competitionId! },
      select: { name: true, shortName: true },
    }),
    prisma.opponent.findUnique({
      where: { id: data.opponentId! },
      select: { name: true, shortName: true },
    }),
  ]);

  if (!competition || !opponent) {
    return { error: "Compétition ou adversaire introuvable." };
  }

  const slug = generateMatchSlug({
    competitionShortName: competition.shortName,
    competitionName: competition.name,
    opponentShortName: opponent.shortName,
    opponentName: opponent.name,
    isHome: data.isHome,
    matchday: data.matchday,
    round: data.round,
    date,
  });

  try {
    await prisma.match.create({
      data: {
        date,
        slug,
        kickoffTime: data.kickoffTime,
        seasonId: data.seasonId!,
        competitionId: data.competitionId!,
        opponentId: data.opponentId!,
        venueId: data.venueId,
        isHome: data.isHome,
        isNeutralVenue: data.isNeutralVenue,
        matchday: data.matchday,
        round: data.round,
        leg: data.leg,
        scoreUsap: data.scoreUsap,
        scoreOpponent: data.scoreOpponent,
        halfTimeUsap: data.halfTimeUsap,
        halfTimeOpponent: data.halfTimeOpponent,
        result: data.result as MatchResult,
        bonusOffensif: data.bonusOffensif,
        bonusDefensif: data.bonusDefensif,
        refereeId: data.refereeId,
        attendance: data.attendance,
        report: data.report,
        manOfTheMatch: data.manOfTheMatch,
        triesUsap: data.triesUsap,
        conversionsUsap: data.conversionsUsap,
        penaltiesUsap: data.penaltiesUsap,
        dropGoalsUsap: data.dropGoalsUsap,
        penaltyTriesUsap: data.penaltyTriesUsap,
        triesOpponent: data.triesOpponent,
        conversionsOpponent: data.conversionsOpponent,
        penaltiesOpponent: data.penaltiesOpponent,
        dropGoalsOpponent: data.dropGoalsOpponent,
        penaltyTriesOpponent: data.penaltyTriesOpponent,
      },
    });
  } catch {
    return { error: "Erreur lors de la création du match." };
  }

  revalidatePath("/admin/matchs");
  revalidatePath("/matchs");
  return { success: true };
}

export async function updateMatch(
  _prev: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) return { error: "ID manquant." };

  const data = parseFormData(formData);
  const error = validate(data);
  if (error) return { error };

  const date = new Date(data.dateStr);

  // Récupérer les noms pour régénérer le slug
  const [competition, opponent] = await Promise.all([
    prisma.competition.findUnique({
      where: { id: data.competitionId! },
      select: { name: true, shortName: true },
    }),
    prisma.opponent.findUnique({
      where: { id: data.opponentId! },
      select: { name: true, shortName: true },
    }),
  ]);

  if (!competition || !opponent) {
    return { error: "Compétition ou adversaire introuvable." };
  }

  const slug = generateMatchSlug({
    competitionShortName: competition.shortName,
    competitionName: competition.name,
    opponentShortName: opponent.shortName,
    opponentName: opponent.name,
    isHome: data.isHome,
    matchday: data.matchday,
    round: data.round,
    date,
  });

  try {
    await prisma.match.update({
      where: { id },
      data: {
        date,
        slug,
        kickoffTime: data.kickoffTime,
        seasonId: data.seasonId!,
        competitionId: data.competitionId!,
        opponentId: data.opponentId!,
        venueId: data.venueId,
        isHome: data.isHome,
        isNeutralVenue: data.isNeutralVenue,
        matchday: data.matchday,
        round: data.round,
        leg: data.leg,
        scoreUsap: data.scoreUsap,
        scoreOpponent: data.scoreOpponent,
        halfTimeUsap: data.halfTimeUsap,
        halfTimeOpponent: data.halfTimeOpponent,
        result: data.result as MatchResult,
        bonusOffensif: data.bonusOffensif,
        bonusDefensif: data.bonusDefensif,
        refereeId: data.refereeId,
        attendance: data.attendance,
        report: data.report,
        manOfTheMatch: data.manOfTheMatch,
        triesUsap: data.triesUsap,
        conversionsUsap: data.conversionsUsap,
        penaltiesUsap: data.penaltiesUsap,
        dropGoalsUsap: data.dropGoalsUsap,
        penaltyTriesUsap: data.penaltyTriesUsap,
        triesOpponent: data.triesOpponent,
        conversionsOpponent: data.conversionsOpponent,
        penaltiesOpponent: data.penaltiesOpponent,
        dropGoalsOpponent: data.dropGoalsOpponent,
        penaltyTriesOpponent: data.penaltyTriesOpponent,
      },
    });
  } catch {
    return { error: "Erreur lors de la mise à jour du match." };
  }

  revalidatePath("/admin/matchs");
  revalidatePath("/matchs");
  return { success: true };
}

export async function deleteMatch(id: string): Promise<MatchActionState> {
  await requireAdmin();

  if (!id) return { error: "ID manquant." };

  // Vérifier l'intégrité référentielle
  const [playerCount, eventCount] = await Promise.all([
    prisma.matchPlayer.count({ where: { matchId: id } }),
    prisma.matchEvent.count({ where: { matchId: id } }),
  ]);

  const total = playerCount + eventCount;
  if (total > 0) {
    const details: string[] = [];
    if (playerCount > 0)
      details.push(`${playerCount} joueur(s) enregistré(s)`);
    if (eventCount > 0)
      details.push(`${eventCount} événement(s) de match`);
    return {
      error: `Impossible de supprimer : ce match est lié à ${details.join(", ")}.`,
    };
  }

  try {
    await prisma.match.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression du match." };
  }

  revalidatePath("/admin/matchs");
  return { success: true };
}
