import L from 'leaflet';
import 'leaflet.markercluster';
import type { Site } from './types.ts';
import { STAGGER_LIMIT, staggerBatches, staggerWindow } from './timeline.ts';
import type { PlaybackEntry } from './timeline.ts';
import { clusterIconHtml, clusterSize, markerIconHtml, typeCounts } from './utils.ts';

/** Same radius as the live map, so the clusters here are the ones the viewer ends up with. */
const CLUSTER_RADIUS = 48;

/** Reference markers are never seen; they only give the cluster group something to group. */
const HIDDEN_ICON = L.divIcon({ className: 'wh-ref-hidden', html: '', iconSize: [0, 0] });

function hash(id: string): number {
  let value = 0;
  for (let index = 0; index < id.length; index += 1) {
    value = (value * 31 + id.charCodeAt(index)) | 0;
  }
  return value;
}

interface Shown {
  marker: L.Marker;
  count: number;
}

/**
 * Draws the map while the timeline plays.
 *
 * The live cluster group moves its clusters as markers join (a cluster sits at the average of
 * its members), which makes them jump around. Here a hidden cluster group holds every site that
 * playback will reveal, so cluster positions are fixed from the start. Visible icons are drawn
 * at those fixed positions and only their counts change. When playback ends the live group
 * clusters the same sites, so the two match.
 */
export class PlaybackLayer {
  private readonly map: L.Map;
  private group: L.MarkerClusterGroup | null = null;
  private readonly display = L.layerGroup();
  private entries: PlaybackEntry<Site>[] = [];
  private markers = new Map<string, L.Marker>();
  private readonly revealed = new Set<string>();
  private members = new Map<unknown, { parent: unknown; sites: Site[] }>();
  private shown = new Map<unknown, Shown>();
  private timers: number[] = [];
  private stopped = false;

  constructor(map: L.Map, entries: PlaybackEntry<Site>[]) {
    this.map = map;
    this.display.addTo(map);
    map.on('zoomend', this.rebuild);
    this.load(entries);
  }

  /** Swaps in a new set of sites (the start year moved) without touching the live cluster group. */
  setEntries(entries: PlaybackEntry<Site>[]): void {
    if (this.stopped || entries === this.entries) return;
    this.clearTimers();
    this.load(entries);
  }

  /** Builds the hidden reference group for these sites and works out their clusters. */
  private load(entries: PlaybackEntry<Site>[]): void {
    this.group?.remove();
    this.entries = entries;
    this.markers = new Map();
    const group = L.markerClusterGroup({
      maxClusterRadius: CLUSTER_RADIUS,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      animate: false,
      animateAddingMarkers: false,
      // Keep sites outside the viewport in their clusters too. Without this their icons are
      // dropped, getVisibleParent cannot find their cluster, and panning would show lone pins.
      removeOutsideVisibleBounds: false,
      iconCreateFunction: () => HIDDEN_ICON,
    });
    const markers: L.Marker[] = [];
    for (const { site } of entries) {
      const marker = L.marker([site.lat, site.lon], {
        icon: HIDDEN_ICON,
        interactive: false,
        keyboard: false,
      });
      this.markers.set(site.id, marker);
      markers.push(marker);
    }
    group.addLayers(markers);
    group.addTo(this.map);
    this.group = group;
    this.rebuild();
  }

  /** Reveals every site up to `year`. New ones appear in small batches over a short window. */
  reveal(year: number, speed: number): void {
    this.clearTimers();
    const wanted = new Set<string>();
    const fresh: Site[] = [];
    for (const { site, at } of this.entries) {
      if (at > year) continue;
      wanted.add(site.id);
      if (!this.revealed.has(site.id)) fresh.push(site);
    }
    for (const id of [...this.revealed]) if (!wanted.has(id)) this.revealed.delete(id);

    fresh.sort((a, b) => hash(a.id) - hash(b.id));
    if (fresh.length > STAGGER_LIMIT) {
      for (const site of fresh) this.revealed.add(site.id);
      this.render();
      return;
    }

    const sizes = staggerBatches(fresh.length);
    const gap = sizes.length > 1 ? staggerWindow(fresh.length) / speed / sizes.length : 0;
    let offset = 0;
    sizes.forEach((size, index) => {
      const batch = fresh.slice(offset, offset + size);
      offset += size;
      const apply = () => {
        for (const site of batch) this.revealed.add(site.id);
        this.render();
      };
      if (index === 0) apply();
      else this.timers.push(window.setTimeout(apply, gap * index));
    });
    if (sizes.length === 0) this.render();
  }

  /** Cancels pending reveals and removes the playback drawing. */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.clearTimers();
    this.map.off('zoomend', this.rebuild);
    this.display.remove();
    this.group?.remove();
  }

  private clearTimers(): void {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers = [];
  }

  /** Works out which cluster (or lone pin) each site belongs to at the current zoom. */
  private readonly rebuild = (): void => {
    if (this.stopped) return;
    this.members = new Map();
    for (const { site } of this.entries) {
      const marker = this.markers.get(site.id);
      if (!marker) continue;
      const parent = this.group?.getVisibleParent(marker) ?? marker;
      let entry = this.members.get(parent);
      if (!entry) {
        entry = { parent, sites: [] };
        this.members.set(parent, entry);
      }
      entry.sites.push(site);
    }
    this.display.clearLayers();
    this.shown = new Map();
    this.render();
  };

  private render(): void {
    if (this.stopped) return;
    const live = new Set<unknown>();
    for (const [key, { parent, sites }] of this.members) {
      const visible = sites.filter((site) => this.revealed.has(site.id));
      if (visible.length === 0) continue;
      live.add(key);
      const isCluster = typeof (parent as L.MarkerCluster).getChildCount === 'function';
      const existing = this.shown.get(key);

      if (!isCluster) {
        if (existing) continue;
        const site = visible[0]!;
        const marker = L.marker([site.lat, site.lon], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            html: markerIconHtml(site.type, false, false, site.danger),
            className: 'wh-marker-wrapper wh-playing',
            iconSize: [34, 42],
            iconAnchor: [17, 40],
          }),
        }).addTo(this.display);
        this.shown.set(key, { marker, count: 1 });
        continue;
      }

      if (existing && existing.count === visible.length) continue;
      const size = clusterSize(visible.length);
      const icon = L.divIcon({
        html: clusterIconHtml(visible.length, typeCounts(visible.map((site) => site.type))),
        className: 'wh-cluster-wrapper wh-playing',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      if (existing) {
        existing.marker.setIcon(icon);
        existing.count = visible.length;
      } else {
        const marker = L.marker((parent as L.MarkerCluster).getLatLng(), {
          interactive: false,
          keyboard: false,
          icon,
        }).addTo(this.display);
        this.shown.set(key, { marker, count: visible.length });
      }
    }
    // Sites can also go away (the viewer dragged the end handle back).
    for (const [key, entry] of this.shown) {
      if (live.has(key)) continue;
      entry.marker.remove();
      this.shown.delete(key);
    }
  }
}
