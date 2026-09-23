import { revalidatePath, revalidateTag } from "next/cache";
import { TAG_CONTENU } from "@/lib/cache";
import { NextResponse } from "next/server";

/**
 * Purge du cache des pages, après une saisie.
 *
 * **LES FICHES SONT EN CACHE SEPT JOURS** (`HISTORIQUE` de `lib/cache.ts`),
 * parce qu'un site d'histoire ne change presque jamais et qu'une
 * revalidation horaire sur 2 948 pages épuisait le quota Vercel en moins de
 * trois jours. Le prix de cette durée est cette route : sans elle, la fiche
 * d'un match saisi le lendemain resterait périmée une semaine.
 *
 * Elle est appelée par `scripts/purger-cache.ts`, dernier temps de la marche
 * du « lendemain d'un match ». L'admin, lui, n'en a pas besoin : ses actions
 * appellent `revalidatePath` directement, étant déjà dans le serveur.
 *
 * ------------------------------------------------------------------------
 * POURQUOI UN SECRET, ET PAS LA SESSION SUPABASE
 *
 * Un script de la chaîne tourne sur le poste de Jérémy, sans navigateur ni
 * cookie : il ne peut pas présenter la session qui garde `/admin`. Le secret
 * vit donc dans `REVALIDATE_SECRET`, côté Vercel et dans le `.env` local, et
 * **jamais dans le dépôt**.
 *
 * Sans secret configuré, la route refuse tout : une purge ouverte serait un
 * moyen commode de faire recalculer le site entier à volonté, c'est-à-dire
 * exactement le gaspillage qu'on vient de corriger.
 */
export async function POST(requete: Request) {
  const attendu = process.env.REVALIDATE_SECRET;
  if (!attendu) {
    return NextResponse.json(
      { erreur: "REVALIDATE_SECRET n'est pas configuré sur ce déploiement" },
      { status: 503 },
    );
  }
  if (requete.headers.get("x-revalidate-secret") !== attendu) {
    return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  }

  let chemins: unknown;
  try {
    ({ chemins } = await requete.json());
  } catch {
    return NextResponse.json({ erreur: "corps JSON attendu" }, { status: 400 });
  }
  if (!Array.isArray(chemins) || chemins.some((c) => typeof c !== "string")) {
    return NextResponse.json(
      { erreur: 'un tableau `chemins` de chaînes est attendu, ex. ["/[locale]/matchs/[slug]"]' },
      { status: 400 },
    );
  }

  // **Les chemins sont donnés dans leur forme de route**, avec leurs segments
  // dynamiques — `/[locale]/matchs/[slug]` et non `/fr/matchs/le-slug` : le
  // type "page" purge alors toutes les pages de cette route, les deux langues
  // comprises. C'est ce que fait déjà l'admin, et c'est ce qu'on veut après
  // une saisie, qui touche la fiche du match mais aussi les classements, les
  // records et la page de saison.
  for (const chemin of chemins as string[]) {
    revalidatePath(chemin, "page");
  }

  // **ET LE TAG, SANS QUOI LA MOITIÉ DU TRAVAIL RESTE FAITE.** Les pages qui
  // lisent `searchParams` — matchs, joueurs, adversaires, fiche de stade —
  // sont dynamiques : `revalidatePath` ne les concerne pas, ce sont leurs
  // `unstable_cache` qui portent la donnée. Le pied de page est dans le même
  // cas sur les trente-six pages. Un `unstable_cache` sans tag survit à la
  // purge de la page qui l'emploie.
  revalidateTag(TAG_CONTENU);

  return NextResponse.json({ purges: chemins.length, tag: TAG_CONTENU, chemins });
}
