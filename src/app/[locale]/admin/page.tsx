import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier le rôle dans la table users — auto-créer le 1er utilisateur en ADMIN
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      // Premier utilisateur → ADMIN automatiquement
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email ?? "",
          role: "ADMIN",
        },
      });
    } else {
      // Pas le premier → pas d'accès admin
      redirect("/");
    }
  }

  if (dbUser.role === "VIEWER") {
    redirect("/");
  }

  // Récupérer les stats pour le dashboard
  const [playerCount, matchCount, seasonCount, trophyCount, countryCount, venueCount, competitionCount, coachCount, presidentCount, refereeCount] =
    await Promise.all([
      prisma.player.count(),
      prisma.match.count(),
      prisma.season.count(),
      prisma.trophy.count(),
      prisma.country.count(),
      prisma.venue.count(),
      prisma.competition.count(),
      prisma.coach.count(),
      prisma.president.count(),
      prisma.referee.count(),
    ]);

  return (
    <AdminDashboard
      user={{ email: user.email ?? "", name: dbUser.name, role: dbUser.role }}
      stats={{
        players: playerCount,
        matches: matchCount,
        seasons: seasonCount,
        trophies: trophyCount,
        countries: countryCount,
        venues: venueCount,
        competitions: competitionCount,
        coaches: coachCount,
        presidents: presidentCount,
        referees: refereeCount,
      }}
    />
  );
}
