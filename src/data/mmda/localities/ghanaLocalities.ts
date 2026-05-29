export interface LocalityData {
  name: string;
  aliases: string[];
  district: string;
  streets?: string[];
  description?: string;
}

export const GHANA_LOCALITIES: LocalityData[] = [
  {
    name: "Accra Central",
    aliases: ["Accra", "Central Business District"],
    district: "Accra Metropolitan",
    streets: ["High Street", "Makola Road", "Kinbu Road", "Asafoatse Nettey Road"]
  },
  {
    name: "Cantonments",
    aliases: ["Cantonments"],
    district: "La Dade-Kotopon Municipal",
    streets: ["Switchback Road", "Giffard Road", "Fourth Circular Road"]
  },
  {
    name: "Labone",
    aliases: ["Labone"],
    district: "La Dade-Kotopon Municipal",
    streets: ["Ndabaningi Sithole Road", "Orphan Crescent", "Awudu Sorre Street"]
  },
  {
    name: "Korle Bu",
    aliases: ["Korle-Bu", "Korlebu"],
    district: "Accra Metropolitan",
    streets: ["Guggisberg Avenue", "Bannerman Road"]
  },
  {
    name: "Kaneshie",
    aliases: ["Kaneshie", "Kaneshi"],
    district: "Accra Metropolitan",
    streets: ["Winneba Road", "Obetsebi Lamptey Avenue", "Fadama Road"]
  },
  {
    name: "East Legon",
    aliases: ["E. Legon", "Legon East", "East Legon Residential"],
    district: "Ayawaso West Municipal",
    streets: ["Boundary Road", "Lagos Avenue", "Mensah Wood Street", "Freetown Avenue", "Bawaleshie Road"]
  },
  {
    name: "Abelenkpe",
    aliases: ["Abelenkpe", "Abelenkpi"],
    district: "Ayawaso West Municipal",
    streets: ["Abelenkpe Road", "Domiabere Street", "Ebony Street"]
  },
  {
    name: "Bantama",
    aliases: ["Bntama", "Bantama Residential"],
    district: "Kumasi Metropolitan",
    streets: ["Bantama High Street", "Okomfo Anokye Road", "Kuffour Avenue"]
  },
  {
    name: "Abokobi",
    aliases: ["Abokobi", "Abokobi Town"],
    district: "Ga East Municipal",
    streets: ["Abokobi-Pantang Road", "Sesemi Road", "Akporman Road"]
  },
  {
    name: "Madina",
    aliases: ["Madna", "Madina Estate", "Madina Zongo"],
    district: "La Nkwantanang Madina Municipal",
    streets: ["Zongo Junction Road", "Ritz Junction Road", "Madina Market Road", "Nkulenu Street"]
  },
  {
    name: "Spintex",
    aliases: ["Spintex Road", "Spintex Junction"],
    district: "Ledzokuku Municipal",
    streets: ["Spintex Road", "Baatsona Highway", "Agblezaa Road", "Coca Cola Roundabout"]
  },
  {
    name: "Osu",
    aliases: ["Osu", "Christianborg"],
    district: "Korle Klottey Municipal",
    streets: ["Oxford Street", "Cantonments Road", "Mission Street", "Ring Road East"]
  },
  {
    name: "Dansoman",
    aliases: ["Dansoman", "Dansoman Estate"],
    district: "Ablekuma West Municipal",
    streets: ["Dansoman High Street", "Sahara Street", "Exhibition Road", "Zodiac Road"]
  },
  {
    name: "Adenta",
    aliases: ["Adentan", "Adenta Housing"],
    district: "Adentan Municipal",
    streets: ["SDA Junction Road", "Commandos Road", "Aviation Road", "Frafraha Road"]
  },
  {
    name: "Tema Community 1",
    aliases: ["Tema C1", "Community 1"],
    district: "Tema Metropolitan",
    streets: ["Hospital Road", "Mankoadze Road", "Padmore Street"]
  },
  {
    name: "Kasoa",
    aliases: ["Kasoa", "Oduponkpehe"],
    district: "Awutu Senya East Municipal",
    streets: ["Bawjiase Road", "New Market Road", "Amanfrom Road", "CP Road"]
  },
  {
    name: "Amasaman",
    aliases: ["Amasaman"],
    district: "Ga West Municipal",
    streets: ["Nsawam Road", "Adeiso Road", "Treykka Street"]
  },
  {
    name: "Ho",
    aliases: ["Ho", "Ho City"],
    district: "Ho Municipal",
    streets: ["Civic Centre Road", "Market Road", "Ahoe Road", "Dave Road"]
  },
  {
    name: "Tamale Central",
    aliases: ["Tamale", "T-City"],
    district: "Tamale Metropolitan",
    streets: ["Hospital Road", "Bolga Road", "Nyohini Road", "Waterworks Road"]
  },
  {
    name: "Takoradi",
    aliases: ["Tadi", "Oil City"],
    district: "Sekondi Takoradi Metropolitan",
    streets: ["Liberation Road", "Axim Road", "Cape Coast Road", "John Mensah Sarbah Road"]
  },
  {
    name: "Ngleshie Amanfro",
    aliases: ["Amanfro"],
    district: "Ga South Municipal",
    streets: ["Amanfro Road", "Tuba Road", "Old Barrier Road"]
  },
  {
    name: "Bortianor",
    aliases: ["Bortianor"],
    district: "Ga South Municipal",
    streets: ["Bortianor Road", "Aplaku Road"]
  },
  {
    name: "Tuba",
    aliases: ["Tuba"],
    district: "Ga South Municipal",
    streets: ["Tuba Road", "Nyanyano Road", "Tuba Market Road"]
  },
  {
    name: "Kokrobite",
    aliases: ["Kokrobite"],
    district: "Ga South Municipal",
    streets: ["Kokrobitey Road", "Langma Road", "Beach Road", "Bojo Beach Road"]
  },
  {
    name: "Galilea",
    aliases: ["Galilea"],
    district: "Ga South Municipal",
    streets: ["Galilea Road", "Iron City Road", "Top Town Road"]
  },
  {
    name: "Gedan",
    aliases: ["Gedan"],
    district: "Ga South Municipal",
    streets: ["Gedan Road", "Gedan High Street"]
  },
  {
    name: "Akwasa",
    aliases: ["Akwasa"],
    district: "Ga South Municipal",
    streets: ["Akwasa Road", "Akwasa Lane"]
  },
  {
    name: "Nsuobri",
    aliases: ["Nsuobri"],
    district: "Ga South Municipal",
    streets: ["Nsuobri Road", "Nsuobri High Street"]
  },
  {
    name: "Akweiman",
    aliases: ["Akweiman"],
    district: "Ga South Municipal",
    streets: ["Akweiman Road", "Akweiman Market Road"]
  },
  {
    name: "Jei-Krodua",
    aliases: ["Jei-Krodua"],
    district: "Ga South Municipal",
    streets: ["Jei-Krodua Road", "Bawjiase Road"]
  },
  {
    name: "Panfo",
    aliases: ["Panfo"],
    district: "Ga South Municipal",
    streets: ["Panfo Road"]
  },
  {
    name: "Obom",
    aliases: ["Obom"],
    district: "Ga South Municipal",
    streets: ["Obom Road", "Ashale Botwe - Obom Road"]
  },
  {
    name: "Oduman-Asuaba",
    aliases: ["Oduman-Asuaba"],
    district: "Ga South Municipal",
    streets: ["Oduman-Asuaba Road", "Oduman Road"]
  },
  {
    name: "Paanor",
    aliases: ["Paanor"],
    district: "Ga South Municipal",
    streets: ["Paanor Road"]
  },
  {
    name: "Kofi Kwei",
    aliases: ["Kofi Kwei"],
    district: "Ga South Municipal",
    streets: ["Kofi Kwei Road"]
  },
  {
    name: "Gbemomo",
    aliases: ["Gbemomo"],
    district: "Ga South Municipal",
    streets: ["Gbemomo Road"]
  },
  {
    name: "Danchira",
    aliases: ["Danchira"],
    district: "Ga South Municipal",
    streets: ["Danchira Road", "Amasaman - Danchira Road"]
  },
  {
    name: "Ashalaja",
    aliases: ["Ashalaja"],
    district: "Ga South Municipal",
    streets: ["Ashalaja Road", "Ashalaja Opetekwei Road"]
  },
  {
    name: "Hobor",
    aliases: ["Hobor"],
    district: "Ga South Municipal",
    streets: ["Hobor Road"]
  },
  {
    name: "Weija",
    aliases: ["Weija", "Gbawe", "Mallam"],
    district: "Weija Gbawe Municipal",
    streets: ["Weija Road", "Gbawe Road", "Mallam-Kasoa Highway", "Oblogo Road"]
  }
];

