/**
 * UNESCO uses formal country names ("Türkiye", "Russian Federation"). Visitors search with the
 * names they know, so each formal name is listed with its everyday names. Only names that do
 * not already contain the everyday one are needed: "Bolivia (Plurinational State of)" already
 * matches "bolivia".
 */
const ALIASES: Record<string, string[]> = {
  Türkiye: ['Turkey'],
  'Russian Federation': ['Russia'],
  'United States of America': ['USA', 'US', 'America', 'United States'],
  'United Kingdom of Great Britain and Northern Ireland': [
    'UK',
    'Britain',
    'Great Britain',
    'England',
    'Scotland',
    'Wales',
    'Northern Ireland',
  ],
  'Syrian Arab Republic': ['Syria'],
  'Republic of Korea': ['South Korea', 'Korea'],
  "Democratic People's Republic of Korea": ['North Korea', 'Korea'],
  "Lao People's Democratic Republic": ['Laos'],
  'Viet Nam': ['Vietnam'],
  Czechia: ['Czech Republic'],
  "Côte d'Ivoire": ['Ivory Coast'],
  'Netherlands (Kingdom of the)': ['Holland', 'Netherlands'],
  'Democratic Republic of the Congo': ['DRC', 'Congo'],
  'Republic of the Congo': ['Congo'],
  'Holy See': ['Vatican', 'Vatican City'],
  'Cabo Verde': ['Cape Verde'],
  Myanmar: ['Burma'],
  'Timor-Leste': ['East Timor'],
  'Iran (Islamic Republic of)': ['Iran'],
  'Republic of Moldova': ['Moldova'],
  'United Republic of Tanzania': ['Tanzania'],
  'State of Palestine': ['Palestine'],
  'Micronesia (Federated States of)': ['Micronesia'],
  'Venezuela (Bolivarian Republic of)': ['Venezuela'],
  'Bolivia (Plurinational State of)': ['Bolivia'],
  Eswatini: ['Swaziland'],
  'North Macedonia': ['Macedonia'],
};

/** Everyday names for a site's countries, for the search index. */
export function countryAliases(countries: string[]): string {
  return countries.flatMap((country) => ALIASES[country] ?? []).join(' ');
}
