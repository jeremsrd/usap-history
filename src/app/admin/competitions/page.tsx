import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CompetitionList from "./CompetitionList";

export default async function AdminCompetitionsPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const competitions = await prisma.competition.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      shortName: true,
      type: true,
      isActive: true,
      _count: { select: { matches: true } },
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
          <span className="text-usap-or">des compétitions</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Championnats, coupes et compétitions référencés.
        </p>
      </div>

      {/* Liste */}
      <CompetitionList competitions={competitions} />
    </div>
  );
}
