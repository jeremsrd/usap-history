import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo

export async function POST(request: NextRequest) {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Lecture du formulaire
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "misc";

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier envoyé." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, SVG." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Le fichier dépasse la taille maximale de 2 Mo." },
      { status: 400 },
    );
  }

  // Nom de fichier unique
  const ext = file.name.split(".").pop() || "png";
  const timestamp = Date.now();
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .substring(0, 50);
  const filePath = `${folder}/${timestamp}-${safeName}.${ext}`;

  // Upload vers Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: `Erreur d'upload : ${uploadError.message}` },
      { status: 500 },
    );
  }

  // URL publique
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl });
}
