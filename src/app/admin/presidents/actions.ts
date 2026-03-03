"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generatePresidentSlug } from "@/lib/slugs";

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

export type PresidentActionState = {
  error?: string;
  success?: boolean;
};

export async function createPresident(
  _prev: PresidentActionState,
  formData: FormData,
): Promise<PresidentActionState> {
  await requireAdmin();

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const startYearStr = formData.get("startYear") as string;
  const startYear = startYearStr ? parseInt(startYearStr, 10) : null;
  const endYearStr = formData.get("endYear") as string;
  const endYear = endYearStr ? parseInt(endYearStr, 10) : null;
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const biography = (formData.get("biography") as string)?.trim() || null;

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  try {
    const president = await prisma.president.create({
      data: { firstName, lastName, slug: "", startYear, endYear, photoUrl, biography },
    });

    const slug = generatePresidentSlug(firstName, lastName, president.id);
    await prisma.president.update({
      where: { id: president.id },
      data: { slug },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un président "${firstName} ${lastName}" existe déjà.` };
    }
    return { error: "Erreur lors de la création du président." };
  }

  revalidatePath("/admin/presidents");
  revalidatePath("/presidents");
  return { success: true };
}

export async function updatePresident(
  _prev: PresidentActionState,
  formData: FormData,
): Promise<PresidentActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const startYearStr = formData.get("startYear") as string;
  const startYear = startYearStr ? parseInt(startYearStr, 10) : null;
  const endYearStr = formData.get("endYear") as string;
  const endYear = endYearStr ? parseInt(endYearStr, 10) : null;
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const biography = (formData.get("biography") as string)?.trim() || null;

  if (!id || !firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const slug = generatePresidentSlug(firstName, lastName, id);

  try {
    await prisma.president.update({
      where: { id },
      data: { firstName, lastName, slug, startYear, endYear, photoUrl, biography },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un président "${firstName} ${lastName}" existe déjà.` };
    }
    return { error: "Erreur lors de la mise à jour du président." };
  }

  revalidatePath("/admin/presidents");
  revalidatePath("/presidents");
  return { success: true };
}

export async function deletePresident(
  id: string,
): Promise<PresidentActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  const seasonCount = await prisma.season.count({
    where: { presidentId: id },
  });
  if (seasonCount > 0) {
    return {
      error: `Impossible de supprimer : ce président est lié à ${seasonCount} saison(s).`,
    };
  }

  try {
    await prisma.president.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression du président." };
  }

  revalidatePath("/admin/presidents");
  revalidatePath("/presidents");
  return { success: true };
}
