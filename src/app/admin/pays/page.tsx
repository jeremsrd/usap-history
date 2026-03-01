import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import CountryList from "./CountryList";

export default async function AdminPaysPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const countries = await prisma.country.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      continent: true,
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
          <span className="text-usap-or">des pays</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pays et nations référencés dans la base de données.
        </p>
      </div>

      {/* Liste */}
      <CountryList countries={countries} />
    </div>
  );
}
