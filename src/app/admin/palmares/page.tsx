import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import TrophyList from "./TrophyList";

export default async function AdminPalmaresPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const trophies = await prisma.trophy.findMany({
    orderBy: [{ year: "desc" }],
    select: {
      id: true,
      year: true,
      competition: true,
      achievement: true,
      opponent: true,
      score: true,
      venue: true,
      details: true,
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
          <span className="text-usap-or">du palmarès</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Titres, finales et performances remarquables de l&apos;USAP.
        </p>
      </div>

      {/* Liste */}
      <TrophyList trophies={trophies} />
    </div>
  );
}