export function getLocalityAndStreetByDistrict(district: string, gpsPrefix: string, region: string): { locality: string, street: string } | null {
  const normalizedDistrict = district.toLowerCase();
  
  // Try exact match first
  let matchingLocalities = GHANA_LOCALITIES.filter(loc => loc.district.toLowerCase() === normalizedDistrict);
  
  // Fallback 1: Try partial match on district name (e.g. "Ga South" matches "Ga South Municipal")
  if (matchingLocalities.length === 0) {
    matchingLocalities = GHANA_LOCALITIES.filter(loc => 
      loc.district.toLowerCase().includes(normalizedDistrict) || 
      normalizedDistrict.includes(loc.district.toLowerCase().replace(' municipal', '').replace(' metropolitan', '').replace(' district', ''))
    );
  }

  // Fallback 2: Generate dynamically based on the district name
  if (matchingLocalities.length === 0) {
    let name = district.replace(/Municipal|Metropolitan|District/gi, '').trim();
    name = name.replace(/\s+(North|South|East|West|Central)$/gi, '').trim();
    
    if (name) {
      matchingLocalities = [{
        name,
        aliases: [name],
        district: district,
        streets: [`${name} High Street`, `${name} Market Road`, `Post Office Road`]
      }];
    }
  }

  if (matchingLocalities.length > 0) {
    // Generate a pseudo-random index based on the GPS string for consistency
    let hash = 0;
    for (let i = 0; i < gpsPrefix.length; i++) {
        hash = gpsPrefix.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % matchingLocalities.length;
    const selectedLocality = matchingLocalities[idx];
    
    let defaultStreet = "";
    if (selectedLocality.streets && selectedLocality.streets.length > 0) {
      const streetIdx = Math.abs(hash) % selectedLocality.streets.length;
      defaultStreet = selectedLocality.streets[streetIdx];
    }
    
    return {
      locality: selectedLocality.name,
      street: defaultStreet
    };
  }
  
  return null;
}

export function normalizeLocality(input: string): string {
  const normalizedInput = input.trim().toLowerCase();
  
  for (const loc of GHANA_LOCALITIES) {
    if (loc.name.toLowerCase() === normalizedInput) return loc.name;
    if (loc.aliases.some(a => a.toLowerCase() === normalizedInput)) return loc.name;
  }
  
  // Basic cleaning if not in dataset
  return input
    .replace(/\bK'si\b/gi, "Kumasi")
    .replace(/\bTadi\b/gi, "Takoradi")
    .replace(/\bAccra Central\b/gi, "Accra")
    .trim();
}
