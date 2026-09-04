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

const VALID_ACHIEVEMENTS = [
  "CHAMPION",
  "FINALISTE",
  "DEMI_FINALISTE",
  "QUART_FINALISTE",
  "VAINQUEUR_COUPE",
  "FINALISTE_COUPE",
];

// --- Types ---

export type TrophyActionState = {
  error?: string;
  success?: boolean;
};

// --- Actions ---

export async function createTrophy(
  _prev: TrophyActionState,
  formData: FormData,
): Promise<TrophyActionState> {
  await requireAdmin();

  const year = Number(formData.get("year"));
  const competition = (formData.get("competition") as string)?.trim();
  const achievement = (formData.get("achievement") as string)?.trim();
  const opponent = (formData.get("opponent") as string)?.trim() || null;
  const score = (formData.get("score") as string)?.trim() || null;
  const venue = (formData.get("venue") as string)?.trim() || null;
  const details = (formData.get("details") as string)?.trim() || null;

  if (!year || year < 1900 || year > 2100) {
    return { error: "L'année est obligatoire et doit être valide." };
  }

  if (!competition) {
    return { error: "La compétition est obligatoire." };
  }

  if (!achievement || !VALID_ACHIEVEMENTS.includes(achievement)) {
    return { error: "Le type de résultat est obligatoire." };
  }

  try {
    await prisma.trophy.create({
      data: {
        year,
        competition,
        achievement: achievement as "CHAMPION" | "FINALISTE" | "DEMI_FINALISTE" | "QUART_FINALISTE" | "VAINQUEUR_COUPE" | "FINALISTE_COUPE",
        opponent,
        score,
        venue,
        details,
      },
    });
  } catch {
    return { error: "Erreur lors de la création du trophée." };
  }

  revalidatePath("/admin/palmares");
  revalidatePath("/palmares");
  return { success: true };
}

export async function updateTrophy(
  _prev: TrophyActionState,
  formData: FormData,
): Promise<TrophyActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const year = Number(formData.get("year"));
  const competition = (formData.get("competition") as string)?.trim();
  const achievement = (formData.get("achievement") as string)?.trim();
  const opponent = (formData.get("opponent") as string)?.trim() || null;
  const score = (formData.get("score") as string)?.trim() || null;
  const venue = (formData.get("venue") as string)?.trim() || null;
  const details = (formData.get("details") as string)?.trim() || null;

  if (!id) {
    return { error: "ID manquant." };
  }

  if (!year || year < 1900 || year > 2100) {
    return { error: "L'année est obligatoire et doit être valide." };
  }

  if (!competition) {
    return { error: "La compétition est obligatoire." };
  }

  if (!achievement || !VALID_ACHIEVEMENTS.includes(achievement)) {
    return { error: "Le type de résultat est obligatoire." };
  }

  try {
    await prisma.trophy.update({
      where: { id },
      data: {
        year,
        competition,
        achievement: achievement as "CHAMPION" | "FINALISTE" | "DEMI_FINALISTE" | "QUART_FINALISTE" | "VAINQUEUR_COUPE" | "FINALISTE_COUPE",
        opponent,
        score,
        venue,
        details,
      },
    });
  } catch {
    return { error: "Erreur lors de la mise à jour du trophée." };
  }

  revalidatePath("/admin/palmares");
  revalidatePath("/palmares");
  return { success: true };
}

export async function deleteTrophy(
  id: string,
): Promise<TrophyActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  try {
    await prisma.trophy.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression du trophée." };
  }

  revalidatePath("/admin/palmares");
  revalidatePath("/palmares");
  return { success: true };
}
