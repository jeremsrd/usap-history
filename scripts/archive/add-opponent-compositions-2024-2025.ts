/**
 * Script d'ajout des compositions adverses pour la saison 2024-2025
 * Couvre : Top 14 J8-J26, Challenge Cup J1-J4 + 8e finale, Barrage Access
 *
 * Usage: npx tsx scripts/add-opponent-compositions-2024-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function positionFromNumber(num: number): Position {
  switch (num) {
    case 1: return Position.PILIER_GAUCHE;
    case 2: return Position.TALONNEUR;
    case 3: return Position.PILIER_DROIT;
    case 4: case 5: return Position.DEUXIEME_LIGNE;
    case 6: case 7: return Position.TROISIEME_LIGNE_AILE;
    case 8: return Position.NUMERO_HUIT;
    case 9: return Position.DEMI_DE_MELEE;
    case 10: return Position.DEMI_OUVERTURE;
    case 11: case 14: return Position.AILIER;
    case 12: case 13: return Position.CENTRE;
    case 15: return Position.ARRIERE;
    default: return Position.CENTRE; // fallback remplaçants
  }
}

// ─── Types ──────────────────────────────────────────────────────

interface OpponentPlayer {
  num: number;
  firstName: string;
  lastName: string;
  isCaptain?: boolean;
}

interface MatchComposition {
  matchId: string;
  label: string; // Pour le logging
  starters: OpponentPlayer[];
  replacements: OpponentPlayer[];
}

// ─── Data: Top 14 J8-J26 ───────────────────────────────────────

const TOP14_MATCHES: MatchComposition[] = [
  // J8 - Racing 92 vs USAP (25/10/2024)
  {
    matchId: "cmmbzxs8c002v1umrha3ioxqb",
    label: "J8 - Racing 92",
    starters: [
      { num: 1, firstName: "Guram", lastName: "Gogichashvili" },
      { num: 2, firstName: "Alifeleti Tu'ifua", lastName: "Kaitu'u" },
      { num: 3, firstName: "Gia", lastName: "Kharaishvili" },
      { num: 4, firstName: "Will", lastName: "Rowlands" },
      { num: 5, firstName: "Fabien", lastName: "Sanconnie" },
      { num: 6, firstName: "José Junior", lastName: "K'Poku" },
      { num: 7, firstName: "Maxime", lastName: "Baudonne" },
      { num: 8, firstName: "Hacjivah Graham", lastName: "Dayimani" },
      { num: 9, firstName: "Nolann", lastName: "Le Garrec" },
      { num: 10, firstName: "Owen", lastName: "Farrell" },
      { num: 11, firstName: "Henry", lastName: "Arundell" },
      { num: 12, firstName: "Josua", lastName: "Tuisova" },
      { num: 13, firstName: "Gaël", lastName: "Fickou" },
      { num: 14, firstName: "Vinaya", lastName: "Habosi" },
      { num: 15, firstName: "Max", lastName: "Spring" },
    ],
    replacements: [
      { num: 16, firstName: "Janick", lastName: "Tarrit" },
      { num: 17, firstName: "Eddy", lastName: "Ben Arous" },
      { num: 18, firstName: "Romain", lastName: "Taofifenua" },
      { num: 19, firstName: "Ibrahim", lastName: "Diallo" },
      { num: 20, firstName: "Cameron", lastName: "Woki" },
      { num: 21, firstName: "Antoine", lastName: "Gibert" },
      { num: 22, firstName: "Daniel", lastName: "Lancaster" },
      { num: 23, firstName: "Thomas", lastName: "Laclayat" },
    ],
  },

  // J9 - USAP vs RC Vannes (02/11/2024)
  {
    matchId: "cmmbzxs98002x1umrihzr6yqu",
    label: "J9 - RC Vannes",
    starters: [
      { num: 1, firstName: "Makovina", lastName: "Vunipola" },
      { num: 2, firstName: "Théo", lastName: "Beziat" },
      { num: 3, firstName: "Pagakalasio", lastName: "Tafili" },
      { num: 4, firstName: "Eric", lastName: "Marks" },
      { num: 5, firstName: "Fabrice", lastName: "Metz" },
      { num: 6, firstName: "Karl", lastName: "Chateau" },
      { num: 7, firstName: "Francisco", lastName: "Gorrissen" },
      { num: 8, firstName: "Sione", lastName: "Kalamafoni" },
      { num: 9, firstName: "Michael", lastName: "Ruru" },
      { num: 10, firstName: "Maxime", lastName: "Lafage" },
      { num: 11, firstName: "Salesi", lastName: "Rayasi" },
      { num: 12, firstName: "Alex", lastName: "Arrate" },
      { num: 13, firstName: "Francis", lastName: "Saili" },
      { num: 14, firstName: "Iñaki", lastName: "Ayarza" },
      { num: 15, firstName: "Gwenael", lastName: "Duplenne" },
    ],
    replacements: [
      { num: 16, firstName: "Cyril", lastName: "Blanchard" },
      { num: 17, firstName: "Charles Henri", lastName: "Berguet" },
      { num: 18, firstName: "Timothé", lastName: "Mezou" },
      { num: 19, firstName: "Simon", lastName: "Augry" },
      { num: 20, firstName: "Léon", lastName: "Boulier" },
      { num: 21, firstName: "Stephen", lastName: "Varney" },
      { num: 22, firstName: "Thibault", lastName: "Debaes" },
      { num: 23, firstName: "Santiago", lastName: "Medrano" },
    ],
  },

  // J10 - Stade Toulousain vs USAP (09/11/2024)
  {
    matchId: "cmmbzxsa4002z1umrt6187d4g",
    label: "J10 - Stade Toulousain",
    starters: [
      { num: 1, firstName: "Rodrigue", lastName: "Neti" },
      { num: 2, firstName: "Guillaume", lastName: "Cramont" },
      { num: 3, firstName: "David", lastName: "Ainuu" },
      { num: 4, firstName: "Anthony", lastName: "Jelonch" },
      { num: 5, firstName: "Clément", lastName: "Vergé" },
      { num: 6, firstName: "Jack", lastName: "Willis" },
      { num: 7, firstName: "Léo", lastName: "Banos" },
      { num: 8, firstName: "Theo", lastName: "Ntamack Muyenga" },
      { num: 9, firstName: "Paul", lastName: "Graou" },
      { num: 10, firstName: "Romain", lastName: "Ntamack" },
      { num: 11, firstName: "Matthis", lastName: "Lebel" },
      { num: 12, firstName: "Pita Jordan", lastName: "Ahki" },
      { num: 13, firstName: "Santiago", lastName: "Chocobares" },
      { num: 14, firstName: "Dimitri", lastName: "Delibes" },
      { num: 15, firstName: "Matias", lastName: "Remue" },
    ],
    replacements: [
      { num: 16, firstName: "Thomas", lastName: "Lacombre" },
      { num: 17, firstName: "Benjamin", lastName: "Bertrand" },
      { num: 18, firstName: "Efrain", lastName: "Elias" },
      { num: 19, firstName: "Mathis", lastName: "Castro Ferreira" },
      { num: 20, firstName: "Simon", lastName: "Daroque" },
      { num: 21, firstName: "Pierre-Louis", lastName: "Barassi" },
      { num: 22, firstName: "Setareki", lastName: "Bituniyata" },
      { num: 23, firstName: "Dorian", lastName: "Aldegheri" },
    ],
  },

  // J11 - USAP vs RC Toulon (23/11/2024)
  {
    matchId: "cmmbzxsb000311umrp2cff2nb",
    label: "J11 - RC Toulon",
    starters: [
      { num: 1, firstName: "Dany", lastName: "Priso Mouangue" },
      { num: 2, firstName: "Teddy", lastName: "Baubigny" },
      { num: 3, firstName: "Kyle", lastName: "Sinckler" },
      { num: 4, firstName: "David George", lastName: "Ribbans" },
      { num: 5, firstName: "Komiti Junior", lastName: "Alainuuese" },
      { num: 6, firstName: "Mattéo", lastName: "Le Corvec" },
      { num: 7, firstName: "Esteban", lastName: "Abadie" },
      { num: 8, firstName: "Charles", lastName: "Ollivon" },
      { num: 9, firstName: "Baptiste", lastName: "Serin" },
      { num: 10, firstName: "Enzo", lastName: "Hervé" },
      { num: 11, firstName: "Setariki", lastName: "Tuicuvu" },
      { num: 12, firstName: "Jérémy", lastName: "Sinzelle" },
      { num: 13, firstName: "Antoine", lastName: "Frisch" },
      { num: 14, firstName: "Gaël", lastName: "Dréan" },
      { num: 15, firstName: "Marius", lastName: "Domon" },
    ],
    replacements: [
      { num: 16, firstName: "Mickaël", lastName: "Ivaldi" },
      { num: 17, firstName: "Daniel", lastName: "Brennan" },
      { num: 18, firstName: "Matthias", lastName: "Halagahu" },
      { num: 19, firstName: "Lewis Wesley", lastName: "Ludlam" },
      { num: 20, firstName: "Daniel Rhys", lastName: "Biggar" },
      { num: 21, firstName: "Jules", lastName: "Danglot" },
      { num: 22, firstName: "Rayan", lastName: "Rebbadj" },
      { num: 23, firstName: "Emerick", lastName: "Setiano" },
    ],
  },

  // J12 - Stade Français Paris vs USAP (30/11/2024)
  {
    matchId: "cmmbzxsbv00331umrrz4hnfwz",
    label: "J12 - Stade Français Paris",
    starters: [
      { num: 1, firstName: "Moses Eneliko", lastName: "Alo Emile" },
      { num: 2, firstName: "Giacomo", lastName: "Nicotera" },
      { num: 3, firstName: "Paul", lastName: "Alo Emile" },
      { num: 4, firstName: "Paul", lastName: "Gabrillagues" },
      { num: 5, firstName: "Juan John", lastName: "Van Der Mescht" },
      { num: 6, firstName: "Tanginoa Palu", lastName: "Halaifonua" },
      { num: 7, firstName: "Ryan", lastName: "Chapuis" },
      { num: 8, firstName: "Juan Martin", lastName: "Scelzo" },
      { num: 9, firstName: "Brad", lastName: "Weber" },
      { num: 10, firstName: "Louis", lastName: "Carbonel" },
      { num: 11, firstName: "Charles", lastName: "Laloi" },
      { num: 12, firstName: "Jérémy Charles", lastName: "Ward" },
      { num: 13, firstName: "Joseph", lastName: "Marchant" },
      { num: 14, firstName: "Peniasi", lastName: "Dakuwaqa" },
      { num: 15, firstName: "Léo", lastName: "Barré" },
    ],
    replacements: [
      { num: 16, firstName: "Lucas", lastName: "Peyresblanques" },
      { num: 17, firstName: "Hugo", lastName: "Ndiaye" },
      { num: 18, firstName: "Setareki", lastName: "Turagacoke" },
      { num: 19, firstName: "Andy", lastName: "Timo" },
      { num: 20, firstName: "Louis", lastName: "Foursans Bourdette" },
      { num: 21, firstName: "Yoan", lastName: "Tanga Mangene" },
      { num: 22, firstName: "Samuel", lastName: "Ezeala" },
      { num: 23, firstName: "Francisco", lastName: "Gomez Kodela" },
    ],
  },

  // J13 - USAP vs Stade Rochelais (07/12/2024)
  {
    matchId: "cmmbzxscs00351umrvr7w23b1",
    label: "J13 - Stade Rochelais",
    starters: [
      { num: 1, firstName: "Thierry", lastName: "Paiva" },
      { num: 2, firstName: "Quentin", lastName: "Lespiaucq" },
      { num: 3, firstName: "Joël Antonio", lastName: "Sclavi" },
      { num: 4, firstName: "Thomas", lastName: "Lavault" },
      { num: 5, firstName: "Kane", lastName: "Douglas" },
      { num: 6, firstName: "Judicaël", lastName: "Cancoriet" },
      { num: 7, firstName: "Levani Botia", lastName: "Veivuke" },
      { num: 8, firstName: "Paul", lastName: "Boudehent" },
      { num: 9, firstName: "Thomas", lastName: "Berjon" },
      { num: 10, firstName: "Antoine", lastName: "Hastoy" },
      { num: 11, firstName: "Jules", lastName: "Favre" },
      { num: 12, firstName: "Jonathan", lastName: "Danty" },
      { num: 13, firstName: "Simeli", lastName: "Daunivucu" },
      { num: 14, firstName: "Suliasi", lastName: "Vunivalu" },
      { num: 15, firstName: "Brice", lastName: "Dulin" },
    ],
    replacements: [
      { num: 16, firstName: "Nikolozi", lastName: "Sutidze" },
      { num: 17, firstName: "Reda", lastName: "Wardi" },
      { num: 18, firstName: "Ultan", lastName: "Dillane" },
      { num: 19, firstName: "Matthias", lastName: "Haddad" },
      { num: 20, firstName: "Hoani", lastName: "Bosmorin" },
      { num: 21, firstName: "Hugo", lastName: "Reus" },
      { num: 22, firstName: "Teddy", lastName: "Thomas" },
      { num: 23, firstName: "Aleksandre", lastName: "Kuntelia" },
    ],
  },

  // J14 - LOU Rugby vs USAP (21/12/2024)
  {
    matchId: "cmmbzxsdn00371umrbhfx333a",
    label: "J14 - LOU Rugby",
    starters: [
      { num: 1, firstName: "Hamza", lastName: "Kaabeche" },
      { num: 2, firstName: "Guillaume", lastName: "Marchand" },
      { num: 3, firstName: "Jermaine", lastName: "Ainsley" },
      { num: 4, firstName: "Killian", lastName: "Geraci" },
      { num: 5, firstName: "Alban", lastName: "Roussel" },
      { num: 6, firstName: "Dylan", lastName: "Cretin" },
      { num: 7, firstName: "Beka", lastName: "Saginadze" },
      { num: 8, firstName: "Beka", lastName: "Shvangiradze" },
      { num: 9, firstName: "Baptiste", lastName: "Couilloud" },
      { num: 10, firstName: "Léo", lastName: "Berdeu" },
      { num: 11, firstName: "Monty", lastName: "Ioane" },
      { num: 12, firstName: "Théo", lastName: "Millet" },
      { num: 13, firstName: "Alfred", lastName: "Parisien" },
      { num: 14, firstName: "Xavier", lastName: "Mignot" },
      { num: 15, firstName: "Davit", lastName: "Niniashvili" },
    ],
    replacements: [
      { num: 16, firstName: "Samuel Sireli", lastName: "Matavesi" },
      { num: 17, firstName: "Sébastien", lastName: "Taofifenua" },
      { num: 18, firstName: "Arno", lastName: "Botha" },
      { num: 19, firstName: "Steeve", lastName: "Blanc Mappaz" },
      { num: 20, firstName: "Charlie", lastName: "Cassang" },
      { num: 21, firstName: "Martin", lastName: "Méliande" },
      { num: 22, firstName: "Liam Robson", lastName: "Allen" },
      { num: 23, firstName: "Cédaté", lastName: "Gomes Sa" },
    ],
  },

  // J15 - USAP vs Aviron Bayonnais (29/12/2024)
  {
    matchId: "cmmbzxsej00391umr652lsctk",
    label: "J15 - Aviron Bayonnais",
    starters: [
      { num: 1, firstName: "Swan", lastName: "Cormenier" },
      { num: 2, firstName: "Facundo", lastName: "Bosch" },
      { num: 3, firstName: "Luke", lastName: "Tagi" },
      { num: 4, firstName: "Alexander James", lastName: "Moon" },
      { num: 5, firstName: "Lucas Martin", lastName: "Paulos Adler" },
      { num: 6, firstName: "Rodrigo", lastName: "Bruni" },
      { num: 7, firstName: "Baptiste", lastName: "Heguy" },
      { num: 8, firstName: "Giovanni", lastName: "Habel Kuffner" },
      { num: 9, firstName: "Maxime", lastName: "Machenaud" },
      { num: 10, firstName: "Camille", lastName: "Lopez" },
      { num: 11, firstName: "Arnaud", lastName: "Erbinartegaray" },
      { num: 12, firstName: "Etuale Manusamoa", lastName: "Tuilagi" },
      { num: 13, firstName: "Sireli", lastName: "Maqala" },
      { num: 14, firstName: "Nadir", lastName: "Megdoud" },
      { num: 15, firstName: "Cheikh Saliou", lastName: "Tiberghien" },
    ],
    replacements: [
      { num: 16, firstName: "Lucas", lastName: "Martin" },
      { num: 17, firstName: "Martin", lastName: "Villar" },
      { num: 18, firstName: "Denis", lastName: "Marchois" },
      { num: 19, firstName: "Semisi Veikoso", lastName: "Poloniati" },
      { num: 20, firstName: "Baptiste", lastName: "Germain" },
      { num: 21, firstName: "Joris", lastName: "Segonds" },
      { num: 22, firstName: "Tom", lastName: "Spring" },
      { num: 23, firstName: "Tevita", lastName: "Tatafu" },
    ],
  },

  // J16 - Castres Olympique vs USAP (04/01/2025)
  {
    matchId: "cmmbzxsfe003b1umruu9jcnh0",
    label: "J16 - Castres Olympique",
    starters: [
      { num: 1, firstName: "Quentin", lastName: "Walcker" },
      { num: 2, firstName: "Pierre", lastName: "Colonna" },
      { num: 3, firstName: "Levan", lastName: "Chilachava" },
      { num: 4, firstName: "Gauthier", lastName: "Maravat" },
      { num: 5, firstName: "Florent", lastName: "Vanverberghe" },
      { num: 6, firstName: "Mathieu", lastName: "Babillot" },
      { num: 7, firstName: "Simon", lastName: "Meka" },
      { num: 8, firstName: "Tyler", lastName: "Ardron" },
      { num: 9, firstName: "Santiago", lastName: "Arata Perrone" },
      { num: 10, firstName: "Louis", lastName: "Le Brun" },
      { num: 11, firstName: "Josaia Winimaivunidawa", lastName: "Raisuqe" },
      { num: 12, firstName: "Adrea", lastName: "Cocagi" },
      { num: 13, firstName: "Adrien", lastName: "Seguret" },
      { num: 14, firstName: "Rémy", lastName: "Baget" },
      { num: 15, firstName: "Théo", lastName: "Chabouni" },
    ],
    replacements: [
      { num: 16, firstName: "Gaëtan", lastName: "Barlot" },
      { num: 17, firstName: "Antoine", lastName: "Tichit" },
      { num: 18, firstName: "Guillaume", lastName: "Ducat" },
      { num: 19, firstName: "Abraham", lastName: "Papalii" },
      { num: 20, firstName: "Feibyan Cornell", lastName: "Tukino" },
      { num: 21, firstName: "Jérémy", lastName: "Fernandez" },
      { num: 22, firstName: "Antoine", lastName: "Zeghdar" },
      { num: 23, firstName: "Nicolas", lastName: "Corato" },
    ],
  },

  // J17 - USAP vs Section Paloise (25/01/2025)
  {
    matchId: "cmmbzxsga003d1umrs0i2csjn",
    label: "J17 - Section Paloise",
    starters: [
      { num: 1, firstName: "Ignacio", lastName: "Calles" },
      { num: 2, firstName: "Romain", lastName: "Ruffenach" },
      { num: 3, firstName: "Harry", lastName: "Williams" },
      { num: 4, firstName: "Hugo", lastName: "Auradou" },
      { num: 5, firstName: "Lekima Vuda", lastName: "Tagitagivalu" },
      { num: 6, firstName: "Luke", lastName: "Whitelock" },
      { num: 7, firstName: "Loïc", lastName: "Credoz" },
      { num: 8, firstName: "Carwyn", lastName: "Tuipulotu" },
      { num: 9, firstName: "Thibault", lastName: "Daubagna" },
      { num: 10, firstName: "Joe", lastName: "Simmonds" },
      { num: 11, firstName: "Aaron", lastName: "Grandidier-Nkanang" },
      { num: 12, firstName: "Fabien", lastName: "Brau-Boirie" },
      { num: 13, firstName: "Eliott", lastName: "Roudil" },
      { num: 14, firstName: "Clément", lastName: "Laporte" },
      { num: 15, firstName: "Aymeric", lastName: "Luc" },
    ],
    replacements: [
      { num: 16, firstName: "Youri", lastName: "Delhommel" },
      { num: 17, firstName: "Daniel", lastName: "Bibi Biziwu" },
      { num: 18, firstName: "Rémi", lastName: "Picquette" },
      { num: 19, firstName: "Joël", lastName: "Kpoku" },
      { num: 20, firstName: "Daniel", lastName: "Robson" },
      { num: 21, firstName: "Nathan", lastName: "Decron" },
      { num: 22, firstName: "Axel", lastName: "Desperes Rigou" },
      { num: 23, firstName: "Jon", lastName: "Zabala Arrieta" },
    ],
  },

  // J18 - USAP vs Union Bordeaux-Bègles (01/02/2025)
  {
    matchId: "cmmbzxsh6003f1umrvmeb26q8",
    label: "J18 - Union Bordeaux-Bègles",
    starters: [
      { num: 1, firstName: "Ugo", lastName: "Boniface" },
      { num: 2, firstName: "Maxime", lastName: "Lamothe" },
      { num: 3, firstName: "Benjamin", lastName: "Tameifuna" },
      { num: 4, firstName: "Jonathan", lastName: "Gray" },
      { num: 5, firstName: "Cyril", lastName: "Cazeaux" },
      { num: 6, firstName: "Marko", lastName: "Gazzotti" },
      { num: 7, firstName: "Guido", lastName: "Petti Pagadizabal" },
      { num: 8, firstName: "Peter", lastName: "Samu" },
      { num: 9, firstName: "Maxime", lastName: "Lucu" },
      { num: 10, firstName: "Matthieu", lastName: "Jalibert" },
      { num: 11, firstName: "Arthur", lastName: "Retière" },
      { num: 12, firstName: "Röhan", lastName: "Janse Van Rensburg" },
      { num: 13, firstName: "Nicolas", lastName: "Depoortere" },
      { num: 14, firstName: "Jon", lastName: "Echegaray" },
      { num: 15, firstName: "Romain", lastName: "Buros" },
    ],
    replacements: [
      { num: 16, firstName: "Connor", lastName: "Sa" },
      { num: 17, firstName: "Jefferson", lastName: "Poirot" },
      { num: 18, firstName: "Alexandre", lastName: "Ricard" },
      { num: 19, firstName: "Tiaan", lastName: "Jacobs" },
      { num: 20, firstName: "Bastien", lastName: "Vergnes Taillefer" },
      { num: 21, firstName: "Joseph", lastName: "Carbery" },
      { num: 22, firstName: "Benjamin Nouata Lupe", lastName: "Tapuai" },
      { num: 23, firstName: "Sipili", lastName: "Falatea" },
    ],
  },

  // J19 - RC Toulon vs USAP (15/02/2025)
  {
    matchId: "cmmbzxsi1003h1umryrkss5ga",
    label: "J19 - RC Toulon",
    starters: [
      { num: 1, firstName: "Jean Baptiste", lastName: "Gros" },
      { num: 2, firstName: "Teddy", lastName: "Baubigny" },
      { num: 3, firstName: "Beka", lastName: "Gigashvili" },
      { num: 4, firstName: "Swan", lastName: "Rebbadj" },
      { num: 5, firstName: "David George", lastName: "Ribbans" },
      { num: 6, firstName: "Lewis Wesley", lastName: "Ludlam" },
      { num: 7, firstName: "Esteban", lastName: "Abadie" },
      { num: 8, firstName: "Facundo", lastName: "Isa" },
      { num: 9, firstName: "Baptiste", lastName: "Serin" },
      { num: 10, firstName: "Paolo", lastName: "Garbisi" },
      { num: 11, firstName: "Rayan", lastName: "Rebbadj" },
      { num: 12, firstName: "Jérémy", lastName: "Sinzelle" },
      { num: 13, firstName: "Leicester", lastName: "Faingaanuku" },
      { num: 14, firstName: "Gaël", lastName: "Dréan" },
      { num: 15, firstName: "Melvyn", lastName: "Jaminet" },
    ],
    replacements: [
      { num: 16, firstName: "Gianmarco", lastName: "Lucchesi" },
      { num: 17, firstName: "Daniel", lastName: "Brennan" },
      { num: 18, firstName: "Matthias", lastName: "Halagahu" },
      { num: 19, firstName: "Mattéo", lastName: "Le Corvec" },
      { num: 20, firstName: "Selevasio", lastName: "Tolofua" },
      { num: 21, firstName: "Benjamin", lastName: "White" },
      { num: 22, firstName: "Marius", lastName: "Domon" },
      { num: 23, firstName: "Emerick", lastName: "Setiano" },
    ],
  },

  // J20 - USAP vs RC Vannes (22/02/2025)
  {
    matchId: "cmmbzxsix003j1umrwu3re5ra",
    label: "J20 - RC Vannes",
    starters: [
      { num: 1, firstName: "Thomas", lastName: "Moukoro Abouem" },
      { num: 2, firstName: "Patrick", lastName: "Leafa" },
      { num: 3, firstName: "Santiago", lastName: "Medrano" },
      { num: 4, firstName: "Joseph", lastName: "Edwards" },
      { num: 5, firstName: "Fabrice", lastName: "Metz" },
      { num: 6, firstName: "Simon", lastName: "Augry" },
      { num: 7, firstName: "Francisco", lastName: "Gorrissen" },
      { num: 8, firstName: "Sione", lastName: "Kalamafoni" },
      { num: 9, firstName: "Michael", lastName: "Ruru" },
      { num: 10, firstName: "Maxime", lastName: "Lafage" },
      { num: 11, firstName: "Filipo", lastName: "Nakosi" },
      { num: 12, firstName: "Pierre", lastName: "Boudehent" },
      { num: 13, firstName: "Robin", lastName: "Taccola" },
      { num: 14, firstName: "Salesi", lastName: "Rayasi" },
      { num: 15, firstName: "John", lastName: "Porch" },
    ],
    replacements: [
      { num: 16, firstName: "Cyril", lastName: "Blanchard" },
      { num: 17, firstName: "Makovina", lastName: "Vunipola" },
      { num: 18, firstName: "Timothé", lastName: "Mezou" },
      { num: 19, firstName: "Matthieu", lastName: "Uhila" },
      { num: 20, firstName: "Stephen", lastName: "Varney" },
      { num: 21, firstName: "Jean", lastName: "Cotarmanac'h" },
      { num: 22, firstName: "Francis", lastName: "Saili" },
      { num: 23, firstName: "Phillip", lastName: "Kite" },
    ],
  },

  // J21 - USAP vs Racing 92 (01/03/2025)
  {
    matchId: "cmmbzxsjw003l1umr8iso0umg",
    label: "J21 - Racing 92",
    starters: [
      { num: 1, firstName: "Guram", lastName: "Gogichashvili" },
      { num: 2, firstName: "Diego", lastName: "Escobar" },
      { num: 3, firstName: "Demba", lastName: "Bamba" },
      { num: 4, firstName: "Boris", lastName: "Palu" },
      { num: 5, firstName: "Romain", lastName: "Taofifenua" },
      { num: 6, firstName: "Maxime", lastName: "Baudonne" },
      { num: 7, firstName: "Shingirai Dylan Masimba", lastName: "Manyarara" },
      { num: 8, firstName: "Jordan", lastName: "Joseph" },
      { num: 9, firstName: "Nolann", lastName: "Le Garrec" },
      { num: 10, firstName: "Owen", lastName: "Farrell" },
      { num: 11, firstName: "Vinaya", lastName: "Habosi" },
      { num: 12, firstName: "Josua", lastName: "Tuisova" },
      { num: 13, firstName: "Gaël", lastName: "Fickou" },
      { num: 14, firstName: "Donovan", lastName: "Taofifenua" },
      { num: 15, firstName: "Max", lastName: "Spring" },
    ],
    replacements: [
      { num: 16, firstName: "Alifeleti Tu'ifua", lastName: "Kaitu'u" },
      { num: 17, firstName: "Hassane", lastName: "Kolingar" },
      { num: 18, firstName: "Will", lastName: "Rowlands" },
      { num: 19, firstName: "José Junior", lastName: "K'Poku" },
      { num: 20, firstName: "Noa", lastName: "Zinzen" },
      { num: 21, firstName: "Antoine", lastName: "Gibert" },
      { num: 22, firstName: "Tristan James", lastName: "Tedder" },
      { num: 23, firstName: "Thomas", lastName: "Laclayat" },
    ],
  },

  // J22 - Montpellier vs USAP (08/03/2025)
  {
    matchId: "cmmbzxsks003n1umrw0re9l48",
    label: "J22 - Montpellier",
    starters: [
      { num: 1, firstName: "Enzo", lastName: "Forletta" },
      { num: 2, firstName: "Christopher", lastName: "Tolofua" },
      { num: 3, firstName: "Mohamed", lastName: "Haouas" },
      { num: 4, firstName: "Florian", lastName: "Verhaeghe" },
      { num: 5, firstName: "Tyler", lastName: "Duguid" },
      { num: 6, firstName: "Lenni", lastName: "Nouchi" },
      { num: 7, firstName: "Alexandre", lastName: "Bécognée" },
      { num: 8, firstName: "Viliami", lastName: "Vunipola" },
      { num: 9, firstName: "Jacobus Meyer", lastName: "Reinach" },
      { num: 10, firstName: "Stuart", lastName: "Hogg" },
      { num: 11, firstName: "Madosha", lastName: "Tambwe" },
      { num: 12, firstName: "Auguste", lastName: "Cadot" },
      { num: 13, firstName: "Arthur", lastName: "Vincent" },
      { num: 14, firstName: "Maël", lastName: "Moustin" },
      { num: 15, firstName: "Anthony", lastName: "Bouthier" },
    ],
    replacements: [
      { num: 16, firstName: "Vano", lastName: "Karkadze" },
      { num: 17, firstName: "Baptiste", lastName: "Erdocio" },
      { num: 18, firstName: "Marco", lastName: "Tauleigne" },
      { num: 19, firstName: "Nicolaas", lastName: "Janse Van Rensburg" },
      { num: 20, firstName: "Léo", lastName: "Coly" },
      { num: 21, firstName: "Thomas", lastName: "Darmon" },
      { num: 22, firstName: "Joshua", lastName: "Moorby" },
      { num: 23, firstName: "Wilfrid", lastName: "Hounkpatin" },
    ],
  },

  // J23 - USAP vs Stade Français Paris (22/03/2025)
  {
    matchId: "cmmbzxslo003p1umrvc8pr1cd",
    label: "J23 - Stade Français Paris",
    starters: [
      { num: 1, firstName: "Clément", lastName: "Castets" },
      { num: 2, firstName: "Giacomo", lastName: "Nicotera" },
      { num: 3, firstName: "Paul", lastName: "Alo Emile" },
      { num: 4, firstName: "Paul", lastName: "Gabrillagues" },
      { num: 5, firstName: "Baptiste", lastName: "Pesenti" },
      { num: 6, firstName: "Tanginoa Palu", lastName: "Halaifonua" },
      { num: 7, firstName: "Romain", lastName: "Briatte" },
      { num: 8, firstName: "Sekou", lastName: "Macalou" },
      { num: 9, firstName: "Louis", lastName: "Foursans Bourdette" },
      { num: 10, firstName: "Zack", lastName: "Henry" },
      { num: 11, firstName: "Lester", lastName: "Etien" },
      { num: 12, firstName: "Julien", lastName: "Delbouis" },
      { num: 13, firstName: "Joseph", lastName: "Marchant" },
      { num: 14, firstName: "Peniasi", lastName: "Dakuwaqa" },
      { num: 15, firstName: "Joe", lastName: "Jonas" },
    ],
    replacements: [
      { num: 16, firstName: "Lucas", lastName: "Peyresblanques" },
      { num: 17, firstName: "Moses Eneliko", lastName: "Alo Emile" },
      { num: 18, firstName: "Pierre Henri", lastName: "Azagoh Kouadio" },
      { num: 19, firstName: "Juan Martin", lastName: "Scelzo" },
      { num: 20, firstName: "Thibaut Robert", lastName: "Motassi Dibongue" },
      { num: 21, firstName: "Louis", lastName: "Carbonel" },
      { num: 22, firstName: "Jérémy Charles", lastName: "Ward" },
      { num: 23, firstName: "Giorgi", lastName: "Melikidze" },
    ],
  },

  // J24 - USAP vs ASM Clermont (29/03/2025)
  {
    matchId: "cmmbzxsmj003r1umru5pefzc8",
    label: "J24 - ASM Clermont",
    starters: [
      { num: 1, firstName: "Giorgi", lastName: "Akhaladze" },
      { num: 2, firstName: "Barnabé", lastName: "Massa" },
      { num: 3, firstName: "Cristian", lastName: "Ojovan" },
      { num: 4, firstName: "Robert", lastName: "Simmons" },
      { num: 5, firstName: "Peceli", lastName: "Yato" },
      { num: 6, firstName: "Killian", lastName: "Tixeront" },
      { num: 7, firstName: "Marcos", lastName: "Kremer" },
      { num: 8, firstName: "Pita-Gus", lastName: "Sowakula" },
      { num: 9, firstName: "Baptiste", lastName: "Jauneau" },
      { num: 10, firstName: "Benjamin", lastName: "Urdapilleta" },
      { num: 11, firstName: "Alivereti", lastName: "Raka" },
      { num: 12, firstName: "George", lastName: "Moala" },
      { num: 13, firstName: "Léon", lastName: "Darricarrère" },
      { num: 14, firstName: "Bautista", lastName: "Delguy" },
      { num: 15, firstName: "Alex", lastName: "Newsome" },
    ],
    replacements: [
      { num: 16, firstName: "Etienne", lastName: "Fourcade" },
      { num: 17, firstName: "Mathéo", lastName: "Frisach" },
      { num: 18, firstName: "Thibaud", lastName: "Lanen" },
      { num: 19, firstName: "Alexandre", lastName: "Fischer" },
      { num: 20, firstName: "Anthime", lastName: "Héméry" },
      { num: 21, firstName: "Sébastien", lastName: "Bézy" },
      { num: 22, firstName: "Irae Vincynt", lastName: "Simone" },
      { num: 23, firstName: "Régis", lastName: "Montagne" },
    ],
  },

  // J25 - Stade Rochelais vs USAP (05/04/2025)
  {
    matchId: "cmmbzxsnh003t1umrs41gfzk9",
    label: "J25 - Stade Rochelais",
    starters: [
      { num: 1, firstName: "Reda", lastName: "Wardi" },
      { num: 2, firstName: "Nikolozi", lastName: "Sutidze" },
      { num: 3, firstName: "Aleksandre", lastName: "Kuntelia" },
      { num: 4, firstName: "Thomas", lastName: "Lavault" },
      { num: 5, firstName: "William", lastName: "Skelton" },
      { num: 6, firstName: "Paul", lastName: "Boudehent" },
      { num: 7, firstName: "Matthias", lastName: "Haddad" },
      { num: 8, firstName: "Grégory", lastName: "Alldritt" },
      { num: 9, firstName: "Tawera", lastName: "Kerr Barlow" },
      { num: 10, firstName: "Antoine", lastName: "Hastoy" },
      { num: 11, firstName: "Hoani", lastName: "Bosmorin" },
      { num: 12, firstName: "Jules", lastName: "Favre" },
      { num: 13, firstName: "Ulupano", lastName: "Seuteni" },
      { num: 14, firstName: "Jack", lastName: "Nowell" },
      { num: 15, firstName: "Brice", lastName: "Dulin" },
    ],
    replacements: [
      { num: 16, firstName: "Pierre", lastName: "Bourgarit" },
      { num: 17, firstName: "Thierry", lastName: "Paiva" },
      { num: 18, firstName: "Judicaël", lastName: "Cancoriet" },
      { num: 19, firstName: "Levani Botia", lastName: "Veivuke" },
      { num: 20, firstName: "Thomas", lastName: "Berjon" },
      { num: 21, firstName: "Dillyn", lastName: "Leyds" },
      { num: 22, firstName: "Jonathan", lastName: "Danty" },
      { num: 23, firstName: "Uini", lastName: "Atonio" },
    ],
  },

  // J26 - USAP vs Stade Toulousain (19/04/2025)
  {
    matchId: "cmmbzxsod003v1umrwqyzi6ba",
    label: "J26 - Stade Toulousain",
    starters: [
      { num: 1, firstName: "Cyril", lastName: "Baille" },
      { num: 2, firstName: "Thomas", lastName: "Lacombre" },
      { num: 3, firstName: "Dorian", lastName: "Aldegheri" },
      { num: 4, firstName: "Clément", lastName: "Vergé" },
      { num: 5, firstName: "Emmanuel", lastName: "Meafou" },
      { num: 6, firstName: "Mathis", lastName: "Castro Ferreira" },
      { num: 7, firstName: "Léo", lastName: "Banos" },
      { num: 8, firstName: "Alexandre", lastName: "Roumat" },
      { num: 9, firstName: "Paul", lastName: "Graou" },
      { num: 10, firstName: "Romain", lastName: "Ntamack" },
      { num: 11, firstName: "Matthis", lastName: "Lebel" },
      { num: 12, firstName: "Pita Jordan", lastName: "Ahki" },
      { num: 13, firstName: "Dimitri", lastName: "Delibes" },
      { num: 14, firstName: "Ange", lastName: "Capuozzo" },
      { num: 15, firstName: "Lucien", lastName: "Richardis" },
    ],
    replacements: [
      { num: 16, firstName: "Guillaume", lastName: "Cramont" },
      { num: 17, firstName: "Rodrigue", lastName: "Neti" },
      { num: 18, firstName: "Joshua", lastName: "Brennan" },
      { num: 19, firstName: "Alban", lastName: "Placines" },
      { num: 20, firstName: "Theo", lastName: "Ntamack Muyenga" },
      { num: 21, firstName: "Naoto", lastName: "Saito" },
      { num: 22, firstName: "Mathieu", lastName: "Galtier" },
      { num: 23, firstName: "Joël", lastName: "Merkler Perez" },
    ],
  },
];

// ─── Data: Challenge Cup ────────────────────────────────────────

const CHALLENGE_CUP_MATCHES: MatchComposition[] = [
  // CC J1 - Toyota Cheetahs vs USAP (06/12/2024)
  {
    matchId: "cmmbzxsp9003x1umrv4hf1i31",
    label: "CC J1 - Toyota Cheetahs",
    starters: [
      { num: 1, firstName: "Schalk", lastName: "Ferreira" },
      { num: 2, firstName: "Louis", lastName: "Van Der Westhuizen" },
      { num: 3, firstName: "Aranos", lastName: "Coetzee" },
      { num: 4, firstName: "Carl", lastName: "Wegner" },
      { num: 5, firstName: "Victor", lastName: "Sekekete", isCaptain: true },
      { num: 6, firstName: "Gideon", lastName: "Van Der Merwe" },
      { num: 7, firstName: "Friedle", lastName: "Olivier" },
      { num: 8, firstName: "Jeandré", lastName: "Rudolph" },
      { num: 9, firstName: "Ruben", lastName: "De Haas" },
      { num: 10, firstName: "Ethan", lastName: "Wentzel" },
      { num: 11, firstName: "Prince", lastName: "Nkabinde" },
      { num: 12, firstName: "Ali", lastName: "Mgijima" },
      { num: 13, firstName: "Carel-Jan", lastName: "Coetzee" },
      { num: 14, firstName: "Munier", lastName: "Hartzenberg" },
      { num: 15, firstName: "Michael", lastName: "Annies" },
    ],
    replacements: [
      { num: 16, firstName: "Vernon", lastName: "Paulo" },
      { num: 17, firstName: "Hencus", lastName: "Van Wyk" },
      { num: 18, firstName: "Robert", lastName: "Hunt" },
      { num: 19, firstName: "Pierre", lastName: "Uys" },
      { num: 20, firstName: "Oupa", lastName: "Mohoje" },
      { num: 21, firstName: "Daniel", lastName: "Maartens" },
      { num: 22, firstName: "Rewan", lastName: "Kruger" },
      { num: 23, firstName: "George", lastName: "Lourens" },
    ],
  },

  // CC J2 - USAP vs Connacht Rugby (14/12/2024)
  {
    matchId: "cmmbzxsq3003z1umry5b9iqa7",
    label: "CC J2 - Connacht Rugby",
    starters: [
      { num: 1, firstName: "Dennis", lastName: "Buckley" },
      { num: 2, firstName: "Eoin", lastName: "De Buitléar" },
      { num: 3, firstName: "Sam", lastName: "Illo" },
      { num: 4, firstName: "Darragh", lastName: "Murray" },
      { num: 5, firstName: "Joe", lastName: "Joyce" },
      { num: 6, firstName: "Cian", lastName: "Prendergast" },
      { num: 7, firstName: "Shamus", lastName: "Hurley-Langton" },
      { num: 8, firstName: "Sean F", lastName: "O'Brien" },
      { num: 9, firstName: "Matthew", lastName: "Devine" },
      { num: 10, firstName: "Jack", lastName: "Carty" },
      { num: 11, firstName: "Andrew", lastName: "Smith" },
      { num: 12, firstName: "Cathal", lastName: "Forde" },
      { num: 13, firstName: "Byron", lastName: "Ralston" },
      { num: 14, firstName: "Chay", lastName: "Mullins" },
      { num: 15, firstName: "Santiago", lastName: "Cordero" },
    ],
    replacements: [
      { num: 16, firstName: "Adam", lastName: "McBurney" },
      { num: 17, firstName: "Jordan", lastName: "Duggan" },
      { num: 18, firstName: "Jack", lastName: "Aungier" },
      { num: 19, firstName: "Oisín", lastName: "Dowling" },
      { num: 20, firstName: "Paul", lastName: "Boyle" },
      { num: 21, firstName: "Conor", lastName: "Oliver" },
      { num: 22, firstName: "Ben", lastName: "Murphy" },
      { num: 23, firstName: "David", lastName: "Hawkshaw" },
    ],
  },

  // CC J3 - USAP vs Cardiff Rugby (10/01/2025)
  {
    matchId: "cmmbzxsqy00411umrpdu82xuc",
    label: "CC J3 - Cardiff Rugby",
    starters: [
      { num: 1, firstName: "Rhys", lastName: "Barratt" },
      { num: 2, firstName: "Evan", lastName: "Lloyd" },
      { num: 3, firstName: "Keiron", lastName: "Assiratti" },
      { num: 4, firstName: "Josh", lastName: "McNally" },
      { num: 5, firstName: "Teddy", lastName: "Williams", isCaptain: true },
      { num: 6, firstName: "Alex", lastName: "Mann" },
      { num: 7, firstName: "Dan", lastName: "Thomas" },
      { num: 8, firstName: "Alun", lastName: "Lawrence" },
      { num: 9, firstName: "Aled", lastName: "Davies" },
      { num: 10, firstName: "Tinus", lastName: "De Beer" },
      { num: 11, firstName: "Tom", lastName: "Bowen" },
      { num: 12, firstName: "Rory", lastName: "Jennings" },
      { num: 13, firstName: "Rey", lastName: "Lee-Lo" },
      { num: 14, firstName: "Regan", lastName: "Grace" },
      { num: 15, firstName: "Cam", lastName: "Winnett" },
    ],
    replacements: [
      { num: 16, firstName: "Dafydd", lastName: "Hughes" },
      { num: 17, firstName: "Danny", lastName: "Southworth" },
      { num: 18, firstName: "Will", lastName: "Davies-King" },
      { num: 19, firstName: "Seb", lastName: "Davies" },
      { num: 20, firstName: "Mackenzie", lastName: "Martin" },
      { num: 21, firstName: "Johan", lastName: "Mulder" },
      { num: 22, firstName: "Ben", lastName: "Thomas" },
      { num: 23, firstName: "Jacob", lastName: "Beetham" },
    ],
  },

  // CC J4 - Zebre Parme vs USAP (19/01/2025)
  {
    matchId: "cmmbzxsru00431umr5r1mqzfc",
    label: "CC J4 - Zebre Parme",
    starters: [
      { num: 1, firstName: "Luca", lastName: "Rizzoli" },
      { num: 2, firstName: "Luca", lastName: "Bigi", isCaptain: true },
      { num: 3, firstName: "Juan", lastName: "Pitinari" },
      { num: 4, firstName: "Rusiate", lastName: "Nasove" },
      { num: 5, firstName: "Matteo", lastName: "Canali" },
      { num: 6, firstName: "Luca", lastName: "Andreani" },
      { num: 7, firstName: "Jacopo", lastName: "Bianchi" },
      { num: 8, firstName: "Giacomo", lastName: "Ferrari" },
      { num: 9, firstName: "Thomas", lastName: "Dominguez" },
      { num: 10, firstName: "Giovanni", lastName: "Montemauri" },
      { num: 11, firstName: "Scott", lastName: "Gregory" },
      { num: 12, firstName: "Damiano", lastName: "Mazza" },
      { num: 13, firstName: "Fetuli", lastName: "Paea" },
      { num: 14, firstName: "Jacopo", lastName: "Trulla" },
      { num: 15, firstName: "Giacomo", lastName: "Da Re" },
    ],
    replacements: [
      { num: 16, firstName: "Tommaso", lastName: "Di Bartolomeo" },
      { num: 17, firstName: "Paolo", lastName: "Buonfiglio" },
      { num: 18, firstName: "Muhamed", lastName: "Hasa" },
      { num: 19, firstName: "Leonardo", lastName: "Krumov" },
      { num: 20, firstName: "Bautista", lastName: "Stavile Bravin" },
      { num: 21, firstName: "Gonzalo", lastName: "Garcia" },
      { num: 22, firstName: "Giovanni", lastName: "Licata" },
      { num: 23, firstName: "Alessandro", lastName: "Gesi" },
    ],
  },

  // CC 8e finale - USAP vs Racing 92 (05/04/2025)
  {
    matchId: "cmmbzxssq00451umrd7m0clvp",
    label: "CC 8e - Racing 92",
    starters: [
      { num: 1, firstName: "Hassane", lastName: "Kolingar" },
      { num: 2, firstName: "Janick", lastName: "Tarrit" },
      { num: 3, firstName: "Demba", lastName: "Bamba" },
      { num: 4, firstName: "José Junior", lastName: "K'Poku" },
      { num: 5, firstName: "Romain", lastName: "Taofifenua" },
      { num: 6, firstName: "Maxime", lastName: "Baudonne" },
      { num: 7, firstName: "Noa", lastName: "Zinzen", isCaptain: true },
      { num: 8, firstName: "Jordan", lastName: "Joseph" },
      { num: 9, firstName: "Antoine", lastName: "Gibert" },
      { num: 10, firstName: "Owen", lastName: "Farrell" },
      { num: 11, firstName: "Gaël", lastName: "Fickou" },
      { num: 12, firstName: "Vinaya", lastName: "Habosi" },
      { num: 13, firstName: "Henry", lastName: "Chavancy" },
      { num: 14, firstName: "Donovan", lastName: "Taofifenua" },
      { num: 15, firstName: "Tristan James", lastName: "Tedder" },
    ],
    replacements: [
      { num: 16, firstName: "Diego", lastName: "Escobar" },
      { num: 17, firstName: "Lizo", lastName: "Mazibuko" },
      { num: 18, firstName: "Thomas", lastName: "Laclayat" },
      { num: 19, firstName: "Boris", lastName: "Palu" },
      { num: 20, firstName: "Shingirai Dylan Masimba", lastName: "Manyarara" },
      { num: 21, firstName: "Waisea", lastName: "Naituvi" },
      { num: 22, firstName: "Nolann", lastName: "Le Garrec" },
      { num: 23, firstName: "Sailosi", lastName: "James" },
    ],
  },
];

// ─── Data: Barrage Access ───────────────────────────────────────

const ACCESS_MATCH: MatchComposition[] = [
  // Barrage Access - FC Grenoble vs USAP (07/06/2025)
  {
    matchId: "cmmbzxstm00471umruprhmzrd",
    label: "Barrage Access - FC Grenoble",
    starters: [
      { num: 1, firstName: "Zackary", lastName: "Gauthier" },
      { num: 2, firstName: "Mattéo", lastName: "Sarragallet" },
      { num: 3, firstName: "Johan", lastName: "Jonker" },
      { num: 4, firstName: "Thomas", lastName: "Lainault" },
      { num: 5, firstName: "Bill", lastName: "Nansen" },
      { num: 6, firstName: "Antonin", lastName: "Berruyer", isCaptain: true },
      { num: 7, firstName: "Théo", lastName: "Martel" },
      { num: 8, firstName: "Penisoni", lastName: "Muarua" },
      { num: 9, firstName: "Baptiste", lastName: "Couilloud" },
      { num: 10, firstName: "Sam", lastName: "Davies" },
      { num: 11, firstName: "Wesley", lastName: "Hulleu" },
      { num: 12, firstName: "Jules", lastName: "Hériteau" },
      { num: 13, firstName: "Romain", lastName: "Fusier" },
      { num: 14, firstName: "Hugo", lastName: "Trouilloud" },
      { num: 15, firstName: "Jonathan", lastName: "Farnoux" },
    ],
    replacements: [
      { num: 16, firstName: "Léo", lastName: "Rossi" },
      { num: 17, firstName: "Thomas", lastName: "Raynaud" },
      { num: 18, firstName: "Grigol", lastName: "Javakhia" },
      { num: 19, firstName: "Victor", lastName: "Guillaumond" },
      { num: 20, firstName: "Erwan", lastName: "Escande" },
      { num: 21, firstName: "Martin", lastName: "Palmier" },
      { num: 22, firstName: "Romain", lastName: "Trouilloud" },
      { num: 23, firstName: "Gela", lastName: "Pertaia" },
    ],
  },
];

// ─── Cache de joueurs pour déduplication ────────────────────────

// Clé = "prenom|nom" normalisé
const playerCache = new Map<string, string>(); // clé → playerId

function playerKey(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase().trim()}|${lastName.toLowerCase().trim()}`;
}

/**
 * Trouve ou crée un joueur adverse.
 * Utilise le cache en mémoire pour éviter les doublons dans la même exécution.
 */
