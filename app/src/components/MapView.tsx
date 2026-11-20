import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Bounds, Site } from '../lib/types.ts';
import {
  clusterIconHtml,
  clusterSize,
  escapeHtml,
  markerIconHtml,
  TYPE_COLOR,
  siteMeta,
  typeCounts,
} from '../lib/utils.ts';

export interface MapViewHandle {
  flyToPoint: (lat: number, lon: number, zoom?: number) => void;
  /** Fit the view to these sites, regardless of what is currently drawn. */
  fitSites: (sites: Site[]) => void;
  focusSite: (site: Site, options?: { offset?: [number, number] }) => void;
  fitAll: () => void;
}

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
  className?: string;
}

function makeMarkerIcon(site: Site, selected: boolean, highlighted: boolean) {
  return L.divIcon({
    html: markerIconHtml(site.type, selected, highlighted),
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
      <div className={`absolute z-[500] flex flex-col gap-2 ${controlsSideClass} ${controlsBottomClass}`}>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
      </div>
    </div>
  );
});
