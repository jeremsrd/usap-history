"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Continent } from "@prisma/client";

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

export type CountryActionState = {
  error?: string;
  success?: boolean;
};

// --- Actions ---

export async function createCountry(
  _prev: CountryActionState,
  formData: FormData,
): Promise<CountryActionState> {
  await requireAdmin();

  const name = formData.get("name") as string;
  const code = (formData.get("code") as string).toUpperCase();
  const continent = (formData.get("continent") as string) || null;

  if (!name || !code) {
    return { error: "Le nom et le code ISO sont obligatoires." };
  }

  if (code.length !== 2) {
    return { error: "Le code ISO doit être composé de 2 lettres (ex: FR)." };
  }

  try {
    await prisma.country.create({
      data: {
        name,
        code,
        continent: continent as Continent | null,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: "Un pays avec ce nom ou ce code existe déjà." };
    }
    return { error: "Erreur lors de la création du pays." };
  }

  revalidatePath("/admin/pays");
  return { success: true };
}

export async function updateCountry(
  _prev: CountryActionState,
  formData: FormData,
): Promise<CountryActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const code = (formData.get("code") as string).toUpperCase();
  const continent = (formData.get("continent") as string) || null;

  if (!id || !name || !code) {
    return { error: "Le nom et le code ISO sont obligatoires." };
  }

  if (code.length !== 2) {
    return { error: "Le code ISO doit être composé de 2 lettres (ex: FR)." };
  }

  try {
    await prisma.country.update({
      where: { id },
      data: {
        name,
        code,
        continent: continent as Continent | null,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: "Un pays avec ce nom ou ce code existe déjà." };
    }
    return { error: "Erreur lors de la mise à jour du pays." };
  }

  revalidatePath("/admin/pays");
  return { success: true };
}

export async function deleteCountry(id: string): Promise<CountryActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  // Vérifier que le pays n'est pas utilisé par des joueurs, adversaires, etc.
  const [playersBorn, playersNat, opponents, venues, careerClubs] =
    await Promise.all([
      prisma.player.count({ where: { birthCountryId: id } }),
      prisma.player.count({ where: { nationalityId: id } }),
      prisma.opponent.count({ where: { countryId: id } }),
      prisma.venue.count({ where: { countryId: id } }),
      prisma.careerClub.count({ where: { countryId: id } }),
    ]);

  const total = playersBorn + playersNat + opponents + venues + careerClubs;
  if (total > 0) {
    const details: string[] = [];
    if (playersBorn > 0) details.push(`${playersBorn} joueur(s) né(s)`);
    if (playersNat > 0) details.push(`${playersNat} nationalité(s)`);
    if (opponents > 0) details.push(`${opponents} adversaire(s)`);
    if (venues > 0) details.push(`${venues} stade(s)`);
    if (careerClubs > 0) details.push(`${careerClubs} club(s) de carrière`);
    return {
      error: `Impossible de supprimer : ce pays est lié à ${details.join(", ")}.`,
    };
  }

  try {
    await prisma.country.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression du pays." };
  }

  revalidatePath("/admin/pays");
  return { success: true };
}
