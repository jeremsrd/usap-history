"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateCoachSlug } from "@/lib/slugs";

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

export type CoachActionState = {
  error?: string;
  success?: boolean;
};

export async function createCoach(
  _prev: CoachActionState,
  formData: FormData,
): Promise<CoachActionState> {
  await requireAdmin();

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() || null;
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const biography = (formData.get("biography") as string)?.trim() || null;

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  try {
    const coach = await prisma.coach.create({
      data: { firstName, lastName, slug: "", role, photoUrl, biography },
    });

    // Générer le slug avec le CUID
    const slug = generateCoachSlug(firstName, lastName, coach.id);
    await prisma.coach.update({ where: { id: coach.id }, data: { slug } });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un entraîneur "${firstName} ${lastName}" existe déjà.` };
    }
    return { error: "Erreur lors de la création de l'entraîneur." };
  }

  revalidatePath("/admin/entraineurs");
  revalidatePath("/entraineurs");
  return { success: true };
}

export async function updateCoach(
  _prev: CoachActionState,
  formData: FormData,
): Promise<CoachActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() || null;
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const biography = (formData.get("biography") as string)?.trim() || null;

  if (!id || !firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const slug = generateCoachSlug(firstName, lastName, id);

  try {
    await prisma.coach.update({
      where: { id },
      data: { firstName, lastName, slug, role, photoUrl, biography },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un entraîneur "${firstName} ${lastName}" existe déjà.` };
    }
    return { error: "Erreur lors de la mise à jour de l'entraîneur." };
  }

  revalidatePath("/admin/entraineurs");
  revalidatePath("/entraineurs");
  return { success: true };
}

export async function deleteCoach(id: string): Promise<CoachActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  const seasonCount = await prisma.season.count({ where: { coachId: id } });
  if (seasonCount > 0) {
    return {
      error: `Impossible de supprimer : cet entraîneur est lié à ${seasonCount} saison(s).`,
    };
  }

  try {
    await prisma.coach.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression de l'entraîneur." };
  }

  revalidatePath("/admin/entraineurs");
  revalidatePath("/entraineurs");
  return { success: true };
}
