/**
 * Script de création d'un utilisateur admin USAP Historia.
 *
 * Usage :
 *   npx tsx scripts/create-admin.ts <email> <password>
 *
 * Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local
 * (clé "service_role" depuis Supabase > Settings > API)
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage : npx tsx scripts/create-admin.ts <email> <password>");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local",
    );
    console.error(
      "La clé service_role se trouve dans Supabase > Settings > API > Service Role Key",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Créer l'utilisateur dans Supabase Auth
  console.log(`Création de l'utilisateur Auth : ${email}...`);
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    // Si l'utilisateur existe déjà dans Auth, récupérer son ID
    if (authError.message.includes("already been registered")) {
      console.log("Utilisateur Auth déjà existant, récupération de l'ID...");
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users.find((u) => u.email === email);
      if (!existingUser) {
        console.error("Impossible de trouver l'utilisateur existant.");
        process.exit(1);
      }
      // Mettre à jour dans la table users avec le rôle ADMIN
      await prisma.user.upsert({
        where: { id: existingUser.id },
        update: { role: "ADMIN", email },
        create: { id: existingUser.id, email, role: "ADMIN" },
      });
      console.log(`Utilisateur ${email} promu ADMIN (id: ${existingUser.id})`);
      await prisma.$disconnect();
      return;
    }
    console.error("Erreur Auth :", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`Utilisateur Auth créé (id: ${userId})`);

  // 2. Insérer dans la table users avec le rôle ADMIN
  console.log("Insertion dans la table users avec rôle ADMIN...");
  await prisma.user.upsert({
    where: { id: userId },
    update: { role: "ADMIN", email },
    create: { id: userId, email, role: "ADMIN" },
  });

  console.log(`Admin créé avec succès : ${email}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
