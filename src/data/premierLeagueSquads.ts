import { FormationKey } from './formations';

export type PresetRosterPlayer = { no: number; pos: string; name: string };
export type PresetLineupPlayer = { role: string; name: string };
export type PremierLeagueTeam = {
  id: string;
  name: string;
  initials: string;
  formation: FormationKey;
  primaryColor: string;
  secondaryColor: string;
  awayPrimaryColor: string;
  awaySecondaryColor: string;
  flagBands: string[];
};

// Supplied 2026/27 Premier League squads and shirt numbers, updated 5 September 2026.
export const premierLeagueTeams = [
  {
    "id": "bournemouth",
    "name": "AFC Bournemouth",
    "formation": "4-2-3-1",
    "initials": "BOU",
    "primaryColor": "#da291c",
    "secondaryColor": "#111111",
    "awayPrimaryColor": "#facc15",
    "awaySecondaryColor": "#111827",
    "flagBands": [
      "#da291c",
      "#111111",
      "#da291c"
    ]
  },
  {
    "id": "arsenal",
    "name": "Arsenal",
    "formation": "4-3-3",
    "initials": "ARS",
    "primaryColor": "#db0007",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#101827",
    "awaySecondaryColor": "#d9b44a",
    "flagBands": [
      "#db0007",
      "#ffffff",
      "#db0007"
    ]
  },
  {
    "id": "aston-villa",
    "name": "Aston Villa",
    "formation": "4-2-3-1",
    "initials": "AVL",
    "primaryColor": "#670e36",
    "secondaryColor": "#95d9f4",
    "awayPrimaryColor": "#ffffff",
    "awaySecondaryColor": "#670e36",
    "flagBands": [
      "#670e36",
      "#95d9f4",
      "#670e36"
    ]
  },
  {
    "id": "brentford",
    "name": "Brentford",
    "formation": "4-2-3-1",
    "initials": "BRE",
    "primaryColor": "#e30613",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#1f2937",
    "awaySecondaryColor": "#f59e0b",
    "flagBands": [
      "#e30613",
      "#ffffff",
      "#e30613"
    ]
  },
  {
    "id": "brighton",
    "name": "Brighton & Hove Albion",
    "formation": "4-2-3-1",
    "initials": "BHA",
    "primaryColor": "#0057b8",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#f97316",
    "awaySecondaryColor": "#0f172a",
    "flagBands": [
      "#0057b8",
      "#ffffff",
      "#0057b8"
    ]
  },
  {
    "id": "chelsea",
    "name": "Chelsea",
    "formation": "3-4-2-1",
    "initials": "CHE",
    "primaryColor": "#034694",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#f6c445",
    "awaySecondaryColor": "#1e3a8a",
    "flagBands": [
      "#034694",
      "#ffffff",
      "#034694"
    ]
  },
  {
    "id": "coventry-city",
    "name": "Coventry City",
    "formation": "4-2-3-1",
    "initials": "COV",
    "primaryColor": "#72a1d1",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#111827",
    "awaySecondaryColor": "#72a1d1",
    "flagBands": [
      "#72a1d1",
      "#ffffff",
      "#72a1d1"
    ]
  },
  {
    "id": "crystal-palace",
    "name": "Crystal Palace",
    "formation": "3-4-2-1",
    "initials": "CRY",
    "primaryColor": "#1b458f",
    "secondaryColor": "#c4122e",
    "awayPrimaryColor": "#ffffff",
    "awaySecondaryColor": "#1b458f",
    "flagBands": [
      "#1b458f",
      "#c4122e",
      "#1b458f"
    ]
  },
  {
    "id": "everton",
    "name": "Everton",
    "formation": "4-2-3-1",
    "initials": "EVE",
    "primaryColor": "#003399",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#f3e8c8",
    "awaySecondaryColor": "#003399",
    "flagBands": [
      "#003399",
      "#ffffff",
      "#003399"
    ]
  },
  {
    "id": "fulham",
    "name": "Fulham",
    "formation": "4-2-3-1",
    "initials": "FUL",
    "primaryColor": "#ffffff",
    "secondaryColor": "#111111",
    "awayPrimaryColor": "#d71920",
    "awaySecondaryColor": "#111111",
    "flagBands": [
      "#111111",
      "#ffffff",
      "#cc0000"
    ]
  },
  {
    "id": "hull-city",
    "name": "Hull City",
    "formation": "5-4-1",
    "initials": "HUL",
    "primaryColor": "#f5971d",
    "secondaryColor": "#111111",
    "awayPrimaryColor": "#111827",
    "awaySecondaryColor": "#f5971d",
    "flagBands": [
      "#f5971d",
      "#111111",
      "#f5971d"
    ]
  },
  {
    "id": "ipswich-town",
    "name": "Ipswich Town",
    "formation": "4-2-3-1",
    "initials": "IPS",
    "primaryColor": "#3a64a8",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#f97316",
    "awaySecondaryColor": "#1e3a8a",
    "flagBands": [
      "#3a64a8",
      "#ffffff",
      "#3a64a8"
    ]
  },
  {
    "id": "leeds-united",
    "name": "Leeds United",
    "formation": "4-2-3-1",
    "initials": "LEE",
    "primaryColor": "#ffffff",
    "secondaryColor": "#1d428a",
    "awayPrimaryColor": "#7f1d3d",
    "awaySecondaryColor": "#f8d85b",
    "flagBands": [
      "#ffffff",
      "#1d428a",
      "#f9d616"
    ]
  },
  {
    "id": "liverpool",
    "name": "Liverpool",
    "formation": "4-2-3-1",
    "initials": "LIV",
    "primaryColor": "#e31b23",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#0f766e",
    "awaySecondaryColor": "#ffffff",
    "flagBands": [
      "#e31b23",
      "#ffffff",
      "#e31b23"
    ]
  },
  {
    "id": "manchester-city",
    "name": "Manchester City",
    "formation": "4-3-3",
    "initials": "MCI",
    "primaryColor": "#6cabdd",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#7f1d3d",
    "awaySecondaryColor": "#f8d85b",
    "flagBands": [
      "#6cabdd",
      "#ffffff",
      "#6cabdd"
    ]
  },
  {
    "id": "manchester-united",
    "name": "Manchester United",
    "formation": "4-2-3-1",
    "initials": "MUN",
    "primaryColor": "#da291c",
    "secondaryColor": "#fbe122",
    "awayPrimaryColor": "#1d4ed8",
    "awaySecondaryColor": "#e5e7eb",
    "flagBands": [
      "#da291c",
      "#fbe122",
      "#da291c"
    ]
  },
  {
    "id": "newcastle-united",
    "name": "Newcastle United",
    "formation": "4-3-3",
    "initials": "NEW",
    "primaryColor": "#241f20",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#0f766e",
    "awaySecondaryColor": "#ffffff",
    "flagBands": [
      "#241f20",
      "#ffffff",
      "#241f20"
    ]
  },
  {
    "id": "nottingham-forest",
    "name": "Nottingham Forest",
    "formation": "3-4-2-1",
    "initials": "NFO",
    "primaryColor": "#dd0000",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#0f172a",
    "awaySecondaryColor": "#d9b44a",
    "flagBands": [
      "#dd0000",
      "#ffffff",
      "#dd0000"
    ]
  },
  {
    "id": "sunderland",
    "name": "Sunderland",
    "formation": "4-3-3",
    "initials": "SUN",
    "primaryColor": "#e30613",
    "secondaryColor": "#ffffff",
    "awayPrimaryColor": "#111827",
    "awaySecondaryColor": "#f59e0b",
    "flagBands": [
      "#e30613",
      "#ffffff",
      "#e30613"
    ]
  },
  {
    "id": "tottenham-hotspur",
    "name": "Tottenham Hotspur",
    "formation": "4-2-3-1",
    "initials": "TOT",
    "primaryColor": "#ffffff",
    "secondaryColor": "#132257",
    "awayPrimaryColor": "#6d28d9",
    "awaySecondaryColor": "#d9f99d",
    "flagBands": [
      "#ffffff",
      "#132257",
      "#ffffff"
    ]
  }
] as PremierLeagueTeam[];

