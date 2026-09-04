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

export type VenueActionState = {
  error?: string;
  success?: boolean;
};

// --- Actions ---

export async function createVenue(
  _prev: VenueActionState,
  formData: FormData,
): Promise<VenueActionState> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const countryId = (formData.get("countryId") as string) || null;
  const capacityStr = formData.get("capacity") as string;
  const capacity = capacityStr ? parseInt(capacityStr, 10) : null;
  const yearOpenedStr = formData.get("yearOpened") as string;
  const yearOpened = yearOpenedStr ? parseInt(yearOpenedStr, 10) : null;
  const latitudeStr = formData.get("latitude") as string;
  const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
  const longitudeStr = formData.get("longitude") as string;
  const longitude = longitudeStr ? parseFloat(longitudeStr) : null;
  const isHomeGround = formData.get("isHomeGround") === "on";
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    return { error: "Le nom du stade est obligatoire." };
  }

  if (!city) {
    return { error: "La ville est obligatoire." };
  }

  if (capacity && (capacity < 0 || capacity > 200000)) {
    return { error: "La capacité doit être comprise entre 0 et 200 000." };
  }

  if (yearOpened && (yearOpened < 1800 || yearOpened > 2100)) {
    return { error: "L'année d'ouverture doit être comprise entre 1800 et 2100." };
  }

  try {
    await prisma.venue.create({
      data: {
        name,
        city,
        countryId,
        capacity,
        yearOpened,
        latitude,
        longitude,
        isHomeGround,
        photoUrl,
        notes,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un stade avec le nom "${name}" existe déjà.` };
    }
    return { error: "Erreur lors de la création du stade." };
  }

  revalidatePath("/admin/stades");
  return { success: true };
}

export async function updateVenue(
  _prev: VenueActionState,
  formData: FormData,
): Promise<VenueActionState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const countryId = (formData.get("countryId") as string) || null;
  const capacityStr = formData.get("capacity") as string;
  const capacity = capacityStr ? parseInt(capacityStr, 10) : null;
  const yearOpenedStr = formData.get("yearOpened") as string;
  const yearOpened = yearOpenedStr ? parseInt(yearOpenedStr, 10) : null;
  const latitudeStr = formData.get("latitude") as string;
  const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
  const longitudeStr = formData.get("longitude") as string;
  const longitude = longitudeStr ? parseFloat(longitudeStr) : null;
  const isHomeGround = formData.get("isHomeGround") === "on";
  const photoUrl = (formData.get("photoUrl") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!id || !name) {
    return { error: "Le nom du stade est obligatoire." };
  }

  if (!city) {
    return { error: "La ville est obligatoire." };
  }

  if (capacity && (capacity < 0 || capacity > 200000)) {
    return { error: "La capacité doit être comprise entre 0 et 200 000." };
  }

  if (yearOpened && (yearOpened < 1800 || yearOpened > 2100)) {
    return { error: "L'année d'ouverture doit être comprise entre 1800 et 2100." };
  }

  try {
    await prisma.venue.update({
      where: { id },
      data: {
        name,
        city,
        countryId,
        capacity,
        yearOpened,
        latitude,
        longitude,
        isHomeGround,
        photoUrl,
        notes,
      },
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("Unique constraint failed")
    ) {
      return { error: `Un stade avec le nom "${name}" existe déjà.` };
    }
    return { error: "Erreur lors de la mise à jour du stade." };
  }

  revalidatePath("/admin/stades");
  return { success: true };
}

export async function deleteVenue(
  id: string,
): Promise<VenueActionState> {
  await requireAdmin();

  if (!id) {
    return { error: "ID manquant." };
  }

  // Vérifier l'intégrité référentielle
  const [matchCount, opponentCount] = await Promise.all([
    prisma.match.count({ where: { venueId: id } }),
    prisma.opponent.count({ where: { venueId: id } }),
  ]);

  const total = matchCount + opponentCount;
  if (total > 0) {
    const details: string[] = [];
    if (matchCount > 0) details.push(`${matchCount} match(s)`);
    if (opponentCount > 0) details.push(`${opponentCount} adversaire(s)`);
    return {
      error: `Impossible de supprimer : ce stade est lié à ${details.join(", ")}.`,
    };
  }

  try {
    await prisma.venue.delete({ where: { id } });
  } catch {
    return { error: "Erreur lors de la suppression du stade." };
  }

  revalidatePath("/admin/stades");
  return { success: true };
}
