import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ReactNode } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Bounds, Site, SiteType } from '../lib/types.ts';
import {
  clusterIconHtml,
  clusterSize,
  escapeHtml,
  markerIconHtml,
  TYPE_COLOR,
  siteMeta,
  typeCounts,
} from '../lib/utils.ts';

export interface PartsPadding {
  /** Pixels on the right and bottom to keep clear, for the detail card. */
  right: number;
  bottom: number;
}

export interface MapViewHandle {
  /** Fits the view to the parts of a serial site, leaving room for the detail card. */
  fitParts: (points: [number, number][], padding: PartsPadding) => void;
  flyToPoint: (lat: number, lon: number, zoom?: number) => void;
  /** Fit the view to these sites, regardless of what is currently drawn. */
  fitSites: (sites: Site[]) => void;
  focusSite: (site: Site, options?: { offset?: [number, number] }) => void;
  fitAll: () => void;
}

export type ControlSize = 'sm' | 'md';

/** Shared by the zoom stack and any extra buttons so every control matches. */
export const MAP_CONTROL = {
  sm: {
    stack: 'gap-1.5',
    button: 'h-8 w-8 rounded-lg',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    stack: 'gap-2',
    button: 'h-10 w-10 rounded-xl',
    icon: 'h-4 w-4',
  },
} as const;

interface MapViewProps {
  sites: Site[];
  selectedSite: Site | null;
  highlightedId?: string | null;
  fitKey?: string;
  onSelect: (site: Site) => void;
  onHover?: (site: Site | null) => void;
  onBoundsChange?: (bounds: Bounds) => void;
  onMapClick?: () => void;
  controlsBottomClass?: string;
  controlsSideClass?: string;
  /** Centre the first view on this site instead of fitting every marker. */
  initialFocus?: { site: Site; offset: [number, number] } | null;
  /** Sites inscribed in this year get a one-off ripple on the map (playback). */
  rippleYear?: number | null;
  /** Extra buttons added to the end of the map control stack (such as locate). */
  extraControls?: ReactNode;
  /** The places that make up the selected serial site, drawn as small dots. */
  parts?: [number, number][] | null;
  partsType?: SiteType;
  /** "sm" is the compact desktop stack; "md" keeps touch-sized buttons for phones. */
  controlSize?: ControlSize;
  className?: string;
}

// Space a tooltip needs on each side of a pin, in pixels. The top figure also clears the
// search strip that floats over the map (strip 56 + tooltip 46 + pin 42 + gap).
const TOOLTIP_SIDE = 130;
const TOOLTIP_TOP = 152;

/**
 * Opens the tooltip on the side with room. Pins near the top get it below, pins near the
 * left or right edge get it beside them, so it never lands off screen or under the strip.
 */
function placeTooltip(map: L.Map | null, marker: L.Marker) {
  const tip = marker.getTooltip();
  if (!map || !tip) return;
  const size = map.getSize();
  const point = map.latLngToContainerPoint(marker.getLatLng());
  const nearTop = point.y < TOOLTIP_TOP;

  if (point.x < TOOLTIP_SIDE) {
    tip.options.direction = 'right';
    tip.options.offset = L.point(16, nearTop ? 6 : -22);
  } else if (point.x > size.x - TOOLTIP_SIDE) {
    tip.options.direction = 'left';
    tip.options.offset = L.point(-16, nearTop ? 6 : -22);
  } else if (nearTop) {
    tip.options.direction = 'bottom';
    tip.options.offset = L.point(0, 6);
  } else {
    tip.options.direction = 'top';
    tip.options.offset = L.point(0, -38);
  }
}

