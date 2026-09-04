"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generatePlayerSlug } from "@/lib/slugs";
import type { Position } from "@prisma/client";

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

// --- Types ---

export type PlayerActionState = {
  error?: string;
  success?: boolean;
};

// --- Actions ---

export async function createPlayer(
  _prev: PlayerActionState,
  formData: FormData,
): Promise<PlayerActionState> {
  await requireAdmin();

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const positionVal = (formData.get("position") as string) || null;
  const birthDateStr = formData.get("birthDate") as string;
  const deathDateStr = formData.get("deathDate") as string;
  const birthPlace = (formData.get("birthPlace") as string)?.trim() || null;
  const birthCountryId = (formData.get("birthCountryId") as string) || null;
  const nationalityId = (formData.get("nationalityId") as string) || null;
  const heightStr = formData.get("height") as string;
  const height = heightStr ? parseInt(heightStr, 10) : null;
  const weightStr = formData.get("weight") as string;
  const weight = weightStr ? parseInt(weightStr, 10) : null;
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const biography = (formData.get("biography") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!firstName) {
    return { error: "Le prénom est obligatoire." };
  }

  if (!lastName) {
    return { error: "Le nom est obligatoire." };
  }

  if (positionVal && !VALID_POSITIONS.includes(positionVal)) {
    return { error: "Poste invalide." };
  }

  if (height && (height < 140 || height > 230)) {
    return { error: "La taille doit être comprise entre 140 et 230 cm." };
  }

  if (weight && (weight < 50 || weight > 200)) {
    return { error: "Le poids doit être compris entre 50 et 200 kg." };
  }

  const birthDate = birthDateStr ? new Date(birthDateStr) : null;
  const deathDate = deathDateStr ? new Date(deathDateStr) : null;

  if (birthDate && deathDate && deathDate <= birthDate) {
    return { error: "La date de décès doit être postérieure à la date de naissance." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: {
          firstName,
          lastName,
          slug: "temp", // Temporaire, mis à jour juste après avec l'id généré
          position: positionVal as Position | null,
          birthDate,
          deathDate,
          birthPlace,
          birthCountryId,
          nationalityId,
          height,
          weight,
          photoUrl,
          biography,
          isActive,
        },
      });

      const slug = generatePlayerSlug(firstName, lastName, created.id);
      await tx.player.update({
        where: { id: created.id },
        data: { slug },
      });
    });
  } catch {
    return { error: "Erreur lors de la création du joueur." };
  }

  revalidatePath("/admin/joueurs");
  revalidatePath("/joueurs");
  return { success: true };
}

export async function updatePlayer(
  _prev: PlayerActionState,
  formData: FormData,
): Promise<PlayerActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const positionVal = (formData.get("position") as string) || null;
  const birthDateStr = formData.get("birthDate") as string;
  const deathDateStr = formData.get("deathDate") as string;
  const birthPlace = (formData.get("birthPlace") as string)?.trim() || null;
  const birthCountryId = (formData.get("birthCountryId") as string) || null;
  const nationalityId = (formData.get("nationalityId") as string) || null;
  const heightStr = formData.get("height") as string;
  const height = heightStr ? parseInt(heightStr, 10) : null;
  const weightStr = formData.get("weight") as string;
  const weight = weightStr ? parseInt(weightStr, 10) : null;
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const biography = (formData.get("biography") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!id || !firstName) {
    return { error: "Le prénom est obligatoire." };
  }

  if (!lastName) {
    return { error: "Le nom est obligatoire." };
  }

  if (positionVal && !VALID_POSITIONS.includes(positionVal)) {
    return { error: "Poste invalide." };
  }

  if (height && (height < 140 || height > 230)) {
    return { error: "La taille doit être comprise entre 140 et 230 cm." };
  }

  if (weight && (weight < 50 || weight > 200)) {
    return { error: "Le poids doit être compris entre 50 et 200 kg." };
  }

  const birthDate = birthDateStr ? new Date(birthDateStr) : null;
  const deathDate = deathDateStr ? new Date(deathDateStr) : null;

  if (birthDate && deathDate && deathDate <= birthDate) {
    return { error: "La date de décès doit être postérieure à la date de naissance." };
  }

  const slug = generatePlayerSlug(firstName, lastName, id);

  try {
    await prisma.player.update({
      where: { id },
      data: {
        firstName,
        lastName,
        slug,
        position: positionVal as Position | null,
        birthDate,
        deathDate,
        birthPlace,
        birthCountryId,
        nationalityId,
        height,
        weight,
        photoUrl,
        biography,
        isActive,
      },
    });
  } catch {
    return { error: "Erreur lors de la mise à jour du joueur." };
  }

  revalidatePath("/admin/joueurs");
  revalidatePath("/joueurs");
  return { success: true };
}

export async function deletePlayer(
  id: string,
): Promise<PlayerActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  // Vérifier l'intégrité référentielle
  const [careerCount, matchCount, seasonCount, internationalCount, awardCount, stintCount] =
    await Promise.all([
      prisma.careerClub.count({ where: { playerId: id } }),
      prisma.matchPlayer.count({ where: { playerId: id } }),
      prisma.seasonPlayer.count({ where: { playerId: id } }),
      prisma.playerInternational.count({ where: { playerId: id } }),
      prisma.playerAward.count({ where: { playerId: id } }),
      prisma.playerStint.count({ where: { playerId: id } }),
    ]);

  const total = careerCount + matchCount + seasonCount + internationalCount + awardCount + stintCount;
  if (total > 0) {
    const details: string[] = [];
    if (matchCount > 0) details.push(`${matchCount} match(s)`);
    if (seasonCount > 0) details.push(`${seasonCount} saison(s)`);
    if (careerCount > 0) details.push(`${careerCount} club(s) en carrière`);
    if (internationalCount > 0) details.push(`${internationalCount} sélection(s)`);
    if (awardCount > 0) details.push(`${awardCount} récompense(s)`);
    if (stintCount > 0) details.push(`${stintCount} passage(s) USAP`);
    return {
      error: `Impossible de supprimer : ce joueur est lié à ${details.join(", ")}.`,
    };
  }

  try {
    await prisma.player.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression du joueur." };
  }

  revalidatePath("/admin/joueurs");
  return { success: true };
}
