// =============================================================================
// USAP HISTORY - Script de seed initial
// Données de démarrage avec le palmarès et quelques saisons/joueurs emblématiques
// Usage : npx ts-node scripts/seed.ts
// =============================================================================

import { PrismaClient, Division, CompetitionType, MatchResult, TrophyType, Position } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏉 Début du seed USAP History...\n');

  // =========================================================================
  // 1. COMPÉTITIONS
  // =========================================================================
  console.log('📋 Création des compétitions...');

  const competitions = await Promise.all([
    prisma.competition.create({
      data: {
        name: 'Championnat de France Top 14',
        shortName: 'Top 14',
        type: CompetitionType.CHAMPIONNAT,
        country: 'France',
      },
    }),
    prisma.competition.create({
      data: {
        name: 'Pro D2',
        shortName: 'Pro D2',
        type: CompetitionType.CHAMPIONNAT,
        country: 'France',
      },
    }),
    prisma.competition.create({
      data: {
        name: 'Coupe d\'Europe / Champions Cup',
        shortName: 'H-Cup',
        type: CompetitionType.COUPE_EUROPE,
        country: 'Europe',
      },
    }),
    prisma.competition.create({
      data: {
        name: 'Challenge Européen',
        shortName: 'Challenge',
        type: CompetitionType.CHALLENGE_EUROPE,
        country: 'Europe',
      },
    }),
    prisma.competition.create({
      data: {
        name: 'Challenge Yves du Manoir',
        shortName: 'Du Manoir',
        type: CompetitionType.COUPE_FRANCE,
        country: 'France',
        isActive: false,
      },
    }),
    prisma.competition.create({
      data: {
        name: 'Championnat de France 1ère série',
        shortName: '1ère série',
        type: CompetitionType.CHAMPIONNAT,
        country: 'France',
        isActive: false,
      },
    }),
  ]);

  const [top14, proD2, hCup, challenge, duManoir, premiereSerie] = competitions;

  // =========================================================================
  // 2. PALMARÈS
  // =========================================================================
  console.log('🏆 Création du palmarès...');

  const trophees = [
    // Titres de champion
    { year: 1914, competition: 'Championnat de France', achievement: TrophyType.CHAMPION, opponent: 'Stado Tarbes', score: '8-7', venue: 'Toulouse' },
    { year: 1921, competition: 'Championnat de France', achievement: TrophyType.CHAMPION, opponent: 'Stade Toulousain', score: '5-0', venue: 'Béziers' },
    { year: 1925, competition: 'Championnat de France', achievement: TrophyType.CHAMPION, opponent: 'AS Carcassonne', score: '5-0', venue: 'Béziers', details: 'Première finale annulée (0-0) à cause de la pluie. Rejouée la semaine suivante.' },
    { year: 1938, competition: 'Championnat de France', achievement: TrophyType.CHAMPION, opponent: 'Biarritz', score: '11-6', venue: 'Toulouse' },
    { year: 1944, competition: 'Championnat de France', achievement: TrophyType.CHAMPION, opponent: 'Aviron Bayonnais', score: '20-5', venue: 'Paris' },
    { year: 1955, competition: 'Championnat de France', achievement: TrophyType.CHAMPION, opponent: 'FC Lourdes', score: '11-6', venue: 'Bordeaux' },
    { year: 2009, competition: 'Championnat de France Top 14', achievement: TrophyType.CHAMPION, opponent: 'ASM Clermont', score: '22-13', venue: 'Stade de France, Paris' },

    // Finales perdues
    { year: 1924, competition: 'Championnat de France', achievement: TrophyType.FINALISTE, opponent: 'Stade Toulousain' },
    { year: 1926, competition: 'Championnat de France', achievement: TrophyType.FINALISTE, opponent: 'Stade Toulousain' },
    { year: 1935, competition: 'Championnat de France', achievement: TrophyType.FINALISTE, opponent: 'Biarritz' },
    { year: 1939, competition: 'Championnat de France', achievement: TrophyType.FINALISTE, opponent: 'Biarritz' },
    { year: 1952, competition: 'Championnat de France', achievement: TrophyType.FINALISTE, opponent: 'FC Lourdes' },
    { year: 1977, competition: 'Championnat de France', achievement: TrophyType.FINALISTE, opponent: 'Béziers' },
    { year: 1998, competition: 'Championnat de France', achievement: TrophyType.FINALISTE, opponent: 'Stade Français' },
    { year: 2004, competition: 'Championnat de France Top 14', achievement: TrophyType.FINALISTE, opponent: 'Stade Français' },
    { year: 2010, competition: 'Championnat de France Top 14', achievement: TrophyType.FINALISTE, opponent: 'RC Toulon' },

    // Pro D2
    { year: 2018, competition: 'Pro D2', achievement: TrophyType.CHAMPION, opponent: 'Grenoble' },
    { year: 2021, competition: 'Pro D2', achievement: TrophyType.CHAMPION, opponent: 'Biarritz', score: '33-14' },

    // Yves du Manoir
    { year: 1935, competition: 'Challenge Yves du Manoir', achievement: TrophyType.VAINQUEUR_COUPE },
    { year: 1955, competition: 'Challenge Yves du Manoir', achievement: TrophyType.VAINQUEUR_COUPE },
    { year: 1994, competition: 'Challenge Yves du Manoir', achievement: TrophyType.VAINQUEUR_COUPE },

    // Coupe d'Europe
    { year: 2003, competition: 'Coupe d\'Europe', achievement: TrophyType.FINALISTE, opponent: 'Toulouse', score: '17-22', venue: 'Lansdowne Road, Dublin' },
  ];

  for (const t of trophees) {
    await prisma.trophy.create({ data: t });
  }

  // =========================================================================
  // 3. STADES
  // =========================================================================
  console.log('🏟️ Création des stades...');

  await prisma.venue.createMany({
    data: [
      { name: 'Stade Aimé-Giral', city: 'Perpignan', capacity: 14500, yearOpened: 1937, isHomeGround: true, notes: 'Stade historique de l\'USAP, nommé en hommage à Aimé Giral, joueur mort pendant la Première Guerre mondiale.' },
      { name: 'Stade Gilbert Brutus', city: 'Perpignan', capacity: 14500, isHomeGround: true, notes: 'Ancien nom du stade Aimé-Giral (avant renommage).' },
      { name: 'Stade de France', city: 'Saint-Denis', capacity: 80698, isHomeGround: false },
      { name: 'Stade Olympique de Montjuïc', city: 'Barcelone', capacity: 55000, isHomeGround: false, notes: 'L\'USAP y a délocalisé plusieurs matchs pour promouvoir l\'identité catalane.' },
    ],
  });

  // =========================================================================
  // 4. QUELQUES JOUEURS EMBLÉMATIQUES
  // =========================================================================
  console.log('👤 Création de joueurs emblématiques...');

  const joueurs = await Promise.all([
    prisma.player.create({
      data: {
        firstName: 'Nicolas',
        lastName: 'Mas',
        birthDate: new Date('1980-09-22'),
        birthPlace: 'Perpignan',
        birthCountry: 'France',
        nationality: 'Française',
        position: Position.PILIER_DROIT,
        isInternational: true,
        internationalTeam: 'France',
        internationalCaps: 76,
        biography: 'Pilier droit emblématique de l\'USAP et du XV de France. Capitaine de l\'USAP lors du titre de champion de France 2009.',
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Dan',
        lastName: 'Carter',
        birthDate: new Date('1982-03-05'),
        birthPlace: 'Southbridge',
        birthCountry: 'Nouvelle-Zélande',
        nationality: 'Néo-Zélandaise',
        position: Position.DEMI_OUVERTURE,
        isInternational: true,
        internationalTeam: 'Nouvelle-Zélande',
        internationalCaps: 112,
        biography: 'Légende des All Blacks, Dan Carter a porté les couleurs de l\'USAP lors de la saison 2008-2009. Blessé après 5 matchs.',
        usapDebutDate: new Date('2008-12-14'),
        usapDepartDate: new Date('2009-02-01'),
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Percy',
        lastName: 'Montgomery',
        birthDate: new Date('1974-03-15'),
        birthPlace: 'Walvis Bay',
        birthCountry: 'Afrique du Sud',
        nationality: 'Sud-Africaine',
        position: Position.ARRIERE,
        isInternational: true,
        internationalTeam: 'Afrique du Sud',
        internationalCaps: 102,
        biography: 'Arrière champion du monde 2007 avec l\'Afrique du Sud. A joué deux saisons à l\'USAP (2007-2009).',
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Jean-François',
        lastName: 'Imbernon',
        birthDate: new Date('1950-04-09'),
        birthPlace: 'Perpignan',
        birthCountry: 'France',
        nationality: 'Française',
        position: Position.DEUXIEME_LIGNE,
        isInternational: true,
        internationalTeam: 'France',
        internationalCaps: 33,
        biography: 'Deuxième ligne perpignanais, pilier de l\'USAP dans les années 1970. Finaliste du championnat en 1977.',
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Melvyn',
        lastName: 'Jaminet',
        birthDate: new Date('1999-07-01'),
        birthPlace: 'Toulouse',
        birthCountry: 'France',
        nationality: 'Française',
        position: Position.ARRIERE,
        isInternational: true,
        internationalTeam: 'France',
        biography: 'Arrière formé à l\'USAP, révélé lors de la tournée du XV de France en Australie en 2021.',
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Aimé',
        lastName: 'Giral',
        birthDate: new Date('1891-01-01'),
        birthPlace: 'Perpignan',
        birthCountry: 'France',
        nationality: 'Française',
        position: Position.DEMI_OUVERTURE,
        isInternational: false,
        biography: 'Joueur de l\'ASP, mort au combat pendant la Première Guerre mondiale le 11 mars 1915. Le stade de l\'USAP porte son nom en son hommage.',
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Joseph',
        lastName: 'Desclaux',
        birthPlace: 'Perpignan',
        birthCountry: 'France',
        nationality: 'Française',
        position: Position.CENTRE,
        isInternational: true,
        internationalTeam: 'France',
        biography: 'Surnommé "Jep", joueur emblématique des années 1930-1940. Champion de France 1938 et 1944.',
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Sébastien',
        lastName: 'Vahaamahina',
        birthDate: new Date('1991-02-12'),
        birthPlace: 'Nouméa',
        birthCountry: 'Nouvelle-Calédonie',
        nationality: 'Française',
        position: Position.DEUXIEME_LIGNE,
        isInternational: true,
        internationalTeam: 'France',
        internationalCaps: 46,
        biography: 'Deuxième ligne puissant, formé à l\'USAP avant de rejoindre Clermont puis de revenir à Perpignan.',
      },
    }),
  ]);

  // =========================================================================
  // 5. SAISON EXEMPLE : 2008-2009 (Titre de champion !)
  // =========================================================================
  console.log('📅 Création de la saison 2008-2009 (titre de champion)...');

  const saison2009 = await prisma.season.create({
    data: {
      startYear: 2008,
      endYear: 2009,
      label: '2008-2009',
      division: Division.TOP_14,
      finalRanking: 1,
      champion: true,
      coachName: 'Jacques Brunel',
      presidentName: 'Paul Goze',
      notes: 'Saison historique : 7ème titre de champion de France. Victoire en finale contre Clermont 22-13 au Stade de France.',
    },
  });

  // Finale 2009
  await prisma.match.create({
    data: {
      date: new Date('2009-06-06'),
      kickoffTime: '21:00',
      seasonId: saison2009.id,
      competitionId: top14.id,
      round: 'Finale',
      isHome: false,
      venue: 'Stade de France',
      city: 'Saint-Denis',
      isNeutralVenue: true,
      opponent: 'ASM Clermont Auvergne',
      scoreUsap: 22,
      scoreOpponent: 13,
      result: MatchResult.VICTOIRE,
      attendance: 79741,
      report: 'L\'USAP remporte son 7ème titre de champion de France devant 79 741 spectateurs au Stade de France. Les Catalans dominent Clermont grâce à une défense héroïque et le pied de Nicolas Laharrague.',
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 5,
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 2,
    },
  });

  // =========================================================================
  // 6. SAISON EXEMPLE : 2024-2025 (saison actuelle)
  // =========================================================================
  console.log('📅 Création de la saison 2024-2025...');

  const saison2025 = await prisma.season.create({
    data: {
      startYear: 2024,
      endYear: 2025,
      label: '2024-2025',
      division: Division.TOP_14,
      coachName: 'Patrick Arlettaz',
      notes: 'Retour en Top 14. Saison difficile avec un objectif de maintien.',
    },
  });

  // =========================================================================
  // 7. COACHES HISTORIQUES
  // =========================================================================
  console.log('🎓 Création des entraîneurs...');

  await prisma.coach.createMany({
    data: [
      { firstName: 'Gilbert', lastName: 'Brutus', role: 'Entraîneur principal', biography: 'Légende de l\'USAP, son nom a été donné au stade (avant le renommage en Aimé-Giral).' },
      { firstName: 'Jacques', lastName: 'Brunel', role: 'Entraîneur principal', startDate: new Date('2002-07-01'), endDate: new Date('2012-06-30'), biography: 'Artisan du titre de 2009 et de la finale de Coupe d\'Europe 2003. Futur sélectionneur du XV de France.' },
      { firstName: 'Patrick', lastName: 'Arlettaz', role: 'Entraîneur principal', startDate: new Date('2023-07-01'), biography: 'Entraîneur principal actuel de l\'USAP.' },
    ],
  });

  console.log('\n✅ Seed terminé avec succès !');
  console.log('   - Compétitions : 6');
  console.log('   - Trophées : ' + trophees.length);
  console.log('   - Joueurs : ' + joueurs.length);
  console.log('   - Saisons : 2');
  console.log('   - Matchs : 1 (finale 2009)');
  console.log('   - Coaches : 3');
  console.log('   - Stades : 4');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
