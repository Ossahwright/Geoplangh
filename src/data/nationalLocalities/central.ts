import { NationalLocalityRegistry } from '../../types/locality';

export const centralLocalities: NationalLocalityRegistry = {
  "CX": {
    "code": "CX",
    "districtName": "Awutu Senya East Municipal",
    "region": "Central Region",
    "category": "Municipal",
    "localities": [
      { "name": "Kasoa Proper", "type": "town", "aliases": ["Oduponkpehe"], "roads": ["Bawjiase Road", "New Market Road"] },
      { "name": "Millenium City", "type": "suburb", "roads": ["Millenium Boulevard", "Pentecost Junction Road"] },
      { "name": "Ofaakor", "type": "town", "roads": ["Ofaakor High Street", "CP Road"] },
      { "name": "CP", "type": "suburb", "aliases": ["Christian King"], "roads": ["CP Road", "Lamptey Street"] },
      { "name": "Akweley", "type": "suburb", "roads": ["Akweley Link", "Bawjiase Road"] },
      { "name": "Iron City", "type": "suburb", "roads": ["Iron City Road", "Top Town Road"] },
      { "name": "Adam Nana", "type": "suburb", "roads": ["Adam Nana Main Road", "Amanfrom Road"] },
      { "name": "Jerry-Morrison", "type": "suburb", "roads": ["Jerry Link", "Bawjiase Road"] },
      { "name": "New Market", "type": "suburb", "roads": ["New Market Bypass", "Kasoa Bypass"] },
      { "name": "Amanfrom", "type": "town", "roads": ["Old Barrier Road", "Kasoa Highway"] }
    ]
  },
  "CC": {
    "code": "CC",
    "districtName": "Cape Coast Metropolitan",
    "region": "Central Region",
    "category": "Metropolitan",
    "localities": [
      { "name": "Abura", "type": "suburb", "roads": ["Abura Road", "UCC Highway"] },
      { "name": "Pedu", "type": "suburb", "roads": ["Pedu Link", "Jukwa Road"] },
      { "name": "Ola", "type": "suburb", "roads": ["Ola Hospital Road", "Beach Drive"] },
      { "name": "Cape Coast Proper", "type": "town", "roads": ["Commercial Road", "Bakano Road"] }
    ]
  }
};