function makeMarkerIcon(site: Site, selected: boolean, highlighted: boolean) {
  return L.divIcon({
    html: markerIconHtml(site.type, selected, highlighted, site.danger),
    className: 'wh-marker-wrapper',
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    sites,
    selectedSite,
    highlightedId = null,
    fitKey = '',
    onSelect,
    onHover,
    onBoundsChange,
    onMapClick,
    controlsBottomClass = 'bottom-28',
    controlsSideClass = 'right-4',
    initialFocus = null,
    rippleYear = null,
    extraControls,
    parts = null,
    partsType = 'cultural',
    controlSize = 'md',
    className = '',
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const markerSites = useRef<WeakMap<L.Marker, Site>>(new WeakMap());
  const prevSelectedRef = useRef<L.Marker | null>(null);
  const prevHighlightedRef = useRef<L.Marker | null>(null);
  const hasFitRef = useRef(false);
  const lastFitKeyRef = useRef('');
  const selectedIdRef = useRef<string | null>(null);
  const rippleLayerRef = useRef<L.LayerGroup | null>(null);
  const sitesRef = useRef<Site[]>([]);
  sitesRef.current = sites;
  const initialFocusRef = useRef(initialFocus);
  initialFocusRef.current = initialFocusRef.current ?? initialFocus;
  const highlightedIdRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);
  useEffect(() => {
    selectedIdRef.current = selectedSite?.id ?? null;
  }, [selectedSite]);
  useEffect(() => {
    highlightedIdRef.current = highlightedId;
  }, [highlightedId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 18,
      preferCanvas: true,
    }).setView([20, 0], 2);

    // OSM tiles, muted in CSS (.leaflet-tile-pane) so the type colours carry the map.
    // CARTO Positron now requires an API key, so it is not used.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 48,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
      iconCreateFunction: (group) => {
        const count = group.getChildCount();
        const markers = group.getAllChildMarkers();
        const types = markers.map((marker) => markerSites.current.get(marker)?.type ?? 'cultural');
        const size = clusterSize(count);
        return L.divIcon({
          html: clusterIconHtml(count, typeCounts(types)),
          className: 'wh-cluster-wrapper',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });
    cluster.addTo(map);
    rippleLayerRef.current = L.layerGroup().addTo(map);
    // A pane above the pins and clusters, so a serial site's parts are never hidden under them.
    map.createPane('parts').style.zIndex = '650';
    partsLayerRef.current = L.layerGroup().addTo(map);

    const emitBounds = () => {
      const bounds = map.getBounds();
      onBoundsChangeRef.current?.([
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()],
      ]);
    };
    map.on('moveend', emitBounds);
    map.on('zoomend', emitBounds);
    map.on('click', () => onMapClickRef.current?.());

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    mapRef.current = map;
    clusterRef.current = cluster;
    emitBounds();

    return () => {
      observer.disconnect();
      map.off('moveend', emitBounds);
      map.off('zoomend', emitBounds);
      map.remove();
      rippleLayerRef.current = null;
      partsLayerRef.current = null;
      mapRef.current = null;
      clusterRef.current = null;
      markerRefs.current.clear();
      markerSites.current = new WeakMap();
      prevSelectedRef.current = null;
      prevHighlightedRef.current = null;
      hasFitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    const nextIds = new Set(sites.map((site) => site.id));
    for (const [id, marker] of markerRefs.current) {
      if (nextIds.has(id)) continue;
      cluster.removeLayer(marker);
      markerRefs.current.delete(id);
      markerSites.current.delete(marker);
      if (prevSelectedRef.current === marker) prevSelectedRef.current = null;
      if (prevHighlightedRef.current === marker) prevHighlightedRef.current = null;
    }

    const added: L.Marker[] = [];
    for (const site of sites) {
      if (markerRefs.current.has(site.id)) continue;
      const marker = L.marker([site.lat, site.lon], {
        icon: makeMarkerIcon(
          site,
          site.id === selectedIdRef.current,
          site.id === highlightedIdRef.current,
        ),
        title: site.name,
        alt: site.name,
        riseOnHover: true,
      });
      // Registered before bindTooltip so it runs first and can pick a side before Leaflet opens the tip.
      marker.on('mouseover', () => placeTooltip(mapRef.current, marker));
      marker.bindTooltip(
        `<strong>${escapeHtml(site.name)}</strong><br><span>${escapeHtml(siteMeta(site))}</span>`,
        { direction: 'top', offset: [0, -38], className: 'wh-tooltip', opacity: 1 },
      );
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        onSelectRef.current(site);
      });
      marker.on('mouseover', () => onHoverRef.current?.(site));
      marker.on('mouseout', () => onHoverRef.current?.(null));
      marker.on('focus', () => onHoverRef.current?.(site));
      marker.on('blur', () => onHoverRef.current?.(null));
      markerSites.current.set(marker, site);
      markerRefs.current.set(site.id, marker);
      added.push(marker);
    }
    if (added.length > 0) cluster.addLayers(added);

    if (!hasFitRef.current && sites.length > 0) {
      const bounds = cluster.getBounds();
      if (bounds.isValid()) {
        const focus = initialFocusRef.current;
        if (focus) {
          const zoom = 9;
          const point = map.project([focus.site.lat, focus.site.lon], zoom);
          point.x += focus.offset[0];
          point.y += focus.offset[1];
          map.setView(map.unproject(point, zoom), zoom, { animate: false });
          initialFocusRef.current = null;
        } else {
          map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
        }
        hasFitRef.current = true;
        lastFitKeyRef.current = fitKey;
      }
    }
  }, [sites, fitKey]);

  useEffect(() => {
    if (!hasFitRef.current || lastFitKeyRef.current === fitKey) return;
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;
    const bounds = cluster.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
      lastFitKeyRef.current = fitKey;
    }
  }, [fitKey]);

  useEffect(() => {
    const previous = prevSelectedRef.current;
    if (previous) {
      const site = markerSites.current.get(previous);
      if (site) {
        previous.setIcon(
          makeMarkerIcon(site, false, site.id === highlightedIdRef.current),
        );
      }
    }
    if (selectedSite) {
      const marker = markerRefs.current.get(selectedSite.id);
      if (marker) {
        marker.setIcon(makeMarkerIcon(selectedSite, true, false));
        prevSelectedRef.current = marker;
      } else {
        prevSelectedRef.current = null;
      }
    } else {
      prevSelectedRef.current = null;
    }
  }, [selectedSite]);

  useEffect(() => {
    const previous = prevHighlightedRef.current;
    if (previous) {
      const site = markerSites.current.get(previous);
      if (site && site.id !== selectedIdRef.current) {
        previous.setIcon(makeMarkerIcon(site, false, false));
      }
    }
    if (highlightedId) {
      const marker = markerRefs.current.get(highlightedId);
      const site = marker ? markerSites.current.get(marker) : null;
      if (marker && site && site.id !== selectedIdRef.current) {
        marker.setIcon(makeMarkerIcon(site, false, true));
        prevHighlightedRef.current = marker;
      } else {
        prevHighlightedRef.current = null;
      }
    } else {
      prevHighlightedRef.current = null;
    }
  }, [highlightedId]);

  // Ripples sit outside the cluster group, so a new inscription is visible
  // even when its marker is folded into a cluster at world zoom.
  useEffect(() => {
    const layer = rippleLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (rippleYear === null) return;
    const fresh = sitesRef.current.filter((site) => site.year === rippleYear).slice(0, 80);
    for (const site of fresh) {
      L.marker([site.lat, site.lon], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'wh-ripple-wrapper',
          html: `<span class="wh-ripple" style="--ripple-color:${TYPE_COLOR[site.type]}"></span>`,
          iconSize: [0, 0],
        }),
      }).addTo(layer);
    }
  }, [rippleYear]);

  // The parts of a selected serial site, outside the cluster group so they never merge.
  const partsLayerRef = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    const layer = partsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!parts) return;
    const icon = L.divIcon({
      className: 'wh-part-wrapper',
      html: `<span class="wh-part wh-part--${partsType}"></span>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    for (const [lat, lon] of parts) {
      L.marker([lat, lon], { icon, pane: 'parts', interactive: false, keyboard: false }).addTo(layer);
    }
  }, [parts, partsType]);

  useImperativeHandle(
    ref,
    () => ({
      focusSite: (site, options) => {
        const map = mapRef.current;
        if (!map) return;
        const [offsetX = 0, offsetY = 0] = options?.offset ?? [0, 0];
        const zoom = Math.max(map.getZoom(), 9);
        const point = map.project([site.lat, site.lon], zoom);
        point.x += offsetX;
        point.y += offsetY;
        map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.7 });
      },
      flyToPoint: (lat, lon, zoom = 6) => {
        mapRef.current?.flyTo([lat, lon], zoom, { duration: 1.1 });
      },
      fitSites: (target) => {
        const map = mapRef.current;
        if (!map || target.length === 0) return;
        const bounds = L.latLngBounds(target.map((site) => [site.lat, site.lon] as [number, number]));
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
      },
      fitParts: (points, padding) => {
        const map = mapRef.current;
        if (!map || points.length === 0) return;
        map.fitBounds(L.latLngBounds(points), {
          paddingTopLeft: [40, 80],
          paddingBottomRight: [padding.right, padding.bottom],
          maxZoom: 9,
        });
      },
      fitAll: () => {
        const map = mapRef.current;
        const cluster = clusterRef.current;
        if (!map || !cluster) return;
        const bounds = cluster.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
      },
    }),
    [],
  );

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={containerRef} className="absolute inset-0" aria-label="Map of World Heritage sites" />
      <div
        className={`absolute z-[500] flex flex-col ${MAP_CONTROL[controlSize].stack} ${controlsSideClass} ${controlsBottomClass}`}
      >
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          className={`focus-ring grid place-items-center border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95 ${MAP_CONTROL[controlSize].button}`}
        >
          <svg viewBox="0 0 24 24" className={MAP_CONTROL[controlSize].icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          className={`focus-ring grid place-items-center border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95 ${MAP_CONTROL[controlSize].button}`}
        >
          <svg viewBox="0 0 24 24" className={MAP_CONTROL[controlSize].icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            const cluster = clusterRef.current;
            if (!map || !cluster) return;
            const bounds = cluster.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
          }}
          aria-label="Fit all sites"
          className={`focus-ring grid place-items-center border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95 ${MAP_CONTROL[controlSize].button}`}
        >
          <svg viewBox="0 0 24 24" className={MAP_CONTROL[controlSize].icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
        {extraControls}
      </div>
    </div>
  );
});
