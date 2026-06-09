// Active volcanoes of the Philippines (PHIVOLCS active list).
// Coordinates from PHIVOLCS / Smithsonian Global Volcanism Program (approximate summit positions).
export interface Volcano {
  name: string;
  lat: number;
  lon: number;
}

export const VOLCANOES: Volcano[] = [
  { name: 'Mayon', lat: 13.257, lon: 123.685 },
  { name: 'Taal', lat: 14.002, lon: 120.993 },
  { name: 'Pinatubo', lat: 15.13, lon: 120.35 },
  { name: 'Kanlaon', lat: 10.412, lon: 123.132 },
  { name: 'Bulusan', lat: 12.77, lon: 124.05 },
  { name: 'Hibok-Hibok', lat: 9.203, lon: 124.673 },
  { name: 'Banahaw', lat: 14.07, lon: 121.48 },
  { name: 'Biliran', lat: 11.558, lon: 124.535 },
  { name: 'Cabalian', lat: 10.287, lon: 125.22 },
  { name: 'Camiguin de Babuyanes', lat: 18.83, lon: 121.86 },
  { name: 'Didicas', lat: 19.077, lon: 122.202 },
  { name: 'Iraya', lat: 20.469, lon: 122.011 },
  { name: 'Iriga', lat: 13.457, lon: 123.457 },
  { name: 'Babuyan Claro', lat: 19.524, lon: 121.94 },
  { name: 'Makaturing', lat: 7.647, lon: 124.32 },
  { name: 'Matutum', lat: 6.359, lon: 125.075 },
  { name: 'Musuan', lat: 7.877, lon: 125.068 },
  { name: 'Parker', lat: 6.113, lon: 124.892 },
  { name: 'Ragang', lat: 7.7, lon: 124.5 },
  { name: 'Smith', lat: 19.535, lon: 121.918 },
  { name: 'Bud Dajo', lat: 6.013, lon: 121.062 },
  { name: 'Leonard Kniaseff', lat: 7.393, lon: 126.063 },
  { name: 'Kalatungan', lat: 7.955, lon: 124.8 },
  { name: 'Pocdol (Bacon-Manito)', lat: 13.05, lon: 123.95 },
];
