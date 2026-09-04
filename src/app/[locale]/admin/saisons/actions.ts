"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatSeasonLabel } from "@/lib/utils";
import type { Division } from "@prisma/client";

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

// --- Types ---

export type SeasonActionState = {
  error?: string;
  success?: boolean;
};

// --- Actions ---

export async function createSeason(
  _prev: SeasonActionState,
  formData: FormData,
): Promise<SeasonActionState> {
  await requireAdmin();

  const startYear = parseInt(formData.get("startYear") as string, 10);
  const endYear = parseInt(formData.get("endYear") as string, 10);
  const division = formData.get("division") as string;
  const coachId = (formData.get("coachId") as string) || null;
  const presidentId = (formData.get("presidentId") as string) || null;

  if (!startYear || !endYear || !division) {
    return { error: "L'année de début, de fin et la division sont obligatoires." };
  }

  if (endYear !== startYear + 1) {
    return { error: "L'année de fin doit être l'année de début + 1." };
  }

  if (startYear < 1902 || startYear > 2100) {
    return { error: "L'année de début doit être comprise entre 1902 et 2100." };
  }

  const label = formatSeasonLabel(startYear, endYear);

  try {
    await prisma.season.create({
      data: {
        startYear,
        endYear,
        label,
        division: division as Division,
        coachId,
        presidentId,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `La saison ${label} existe déjà.` };
    }
    return { error: "Erreur lors de la création de la saison." };
  }

  revalidatePath("/admin/saisons");
  revalidatePath("/saisons");
  return { success: true };
}

export async function updateSeason(
  _prev: SeasonActionState,
  formData: FormData,
): Promise<SeasonActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const startYear = parseInt(formData.get("startYear") as string, 10);
  const endYear = parseInt(formData.get("endYear") as string, 10);
  const division = formData.get("division") as string;
  const coachId = (formData.get("coachId") as string) || null;
  const presidentId = (formData.get("presidentId") as string) || null;

  if (!id || !startYear || !endYear || !division) {
    return { error: "L'année de début, de fin et la division sont obligatoires." };
  }

  if (endYear !== startYear + 1) {
    return { error: "L'année de fin doit être l'année de début + 1." };
  }

  if (startYear < 1902 || startYear > 2100) {
    return { error: "L'année de début doit être comprise entre 1902 et 2100." };
  }

  const label = formatSeasonLabel(startYear, endYear);

  try {
    await prisma.season.update({
      where: { id },
      data: {
        startYear,
        endYear,
        label,
        division: division as Division,
        coachId,
        presidentId,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `La saison ${label} existe déjà.` };
    }
    return { error: "Erreur lors de la mise à jour de la saison." };
  }

  revalidatePath("/admin/saisons");
  revalidatePath("/saisons");
  return { success: true };
}

export async function deleteSeason(id: string): Promise<SeasonActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  // Vérifier l'intégrité référentielle
  const [matchCount, seasonPlayerCount] = await Promise.all([
    prisma.match.count({ where: { seasonId: id } }),
    prisma.seasonPlayer.count({ where: { seasonId: id } }),
  ]);

  const total = matchCount + seasonPlayerCount;
  if (total > 0) {
    const details: string[] = [];
    if (matchCount > 0) details.push(`${matchCount} match(s)`);
    if (seasonPlayerCount > 0) details.push(`${seasonPlayerCount} joueur(s) d'effectif`);
    return {
      error: `Impossible de supprimer : cette saison est liée à ${details.join(", ")}.`,
    };
  }

  try {
    await prisma.season.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression de la saison." };
  }

  revalidatePath("/admin/saisons");
  revalidatePath("/saisons");
  return { success: true };
}
