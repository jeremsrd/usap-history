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

  // **PLUS DE CRÉATION D'ADMINISTRATEUR D'OFFICE.** Ce tableau de bord
  // inscrivait le demandeur en `ADMIN` quand la table `users` était vide, ce
  // qui en faisait la seule porte du site à délivrer un droit au lieu de le
  // vérifier. Le risque n'était pas théorique : la page de connexion porte un
  // formulaire d'inscription ouvert, si bien qu'une table vidée — une
  // migration, une remise à zéro — aurait donné l'administration au premier
  // venu. Arbitré par Jérémy le 9 septembre 2026.
  //
  // Le garde est désormais celui des douze autres pages d'admin, au mot près :
  // une fiche absente vaut refus, comme un rôle de simple lecteur.
  //
  // **Amorçage** : sans ligne dans `users`, l'administration est close pour
  // tout le monde, et c'est voulu. La première s'écrit à la main dans
  // Supabase, l'identifiant étant celui du compte d'authentification :
  //   insert into users (id, email, role) values ('<uuid auth>', '<courriel>', 'ADMIN');
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

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
