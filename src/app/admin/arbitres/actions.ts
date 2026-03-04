"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateRefereeSlug } from "@/lib/slugs";

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

export type RefereeActionState = {
  error?: string;
  success?: boolean;
};

export async function createReferee(
  _prev: RefereeActionState,
  formData: FormData,
): Promise<RefereeActionState> {
  await requireAdmin();

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;

  if (!firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  try {
    const referee = await prisma.referee.create({
      data: { firstName, lastName, slug: "", photoUrl },
    });

    const slug = generateRefereeSlug(firstName, lastName, referee.id);
    await prisma.referee.update({ where: { id: referee.id }, data: { slug } });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un arbitre "${firstName} ${lastName}" existe déjà.` };
    }
    return { error: "Erreur lors de la création de l'arbitre." };
  }

  revalidatePath("/admin/arbitres");
  revalidatePath("/arbitres");
  return { success: true };
}

export async function updateReferee(
  _prev: RefereeActionState,
  formData: FormData,
): Promise<RefereeActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;

  if (!id || !firstName || !lastName) {
    return { error: "Le prénom et le nom sont obligatoires." };
  }

  const slug = generateRefereeSlug(firstName, lastName, id);

  try {
    await prisma.referee.update({
      where: { id },
      data: { firstName, lastName, slug, photoUrl },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un arbitre "${firstName} ${lastName}" existe déjà.` };
    }
    return { error: "Erreur lors de la mise à jour de l'arbitre." };
  }

  revalidatePath("/admin/arbitres");
  revalidatePath("/arbitres");
  return { success: true };
}

export async function deleteReferee(id: string): Promise<RefereeActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  const matchCount = await prisma.match.count({ where: { refereeId: id } });
  if (matchCount > 0) {
    return {
      error: `Impossible de supprimer : cet arbitre est lié à ${matchCount} match(s).`,
    };
  }

  try {
    await prisma.referee.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression de l'arbitre." };
  }

  revalidatePath("/admin/arbitres");
  revalidatePath("/arbitres");
  return { success: true };
}
