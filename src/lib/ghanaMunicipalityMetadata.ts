export interface MMDAInfo {
  name: string;
  category: 'Metropolitan' | 'Municipal' | 'District';
  region: string;
  capital: string;
  established: string;
}

export const GHANA_MMDA_METADATA: Record<string, MMDAInfo> = {
  "Ayawaso West Municipal": {
    name: "Ayawaso West Municipal Assembly",
    category: "Municipal",
    region: "Greater Accra Region",
    capital: "Abelenkpe",
    established: "2018"
  },
  "Kumasi Metropolitan": {
    name: "Kumasi Metropolitan Assembly",
    category: "Metropolitan",
    region: "Ashanti Region",
    capital: "Catering Rest House",
    established: "1988"
  },
  "Ga East Municipal": {
    name: "Ga East Municipal Assembly",
    category: "Municipal",
    region: "Greater Accra Region",
    capital: "Abokobi",
    established: "2004"
  },
  "Ga West Municipal": {
    name: "Ga West Municipal Assembly",
    category: "Municipal",
    region: "Greater Accra Region",
    capital: "Amasaman",
    established: "2004"
  },
  "Sekondi-Takoradi Metropolitan": {
    name: "Sekondi-Takoradi Metropolitan Assembly",
    category: "Metropolitan",
    region: "Western Region",
    capital: "Sekondi-Takoradi",
    established: "2008"
  },
  "Tamale Metropolitan": {
    name: "Tamale Metropolitan Assembly",
    category: "Metropolitan",
    region: "Northern Region",
    capital: "Tamale",
    established: "2004"
  }
};
