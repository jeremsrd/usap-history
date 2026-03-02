"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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

export type OpponentActionState = {
  error?: string;
  success?: boolean;
};

// --- Actions ---

export async function createOpponent(
  _prev: OpponentActionState,
  formData: FormData,
): Promise<OpponentActionState> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const shortName = (formData.get("shortName") as string)?.trim() || null;
  const officialName = (formData.get("officialName") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const countryId = (formData.get("countryId") as string) || null;
  const venueId = (formData.get("venueId") as string) || null;
  const foundedYearStr = formData.get("foundedYear") as string;
  const foundedYear = foundedYearStr ? parseInt(foundedYearStr, 10) : null;
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
  const websiteUrl = (formData.get("websiteUrl") as string)?.trim() || null;
  const facebookUrl = (formData.get("facebookUrl") as string)?.trim() || null;
  const instagramUrl = (formData.get("instagramUrl") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    return { error: "Le nom du club est obligatoire." };
  }

  if (foundedYear && (foundedYear < 1800 || foundedYear > 2100)) {
    return { error: "L'année de fondation doit être comprise entre 1800 et 2100." };
  }

  try {
    await prisma.opponent.create({
      data: {
        name,
        shortName,
        officialName,
        city,
        countryId,
        venueId,
        foundedYear,
        logoUrl,
        websiteUrl,
        facebookUrl,
        instagramUrl,
        isActive,
        notes,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un adversaire avec le nom "${name}" existe déjà.` };
    }
    return { error: "Erreur lors de la création de l'adversaire." };
  }

  revalidatePath("/admin/adversaires");
  return { success: true };
}

export async function updateOpponent(
  _prev: OpponentActionState,
  formData: FormData,
): Promise<OpponentActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const shortName = (formData.get("shortName") as string)?.trim() || null;
  const officialName = (formData.get("officialName") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const countryId = (formData.get("countryId") as string) || null;
  const venueId = (formData.get("venueId") as string) || null;
  const foundedYearStr = formData.get("foundedYear") as string;
  const foundedYear = foundedYearStr ? parseInt(foundedYearStr, 10) : null;
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
  const websiteUrl = (formData.get("websiteUrl") as string)?.trim() || null;
  const facebookUrl = (formData.get("facebookUrl") as string)?.trim() || null;
  const instagramUrl = (formData.get("instagramUrl") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!id || !name) {
    return { error: "Le nom du club est obligatoire." };
  }

  if (foundedYear && (foundedYear < 1800 || foundedYear > 2100)) {
    return { error: "L'année de fondation doit être comprise entre 1800 et 2100." };
  }

  try {
    await prisma.opponent.update({
      where: { id },
      data: {
        name,
        shortName,
        officialName,
        city,
        countryId,
        venueId,
        foundedYear,
        logoUrl,
        websiteUrl,
        facebookUrl,
        instagramUrl,
        isActive,
        notes,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un adversaire avec le nom "${name}" existe déjà.` };
    }
    return { error: "Erreur lors de la mise à jour de l'adversaire." };
  }

  revalidatePath("/admin/adversaires");
  return { success: true };
}

export async function deleteOpponent(
  id: string,
): Promise<OpponentActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  // Vérifier l'intégrité référentielle
  const [matchCount, careerClubCount] = await Promise.all([
    prisma.match.count({ where: { opponentId: id } }),
    prisma.careerClub.count({ where: { opponentId: id } }),
  ]);

  const total = matchCount + careerClubCount;
  if (total > 0) {
    const details: string[] = [];
    if (matchCount > 0) details.push(`${matchCount} match(s)`);
    if (careerClubCount > 0) details.push(`${careerClubCount} club(s) de carrière`);
    return {
      error: `Impossible de supprimer : cet adversaire est lié à ${details.join(", ")}.`,
    };
  }

  try {
    await prisma.opponent.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression de l'adversaire." };
  }

  revalidatePath("/admin/adversaires");
  return { success: true };
}
