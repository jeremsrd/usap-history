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

const VALID_TYPES = [
  "CHAMPIONNAT",
  "COUPE_EUROPE",
  "CHALLENGE_EUROPE",
  "COUPE_FRANCE",
  "AMICAL",
  "BARRAGES",
];

// --- Types ---

export type CompetitionActionState = {
  error?: string;
  success?: boolean;
};

// --- Actions ---

export async function createCompetition(
  _prev: CompetitionActionState,
  formData: FormData,
): Promise<CompetitionActionState> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const shortName = (formData.get("shortName") as string)?.trim() || null;
  const type = (formData.get("type") as string)?.trim();
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    return { error: "Le nom de la compétition est obligatoire." };
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return { error: "Le type de compétition est obligatoire." };
  }

  try {
    await prisma.competition.create({
      data: {
        name,
        shortName,
        type: type as "CHAMPIONNAT" | "COUPE_EUROPE" | "CHALLENGE_EUROPE" | "COUPE_FRANCE" | "AMICAL" | "BARRAGES",
        isActive,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Une compétition avec le nom "${name}" existe déjà.` };
    }
    return { error: "Erreur lors de la création de la compétition." };
  }

  revalidatePath("/admin/competitions");
  return { success: true };
}

export async function updateCompetition(
  _prev: CompetitionActionState,
  formData: FormData,
): Promise<CompetitionActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const shortName = (formData.get("shortName") as string)?.trim() || null;
  const type = (formData.get("type") as string)?.trim();
  const isActive = formData.get("isActive") === "on";

  if (!id || !name) {
    return { error: "Le nom de la compétition est obligatoire." };
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return { error: "Le type de compétition est obligatoire." };
  }

  try {
    await prisma.competition.update({
      where: { id },
      data: {
        name,
        shortName,
        type: type as "CHAMPIONNAT" | "COUPE_EUROPE" | "CHALLENGE_EUROPE" | "COUPE_FRANCE" | "AMICAL" | "BARRAGES",
        isActive,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Une compétition avec le nom "${name}" existe déjà.` };
    }
    return { error: "Erreur lors de la mise à jour de la compétition." };
  }

  revalidatePath("/admin/competitions");
  return { success: true };
}

export async function deleteCompetition(
  id: string,
): Promise<CompetitionActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  // Vérifier l'intégrité référentielle
  const matchCount = await prisma.match.count({
    where: { competitionId: id },
  });

  if (matchCount > 0) {
    return {
      error: `Impossible de supprimer : cette compétition est liée à ${matchCount} match(s).`,
    };
  }

  try {
    await prisma.competition.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression de la compétition." };
  }

  revalidatePath("/admin/competitions");
  return { success: true };
}
