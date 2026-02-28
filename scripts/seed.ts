// =============================================================================
// USAP HISTORY - Script de seed initial
// Données de démarrage avec le palmarès et quelques saisons/joueurs emblématiques
// Usage : npx tsx scripts/seed.ts
// =============================================================================

import {
  PrismaClient,
  Division,
  CompetitionType,
  MatchResult,
  TrophyType,
  Position,
  Continent,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏉 Début du seed USAP History...\n");

  // =========================================================================
  // 1. PAYS
  // =========================================================================
  console.log("🌍 Création des pays...");

  const [france, nouvelleZelande, afriqueDuSud, nouvelleCaledonie] =
    await Promise.all([
      prisma.country.create({
        data: {
          name: "France",
          code: "FR",
          continent: Continent.EUROPE,
        },
      }),
      prisma.country.create({
        data: {
          name: "Nouvelle-Zélande",
          code: "NZ",
          continent: Continent.OCEANIE,
        },
      }),
      prisma.country.create({
        data: {
          name: "Afrique du Sud",
          code: "ZA",
          continent: Continent.AFRIQUE,
        },
      }),
      prisma.country.create({
        data: {
          name: "Nouvelle-Calédonie",
          code: "NC",
          continent: Continent.OCEANIE,
        },
      }),
    ]);

  // =========================================================================
  // 2. COMPÉTITIONS
  // =========================================================================
  console.log("📋 Création des compétitions...");

  const [top14, proD2, hCup, challengeEuro, duManoir, premiereSerie] =
    await Promise.all([
      prisma.competition.create({
        data: {
          name: "Championnat de France Top 14",
          shortName: "Top 14",
          type: CompetitionType.CHAMPIONNAT,
        },
      }),
      prisma.competition.create({
        data: {
          name: "Pro D2",
          shortName: "Pro D2",
          type: CompetitionType.CHAMPIONNAT,
        },
      }),
      prisma.competition.create({
        data: {
          name: "Coupe d'Europe / Champions Cup",
          shortName: "H-Cup",
          type: CompetitionType.COUPE_EUROPE,
        },
      }),
      prisma.competition.create({
        data: {
          name: "Challenge Européen",
          shortName: "Challenge",
          type: CompetitionType.CHALLENGE_EUROPE,
        },
      }),
      prisma.competition.create({
        data: {
          name: "Challenge Yves du Manoir",
          shortName: "Du Manoir",
          type: CompetitionType.COUPE_FRANCE,
          isActive: false,
        },
      }),
      prisma.competition.create({
        data: {
          name: "Championnat de France 1ère série",
          shortName: "1ère série",
          type: CompetitionType.CHAMPIONNAT,
          isActive: false,
        },
      }),
    ]);

  // =========================================================================
  // 3. STADES
  // =========================================================================
  console.log("🏟️  Création des stades...");

  const [aimeGiral, stadeDeFrance, montjuic] = await Promise.all([
    prisma.venue.create({
      data: {
        name: "Stade Aimé-Giral",
        city: "Perpignan",
        countryId: france.id,
        capacity: 14500,
        yearOpened: 1937,
        isHomeGround: true,
        notes:
          "Stade historique de l'USAP, nommé en hommage à Aimé Giral, joueur mort pendant la Première Guerre mondiale.",
      },
    }),
    prisma.venue.create({
      data: {
        name: "Stade de France",
        city: "Saint-Denis",
        countryId: france.id,
        capacity: 80698,
        isHomeGround: false,
      },
    }),
    prisma.venue.create({
      data: {
        name: "Stade Olympique de Montjuïc",
        city: "Barcelone",
        capacity: 55000,
        isHomeGround: false,
        notes:
          "L'USAP y a délocalisé plusieurs matchs pour promouvoir l'identité catalane.",
      },
    }),
  ]);

  // =========================================================================
  // 4. ENTRAÎNEURS & PRÉSIDENTS
  // =========================================================================
  console.log("🎓 Création des entraîneurs et présidents...");

  const [brutus, brunel, arlettaz] = await Promise.all([
    prisma.coach.create({
      data: {
        firstName: "Gilbert",
        lastName: "Brutus",
        role: "Entraîneur principal",
        biography:
          "Légende de l'USAP, son nom a été donné au stade (avant le renommage en Aimé-Giral).",
      },
    }),
    prisma.coach.create({
      data: {
        firstName: "Jacques",
        lastName: "Brunel",
        role: "Entraîneur principal",
        biography:
          "Artisan du titre de 2009 et de la finale de Coupe d'Europe 2003. Futur sélectionneur du XV de France.",
      },
    }),
    prisma.coach.create({
      data: {
        firstName: "Patrick",
        lastName: "Arlettaz",
        role: "Entraîneur principal",
        biography: "Entraîneur principal actuel de l'USAP.",
      },
    }),
  ]);

  const [goze, riviere] = await Promise.all([
    prisma.president.create({
      data: {
        firstName: "Paul",
        lastName: "Goze",
        startYear: 2000,
        endYear: 2012,
      },
    }),
    prisma.president.create({
      data: {
        firstName: "François",
        lastName: "Rivière",
        startYear: 2016,
      },
    }),
  ]);

  // =========================================================================
  // 5. PALMARÈS
  // =========================================================================
  console.log("🏆 Création du palmarès...");

  const trophees = [
    { year: 1914, competition: "Championnat de France", achievement: TrophyType.CHAMPION, opponent: "Stado Tarbes", score: "8-7", venue: "Toulouse" },
    { year: 1921, competition: "Championnat de France", achievement: TrophyType.CHAMPION, opponent: "Stade Toulousain", score: "5-0", venue: "Béziers" },
    { year: 1925, competition: "Championnat de France", achievement: TrophyType.CHAMPION, opponent: "AS Carcassonne", score: "5-0", venue: "Béziers", details: "Première finale annulée (0-0) à cause de la pluie. Rejouée la semaine suivante." },
    { year: 1938, competition: "Championnat de France", achievement: TrophyType.CHAMPION, opponent: "Biarritz", score: "11-6", venue: "Toulouse" },
    { year: 1944, competition: "Championnat de France", achievement: TrophyType.CHAMPION, opponent: "Aviron Bayonnais", score: "20-5", venue: "Paris" },
    { year: 1955, competition: "Championnat de France", achievement: TrophyType.CHAMPION, opponent: "FC Lourdes", score: "11-6", venue: "Bordeaux" },
    { year: 2009, competition: "Championnat de France Top 14", achievement: TrophyType.CHAMPION, opponent: "ASM Clermont", score: "22-13", venue: "Stade de France, Paris" },
    { year: 1924, competition: "Championnat de France", achievement: TrophyType.FINALISTE, opponent: "Stade Toulousain" },
    { year: 1926, competition: "Championnat de France", achievement: TrophyType.FINALISTE, opponent: "Stade Toulousain" },
    { year: 1935, competition: "Championnat de France", achievement: TrophyType.FINALISTE, opponent: "Biarritz" },
    { year: 1939, competition: "Championnat de France", achievement: TrophyType.FINALISTE, opponent: "Biarritz" },
    { year: 1952, competition: "Championnat de France", achievement: TrophyType.FINALISTE, opponent: "FC Lourdes" },
    { year: 1977, competition: "Championnat de France", achievement: TrophyType.FINALISTE, opponent: "Béziers" },
    { year: 1998, competition: "Championnat de France", achievement: TrophyType.FINALISTE, opponent: "Stade Français" },
    { year: 2004, competition: "Championnat de France Top 14", achievement: TrophyType.FINALISTE, opponent: "Stade Français" },
    { year: 2010, competition: "Championnat de France Top 14", achievement: TrophyType.FINALISTE, opponent: "RC Toulon" },
    { year: 2018, competition: "Pro D2", achievement: TrophyType.CHAMPION, opponent: "Grenoble" },
    { year: 2021, competition: "Pro D2", achievement: TrophyType.CHAMPION, opponent: "Biarritz", score: "33-14" },
    { year: 1935, competition: "Challenge Yves du Manoir", achievement: TrophyType.VAINQUEUR_COUPE },
    { year: 1955, competition: "Challenge Yves du Manoir", achievement: TrophyType.VAINQUEUR_COUPE },
    { year: 1994, competition: "Challenge Yves du Manoir", achievement: TrophyType.VAINQUEUR_COUPE },
    { year: 2003, competition: "Coupe d'Europe", achievement: TrophyType.FINALISTE, opponent: "Toulouse", score: "17-22", venue: "Lansdowne Road, Dublin" },
  ];

  for (const t of trophees) {
    await prisma.trophy.create({ data: t });
  }

  // =========================================================================
  // 6. ADVERSAIRES
  // =========================================================================
  console.log("🏴 Création des adversaires...");

  const [clermont, toulouse, toulon, stadefrancais, biarritzOpp] =
    await Promise.all([
      prisma.opponent.create({
        data: {
          name: "ASM Clermont Auvergne",
          shortName: "Clermont",
          city: "Clermont-Ferrand",
          countryId: france.id,
          primaryColor: "#FFD700",
          secondaryColor: "#003DA5",
        },
      }),
      prisma.opponent.create({
        data: {
          name: "Stade Toulousain",
          shortName: "Toulouse",
          city: "Toulouse",
          countryId: france.id,
          primaryColor: "#CC0000",
          secondaryColor: "#000000",
        },
      }),
      prisma.opponent.create({
        data: {
          name: "RC Toulon",
          shortName: "Toulon",
          city: "Toulon",
          countryId: france.id,
          primaryColor: "#CC0000",
          secondaryColor: "#FFFFFF",
        },
      }),
      prisma.opponent.create({
        data: {
          name: "Stade Français Paris",
          shortName: "Stade Français",
          city: "Paris",
          countryId: france.id,
          primaryColor: "#FF69B4",
          secondaryColor: "#00008B",
        },
      }),
      prisma.opponent.create({
        data: {
          name: "Biarritz Olympique",
          shortName: "Biarritz",
          city: "Biarritz",
          countryId: france.id,
          primaryColor: "#FF0000",
          secondaryColor: "#FFFFFF",
        },
      }),
    ]);

  // =========================================================================
  // 7. JOUEURS EMBLÉMATIQUES
  // =========================================================================
  console.log("👤 Création de joueurs emblématiques...");

  const joueurs = await Promise.all([
    prisma.player.create({
      data: {
        firstName: "Nicolas",
        lastName: "Mas",
        birthDate: new Date("1980-09-22"),
        birthPlace: "Perpignan",
        birthCountryId: france.id,
        nationalityId: france.id,
        position: Position.PILIER_DROIT,
        biography:
          "Pilier droit emblématique de l'USAP et du XV de France. Capitaine de l'USAP lors du titre de champion de France 2009.",
      },
    }),
    prisma.player.create({
      data: {
        firstName: "Dan",
        lastName: "Carter",
        birthDate: new Date("1982-03-05"),
        birthPlace: "Southbridge",
        birthCountryId: nouvelleZelande.id,
        nationalityId: nouvelleZelande.id,
        position: Position.DEMI_OUVERTURE,
        biography:
          "Légende des All Blacks, Dan Carter a porté les couleurs de l'USAP lors de la saison 2008-2009. Blessé après 5 matchs.",
      },
    }),
    prisma.player.create({
      data: {
        firstName: "Percy",
        lastName: "Montgomery",
        birthDate: new Date("1974-03-15"),
        birthPlace: "Walvis Bay",
        birthCountryId: afriqueDuSud.id,
        nationalityId: afriqueDuSud.id,
        position: Position.ARRIERE,
        biography:
          "Arrière champion du monde 2007 avec l'Afrique du Sud. A joué deux saisons à l'USAP (2007-2009).",
      },
    }),
    prisma.player.create({
      data: {
        firstName: "Jean-François",
        lastName: "Imbernon",
        birthDate: new Date("1950-04-09"),
        birthPlace: "Perpignan",
        birthCountryId: france.id,
        nationalityId: france.id,
        position: Position.DEUXIEME_LIGNE,
        biography:
          "Deuxième ligne perpignanais, pilier de l'USAP dans les années 1970. Finaliste du championnat en 1977.",
      },
    }),
    prisma.player.create({
      data: {
        firstName: "Melvyn",
        lastName: "Jaminet",
        birthDate: new Date("1999-07-01"),
        birthPlace: "Toulouse",
        birthCountryId: france.id,
        nationalityId: france.id,
        position: Position.ARRIERE,
        biography:
          "Arrière formé à l'USAP, révélé lors de la tournée du XV de France en Australie en 2021.",
      },
    }),
    prisma.player.create({
      data: {
        firstName: "Aimé",
        lastName: "Giral",
        birthDate: new Date("1891-01-01"),
        deathDate: new Date("1915-03-11"),
        birthPlace: "Perpignan",
        birthCountryId: france.id,
        nationalityId: france.id,
        position: Position.DEMI_OUVERTURE,
        biography:
          "Joueur de l'ASP, mort au combat pendant la Première Guerre mondiale le 11 mars 1915. Le stade de l'USAP porte son nom en son hommage.",
      },
    }),
    prisma.player.create({
      data: {
        firstName: "Joseph",
        lastName: "Desclaux",
        birthPlace: "Perpignan",
        birthCountryId: france.id,
        nationalityId: france.id,
        position: Position.CENTRE,
        biography:
          'Surnommé "Jep", joueur emblématique des années 1930-1940. Champion de France 1938 et 1944.',
      },
    }),
    prisma.player.create({
      data: {
        firstName: "Sébastien",
        lastName: "Vahaamahina",
        birthDate: new Date("1991-02-12"),
        birthPlace: "Nouméa",
        birthCountryId: nouvelleCaledonie.id,
        nationalityId: france.id,
        position: Position.DEUXIEME_LIGNE,
        biography:
          "Deuxième ligne puissant, formé à l'USAP avant de rejoindre Clermont puis de revenir à Perpignan.",
      },
    }),
  ]);

  // =========================================================================
  // 8. SAISONS
  // =========================================================================
  console.log("📅 Création des saisons...");

  const saison2009 = await prisma.season.create({
    data: {
      startYear: 2008,
      endYear: 2009,
      label: "2008-2009",
      division: Division.TOP_14,
      finalRanking: 1,
      champion: true,
      coachId: brunel.id,
      presidentId: goze.id,
      notes:
        "Saison historique : 7ème titre de champion de France. Victoire en finale contre Clermont 22-13 au Stade de France.",
    },
  });

  await prisma.season.create({
    data: {
      startYear: 2024,
      endYear: 2025,
      label: "2024-2025",
      division: Division.TOP_14,
      coachId: arlettaz.id,
      presidentId: riviere.id,
      notes: "Retour en Top 14. Saison difficile avec un objectif de maintien.",
    },
  });

  // =========================================================================
  // 9. MATCH EXEMPLE : Finale 2009
  // =========================================================================
  console.log("⚽ Création du match (finale 2009)...");

  await prisma.match.create({
    data: {
      date: new Date("2009-06-06"),
      kickoffTime: "21:00",
      seasonId: saison2009.id,
      competitionId: top14.id,
      round: "Finale",
      isHome: false,
      venueId: stadeDeFrance.id,
      isNeutralVenue: true,
      opponentId: clermont.id,
      scoreUsap: 22,
      scoreOpponent: 13,
      result: MatchResult.VICTOIRE,
      attendance: 79741,
      report:
        "L'USAP remporte son 7ème titre de champion de France devant 79 741 spectateurs au Stade de France. Les Catalans dominent Clermont grâce à une défense héroïque et le pied de Nicolas Laharrague.",
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 5,
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 2,
    },
  });

  console.log("\n✅ Seed terminé avec succès !");
  console.log("   - Pays : 4");
  console.log("   - Compétitions : 6");
  console.log("   - Trophées : " + trophees.length);
  console.log("   - Stades : 3");
  console.log("   - Entraîneurs : 3");
  console.log("   - Présidents : 2");
  console.log("   - Adversaires : 5");
  console.log("   - Joueurs : " + joueurs.length);
  console.log("   - Saisons : 2");
  console.log("   - Matchs : 1 (finale 2009)");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