export const premierLeagueSquads = {
  "bournemouth": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Djordje Petrovic"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Julian Araujo"
    },
    {
      "no": 14,
      "pos": "DF",
      "name": "Antonio Silva"
    },
    {
      "no": 18,
      "pos": "DF",
      "name": "Bafode Diakite"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Adrien Truffert"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Tyler Adams"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Lewis Cook"
    },
    {
      "no": 37,
      "pos": "MF",
      "name": "Rayan"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Justin Kluivert"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Amine Adli"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Evanilson"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Fraser Forster"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Michele Di Gregorio"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "James Hill"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Adam Smith"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Max Aarons"
    },
    {
      "no": 47,
      "pos": "MF",
      "name": "Ben Winterburn"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "David Brooks"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Alex Scott"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Ryan Christie"
    },
    {
      "no": 16,
      "pos": "MF",
      "name": "Marcus Tavernier"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Juanlu Sanchez"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Daniel Jebbison"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Alvaro Rodriguez"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Julio Soler"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Ben Gannon-Doak"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Eli Junior Kroupi"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Alex Toth"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Veljko Milosavljevic"
    },
    {
      "no": 46,
      "pos": "MF",
      "name": "Callan McKenna"
    },
    {
      "no": 50,
      "pos": "MF",
      "name": "Remy Rees-Dottin"
    },
    {
      "no": 51,
      "pos": "MF",
      "name": "Malcom Dacosta Gonzalez"
    },
    {
      "no": 53,
      "pos": "MF",
      "name": "Charlie Stevens"
    },
    {
      "no": 56,
      "pos": "MF",
      "name": "Harold William"
    }
  ],
  "arsenal": [
    {
      "no": 1,
      "pos": "GK",
      "name": "David Raya"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Ben White"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "William Saliba"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Gabriel"
    },
    {
      "no": 33,
      "pos": "DF",
      "name": "Riccardo Calafiori"
    },
    {
      "no": 36,
      "pos": "MF",
      "name": "Martin Zubimendi"
    },
    {
      "no": 41,
      "pos": "MF",
      "name": "Declan Rice"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Martin Odegaard"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Bukayo Saka"
    },
    {
      "no": 14,
      "pos": "FW",
      "name": "Viktor Gyokeres"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Eberechi Eze"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Kepa Arrizabalaga"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Illan Meslier"
    },
    {
      "no": 3,
      "pos": "MF",
      "name": "Cristhian Mosquera"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Piero Hincapie"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Jurrien Timber"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Ezri Konsa"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Mikel Merino"
    },
    {
      "no": 39,
      "pos": "MF",
      "name": "Bruno Guimaraes"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Noni Madueke"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Christos Tzolis"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Kai Havertz"
    },
    {
      "no": 35,
      "pos": "MF",
      "name": "Tommy Setford"
    },
    {
      "no": 49,
      "pos": "MF",
      "name": "Myles Lewis-Skelly"
    },
    {
      "no": 56,
      "pos": "MF",
      "name": "Max Dowman"
    }
  ],
  "aston-villa": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Zion Suzuki"
    },
    {
      "no": 29,
      "pos": "DF",
      "name": "Aaron Wan-Bissaka"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Taylor Harwood-Bellis"
    },
    {
      "no": 14,
      "pos": "DF",
      "name": "Pau Torres"
    },
    {
      "no": 22,
      "pos": "DF",
      "name": "Ian Maatsen"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Boubacar Kamara"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Leon Goretzka"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "John McGinn"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Emi Buendia"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Alejandro Garnacho"
    },
    {
      "no": 11,
      "pos": "FW",
      "name": "Nicolas Jackson"
    },
    {
      "no": 40,
      "pos": "MF",
      "name": "Marco Bizot"
    },
    {
      "no": 42,
      "pos": "MF",
      "name": "James Wright"
    },
    {
      "no": 2,
      "pos": "MF",
      "name": "Matty Cash"
    },
    {
      "no": 3,
      "pos": "MF",
      "name": "Victor Lindelof"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Tyrone Mings"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Matteo Ruggeri"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Ross Barkley"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Amadou Onana"
    },
    {
      "no": 26,
      "pos": "MF",
      "name": "Lamare Bogarde"
    },
    {
      "no": 35,
      "pos": "MF",
      "name": "Joao Gomes"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Tammy Abraham"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Ibrahim Mbaye"
    },
    {
      "no": 39,
      "pos": "MF",
      "name": "Brian Madjo"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Johan Manzambi"
    },
    {
      "no": 47,
      "pos": "MF",
      "name": "Alysson"
    }
  ],
  "brentford": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Caoimhin Kelleher"
    },
    {
      "no": 33,
      "pos": "DF",
      "name": "Michael Kayode"
    },
    {
      "no": 22,
      "pos": "DF",
      "name": "Nathan Collins"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Sepp van den Berg"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Rico Henry"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Vitaly Janelt"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Yehor Yarmoliuk"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Kevin Schade"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Mikkel Damsgaard"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Dango Ouattara"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Igor Thiago"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Hakon Valdimarsson"
    },
    {
      "no": 31,
      "pos": "MF",
      "name": "Ellery Balcombe"
    },
    {
      "no": 2,
      "pos": "MF",
      "name": "Aaron Hickey"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Kristoffer Ajer"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "El Hadji Diouf"
    },
    {
      "no": 36,
      "pos": "MF",
      "name": "Ji-soo Kim"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Mathias Jensen"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Josh Dasilva"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Fabio Carvalho"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Antoni Milambo"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Mamadou Sangare"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Callum Wilson"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Jaidon Anthony"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Keane Lewis-Potter"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Caelan Avenell"
    },
    {
      "no": 39,
      "pos": "MF",
      "name": "Gustavo Nunes"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Jannik Schuster"
    },
    {
      "no": 47,
      "pos": "MF",
      "name": "Kaye Furo"
    },
    {
      "no": 48,
      "pos": "MF",
      "name": "Benjamin Fredrick"
    }
  ],
  "brighton": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Bart Verbruggen"
    },
    {
      "no": 20,
      "pos": "DF",
      "name": "Costinha"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Pascal Struijk"
    },
    {
      "no": 5,
      "pos": "DF",
      "name": "Lewis Dunk"
    },
    {
      "no": 29,
      "pos": "DF",
      "name": "Maxim De Cuyper"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Mats Wieffer"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Pascal Gross"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Yankuba Minteh"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Georginio Rutter"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Kaoru Mitoma"
    },
    {
      "no": 28,
      "pos": "FW",
      "name": "Evan Ferguson"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Jason Steele"
    },
    {
      "no": 38,
      "pos": "MF",
      "name": "Tom McGill"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Jaouen Hadjam"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Olivier Boscagli"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Ferdi Kadioglu"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Michael Svoboda"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Diego Gomez"
    },
    {
      "no": 26,
      "pos": "MF",
      "name": "Yasin Ayari"
    },
    {
      "no": 33,
      "pos": "MF",
      "name": "Matt O'Riley"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Promise David"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Ibrahim Osman"
    },
    {
      "no": 39,
      "pos": "MF",
      "name": "Femi Azeez"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Jack Hinshelwood"
    },
    {
      "no": 9,
      "pos": "MF",
      "name": "Stefanos Tzimas"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Chema Andres"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Charalampos Kostoulas"
    },
    {
      "no": 35,
      "pos": "MF",
      "name": "Malick Yalcouye"
    },
    {
      "no": 36,
      "pos": "MF",
      "name": "Zadok Yohanna"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Luka Vuskovic"
    }
  ],
  "chelsea": [
    {
      "no": 26,
      "pos": "GK",
      "name": "Emiliano Martinez"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Wesley Fofana"
    },
    {
      "no": 5,
      "pos": "DF",
      "name": "Maxence Lacroix"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Levi Colwill"
    },
    {
      "no": 24,
      "pos": "DF",
      "name": "Reece James"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Moises Caicedo"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Jordan Henderson"
    },
    {
      "no": 21,
      "pos": "DF",
      "name": "Jorrel Hato"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Cole Palmer"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Morgan Rogers"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Joao Pedro"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Teddy Sharman-Lowe"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Gaga Slonina"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Valentin Barco"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Malo Gusto"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Pep Chavarria"
    },
    {
      "no": 45,
      "pos": "MF",
      "name": "Romeo Lavia"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Pedro Neto"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Jamie Gittens"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Danny Welbeck"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Emmanuel Emegha"
    },
    {
      "no": 2,
      "pos": "MF",
      "name": "Marco Palestra"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Geovany Quenda"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Aaron Anselmino"
    },
    {
      "no": 31,
      "pos": "MF",
      "name": "Reggie Watson"
    },
    {
      "no": 32,
      "pos": "MF",
      "name": "Mahdi Nicoll-Jazuli"
    },
    {
      "no": 34,
      "pos": "MF",
      "name": "Josh Acheampong"
    },
    {
      "no": 39,
      "pos": "MF",
      "name": "Mike Penders"
    },
    {
      "no": 41,
      "pos": "MF",
      "name": "Estevao"
    }
  ],
  "coventry-city": [
    {
      "no": 19,
      "pos": "GK",
      "name": "Carl Rushworth"
    },
    {
      "no": 27,
      "pos": "DF",
      "name": "Milan van Ewijk"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Bobby Thomas"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Ethan Pinnock"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Jay Dasilva"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Matt Grimes"
    },
    {
      "no": 38,
      "pos": "MF",
      "name": "Gustavo Hamer"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Tatsuhiro Sakamoto"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Jack Rudoni"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Ephron Mason-Clark"
    },
    {
      "no": 11,
      "pos": "FW",
      "name": "Haji Wright"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Ben Wilson"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Daniel Bentley"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Kaine Kesler-Hayden"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Joel Latibeaudiere"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Aurele Amenda"
    },
    {
      "no": 26,
      "pos": "MF",
      "name": "Luke Woolfenden"
    },
    {
      "no": 16,
      "pos": "MF",
      "name": "Frank Onyeka"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Josh Eccles"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Victor Torp"
    },
    {
      "no": 9,
      "pos": "MF",
      "name": "Ellis Simms"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Taiwo Awoniyi"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Loum Tchaouna"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Brandon Thomas-Asante"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Caleb Yirenkyi"
    },
    {
      "no": 49,
      "pos": "MF",
      "name": "Sidiki Cherif"
    }
  ],
  "crystal-palace": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Dean Henderson"
    },
    {
      "no": 26,
      "pos": "DF",
      "name": "Chris Richards"
    },
    {
      "no": 5,
      "pos": "DF",
      "name": "Axel Disasi"
    },
    {
      "no": 17,
      "pos": "DF",
      "name": "Takehiro Tomiyasu"
    },
    {
      "no": 30,
      "pos": "DF",
      "name": "Oscar Mingueza"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Adam Wharton"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Quinten Timber"
    },
    {
      "no": 33,
      "pos": "DF",
      "name": "Ben Chilwell"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Ismaila Sarr"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Yeremy Pino"
    },
    {
      "no": 14,
      "pos": "FW",
      "name": "Jean-Philippe Mateta"
    },
    {
      "no": 31,
      "pos": "MF",
      "name": "Remi Matthews"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Walter Benitez"
    },
    {
      "no": 3,
      "pos": "MF",
      "name": "Tyrick Mitchell"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Anan Khalaili"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Jefferson Lerma"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Dwight McNeil"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Daichi Kamada"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Will Hughes"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Dario Osorio"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Cheick Doucoure"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Matheus Franca"
    },
    {
      "no": 9,
      "pos": "MF",
      "name": "Eddie Nketiah"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Jorgen Strand Larsen"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Evann Guessand"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Chadi Riad"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Jaydee Canvot"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Zavier Gozo"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Honest Ahanor"
    }
  ],
  "everton": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Jordan Pickford"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Ainsley Maitland-Niles"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "James Tarkowski"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Jarrad Branthwaite"
    },
    {
      "no": 16,
      "pos": "DF",
      "name": "Vitalii Mykolenko"
    },
    {
      "no": 37,
      "pos": "MF",
      "name": "James Garner"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Hayden Hackney"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Brennan Johnson"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Kiernan Dewsbury-Hall"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Jack Grealish"
    },
    {
      "no": 11,
      "pos": "FW",
      "name": "Thierno Barry"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Mark Travers"
    },
    {
      "no": 31,
      "pos": "MF",
      "name": "Tom King"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Michael Keane"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Jake O'Brien"
    },
    {
      "no": 34,
      "pos": "MF",
      "name": "Merlin Rohl"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Christian Norgaard"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Charly Alcaraz"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Fraser Barnsley"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Tyrique George"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Tyler Dibling"
    },
    {
      "no": 45,
      "pos": "MF",
      "name": "Harrison Armstrong"
    },
    {
      "no": 58,
      "pos": "MF",
      "name": "Braiden Graham"
    },
    {
      "no": 81,
      "pos": "MF",
      "name": "Harvey Foster"
    }
  ],
  "fulham": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Bernd Leno"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Kenny Tete"
    },
    {
      "no": 5,
      "pos": "DF",
      "name": "Joachim Andersen"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Calvin Bassey"
    },
    {
      "no": 33,
      "pos": "DF",
      "name": "Antonee Robinson"
    },
    {
      "no": 16,
      "pos": "MF",
      "name": "Sander Berge"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Hugo Larsson"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Oscar Bobb"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Alex Iwobi"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Kevin"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Rodrigo Muniz"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Benjamin Lecomte"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Jorge Cuenca"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Timothy Castagne"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Ryan Sessegnon"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "David Affengruber"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Harrison Reed"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Cesar Palacios"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Tom Cairney"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Shea Charles"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Manuel Angel"
    },
    {
      "no": 32,
      "pos": "MF",
      "name": "Emile Smith Rowe"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Gonzalo Garcia"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Michael Allen"
    },
    {
      "no": 26,
      "pos": "MF",
      "name": "Terrell Works"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Jonah Kusi-Asare"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Josh King"
    },
    {
      "no": 36,
      "pos": "MF",
      "name": "Alex Borto"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Luc De Fougerolles"
    }
  ],
  "hull-city": [
    {
      "no": 19,
      "pos": "GK",
      "name": "Konstantinos Tzolakis"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Lewie Coyle"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Semi Ajayi"
    },
    {
      "no": 15,
      "pos": "DF",
      "name": "John Egan"
    },
    {
      "no": 32,
      "pos": "DF",
      "name": "Nobel Mendy"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Ryan Giles"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Mohamed Belloumi"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Hidemasa Morita"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Matt Crooks"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Elliot Stroud"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Oli McBurnie"
    },
    {
      "no": 1,
      "pos": "MF",
      "name": "Jack Butland"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Dillon Phillips"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Charlie Hughes"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Paddy McNair"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Matt Targett"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Brooke Norton-Cuffy"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Regan Slater"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Lucas Gourna-Douath"
    },
    {
      "no": 33,
      "pos": "MF",
      "name": "Abdulkadir Omur"
    },
    {
      "no": 42,
      "pos": "MF",
      "name": "Tim Iroegbunam"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Sorba Thomas"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Joe Gelhardt"
    },
    {
      "no": 50,
      "pos": "MF",
      "name": "Mohamed-Ali Cho"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Ilyas Ansah"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Jens Hjerto-Dahl"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Lucas Herrington"
    },
    {
      "no": 55,
      "pos": "MF",
      "name": "Archie Howard"
    },
    {
      "no": 16,
      "pos": "MF",
      "name": "Christos Mouzakitis"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Robinio Vaz"
    }
  ],
  "ipswich-town": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Alex Palmer"
    },
    {
      "no": 19,
      "pos": "DF",
      "name": "Darnell Furlong"
    },
    {
      "no": 26,
      "pos": "DF",
      "name": "Dara O'Shea"
    },
    {
      "no": 24,
      "pos": "DF",
      "name": "Jacob Greaves"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Leif Davis"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Azor Matusiwa"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Exequiel Palacios"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Abdul Fatawu"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Julio Enciso"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Jaden Philogene"
    },
    {
      "no": 38,
      "pos": "FW",
      "name": "Daizen Maeda"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Christian Walton"
    },
    {
      "no": 37,
      "pos": "MF",
      "name": "Kjell Scherpen"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Cedric Kipre"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Issa Diop"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Florentino"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Jack Taylor"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Sasa Lukic"
    },
    {
      "no": 32,
      "pos": "MF",
      "name": "Marcelino Nunez"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Kasey McAteer"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Chuba Akpom"
    },
    {
      "no": 33,
      "pos": "MF",
      "name": "Anis Mehmeti"
    },
    {
      "no": 2,
      "pos": "MF",
      "name": "Emersonn"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Jack Clarke"
    },
    {
      "no": 9,
      "pos": "MF",
      "name": "Zian Flemming"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Sindre Walle Egeli"
    },
    {
      "no": 42,
      "pos": "MF",
      "name": "Abdoul Ouattara"
    }
  ],
  "leeds-united": [
    {
      "no": 1,
      "pos": "GK",
      "name": "James Trafford"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Jayden Bogle"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Joe Rodon"
    },
    {
      "no": 15,
      "pos": "DF",
      "name": "Jaka Bijol"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Gabriel Gudmundsson"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Ethan Ampadu"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Anton Stach"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Daniel James"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Harry Wilson"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Noah Okafor"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Dominic Calvert-Lewin"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Alex Cairns"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Michael Zetterer"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Melvin Bard"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Tarik Muharemovic"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "James Justin"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Nico Elvedi"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Sean Longstaff"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Brenden Aaronson"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Ao Tanaka"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Ilia Gruev"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Lukas Nmecha"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Mateo Joseph"
    },
    {
      "no": 16,
      "pos": "MF",
      "name": "Jean-Matteo Bahoya"
    },
    {
      "no": 47,
      "pos": "MF",
      "name": "Rhys Chadwick"
    },
    {
      "no": 48,
      "pos": "MF",
      "name": "Rory Mahady"
    },
    {
      "no": 49,
      "pos": "MF",
      "name": "Darryl Ombang"
    },
    {
      "no": 50,
      "pos": "MF",
      "name": "Alfie Cresswell"
    },
    {
      "no": 65,
      "pos": "MF",
      "name": "Jayden Lienou"
    },
    {
      "no": 72,
      "pos": "MF",
      "name": "Callum Mills"
    }
  ],
  "liverpool": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Alisson"
    },
    {
      "no": 30,
      "pos": "DF",
      "name": "Jeremie Frimpong"
    },
    {
      "no": 33,
      "pos": "DF",
      "name": "Ronald Araujo"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Virgil van Dijk"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Milos Kerkez"
    },
    {
      "no": 38,
      "pos": "MF",
      "name": "Ryan Gravenberch"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Alexis Mac Allister"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Bradley Barcola"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Florian Wirtz"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Cody Gakpo"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Alexander Isak"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Giorgi Mamardashvili"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Freddie Woodman"
    },
    {
      "no": 56,
      "pos": "MF",
      "name": "Vitezslav Jaros"
    },
    {
      "no": 2,
      "pos": "MF",
      "name": "Joe Gomez"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Jeremy Jacquet"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Conor Bradley"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Kostas Tsimikas"
    },
    {
      "no": 44,
      "pos": "MF",
      "name": "Luke Chambers"
    },
    {
      "no": 52,
      "pos": "MF",
      "name": "Isaac Mabaya"
    },
    {
      "no": 3,
      "pos": "MF",
      "name": "Wataru Endo"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Dominik Szoboszlai"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Victor Munoz"
    },
    {
      "no": 53,
      "pos": "MF",
      "name": "James McConnell"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Federico Chiesa"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Hugo Ekitike"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Giovanni Leoni"
    },
    {
      "no": 42,
      "pos": "MF",
      "name": "Trey Nyoni"
    },
    {
      "no": 73,
      "pos": "MF",
      "name": "Rio Ngumoha"
    }
  ],
  "manchester-city": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Gianluigi Donnarumma"
    },
    {
      "no": 82,
      "pos": "DF",
      "name": "Rico Lewis"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Ruben Dias"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Marc Guehi"
    },
    {
      "no": 21,
      "pos": "DF",
      "name": "Rayan Ait-Nouri"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Elliot Anderson"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Enzo Fernandez"
    },
    {
      "no": 47,
      "pos": "MF",
      "name": "Phil Foden"
    },
    {
      "no": 42,
      "pos": "MF",
      "name": "Antoine Semenyo"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Erling Haaland"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Jeremy Doku"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Marcus Bettinelli"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Geronimo Rulli"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Josko Gvardiol"
    },
    {
      "no": 45,
      "pos": "MF",
      "name": "Abdukodir Khusanov"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Mateo Kovacic"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Rayan Cherki"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Matheus Nunes"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Iliman Ndiaye"
    },
    {
      "no": 37,
      "pos": "MF",
      "name": "Allan"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Vitor Reis"
    },
    {
      "no": 32,
      "pos": "MF",
      "name": "Ayyoub Bouaddi"
    },
    {
      "no": 33,
      "pos": "MF",
      "name": "Nico O'Reilly"
    }
  ],
  "manchester-united": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Senne Lammens"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Diogo Dalot"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Matthijs de Ligt"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Lisandro Martinez"
    },
    {
      "no": 13,
      "pos": "DF",
      "name": "Patrick Dorgu"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Carlos Baleba"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Youri Tielemans"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Bryan Mbeumo"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Bruno Fernandes"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Matheus Cunha"
    },
    {
      "no": 30,
      "pos": "FW",
      "name": "Benjamin Sesko"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Karl Darlow"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Tom Heaton"
    },
    {
      "no": 45,
      "pos": "MF",
      "name": "Dermot Mee"
    },
    {
      "no": 3,
      "pos": "MF",
      "name": "Noussair Mazraoui"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Harry Maguire"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Leny Yoro"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Luke Shaw"
    },
    {
      "no": 26,
      "pos": "MF",
      "name": "Ayden Heaven"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Mason Mount"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Andrey Santos"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Manuel Ugarte"
    },
    {
      "no": 37,
      "pos": "MF",
      "name": "Kobbie Mainoo"
    },
    {
      "no": 43,
      "pos": "MF",
      "name": "Toby Collyer"
    },
    {
      "no": 9,
      "pos": "MF",
      "name": "Marcus Rashford"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Joshua Zirkzee"
    },
    {
      "no": 16,
      "pos": "MF",
      "name": "Amad"
    },
    {
      "no": 38,
      "pos": "MF",
      "name": "Jack Fletcher"
    },
    {
      "no": 39,
      "pos": "MF",
      "name": "Tyler Fletcher"
    },
    {
      "no": 41,
      "pos": "MF",
      "name": "Harry Amass"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Shea Lacey"
    }
  ],
  "newcastle-united": [
    {
      "no": 1,
      "pos": "GK",
      "name": "Nick Pope"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Tino Livramento"
    },
    {
      "no": 12,
      "pos": "DF",
      "name": "Malick Thiaw"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Sven Botman"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Lewis Hall"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Nico Gonzalez"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Joelinton"
    },
    {
      "no": 41,
      "pos": "MF",
      "name": "Jacob Ramsey"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Anthony Elanga"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Yoane Wissa"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Harvey Barnes"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Lukas Hornicek"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "Ewen Jaouen"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Mark Gillespie"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Fabian Schar"
    },
    {
      "no": 33,
      "pos": "MF",
      "name": "Dan Burn"
    },
    {
      "no": 37,
      "pos": "MF",
      "name": "Amar Dedic"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Aladji Bamba"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Sean Steur"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Jacob Murphy"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Joe Willock"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "William Osula"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Bazoumana Toure"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Matias Fernandez-Pardo"
    },
    {
      "no": 51,
      "pos": "MF",
      "name": "Leo Shahar"
    },
    {
      "no": 67,
      "pos": "MF",
      "name": "Lewis Miley"
    }
  ],
  "nottingham-forest": [
    {
      "no": 26,
      "pos": "GK",
      "name": "Matz Sels"
    },
    {
      "no": 31,
      "pos": "DF",
      "name": "Nikola Milenkovic"
    },
    {
      "no": 5,
      "pos": "DF",
      "name": "Murillo"
    },
    {
      "no": 2,
      "pos": "DF",
      "name": "Ousmane Diomande"
    },
    {
      "no": 27,
      "pos": "DF",
      "name": "Daniel Munoz"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Ibrahim Sangare"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Xaver Schlager"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Neco Williams"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Morgan Gibbs-White"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Callum Hudson-Odoi"
    },
    {
      "no": 19,
      "pos": "FW",
      "name": "Liam Delap"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "John Victor"
    },
    {
      "no": 33,
      "pos": "MF",
      "name": "Steven Benda"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Morato"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Jair Cunha"
    },
    {
      "no": 25,
      "pos": "MF",
      "name": "Luca Netz"
    },
    {
      "no": 34,
      "pos": "MF",
      "name": "Ola Aina"
    },
    {
      "no": 37,
      "pos": "MF",
      "name": "Nicolo Savona"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Nicolas Dominguez"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Ryan Yates"
    },
    {
      "no": 24,
      "pos": "MF",
      "name": "James McAtee"
    },
    {
      "no": 9,
      "pos": "MF",
      "name": "Chris Wood"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Igor Jesus"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Dan Ndoye"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Arnaud Kalimuendo"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Aaron Bott"
    }
  ],
  "sunderland": [
    {
      "no": 22,
      "pos": "GK",
      "name": "Robin Roefs"
    },
    {
      "no": 32,
      "pos": "DF",
      "name": "Trai Hume"
    },
    {
      "no": 4,
      "pos": "DF",
      "name": "Kevin Danso"
    },
    {
      "no": 5,
      "pos": "DF",
      "name": "Dan Ballard"
    },
    {
      "no": 17,
      "pos": "DF",
      "name": "Reinildo"
    },
    {
      "no": 34,
      "pos": "MF",
      "name": "Granit Xhaka"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Noah Sadiki"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Enzo Le Fee"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "Nilson Angulo"
    },
    {
      "no": 9,
      "pos": "FW",
      "name": "Brian Brobbey"
    },
    {
      "no": 23,
      "pos": "MF",
      "name": "Malick Fofana"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Simon Moore"
    },
    {
      "no": 31,
      "pos": "MF",
      "name": "Melker Ellborg"
    },
    {
      "no": 12,
      "pos": "MF",
      "name": "Thomas Meunier"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Omar Alderete"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Nordi Mukiele"
    },
    {
      "no": 1,
      "pos": "MF",
      "name": "Aji Alese"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Alan Browne"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Luke O'Nien"
    },
    {
      "no": 19,
      "pos": "MF",
      "name": "Habib Diarra"
    },
    {
      "no": 2,
      "pos": "MF",
      "name": "Abdoullah Ba"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Romaine Mundle"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Wilson Isidor"
    },
    {
      "no": 6,
      "pos": "MF",
      "name": "Dayann Methalie"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Chris Rigg"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Chemsdine Talbi"
    },
    {
      "no": 29,
      "pos": "MF",
      "name": "Jules Ahoka"
    }
  ],
  "tottenham-hotspur": [
    {
      "no": 31,
      "pos": "GK",
      "name": "Antonin Kinsky"
    },
    {
      "no": 23,
      "pos": "DF",
      "name": "Pedro Porro"
    },
    {
      "no": 6,
      "pos": "DF",
      "name": "Jan Paul van Hecke"
    },
    {
      "no": 37,
      "pos": "DF",
      "name": "Micky van de Ven"
    },
    {
      "no": 3,
      "pos": "DF",
      "name": "Andy Robertson"
    },
    {
      "no": 16,
      "pos": "MF",
      "name": "Sandro Tonali"
    },
    {
      "no": 8,
      "pos": "MF",
      "name": "Conor Gallagher"
    },
    {
      "no": 17,
      "pos": "MF",
      "name": "Savinho"
    },
    {
      "no": 7,
      "pos": "MF",
      "name": "Xavi Simons"
    },
    {
      "no": 22,
      "pos": "MF",
      "name": "Omar Marmoush"
    },
    {
      "no": 19,
      "pos": "FW",
      "name": "Dominic Solanke"
    },
    {
      "no": 39,
      "pos": "MF",
      "name": "Martin Dubravka"
    },
    {
      "no": 40,
      "pos": "MF",
      "name": "Brandon Austin"
    },
    {
      "no": 51,
      "pos": "MF",
      "name": "Jacob Knightbridge"
    },
    {
      "no": 4,
      "pos": "MF",
      "name": "Tosin Adarabioyo"
    },
    {
      "no": 5,
      "pos": "MF",
      "name": "Marcos Senesi"
    },
    {
      "no": 13,
      "pos": "MF",
      "name": "Destiny Udogie"
    },
    {
      "no": 33,
      "pos": "MF",
      "name": "Ben Davies"
    },
    {
      "no": 18,
      "pos": "MF",
      "name": "Mateus Fernandes"
    },
    {
      "no": 20,
      "pos": "MF",
      "name": "Mohammed Kudus"
    },
    {
      "no": 21,
      "pos": "MF",
      "name": "Dejan Kulusevski"
    },
    {
      "no": 30,
      "pos": "MF",
      "name": "Rodrigo Bentancur"
    },
    {
      "no": 10,
      "pos": "MF",
      "name": "James Maddison"
    },
    {
      "no": 27,
      "pos": "MF",
      "name": "Mykhailo Mudryk"
    },
    {
      "no": 28,
      "pos": "MF",
      "name": "Wilson Odobert"
    },
    {
      "no": 11,
      "pos": "MF",
      "name": "Mathys Tel"
    },
    {
      "no": 14,
      "pos": "MF",
      "name": "Archie Gray"
    },
    {
      "no": 15,
      "pos": "MF",
      "name": "Lucas Bergvall"
    },
    {
      "no": 68,
      "pos": "MF",
      "name": "Luca Williams-Barnett"
    }
  ]
} as Record<string, PresetRosterPlayer[]>;

