// Time Period Filters

export interface PeriodOption {
  name: string;
  startYear: number;
  endYear: number | null; // null = present
}

export const JEWISH_PERIODS: PeriodOption[] = [
  { name: 'Zugot', startYear: -170, endYear: -30 },
  { name: 'Tannaim', startYear: -30, endYear: 200 },
  { name: 'Amoraim', startYear: 200, endYear: 500 },
  { name: 'Geonim', startYear: 600, endYear: 1050 },
  { name: 'Rishonim', startYear: 1050, endYear: 1500 },
  { name: 'Early Acharonim', startYear: 1500, endYear: 1800 },
  { name: 'Late Acharonim', startYear: 1800, endYear: 1945 },
  { name: 'Contemporary Acharonim', startYear: 1945, endYear: null },
];

export const SECULAR_PERIODS: PeriodOption[] = [
  { name: 'Hellenistic Period', startYear: -323, endYear: -31 },
  { name: 'Roman Period', startYear: -31, endYear: 284 },
  { name: 'Late Antiquity', startYear: 284, endYear: 600 },
  { name: 'Early Middle Ages', startYear: 600, endYear: 1000 },
  { name: 'High Middle Ages', startYear: 1000, endYear: 1300 },
  { name: 'Late Middle Ages', startYear: 1300, endYear: 1500 },
  { name: 'Early Modern Period', startYear: 1500, endYear: 1800 },
  { name: 'Modern Period', startYear: 1800, endYear: 1945 },
  { name: 'Contemporary Period', startYear: 1945, endYear: null },
];

// Region Filters

