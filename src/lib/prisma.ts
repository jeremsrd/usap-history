import { PrismaClient } from "@prisma/client";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPrismaUrl(): string {
  let url = process.env.DATABASE_URL ?? "";
  const ajouter = (param: string) => {
    url += `${url.includes("?") ? "&" : "?"}${param}`;
  };
  // Ajouter connection_limit=1 si absent, pour éviter de saturer le pooler Supabase
  if (!url.includes("connection_limit")) ajouter("connection_limit=1");
  // **Au build, une attente d'une minute au lieu de dix secondes.** Le build
  // de Vercel tourne à Washington, la base est à Francfort, et il pré-rend
  // soixante-dix pages en parallèle sur une connexion par processus : une
  // page lourde la tient assez longtemps pour que la suivante abandonne
  // (P2024). Les trois déploiements du 23 septembre au 4 octobre 2026 ont
  // échoué ainsi, chacun sur une page différente. Hors build, une requête
  // qui attend dix secondes a un autre problème, et la valeur par défaut reste.
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD && !url.includes("pool_timeout")) {
    ajouter("pool_timeout=60");
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildPrismaUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
