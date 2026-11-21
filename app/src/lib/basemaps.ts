export type BasemapId = 'atlas' | 'streets' | 'satellite';

export interface Credit {
  text: string;
  href?: string;
}

export interface Basemap {
  id: BasemapId;
  label: string;
  url: string;
  /** Deepest zoom the provider has real tiles for; the map enlarges them beyond it. */
  maxNativeZoom: number;
  credits: Credit[];
}

interface Keys {
  cartoKey?: string;
  arcgisToken?: string;
}

const OPENSTREETMAP: Credit = {
  text: 'OpenStreetMap contributors',
  href: 'https://www.openstreetmap.org/copyright',
};

/**
 * The map styles on offer. Atlas needs no key. Streets and Satellite are keyed, so they
 * are left out when their key is missing rather than showing a watermark or blank tiles.
 */
export function createBasemaps({ cartoKey, arcgisToken }: Keys): Basemap[] {
  const basemaps: Basemap[] = [
    {
      id: 'atlas',
      label: 'Atlas',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxNativeZoom: 19,
      credits: [OPENSTREETMAP],
    },
  ];
  if (cartoKey) {
    basemaps.push({
      id: 'streets',
      label: 'Streets',
      url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoKey)}`,
      maxNativeZoom: 18,
      credits: [OPENSTREETMAP, { text: 'CARTO', href: 'https://carto.com/attributions' }],
    });
  }
  if (arcgisToken) {
    basemaps.push({
      id: 'satellite',
      label: 'Satellite',
      url: `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${encodeURIComponent(arcgisToken)}`,
      // Imagery is sharper than this in cities but thin elsewhere; stopping here avoids blank tiles.
      maxNativeZoom: 17,
      credits: [
        { text: 'Esri', href: 'https://www.esri.com' },
        { text: 'Maxar, Earthstar Geographics, and the GIS User Community' },
      ],
    });
  }
  return basemaps;
}

export const BASEMAPS = createBasemaps({
  cartoKey: import.meta.env?.VITE_CARTO_KEY,
  arcgisToken: import.meta.env?.VITE_ARCGIS_TOKEN,
});

/** One fixed tile (the Alps and the western Mediterranean) used as each style's preview picture. */
export function thumbnailUrl(basemap: Basemap): string {
  return basemap.url.replace('{z}', '5').replace('{x}', '16').replace('{y}', '11');
}