export interface RegionOption {
  id: string;
  name: string;
  description: string;
  // Approximate bounding boxes for geographic filtering
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export const RABBINIC_REGIONS: RegionOption[] = [
  {
    id: 'israel',
    name: 'Israel',
    description: 'The Land of Israel, a foundational center of Jewish life and rabbinic activity from the Second Temple period onward.',
    bounds: { north: 33.5, south: 29.5, east: 36.0, west: 34.0 },
  },
  {
    id: 'babylonia',
    name: 'Babylonia',
    description: 'An ancient region corresponding largely to modern-day Iraq, where the Babylonian Talmud was composed and where rabbinic authority later continued under the Geonim.',
    bounds: { north: 37.0, south: 29.0, east: 49.0, west: 38.0 },
  },
  {
    id: 'egypt',
    name: 'Egypt',
    description: 'Centered primarily in medieval Cairo (Fustat), Egypt served as a major hub of Jewish law, philosophy, and communal leadership, especially in the twelfth century.',
    bounds: { north: 32.0, south: 22.0, east: 37.0, west: 25.0 },
  },
  {
    id: 'ashkenaz',
    name: 'Ashkenaz',
    description: 'Jewish communities of medieval northern France and the German lands, whose scholars shaped the Ashkenazic tradition of halachic interpretation.',
    bounds: { north: 55.0, south: 47.0, east: 15.0, west: -5.0 },
  },
  {
    id: 'sepharad',
    name: 'Sepharad',
    description: 'Jewish communities of medieval Spain and Portugal, noted for major contributions to Jewish law, philosophy, and biblical interpretation.',
    bounds: { north: 44.0, south: 36.0, east: 4.0, west: -10.0 },
  },
  {
    id: 'provence',
    name: 'Provence',
    description: 'Southern France, a transitional intellectual zone where Ashkenazic and Sephardic traditions intersected.',
    bounds: { north: 45.0, south: 42.0, east: 7.5, west: 3.0 },
  },
  {
    id: 'italy',
    name: 'Italy',
    description: 'Jewish communities in Italy that functioned as an important conduit for rabbinic learning between different European regions.',
    bounds: { north: 47.0, south: 36.0, east: 19.0, west: 6.0 },
  },
  {
    id: 'north-africa',
    name: 'North Africa',
    description: 'Jewish communities across the Maghreb, including Morocco and Tunisia, which maintained strong ties to both Sephardic and Eastern rabbinic traditions.',
    bounds: { north: 37.0, south: 27.0, east: 12.0, west: -13.0 },
  },
  {
    id: 'ottoman',
    name: 'Ottoman Lands',
    description: 'Territories governed by the Ottoman Empire where Jewish life and rabbinic scholarship flourished following the Spanish Expulsion.',
    bounds: { north: 45.0, south: 30.0, east: 45.0, west: 20.0 },
  },
  {
    id: 'eastern-europe',
    name: 'Eastern Europe',
    description: 'Jewish communities in Poland, Lithuania, and surrounding regions that became central to rabbinic scholarship in the early modern and modern periods.',
    bounds: { north: 60.0, south: 45.0, east: 40.0, west: 14.0 },
  },
  {
    id: 'western-europe',
    name: 'Western Europe',
    description: 'Jewish communities in countries such as France, England, and the Netherlands, particularly prominent in the modern era.',
    bounds: { north: 60.0, south: 42.0, east: 10.0, west: -10.0 },
  },
  {
    id: 'north-america',
    name: 'North America',
    description: 'Jewish communities in the United States and Canada that emerged as major centers of rabbinic learning in the twentieth century.',
    bounds: { north: 72.0, south: 25.0, east: -50.0, west: -170.0 },
  },
];

export const SECULAR_REGIONS: RegionOption[] = [
  {
    id: 'levant',
    name: 'Levant',
    description: 'The eastern Mediterranean region, including modern-day Israel and neighboring areas.',
    bounds: { north: 37.0, south: 29.0, east: 42.0, west: 32.0 },
  },
  {
    id: 'mesopotamia',
    name: 'Mesopotamia',
    description: 'The land between the Tigris and Euphrates rivers, largely corresponding to modern-day Iraq.',
    bounds: { north: 37.0, south: 29.0, east: 49.0, west: 38.0 },
  },
  {
    id: 'iberian',
    name: 'Iberian Peninsula',
    description: 'The southwestern European peninsula comprising present-day Spain and Portugal.',
    bounds: { north: 44.0, south: 36.0, east: 4.0, west: -10.0 },
  },
  {
    id: 'central-europe',
    name: 'Central Europe',
    description: 'European regions centered on Germany and neighboring territories.',
    bounds: { north: 55.0, south: 45.0, east: 20.0, west: 5.0 },
  },
  {
    id: 'western-mediterranean',
    name: 'Western Mediterranean',
    description: 'Regions surrounding the western Mediterranean basin, including southern Europe and North Africa.',
    bounds: { north: 46.0, south: 30.0, east: 20.0, west: -10.0 },
  },
  {
    id: 'southern-france',
    name: 'Southern France',
    description: 'The southern portion of France, particularly areas bordering the Mediterranean Sea.',
    bounds: { north: 46.0, south: 42.0, east: 8.0, west: -2.0 },
  },
  {
    id: 'italian-peninsula',
    name: 'Italian Peninsula',
    description: 'The peninsula forming modern-day Italy.',
    bounds: { north: 47.0, south: 36.0, east: 19.0, west: 6.0 },
  },
  {
    id: 'north-africa-secular',
    name: 'North Africa',
    description: 'The northern coastal regions of Africa bordering the Mediterranean Sea.',
    bounds: { north: 37.0, south: 20.0, east: 35.0, west: -17.0 },
  },
  {
    id: 'ottoman-empire',
    name: 'Ottoman Empire',
    description: 'A multi-ethnic empire that ruled parts of southeastern Europe, Anatolia, the Middle East, and North Africa from the fourteenth to the early twentieth century.',
    bounds: { north: 48.0, south: 25.0, east: 50.0, west: 15.0 },
  },
  {
    id: 'eastern-europe-secular',
    name: 'Eastern Europe',
    description: 'European regions east of Germany, including Poland, Ukraine, and Lithuania.',
    bounds: { north: 60.0, south: 44.0, east: 45.0, west: 14.0 },
  },
  {
    id: 'western-europe-secular',
    name: 'Western Europe',
    description: 'Western European countries such as France, England, and the Low Countries.',
    bounds: { north: 62.0, south: 42.0, east: 15.0, west: -12.0 },
  },
  {
    id: 'north-america-secular',
    name: 'North America',
    description: 'The continent comprising the United States and Canada.',
    bounds: { north: 72.0, south: 25.0, east: -50.0, west: -170.0 },
  },
];

export type PeriodMode = 'jewish' | 'secular';
export type RegionMode = 'rabbinic' | 'secular';
