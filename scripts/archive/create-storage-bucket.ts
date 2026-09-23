/**
 * Script pour créer le bucket "images" dans Supabase Storage.
 * Utilise le client Supabase avec la clé anon (le bucket sera créé en mode public).
 *
 * Usage : npx tsx scripts/create-storage-bucket.ts
 *
 * Note : Ce script nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local
 * pour avoir les permissions de créer un bucket.
 * Si pas disponible, créer le bucket manuellement dans le dashboard Supabase.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Utiliser la service role key si disponible, sinon l'anon key
const key = serviceRoleKey || anonKey;

if (!supabaseUrl || !key) {
  console.error("❌ Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, key);

async function main() {
  console.log("🪣 Création du bucket 'images' dans Supabase Storage...");
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Clé: ${serviceRoleKey ? "service_role" : "anon"}`);

  // Vérifier si le bucket existe déjà
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error("❌ Erreur lors de la récupération des buckets :", listError.message);
    process.exit(1);
  }

  const existing = buckets?.find((b) => b.name === "images");
  if (existing) {
    console.log("✅ Le bucket 'images' existe déjà !");
    console.log(`   Public: ${existing.public}`);
    console.log(`   ID: ${existing.id}`);

    // S'assurer qu'il est public
    if (!existing.public) {
      console.log("⚠️  Le bucket n'est pas public, mise à jour...");
      const { error: updateError } = await supabase.storage.updateBucket("images", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
        fileSizeLimit: 2 * 1024 * 1024, // 2 Mo
      });

      if (updateError) {
        console.error("❌ Erreur lors de la mise à jour :", updateError.message);
        process.exit(1);
      }
      console.log("✅ Bucket mis à jour en mode public !");
    }
    return;
  }

  // Créer le bucket
  const { data, error } = await supabase.storage.createBucket("images", {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    fileSizeLimit: 2 * 1024 * 1024, // 2 Mo
  });

  if (error) {
    console.error("❌ Erreur lors de la création du bucket :", error.message);
    console.error("");
    console.error("💡 Si l'erreur est liée aux permissions, tu dois :");
    console.error("   1. Ajouter SUPABASE_SERVICE_ROLE_KEY dans .env.local");
    console.error("   2. Ou créer le bucket manuellement dans le dashboard Supabase :");
    console.error("      Storage → New Bucket → Nom: images → Public: ON → Save");
    process.exit(1);
  }

  console.log("✅ Bucket 'images' créé avec succès !");
  console.log(`   ID: ${data.name}`);
  console.log("   Public: true");
  console.log("   Types autorisés: JPEG, PNG, WebP, SVG");
  console.log("   Taille max: 2 Mo");
}

main().catch(console.error);
