import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import SeasonList from "./SeasonList";

export default async function AdminSaisonsPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const seasons = await prisma.season.findMany({
    orderBy: { startYear: "desc" },
    select: {
      id: true,
      label: true,
      startYear: true,
      endYear: true,
      division: true,
      _count: { select: { matches: true, seasonPlayers: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Retour au dashboard
        </Link>
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          <span className="text-usap-sang">Gestion</span>{" "}
          <span className="text-usap-or">des saisons</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisons de l&apos;USAP depuis 1902.
        </p>
      </div>

      {/* Liste */}
      <SeasonList seasons={seasons} />
    </div>
  );
}
