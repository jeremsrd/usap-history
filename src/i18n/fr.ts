/**
 * Le cahier français — toutes les phrases que le site écrit lui-même.
 *
 * **Ce qui n'y entre pas** : les noms propres (« Nicolas Mas », « Perpignan »),
 * les scores, les dates, et tout ce qui vient de la base — bilans de saison,
 * biographies. Ceux-là sont un chantier à part, et le plus lourd.
 *
 * **L'admin non plus.** C'est le bureau de Jérémy, pas une page publique : le
 * traduire ne servirait personne.
 */
export const fr = {
  nav: {
    accueil: "Accueil",
    saisons: "Saisons",
    matchs: "Matchs",
    joueurs: "Joueurs",
    statistiques: "Statistiques",
    palmares: "Palmarès",
    explorer: "Explorer",
    centurions: "Centurions",
    realisateurs: "Meilleurs réalisateurs",
    records: "Records",
    adversaires: "Adversaires",
    stades: "Stades",
    arbitres: "Arbitres",
    entraineurs: "Entraîneurs",
    presidents: "Présidents",
    admin: "Admin",
    menu: "Ouvrir le menu",
    fermer: "Fermer le menu",
    logo: "Logo USAP",
  },
  joueurs: {
    titre: "Joueurs",
    metaTitre: "Joueurs - USAP Historia",
    metaDescription:
      "Tous les joueurs de l'USA Perpignan : effectif actuel et anciens, de 2004-2005 à aujourd'hui, et les finales d'avant-guerre reconstituées depuis la presse.",
    chapeau: {
      one: "{n} joueur passé par l'USAP, dont {actifs} dans l'effectif actuel.",
      other:
        "{n} joueurs passés par l'USAP, dont {actifs} dans l'effectif actuel.",
    },
    reserve:
      "Les feuilles de match ne sont saisies qu'à partir de 2004-2005, hors les finales de 1914 et de 1925 reconstituées depuis la presse : les autres joueurs des époques antérieures n'y sont pas encore, et les périodes affichées tiennent à ce que la base couvre.",
    rechercher: "Rechercher un nom",
    lancerRecherche: "Rechercher",
    tous: "Tous",
    effectifActuel: "Effectif actuel",
    tousLesPostes: "Tous les postes",
    compte: { one: "{n} joueur", other: "{n} joueurs" },
    pourRecherche: " pour « {q} »",
    dansEffectif: " dans l'effectif actuel",
    indexAria: "Aller à la lettre",
    lettreVide: "Aucun joueur à la lettre {lettre}",
    aucun: "Aucun joueur ne répond à ces critères.",
    reinitialiser: "Voir tous les joueurs",
    entetePortrait: "Portrait",
    enteteJoueur: "Joueur",
    entetePoste: "Poste",
    entetePeriode: "Période",
    enteteMatchs: "Matchs",
    actuel: "Actuel",
    sansMatch: "—",
  },
  centurions: {
    titre: "Centurions",
    metaTitre: "Centurions - USAP Historia",
    metaDescription:
      "Les joueurs qui ont porté au moins cent fois le maillot de l'USA Perpignan : matchs, titularisations, essais et points.",
    compte: {
      one: "{n} joueur a porté au moins {seuil} fois le maillot catalan",
      other: "{n} joueurs ont porté au moins {seuil} fois le maillot catalan",
    },
    dontActifs: { one: " — dont {n} encore à l'effectif", other: " — dont {n} encore à l'effectif" },
    reserveTitre: "Ce tableau ne couvre pas toute l'histoire du club.",
    reserveTexte:
      "Les feuilles de match ne sont disponibles qu'à partir de la saison 2004-2005, deux finales d'avant-guerre exceptées : les centurions des époques antérieures n'y figurent pas, et ceux qui étaient déjà là en 2004 ont joué davantage de matchs que le compte affiché.",
    reserveCompte:
      "Un match se compte comme sur la fiche du joueur : une feuille de match sur une rencontre jouée, toutes compétitions confondues.",
  },
  realisateurs: {
    titre: "Meilleurs réalisateurs",
    metaTitre: "Meilleurs réalisateurs - USAP Historia",
    metaDescription:
      "Les meilleurs réalisateurs de l'USA Perpignan : points marqués, essais et points au pied.",
    chapeau:
      "Trois classements de ce que les Catalans ont marqué : aux points, aux essais, au pied.",
    ongletPoints: "Aux points ({n})",
    ongletEssais: "Aux essais ({n})",
    ongletAuPied: "Au pied ({n})",
    reserveTitre: "Deux saisons manquent presque entièrement à ces comptes.",
    reserveTexte:
      "La LNR ne publie aucun fait de match pour 2004-2005 — ni essai, ni transformation, ni pénalité — et n'en publie qu'une poignée pour 2005-2006. Les joueurs de ces années-là ont marqué davantage que ce que leur ligne affiche, et les époques antérieures ne sont pas en base du tout.",
    reserveBareme:
      "Le détail retombe sur le total partout : essai 5 points, transformation 2, pénalité et drop 3. Un essai de pénalité, lui, vaut sept points et n'a pas d'auteur — il compte pour l'équipe et pour personne, comme un essai collectif.",
    sectionPoints: "Aux points",
    sectionEssais: "Aux essais",
    sectionAuPied: "Au pied",
    criterePoints: "Les joueurs à {seuil} points ou plus, toutes réalisations confondues.",
    critereEssais: "Les joueurs à {seuil} essais ou plus.",
    critereAuPied:
      "Les joueurs à {seuil} points au pied ou plus — transformations, pénalités et drops.",
    legendeComplete: "E : essais — T : transformations — P : pénalités — D : drops",
    legendeAuPied: "T : transformations — P : pénalités — D : drops",
    enteteEssaisParMatch: "Essais/match",
  },
  records: {
    titre: "Records",
    metaTitre: "Records - USAP Historia",
    metaDescription:
      "Les records de l'USA Perpignan sur un match et sur une saison : plus larges victoires, plus gros scores, meilleures séries.",
    chapeau: "Ce que l'USAP a fait de mieux et de pire, sur une rencontre et sur une saison.",
    reserveTitre: "Ce sont les records de la période couverte, pas ceux du club.",
    reserveTexte:
      "La base commence en 2004-2005 pour les rencontres — deux finales d'avant-guerre exceptées, reconstituées depuis la presse —, en 2005-2006 pour les bilans de saison : un siècle d'histoire lui échappe encore.",
    reserveSaisons:
      "Les bilans de saison portent sur le championnat seul, phases finales exclues, et les saisons ne se comparent pas à armes égales : une saison de Pro D2 compte trente journées quand le Top 14 en compte vingt-six. Le nombre de matchs est rappelé à chaque ligne.",
    surUnMatch: "Sur un match",
    surUneSaison: "Sur une saison",
    series: "Séries",
    seriesChapeau:
      "Rencontres consécutives, toutes compétitions confondues et sans coupure entre les saisons.",
    plusLargeVictoire: "Plus large victoire",
    plusLourdeDefaite: "Plus lourde défaite",
    plusDePointsMarques: "Plus de points marqués",
    plusDePointsEncaisses: "Plus de points encaissés",
    plusDEssais: "Plus d'essais marqués",
    matchProlifique: "Match le plus prolifique",
    pointsJoueur: "Points d'un joueur",
    essaisJoueur: "Essais d'un joueur",
    penalitesJoueur: "Pénalités d'un joueur",
    affluence: "Plus forte affluence",
    affluenceNote: "36 matchs seulement ont une affluence renseignée.",
    saisonPoints: "Plus de points au classement",
    saisonVictoires: "Plus de victoires",
    saisonDefaites: "Plus de défaites",
    saisonMarques: "Plus de points marqués",
    saisonEncaisses: "Plus de points encaissés",
    saisonMeilleureDiff: "Meilleure différence",
    saisonPireDiff: "Pire différence",
    saisonBonus: "Plus de bonus offensifs",
    essaisSurUneSaison: "Essais sur une saison",
    pointsSurUneSaison: "Points sur une saison",
    serieVictoires: "Victoires d'affilée",
    serieSansDefaite: "Sans défaite",
    serieDefaites: "Défaites d'affilée",
    matchsDeSaison: "{division} — {n} matchs",
  },
  classement: {
    rang: "#",
    joueur: "Joueur",
    poste: "Poste",
    periode: "Période",
    matchs: "Matchs",
    titulaire: "Titulaire",
    essais: "Essais",
    points: "Points",
    actuel: "Actuel",
  },
  langue: {
    choisir: "Changer de langue",
    /**
     * **Écrit en catalan, et c'est voulu** : il s'adresse à quelqu'un qui vient
     * de choisir le catalan. À faire relire par un catalanophone — le
     * rossellonais est la variété visée.
     */
    nonTraduit: "Traducció al català en curs. Aquesta pàgina encara està en francès.",
  },
  pied: {
    mention: "USAP Historia — Données historiques de l'USA Perpignan depuis 1902",
  },
  theme: {
    versClair: "Passer en mode clair",
    versSombre: "Passer en mode sombre",
  },
} as const;