export const premierLeagueStartingLineups = {
  "bournemouth": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Djordje Petrovic"
      },
      {
        "role": "RB",
        "name": "Julian Araujo"
      },
      {
        "role": "CB",
        "name": "Antonio Silva"
      },
      {
        "role": "CB",
        "name": "Bafode Diakite"
      },
      {
        "role": "LB",
        "name": "Adrien Truffert"
      },
      {
        "role": "DM",
        "name": "Tyler Adams"
      },
      {
        "role": "CM",
        "name": "Lewis Cook"
      },
      {
        "role": "RW",
        "name": "Rayan"
      },
      {
        "role": "AM",
        "name": "Justin Kluivert"
      },
      {
        "role": "LW",
        "name": "Amine Adli"
      },
      {
        "role": "ST",
        "name": "Evanilson"
      }
    ]
  },
  "arsenal": {
    "formation": "4-3-3",
    "players": [
      {
        "role": "GK",
        "name": "David Raya"
      },
      {
        "role": "RB",
        "name": "Ben White"
      },
      {
        "role": "CB",
        "name": "William Saliba"
      },
      {
        "role": "CB",
        "name": "Gabriel"
      },
      {
        "role": "LB",
        "name": "Riccardo Calafiori"
      },
      {
        "role": "DM",
        "name": "Martin Zubimendi"
      },
      {
        "role": "CM",
        "name": "Declan Rice"
      },
      {
        "role": "AM",
        "name": "Martin Odegaard"
      },
      {
        "role": "RW",
        "name": "Bukayo Saka"
      },
      {
        "role": "ST",
        "name": "Viktor Gyokeres"
      },
      {
        "role": "LW",
        "name": "Eberechi Eze"
      }
    ]
  },
  "aston-villa": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Zion Suzuki"
      },
      {
        "role": "RB",
        "name": "Aaron Wan-Bissaka"
      },
      {
        "role": "CB",
        "name": "Taylor Harwood-Bellis"
      },
      {
        "role": "CB",
        "name": "Pau Torres"
      },
      {
        "role": "LB",
        "name": "Ian Maatsen"
      },
      {
        "role": "DM",
        "name": "Boubacar Kamara"
      },
      {
        "role": "CM",
        "name": "Leon Goretzka"
      },
      {
        "role": "RW",
        "name": "John McGinn"
      },
      {
        "role": "AM",
        "name": "Emi Buendia"
      },
      {
        "role": "LW",
        "name": "Alejandro Garnacho"
      },
      {
        "role": "ST",
        "name": "Nicolas Jackson"
      }
    ]
  },
  "brentford": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Caoimhin Kelleher"
      },
      {
        "role": "RB",
        "name": "Michael Kayode"
      },
      {
        "role": "CB",
        "name": "Nathan Collins"
      },
      {
        "role": "CB",
        "name": "Sepp van den Berg"
      },
      {
        "role": "LB",
        "name": "Rico Henry"
      },
      {
        "role": "CM",
        "name": "Vitaly Janelt"
      },
      {
        "role": "CM",
        "name": "Yehor Yarmoliuk"
      },
      {
        "role": "RW",
        "name": "Kevin Schade"
      },
      {
        "role": "AM",
        "name": "Mikkel Damsgaard"
      },
      {
        "role": "LW",
        "name": "Dango Ouattara"
      },
      {
        "role": "ST",
        "name": "Igor Thiago"
      }
    ]
  },
  "brighton": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Bart Verbruggen"
      },
      {
        "role": "RB",
        "name": "Costinha"
      },
      {
        "role": "CB",
        "name": "Pascal Struijk"
      },
      {
        "role": "CB",
        "name": "Lewis Dunk"
      },
      {
        "role": "LB",
        "name": "Maxim De Cuyper"
      },
      {
        "role": "DM",
        "name": "Mats Wieffer"
      },
      {
        "role": "CM",
        "name": "Pascal Gross"
      },
      {
        "role": "RW",
        "name": "Yankuba Minteh"
      },
      {
        "role": "AM",
        "name": "Georginio Rutter"
      },
      {
        "role": "LW",
        "name": "Kaoru Mitoma"
      },
      {
        "role": "ST",
        "name": "Evan Ferguson"
      }
    ]
  },
  "chelsea": {
    "formation": "3-4-2-1",
    "players": [
      {
        "role": "GK",
        "name": "Emiliano Martinez"
      },
      {
        "role": "RCB",
        "name": "Wesley Fofana"
      },
      {
        "role": "CB",
        "name": "Maxence Lacroix"
      },
      {
        "role": "LCB",
        "name": "Levi Colwill"
      },
      {
        "role": "RWB",
        "name": "Reece James"
      },
      {
        "role": "CM",
        "name": "Moises Caicedo"
      },
      {
        "role": "CM",
        "name": "Jordan Henderson"
      },
      {
        "role": "LWB",
        "name": "Jorrel Hato"
      },
      {
        "role": "RAM",
        "name": "Cole Palmer"
      },
      {
        "role": "LAM",
        "name": "Morgan Rogers"
      },
      {
        "role": "ST",
        "name": "Joao Pedro"
      }
    ]
  },
  "coventry-city": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Carl Rushworth"
      },
      {
        "role": "RB",
        "name": "Milan van Ewijk"
      },
      {
        "role": "CB",
        "name": "Bobby Thomas"
      },
      {
        "role": "CB",
        "name": "Ethan Pinnock"
      },
      {
        "role": "LB",
        "name": "Jay Dasilva"
      },
      {
        "role": "CM",
        "name": "Matt Grimes"
      },
      {
        "role": "CM",
        "name": "Gustavo Hamer"
      },
      {
        "role": "RW",
        "name": "Tatsuhiro Sakamoto"
      },
      {
        "role": "AM",
        "name": "Jack Rudoni"
      },
      {
        "role": "LW",
        "name": "Ephron Mason-Clark"
      },
      {
        "role": "ST",
        "name": "Haji Wright"
      }
    ]
  },
  "crystal-palace": {
    "formation": "3-4-2-1",
    "players": [
      {
        "role": "GK",
        "name": "Dean Henderson"
      },
      {
        "role": "RCB",
        "name": "Chris Richards"
      },
      {
        "role": "CB",
        "name": "Axel Disasi"
      },
      {
        "role": "LCB",
        "name": "Takehiro Tomiyasu"
      },
      {
        "role": "RWB",
        "name": "Oscar Mingueza"
      },
      {
        "role": "CM",
        "name": "Adam Wharton"
      },
      {
        "role": "CM",
        "name": "Quinten Timber"
      },
      {
        "role": "LWB",
        "name": "Ben Chilwell"
      },
      {
        "role": "RAM",
        "name": "Ismaila Sarr"
      },
      {
        "role": "LAM",
        "name": "Yeremy Pino"
      },
      {
        "role": "ST",
        "name": "Jean-Philippe Mateta"
      }
    ]
  },
  "everton": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Jordan Pickford"
      },
      {
        "role": "RB",
        "name": "Ainsley Maitland-Niles"
      },
      {
        "role": "CB",
        "name": "James Tarkowski"
      },
      {
        "role": "CB",
        "name": "Jarrad Branthwaite"
      },
      {
        "role": "LB",
        "name": "Vitalii Mykolenko"
      },
      {
        "role": "CM",
        "name": "James Garner"
      },
      {
        "role": "CM",
        "name": "Hayden Hackney"
      },
      {
        "role": "RW",
        "name": "Brennan Johnson"
      },
      {
        "role": "AM",
        "name": "Kiernan Dewsbury-Hall"
      },
      {
        "role": "LW",
        "name": "Jack Grealish"
      },
      {
        "role": "ST",
        "name": "Thierno Barry"
      }
    ]
  },
  "fulham": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Bernd Leno"
      },
      {
        "role": "RB",
        "name": "Kenny Tete"
      },
      {
        "role": "CB",
        "name": "Joachim Andersen"
      },
      {
        "role": "CB",
        "name": "Calvin Bassey"
      },
      {
        "role": "LB",
        "name": "Antonee Robinson"
      },
      {
        "role": "CM",
        "name": "Sander Berge"
      },
      {
        "role": "CM",
        "name": "Hugo Larsson"
      },
      {
        "role": "RW",
        "name": "Oscar Bobb"
      },
      {
        "role": "AM",
        "name": "Alex Iwobi"
      },
      {
        "role": "LW",
        "name": "Kevin"
      },
      {
        "role": "ST",
        "name": "Rodrigo Muniz"
      }
    ]
  },
  "hull-city": {
    "formation": "5-4-1",
    "players": [
      {
        "role": "GK",
        "name": "Konstantinos Tzolakis"
      },
      {
        "role": "RWB",
        "name": "Lewie Coyle"
      },
      {
        "role": "CB",
        "name": "Semi Ajayi"
      },
      {
        "role": "CB",
        "name": "John Egan"
      },
      {
        "role": "CB",
        "name": "Nobel Mendy"
      },
      {
        "role": "LWB",
        "name": "Ryan Giles"
      },
      {
        "role": "RM",
        "name": "Mohamed Belloumi"
      },
      {
        "role": "CM",
        "name": "Hidemasa Morita"
      },
      {
        "role": "CM",
        "name": "Matt Crooks"
      },
      {
        "role": "LM",
        "name": "Elliot Stroud"
      },
      {
        "role": "ST",
        "name": "Oli McBurnie"
      }
    ]
  },
  "ipswich-town": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Alex Palmer"
      },
      {
        "role": "RB",
        "name": "Darnell Furlong"
      },
      {
        "role": "CB",
        "name": "Dara O'Shea"
      },
      {
        "role": "CB",
        "name": "Jacob Greaves"
      },
      {
        "role": "LB",
        "name": "Leif Davis"
      },
      {
        "role": "CM",
        "name": "Azor Matusiwa"
      },
      {
        "role": "CM",
        "name": "Exequiel Palacios"
      },
      {
        "role": "RW",
        "name": "Abdul Fatawu"
      },
      {
        "role": "AM",
        "name": "Julio Enciso"
      },
      {
        "role": "LW",
        "name": "Jaden Philogene"
      },
      {
        "role": "ST",
        "name": "Daizen Maeda"
      }
    ]
  },
  "leeds-united": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "James Trafford"
      },
      {
        "role": "RB",
        "name": "Jayden Bogle"
      },
      {
        "role": "CB",
        "name": "Joe Rodon"
      },
      {
        "role": "CB",
        "name": "Jaka Bijol"
      },
      {
        "role": "LB",
        "name": "Gabriel Gudmundsson"
      },
      {
        "role": "DM",
        "name": "Ethan Ampadu"
      },
      {
        "role": "CM",
        "name": "Anton Stach"
      },
      {
        "role": "RW",
        "name": "Daniel James"
      },
      {
        "role": "AM",
        "name": "Harry Wilson"
      },
      {
        "role": "LW",
        "name": "Noah Okafor"
      },
      {
        "role": "ST",
        "name": "Dominic Calvert-Lewin"
      }
    ]
  },
  "liverpool": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Alisson"
      },
      {
        "role": "RB",
        "name": "Jeremie Frimpong"
      },
      {
        "role": "CB",
        "name": "Ronald Araujo"
      },
      {
        "role": "CB",
        "name": "Virgil van Dijk"
      },
      {
        "role": "LB",
        "name": "Milos Kerkez"
      },
      {
        "role": "CM",
        "name": "Ryan Gravenberch"
      },
      {
        "role": "CM",
        "name": "Alexis Mac Allister"
      },
      {
        "role": "RW",
        "name": "Bradley Barcola"
      },
      {
        "role": "AM",
        "name": "Florian Wirtz"
      },
      {
        "role": "LW",
        "name": "Cody Gakpo"
      },
      {
        "role": "ST",
        "name": "Alexander Isak"
      }
    ]
  },
  "manchester-city": {
    "formation": "4-3-3",
    "players": [
      {
        "role": "GK",
        "name": "Gianluigi Donnarumma"
      },
      {
        "role": "RB",
        "name": "Rico Lewis"
      },
      {
        "role": "CB",
        "name": "Ruben Dias"
      },
      {
        "role": "CB",
        "name": "Marc Guehi"
      },
      {
        "role": "LB",
        "name": "Rayan Ait-Nouri"
      },
      {
        "role": "CM",
        "name": "Elliot Anderson"
      },
      {
        "role": "CM",
        "name": "Enzo Fernandez"
      },
      {
        "role": "AM",
        "name": "Phil Foden"
      },
      {
        "role": "RW",
        "name": "Antoine Semenyo"
      },
      {
        "role": "ST",
        "name": "Erling Haaland"
      },
      {
        "role": "LW",
        "name": "Jeremy Doku"
      }
    ]
  },
  "manchester-united": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Senne Lammens"
      },
      {
        "role": "RB",
        "name": "Diogo Dalot"
      },
      {
        "role": "CB",
        "name": "Matthijs de Ligt"
      },
      {
        "role": "CB",
        "name": "Lisandro Martinez"
      },
      {
        "role": "LB",
        "name": "Patrick Dorgu"
      },
      {
        "role": "CM",
        "name": "Carlos Baleba"
      },
      {
        "role": "CM",
        "name": "Youri Tielemans"
      },
      {
        "role": "RW",
        "name": "Bryan Mbeumo"
      },
      {
        "role": "AM",
        "name": "Bruno Fernandes"
      },
      {
        "role": "LW",
        "name": "Matheus Cunha"
      },
      {
        "role": "ST",
        "name": "Benjamin Sesko"
      }
    ]
  },
  "newcastle-united": {
    "formation": "4-3-3",
    "players": [
      {
        "role": "GK",
        "name": "Nick Pope"
      },
      {
        "role": "RB",
        "name": "Tino Livramento"
      },
      {
        "role": "CB",
        "name": "Malick Thiaw"
      },
      {
        "role": "CB",
        "name": "Sven Botman"
      },
      {
        "role": "LB",
        "name": "Lewis Hall"
      },
      {
        "role": "DM",
        "name": "Nico Gonzalez"
      },
      {
        "role": "CM",
        "name": "Joelinton"
      },
      {
        "role": "CM",
        "name": "Jacob Ramsey"
      },
      {
        "role": "RW",
        "name": "Anthony Elanga"
      },
      {
        "role": "ST",
        "name": "Yoane Wissa"
      },
      {
        "role": "LW",
        "name": "Harvey Barnes"
      }
    ]
  },
  "nottingham-forest": {
    "formation": "3-4-2-1",
    "players": [
      {
        "role": "GK",
        "name": "Matz Sels"
      },
      {
        "role": "RCB",
        "name": "Nikola Milenkovic"
      },
      {
        "role": "CB",
        "name": "Murillo"
      },
      {
        "role": "LCB",
        "name": "Ousmane Diomande"
      },
      {
        "role": "RWB",
        "name": "Daniel Munoz"
      },
      {
        "role": "CM",
        "name": "Ibrahim Sangare"
      },
      {
        "role": "CM",
        "name": "Xaver Schlager"
      },
      {
        "role": "LWB",
        "name": "Neco Williams"
      },
      {
        "role": "RAM",
        "name": "Morgan Gibbs-White"
      },
      {
        "role": "LAM",
        "name": "Callum Hudson-Odoi"
      },
      {
        "role": "ST",
        "name": "Liam Delap"
      }
    ]
  },
  "sunderland": {
    "formation": "4-3-3",
    "players": [
      {
        "role": "GK",
        "name": "Robin Roefs"
      },
      {
        "role": "RB",
        "name": "Trai Hume"
      },
      {
        "role": "CB",
        "name": "Kevin Danso"
      },
      {
        "role": "CB",
        "name": "Dan Ballard"
      },
      {
        "role": "LB",
        "name": "Reinildo"
      },
      {
        "role": "DM",
        "name": "Granit Xhaka"
      },
      {
        "role": "CM",
        "name": "Noah Sadiki"
      },
      {
        "role": "CM",
        "name": "Enzo Le Fee"
      },
      {
        "role": "RW",
        "name": "Nilson Angulo"
      },
      {
        "role": "ST",
        "name": "Brian Brobbey"
      },
      {
        "role": "LW",
        "name": "Malick Fofana"
      }
    ]
  },
  "tottenham-hotspur": {
    "formation": "4-2-3-1",
    "players": [
      {
        "role": "GK",
        "name": "Antonin Kinsky"
      },
      {
        "role": "RB",
        "name": "Pedro Porro"
      },
      {
        "role": "CB",
        "name": "Jan Paul van Hecke"
      },
      {
        "role": "CB",
        "name": "Micky van de Ven"
      },
      {
        "role": "LB",
        "name": "Andy Robertson"
      },
      {
        "role": "CM",
        "name": "Sandro Tonali"
      },
      {
        "role": "CM",
        "name": "Conor Gallagher"
      },
      {
        "role": "RW",
        "name": "Savinho"
      },
      {
        "role": "AM",
        "name": "Xavi Simons"
      },
      {
        "role": "LW",
        "name": "Omar Marmoush"
      },
      {
        "role": "ST",
        "name": "Dominic Solanke"
      }
    ]
  }
} as Record<string, { formation: FormationKey; players: PresetLineupPlayer[] }>;