async function findOrCreateOpponentPlayer(
  firstName: string,
  lastName: string,
  position?: Position,
): Promise<string> {
  const key = playerKey(firstName, lastName);

  // 1. Cache mémoire
  if (playerCache.has(key)) {
    return playerCache.get(key)!;
  }

  // 2. Chercher en BDD (par nom exact)
  const existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });

  if (existing) {
    playerCache.set(key, existing.id);
    return existing.id;
  }

  // 3. Créer le joueur
  const slugBase = slugify(`${firstName} ${lastName}`);
  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      slug: slugBase, // temporaire
      position: position ?? null,
      isActive: false,
    },
  });

  // Mettre à jour le slug avec l'ID pour unicité
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: `${slugBase}-${player.id}` },
  });

  playerCache.set(key, player.id);
  return player.id;
}

// ─── Traitement d'un match ──────────────────────────────────────

async function processMatch(match: MatchComposition): Promise<void> {
  console.log(`\n── ${match.label} ──`);

  // Supprimer les entrées adverses existantes (idempotent)
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.matchId, isOpponent: true },
  });
  if (deleted.count > 0) {
    console.log(`  Supprimé ${deleted.count} entrée(s) adverse(s) existante(s)`);
  }

  // Traiter titulaires
  let created = 0;
  for (const p of match.starters) {
    const pos = positionFromNumber(p.num);
    const playerId = await findOrCreateOpponentPlayer(p.firstName, p.lastName, pos);

    await prisma.matchPlayer.create({
      data: {
        matchId: match.matchId,
        playerId,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: true,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: pos,
      },
    });
    created++;
  }

  // Traiter remplaçants
  for (const p of match.replacements) {
    // Position estimée du remplaçant selon numéro de maillot
    let pos: Position;
    if (p.num <= 18) {
      // 16 = talonneur, 17 = pilier, 18 = 2e/3e ligne
      if (p.num === 16) pos = Position.TALONNEUR;
      else if (p.num === 17) pos = Position.PILIER_GAUCHE;
      else pos = Position.DEUXIEME_LIGNE;
    } else if (p.num <= 20) {
      // 19 = avants, 20 = avants/arrières
      pos = Position.TROISIEME_LIGNE_AILE;
    } else {
      // 21-23 = arrières
      if (p.num === 21) pos = Position.DEMI_DE_MELEE;
      else pos = Position.CENTRE;
    }

    const playerId = await findOrCreateOpponentPlayer(p.firstName, p.lastName, pos);

    await prisma.matchPlayer.create({
      data: {
        matchId: match.matchId,
        playerId,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: false,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: pos,
      },
    });
    created++;
  }

  console.log(`  ✓ ${created} joueurs adverses ajoutés (15 titu + ${match.replacements.length} rempl.)`);
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  Ajout des compositions adverses - Saison 2024-2025 ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  const allMatches = [...TOP14_MATCHES, ...CHALLENGE_CUP_MATCHES, ...ACCESS_MATCH];

  console.log(`\nNombre total de matchs à traiter : ${allMatches.length}`);
  console.log(`Joueurs par match : 23 (15 titulaires + 8 remplaçants)`);
  console.log(`Estimation : ~${allMatches.length * 23} entrées MatchPlayer à créer\n`);

  // Vérifier que tous les matchs existent
  console.log("── Vérification des matchs ──");
  for (const m of allMatches) {
    const match = await prisma.match.findUnique({
      where: { id: m.matchId },
      select: { id: true, slug: true },
    });
    if (!match) {
      throw new Error(`Match introuvable : ${m.label} (${m.matchId})`);
    }
  }
  console.log(`  ✓ ${allMatches.length} matchs vérifiés\n`);

  // Top 14 J8-J26
  console.log("═══ TOP 14 (J8 → J26) ═══");
  for (const match of TOP14_MATCHES) {
    await processMatch(match);
  }

  // Challenge Cup
  console.log("\n═══ CHALLENGE CUP ═══");
  for (const match of CHALLENGE_CUP_MATCHES) {
    await processMatch(match);
  }

  // Barrage Access
  console.log("\n═══ BARRAGE ACCESS ═══");
  for (const match of ACCESS_MATCH) {
    await processMatch(match);
  }

  // Stats finales
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log(`║  Terminé ! ${playerCache.size} joueurs adverses (créés ou réutilisés)    ║`);
  console.log(`║  ${allMatches.length} matchs traités avec compositions adverses      ║`);
  console.log("╚══════════════════════════════════════════════════════╝");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
