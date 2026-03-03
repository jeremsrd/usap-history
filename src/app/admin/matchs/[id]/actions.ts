"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Position, EventType } from "@prisma/client";

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

function parseOptionalInt(val: string | null): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

// --- Types ---

export type ActionResult = {
  error?: string;
  success?: boolean;
};

// --- MatchPlayer Actions ---

const VALID_POSITIONS = [
  "PILIER_GAUCHE",
  "TALONNEUR",
  "PILIER_DROIT",
  "DEUXIEME_LIGNE",
  "TROISIEME_LIGNE_AILE",
  "NUMERO_HUIT",
  "DEMI_DE_MELEE",
  "DEMI_OUVERTURE",
  "AILIER",
  "CENTRE",
  "ARRIERE",
];

export async function addMatchPlayer(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const matchId = formData.get("matchId") as string;
  const playerId = formData.get("playerId") as string;
  const shirtNumber = parseOptionalInt(formData.get("shirtNumber") as string);
  const isStarter = formData.get("isStarter") === "true";
  const isCaptain = formData.get("isCaptain") === "on";
  const positionPlayed = (formData.get("positionPlayed") as string) || null;
  const isOpponent = formData.get("isOpponent") === "true";

  if (!matchId || !playerId) {
    return { error: "Match et joueur sont obligatoires." };
  }

  if (positionPlayed && !VALID_POSITIONS.includes(positionPlayed)) {
    return { error: "Poste invalide." };
  }

  // Vérifier que le joueur n'est pas déjà dans la compo
  const existing = await prisma.matchPlayer.findUnique({
    where: { matchId_playerId: { matchId, playerId } },
  });

  if (existing) {
    return { error: "Ce joueur est déjà dans la composition." };
  }

  try {
    await prisma.matchPlayer.create({
      data: {
        matchId,
        playerId,
        shirtNumber,
        isStarter,
        isCaptain,
        isOpponent,
        positionPlayed: positionPlayed as Position | null,
      },
    });
  } catch {
    return { error: "Erreur lors de l'ajout du joueur." };
  }

  revalidatePath(`/admin/matchs/${matchId}`);
  revalidatePath("/matchs");
  return { success: true };
}

export async function updateMatchPlayer(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const matchId = formData.get("matchId") as string;

  if (!id) return { error: "ID manquant." };

  const shirtNumber = parseOptionalInt(formData.get("shirtNumber") as string);
  const isStarter = formData.get("isStarter") === "true";
  const isCaptain = formData.get("isCaptain") === "on";
  const positionPlayed = (formData.get("positionPlayed") as string) || null;
  const tries = parseInt(formData.get("tries") as string) || 0;
  const conversions = parseInt(formData.get("conversions") as string) || 0;
  const penalties = parseInt(formData.get("penalties") as string) || 0;
  const dropGoals = parseInt(formData.get("dropGoals") as string) || 0;
  const yellowCard = formData.get("yellowCard") === "on";
  const yellowCardMin = parseOptionalInt(
    formData.get("yellowCardMin") as string,
  );
  const redCard = formData.get("redCard") === "on";
  const redCardMin = parseOptionalInt(formData.get("redCardMin") as string);
  const orangeCard = formData.get("orangeCard") === "on";
  const orangeCardMin = parseOptionalInt(
    formData.get("orangeCardMin") as string,
  );
  const whiteCard = formData.get("whiteCard") === "on";
  const whiteCardMin = parseOptionalInt(
    formData.get("whiteCardMin") as string,
  );
  const minutesPlayed = parseOptionalInt(
    formData.get("minutesPlayed") as string,
  );
  const subIn = parseOptionalInt(formData.get("subIn") as string);
  const subOut = parseOptionalInt(formData.get("subOut") as string);

  // Calcul des points : essai=5, transfo=2, pénalité=3, drop=3
  const totalPoints = tries * 5 + conversions * 2 + penalties * 3 + dropGoals * 3;

  try {
    await prisma.matchPlayer.update({
      where: { id },
      data: {
        shirtNumber,
        isStarter,
        isCaptain,
        positionPlayed: positionPlayed as Position | null,
        minutesPlayed,
        tries,
        conversions,
        penalties,
        dropGoals,
        totalPoints,
        yellowCard,
        yellowCardMin,
        redCard,
        redCardMin,
        orangeCard,
        orangeCardMin,
        whiteCard,
        whiteCardMin,
        subIn,
        subOut,
      },
    });
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath(`/admin/matchs/${matchId}`);
  revalidatePath("/matchs");
  return { success: true };
}

export async function removeMatchPlayer(
  id: string,
  matchId: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!id) return { error: "ID manquant." };

  try {
    await prisma.matchPlayer.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression." };
  }

  revalidatePath(`/admin/matchs/${matchId}`);
  revalidatePath("/matchs");
  return { success: true };
}

// --- MatchEvent Actions ---

const VALID_EVENT_TYPES = [
  "ESSAI",
  "TRANSFORMATION",
  "PENALITE",
  "DROP",
  "ESSAI_PENALITE",
  "CARTON_JAUNE",
  "CARTON_ROUGE",
  "REMPLACEMENT_ENTREE",
  "REMPLACEMENT_SORTIE",
];

export async function addMatchEvent(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const matchId = formData.get("matchId") as string;
  const minute = parseInt(formData.get("minute") as string);
  const type = formData.get("type") as string;
  const isUsap = formData.get("isUsap") === "true";
  const description = (formData.get("description") as string)?.trim() || null;
  const playerId = (formData.get("playerId") as string) || null;

  if (!matchId) return { error: "Match obligatoire." };
  if (isNaN(minute) || minute < 0) return { error: "Minute invalide." };
  if (!type || !VALID_EVENT_TYPES.includes(type))
    return { error: "Type d'événement invalide." };

  try {
    await prisma.matchEvent.create({
      data: {
        matchId,
        minute,
        type: type as EventType,
        isUsap,
        description,
        playerId,
      },
    });
  } catch {
    return { error: "Erreur lors de l'ajout de l'événement." };
  }

  revalidatePath(`/admin/matchs/${matchId}`);
  revalidatePath("/matchs");
  return { success: true };
}

export async function removeMatchEvent(
  id: string,
  matchId: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!id) return { error: "ID manquant." };

  try {
    await prisma.matchEvent.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression." };
  }

  revalidatePath(`/admin/matchs/${matchId}`);
  revalidatePath("/matchs");
  return { success: true };
}
