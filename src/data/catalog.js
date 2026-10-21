// Catálogo de satélites. `query` es el parámetro de CelesTrak (CATNR, GROUP o NAME);
// `model` elige el modelo 3D procedural que se muestra al hacer zoom.
export const CATEGORIES = {
  science:  { label: 'Científicos' },
  weather:  { label: 'Meteorológicos' },
  telecom:  { label: 'Telecom' },
  cubesat:  { label: 'Cubesats' },
}

export const SATELLITES = {
  iss:      { label: 'ISS',        category: 'science', model: 'iss',     query: 'CATNR=25544' },
  hubble:   { label: 'Hubble',     category: 'science', model: 'hubble',  query: 'CATNR=20580' },
  tiangong: { label: 'Tiangong',   category: 'science', model: 'station', query: 'CATNR=48274' },
  swift:    { label: 'Swift',      category: 'science', model: 'generic', query: 'CATNR=28485' },
  noaa19:   { label: 'NOAA 19',    category: 'weather', model: 'weather', query: 'CATNR=33591' },
  noaa18:   { label: 'NOAA 18',    category: 'weather', model: 'weather', query: 'CATNR=28654' },
  noaa15:   { label: 'NOAA 15',    category: 'weather', model: 'weather', query: 'CATNR=25338' },
  suomi:    { label: 'Suomi NPP',  category: 'weather', model: 'weather', query: 'CATNR=37849' },
  starlink: { label: 'Starlink',   category: 'telecom', model: 'starlink', query: 'GROUP=starlink' },
  oneweb:   { label: 'OneWeb',     category: 'telecom', model: 'starlink', query: 'GROUP=oneweb' },
  iridium:  { label: 'Iridium',    category: 'telecom', model: 'generic', query: 'GROUP=iridium-NEXT' },
  globalstar: { label: 'Globalstar', category: 'telecom', model: 'generic', query: 'GROUP=globalstar' },
  funcube:  { label: 'FUNcube-1',  category: 'cubesat', model: 'cubesat', query: 'CATNR=39444' },
  estcube:  { label: 'ESTCube-1',  category: 'cubesat', model: 'cubesat', query: 'CATNR=39161' },
  uwe4:     { label: 'UWE-4',      category: 'cubesat', model: 'cubesat', query: 'NAME=UWE-4' },
}

// Nubes de satélites: muchos objetos a la vez. `max` limita cuántos puntos se dibujan.
export const CLOUDS = {
  starlink: { label: 'Starlink', queries: ['GROUP=starlink'], max: 1500, color: '#22d3ee' },
  oneweb:   { label: 'OneWeb',   queries: ['GROUP=oneweb'], max: 500, color: '#4ade80' },
  debris:   {
    label: 'Basura espacial', max: 1200, color: '#f43f5e',
    queries: ['GROUP=cosmos-2251-debris', 'GROUP=fengyun-1c-debris', 'GROUP=iridium-33-debris'],
  },
}
