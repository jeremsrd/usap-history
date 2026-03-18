import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPrismaUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  // Ajouter connection_limit=1 si absent, pour éviter de saturer le pooler Supabase
  if (base.includes("connection_limit")) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}connection_limit=1`;
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
