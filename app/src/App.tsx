import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronDown,
  Info,
  LocateFixed,
  RotateCcw,
  Search,
  Share2,
  Shuffle,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Attribution } from './components/Attribution.tsx';
import { CountryChip } from './components/CountryChip.tsx';
import { CriteriaFilter } from './components/CriteriaFilter.tsx';
import { DiscoverActions } from './components/DiscoverActions.tsx';
import { ExportMenu } from './components/ExportMenu.tsx';
import { FiltersMenu } from './components/FiltersMenu.tsx';
import { MapStrip } from './components/MapStrip.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { FilterChip } from './components/FilterChip.tsx';
import { SharedListBanner, SharedListChip } from './components/SharedListBanner.tsx';
import { Logo } from './components/Logo.tsx';
import { MAP_CONTROL, MapView, type MapViewHandle } from './components/MapView.tsx';
import { MobileSheet, type SheetSnap } from './components/MobileSheet.tsx';
import { Modal } from './components/Modal.tsx';
import { PlaybackReadout } from './components/PlaybackReadout.tsx';
import { SearchOverlay } from './components/SearchOverlay.tsx';
import { SiteDetail } from './components/SiteDetail.tsx';
import { SiteList } from './components/SiteList.tsx';
import { Timeline } from './components/Timeline.tsx';
import { TypeFilter } from './components/TypeFilter.tsx';
import { loadSites } from './lib/data.ts';
import type { Bounds, Site, SiteType, YearRange } from './lib/types.ts';
import { useDebouncedValue } from './lib/useDebouncedValue.ts';
import { useMediaQuery } from './lib/useMediaQuery.ts';
import { useRecentSearches } from './lib/useRecentSearches.ts';
import { useSavedSites } from './lib/useSavedSites.ts';
import { downloadText, toCsv, toGeoJson } from './lib/export.ts';
import { distanceKm, formatDistance, nearbyOrNearest } from './lib/geo.ts';
import { NO_EXTRA, hasExtraFilters, matchesExtra, shareListUrl } from './lib/filters.ts';
import type { ExtraFilters } from './lib/filters.ts';
import { buildUrlHash, parseUrlState } from './lib/urlState.ts';
import {
  TYPE_ORDER,
  countryCount,
  formatNumber,
  formatRange,
  inBounds,
  normalizeSearch,
  pluralize,
  siteSearchText,
} from './lib/utils.ts';

type SortKey = 'name' | 'year' | 'country' | 'distance';

const FALLBACK_DOMAIN: YearRange = [1978, 2026];

function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-line/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-line/60" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-line/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid place-items-center px-6 py-10 text-center" role="alert">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-canvas text-muted">
        <Info className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">Could not load sites</h3>
      <p className="mt-1 max-w-[30ch] text-xs leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="focus-ring mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

export default function App() {
  // Read the hash once so a shared link restores the view it was copied from.
  const initialUrl = useRef(parseUrlState(window.location.hash));
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState(initialUrl.current.query);
  const [types, setTypes] = useState<Set<SiteType>>(new Set(initialUrl.current.types));
  const [extra, setExtra] = useState<ExtraFilters>({
    ...NO_EXTRA,
    danger: initialUrl.current.danger,
    listIds: initialUrl.current.list.length > 0 ? new Set(initialUrl.current.list) : null,
    criteria: new Set(initialUrl.current.criteria),
    country: initialUrl.current.country,
  });
  const [shareCopied, setShareCopied] = useState(false);
  const [yearRange, setYearRange] = useState<YearRange>(FALLBACK_DOMAIN);
  const [domain, setDomain] = useState<YearRange>(FALLBACK_DOMAIN);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('name');
  // Where the visitor is, kept in memory only and only after they press Near me.
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [discoverNotice, setDiscoverNotice] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [initialFocus, setInitialFocus] = useState<{
    site: Site;
    offset: [number, number];
  } | null>(null);

  const mapRef = useRef<MapViewHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const debouncedQuery = useDebouncedValue(query, 350);
  const { recent, addRecent, clearRecent } = useRecentSearches();
  const { saved, toggle: toggleSaved, addMany: saveMany } = useSavedSites();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    loadSites(controller.signal)
      .then((result) => {
        setSites(result.sites);
        const years = result.sites
          .map((site) => site.year)
          .filter((year): year is number => year !== null);
        const nextDomain: YearRange = years.length
          ? [Math.min(...years), Math.max(...years)]
          : FALLBACK_DOMAIN;
        setDomain(nextDomain);
        const wanted = initialUrl.current.years;
        setYearRange(
          wanted
            ? [Math.max(wanted[0], nextDomain[0]), Math.min(wanted[1], nextDomain[1])]
            : nextDomain,
        );
        const linked = initialUrl.current.site
          ? result.sites.find((site) => site.id === initialUrl.current.site)
          : undefined;
        initialUrl.current.site = null;
        if (linked) {
          setSelectedSite(linked);
          setInitialFocus({
            site: linked,
            offset: window.matchMedia('(min-width: 1024px)').matches ? [210, 0] : [0, 120],
          });
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unexpected loading error');
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (loading) return;
    const hash = buildUrlHash({
      site: selectedSite?.id ?? null,
      query: debouncedQuery,
      types,
      years: yearRange,
      domain,
      danger: extra.danger,
      list: extra.listIds,
      criteria: extra.criteria,
      country: extra.country,
    });
    const next = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, '', next);
  }, [loading, selectedSite, debouncedQuery, types, yearRange, domain, extra]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const normalizedQuery = normalizeSearch(query);
  const tokens = useMemo(
    () => normalizedQuery.split(/\s+/).filter(Boolean),
    [normalizedQuery],
  );

  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const site of sites) index.set(site.id, siteSearchText(site));
    return index;
  }, [sites]);

  const matchesQuery = useCallback(
    (site: Site) => {
      if (tokens.length === 0) return true;
      const text = searchIndex.get(site.id) ?? '';
      return tokens.every((token) => text.includes(token));
    },
    [searchIndex, tokens],
  );

  const matchesYear = useCallback(
    (site: Site) => {
      if (site.year === null) {
        return yearRange[0] <= domain[0] && yearRange[1] >= domain[1];
      }
      return site.year >= yearRange[0] && site.year <= yearRange[1];
    },
    [domain, yearRange],
  );

  const filtered = useMemo(
    () =>
      sites.filter(
        (site) =>
          (types.size === 0 || types.has(site.type)) &&
          matchesYear(site) &&
          matchesQuery(site) &&
          matchesExtra(site, extra, saved),
      ),
    [sites, types, matchesYear, matchesQuery, extra, saved],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<SiteType, number> = { cultural: 0, natural: 0, mixed: 0 };
    for (const site of sites) {
      if (!matchesYear(site) || !matchesQuery(site) || !matchesExtra(site, extra, saved)) continue;
      counts[site.type] += 1;
    }
    return counts;
  }, [sites, matchesYear, matchesQuery, extra, saved]);

  // Danger count ignores the danger filter itself, so the chip shows what turning it on would give.
  const dangerCount = useMemo(
    () =>
      sites.filter(
        (site) =>
          site.danger &&
          (types.size === 0 || types.has(site.type)) &&
          matchesYear(site) &&
          matchesQuery(site) &&
          matchesExtra(site, { ...extra, danger: false }, saved),
      ).length,
    [sites, types, matchesYear, matchesQuery, extra, saved],
  );

  const isFiltered =
    query.trim() !== '' ||
    types.size > 0 ||
    hasExtraFilters(extra) ||
    yearRange[0] !== domain[0] ||
    yearRange[1] !== domain[1];
  const playYear = yearRange[1];
  const addedInYear = useMemo(
    () => (playing ? filtered.filter((site) => site.year === playYear).length : 0),
    [playing, filtered, playYear],
  );

  const typeTotal = typeCounts.cultural + typeCounts.natural + typeCounts.mixed;
  const countries = countryCount(filtered);

  const timelineSites = useMemo(
    () =>
      sites.filter(
        (site) =>
          (types.size === 0 || types.has(site.type)) &&
          matchesQuery(site) &&
          matchesExtra(site, extra, saved),
      ),
    [sites, types, matchesQuery, extra, saved],
  );

  // Years that have at least one matching site. Playback jumps between these
  // so the early decades (a handful of inscriptions in 18 years) do not stall.
  const activeYears = useMemo(() => {
    const years = new Set<number>();
    for (const site of timelineSites) if (site.year !== null) years.add(site.year);
    return [...years].sort((a, b) => a - b);
  }, [timelineSites]);

  useEffect(() => {
    if (!playing) return;
    if (yearRange[1] >= domain[1]) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setYearRange((prev) => {
        const next = activeYears.find((year) => year > prev[1]);
        return [prev[0], Math.min(next ?? domain[1], domain[1])];
      });
    }, 400 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, yearRange, domain, activeYears, speed]);

  const sortedFiltered = useMemo(() => {
    const copy = [...filtered];
    const km = new Map<string, number>();
    if (sort === 'distance' && origin) {
      for (const site of copy) km.set(site.id, distanceKm(origin, site));
    }
    copy.sort((a, b) => {
      if (sort === 'distance' && origin) return (km.get(a.id) ?? 0) - (km.get(b.id) ?? 0);
      if (sort === 'year') return (a.year ?? 9999) - (b.year ?? 9999);
      if (sort === 'country') {
        return a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return copy;
  }, [filtered, sort, origin]);

  const sortedListSites = useMemo(
    () => sortedFiltered.filter((site) => inBounds(site, bounds)),
    [sortedFiltered, bounds],
  );
  const listCount = sortedListSites.length;

  const selectedIndex = useMemo(
    () => (selectedSite ? sortedFiltered.findIndex((site) => site.id === selectedSite.id) : -1),
    [selectedSite, sortedFiltered],
  );
  // Nearby uses the current results, so every suggestion has a marker on the map.
  const nearby = useMemo(
    () => (selectedSite ? nearbyOrNearest(selectedSite, filtered, 3) : null),
    [selectedSite, filtered],
  );
  const detailPosition =
    selectedIndex >= 0 ? { index: selectedIndex, total: sortedFiltered.length } : null;

  const fitKey = [
    debouncedQuery,
    Array.from(types).sort().join(','),
    extra.danger,
    extra.savedOnly,
    extra.listIds?.size ?? '',
    [...extra.criteria].sort().join(','),
    extra.country ?? '',
  ].join('|');

  // Changing a filter refits the map to the results, so a card left open would
  // sit over a view that no longer matches it. Close it.
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedSite(null);
  }, []);

  const handleClearTypes = useCallback(() => {
    setTypes(new Set());
    setSelectedSite(null);
  }, []);

  const handleToggleType = useCallback((type: SiteType) => {
    setSelectedSite(null);
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handlePlayToggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (yearRange[1] >= domain[1]) {
      setYearRange([domain[0], domain[0]]);
    }
    // Playback is a global story: clear the detail card, tuck the sheet away and
    // frame every site that will appear, not just the ones drawn at this instant.
    setSelectedSite(null);
    setHighlightedId(null);
    setSheetSnap('peek');
    mapRef.current?.fitSites(timelineSites);
    setPlaying(true);
  }, [playing, yearRange, domain, timelineSites]);

  const handleReset = useCallback(() => {
    setQuery('');
    setTypes(new Set());
    setSort((current) => (current === 'distance' ? 'name' : current));
    setExtra(NO_EXTRA);
    setYearRange(domain);
    setSelectedSite(null);
    setHighlightedId(null);
    setPlaying(false);
    setSearchOpen(false);
    setSheetSnap('peek');
    mapRef.current?.fitAll();
  }, [domain]);

  const handleSelect = useCallback(
    (site: Site) => {
      addRecent(query);
      setSelectedSite(site);
      setSearchOpen(false);
      setHighlightedId(null);
      if (!isDesktop) setSheetSnap('peek');
      mapRef.current?.focusSite(site, { offset: isDesktop ? [210, 0] : [0, 120] });
    },
    [addRecent, query, isDesktop],
  );

  const handleSurprise = useCallback(() => {
    // Prefer sites with a photo, so the first impression is a picture.
    const withImage = filtered.filter((site) => site.image);
    const pool = withImage.length > 0 ? withImage : filtered;
    if (pool.length === 0) return;
    handleSelect(pool[Math.floor(Math.random() * pool.length)]);
  }, [filtered, handleSelect]);

  const handleNearMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setDiscoverNotice('Location is not available in this browser.');
      return;
    }
    setDiscoverNotice('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDiscoverNotice(null);
        setSelectedSite(null);
        const here = { lat: position.coords.latitude, lon: position.coords.longitude };
        setOrigin(here);
        setSort('distance');
        mapRef.current?.flyToPoint(here.lat, here.lon, 6);
      },
      () => setDiscoverNotice('Could not get your location. Check browser permissions.'),
      { timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  const handleExport = useCallback(
    (format: 'csv' | 'geojson') => {
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        downloadText(`world-heritage-sites-${stamp}.csv`, 'text/csv', toCsv(sortedFiltered));
      } else {
        downloadText(
          `world-heritage-sites-${stamp}.geojson`,
          'application/geo+json',
          toGeoJson(sortedFiltered),
        );
      }
    },
    [sortedFiltered],
  );

  const handleStep = useCallback(
    (delta: -1 | 1) => {
      const next = sortedFiltered[selectedIndex + delta];
      if (next) handleSelect(next);
    },
    [sortedFiltered, selectedIndex, handleSelect],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
      const interactive = target?.closest('button, a, [role="button"], [role="slider"]');

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setAboutOpen(false);
        setSelectedSite(null);
        setSheetSnap('peek');
        return;
      }

      if (aboutOpen || searchOpen) return;
      if (typing) return;

      if (event.key === '/') {
        event.preventDefault();
        // Desktop has a search field on screen; the full-screen overlay is for phones.
        if (isDesktop) searchRef.current?.focus();
        else setSearchOpen(true);
        return;
      }
      if (event.key === '1') {
        handleToggleType('cultural');
        return;
      }
      if (event.key === '2') {
        handleToggleType('natural');
        return;
      }
      if (event.key === '3') {
        handleToggleType('mixed');
        return;
      }
      if (event.key === ' ' && !interactive) {
        event.preventDefault();
        handlePlayToggle();
        return;
      }
      if (event.key === '?') {
        setAboutOpen(true);
        return;
      }
      if (selectedSite && !interactive && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        handleStep(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aboutOpen, searchOpen, selectedSite, isDesktop, handleStep, handleToggleType, handlePlayToggle]);

  useEffect(() => {
    if (!isDesktop) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isDesktop]);

  const sortSelect = (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Sort sites</span>
      <select
        value={sort}
        onChange={(event) => setSort(event.target.value as SortKey)}
        className="focus-ring h-9 appearance-none rounded-md border border-line bg-surface pl-2.5 pr-7 text-xs font-medium text-ink"
      >
        <option value="name">Name</option>
        <option value="year">Year</option>
        <option value="country">Country</option>
        {origin && <option value="distance">Distance</option>}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 h-3 w-3 text-muted"
        aria-hidden="true"
      />
    </label>
  );

  const listBody = loading ? (
    <SkeletonList />
  ) : error ? (
    <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
  ) : filtered.length === 0 ? (
    <EmptyState
      title="No sites match"
      description="Nothing fits this search, type and year range together."
      actionLabel="Reset filters"
      onAction={handleReset}
    />
  ) : sortedListSites.length === 0 ? (
    <EmptyState
      title="No sites in this part of the map"
      description="There are matches elsewhere. Zoom out to find them."
      actionLabel="Show all results"
      onAction={() => mapRef.current?.fitAll()}
    />
  ) : (
    <SiteList
      sites={sortedListSites}
      selectedId={selectedSite?.id ?? null}
      highlightedId={highlightedId}
      onSelect={handleSelect}
      onHover={(site) => setHighlightedId(site?.id ?? null)}
      rowHeight={isDesktop ? 72 : 56}
      extraMeta={
        sort === 'distance' && origin
          ? (site) => `${formatDistance(distanceKm(origin, site))} away`
          : undefined
      }
      className="h-full"
    />
  );

  const handleToggleDanger = useCallback(() => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, danger: !prev.danger }));
  }, []);

  // Counts show what ticking a criterion would add, given everything else that is active.
  const criteriaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const without = { ...extra, criteria: new Set<string>() };
    for (const site of sites) {
      if (types.size > 0 && !types.has(site.type)) continue;
      if (!matchesYear(site) || !matchesQuery(site) || !matchesExtra(site, without, saved)) continue;
      for (const code of site.criteriaCodes) counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [sites, types, matchesYear, matchesQuery, extra, saved]);

  const handleToggleCriterion = useCallback((code: string) => {
    setSelectedSite(null);
    setExtra((prev) => {
      const criteria = new Set(prev.criteria);
      if (criteria.has(code)) criteria.delete(code);
      else criteria.add(code);
      return { ...prev, criteria };
    });
  }, []);

  const handleFilterCountry = useCallback((country: string | null) => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, country }));
  }, []);

  const countryChip = extra.country ? (
    <CountryChip country={extra.country} onClear={() => handleFilterCountry(null)} />
  ) : null;

  const handleClearCriteria = useCallback(() => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, criteria: new Set() }));
  }, []);

  const criteriaFilter = (layout: 'popover' | 'inline', size: 'rail' | 'strip' = 'rail') => (
    <CriteriaFilter
      selected={extra.criteria}
      counts={criteriaCounts}
      onToggle={handleToggleCriterion}
      onClear={handleClearCriteria}
      layout={layout}
      size={size}
    />
  );

  const handleToggleSavedOnly = useCallback(() => {
    setSelectedSite(null);
    setExtra((prev) => ({ ...prev, savedOnly: !prev.savedOnly }));
  }, []);

  const handleShareSaved = useCallback(async () => {
    const url = shareListUrl(saved, `${window.location.origin}${window.location.pathname}`);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
    }
  }, [saved]);

  const sharedUnsaved = extra.listIds ? [...extra.listIds].filter((id) => !saved.has(id)).length : 0;
  const sharedBanner = extra.listIds ? (
    <SharedListBanner
      count={extra.listIds.size}
      unsaved={sharedUnsaved}
      onSaveAll={() => extra.listIds && saveMany(extra.listIds)}
      onShowAll={() => {
        setSelectedSite(null);
        setExtra((prev) => ({ ...prev, listIds: null }));
      }}
    />
  ) : null;

  const shareButtonFor = (touch: boolean) =>
    extra.savedOnly && saved.size > 0 ? (
      <button
        type="button"
        onClick={handleShareSaved}
        className={`focus-ring inline-flex items-center gap-1 rounded-md font-medium text-ink transition hover:underline ${
          touch ? 'min-h-11 px-2 text-sm' : 'min-h-8 text-xs'
        }`}
      >
        {shareCopied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {shareCopied ? 'Link copied' : 'Share list'}
      </button>
    ) : null;

  const dangerChipFor = (variant: 'desktop' | 'mobile' | 'strip') => (
    <FilterChip
      label="In danger"
      icon={<TriangleAlert className={variant === 'mobile' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />}
      count={dangerCount}
      active={extra.danger}
      onClick={handleToggleDanger}
      variant={variant}
      tone="danger"
    />
  );

  const savedChipFor = (variant: 'desktop' | 'mobile' | 'strip') => (
    <FilterChip
      label="Saved"
      icon={<Bookmark className={variant === 'mobile' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />}
      count={saved.size}
      active={extra.savedOnly}
      onClick={handleToggleSavedOnly}
      variant={variant}
    />
  );

  const typeFilter = (
    <TypeFilter
      types={types}
      counts={typeCounts}
      total={typeTotal}
      onToggle={handleToggleType}
      onClear={handleClearTypes}
      variant="mobile"
      extras={
        <>
          {dangerChipFor('mobile')}
          {savedChipFor('mobile')}
        </>
      }
    />
  );

  // Desktop strip pieces. The tier (wide, medium, compact) comes from the strip's own width.
  const stripTypes = (compact: boolean) => (
    <TypeFilter
      types={types}
      counts={typeCounts}
      total={typeTotal}
      onToggle={handleToggleType}
      onClear={handleClearTypes}
      variant="strip"
      compact={compact}
    />
  );

  const stripFilters = (wide: boolean) =>
    wide ? (
      <>
        {dangerChipFor('strip')}
        {savedChipFor('strip')}
        {criteriaFilter('popover', 'strip')}
      </>
    ) : (
      <>
        {dangerChipFor('strip')}
        <FiltersMenu activeCount={(extra.savedOnly ? 1 : 0) + extra.criteria.size}>
          {savedChipFor('desktop')}
          {criteriaFilter('inline')}
        </FiltersMenu>
      </>
    );

  const stripExtras =
    extra.country || extra.listIds || (extra.savedOnly && saved.size > 0) ? (
      <>
        {countryChip}
        {extra.listIds && (
          <SharedListChip
            count={extra.listIds.size}
            unsaved={sharedUnsaved}
            onSaveAll={() => extra.listIds && saveMany(extra.listIds)}
            onShowAll={() => {
              setSelectedSite(null);
              setExtra((prev) => ({ ...prev, listIds: null }));
            }}
          />
        )}
        {extra.savedOnly && saved.size > 0 && (
          <button
            type="button"
            onClick={handleShareSaved}
            className="focus-ring inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-medium text-ink shadow-card transition hover:bg-canvas"
          >
            {shareCopied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {shareCopied ? 'Link copied' : 'Share list'}
          </button>
        )}
      </>
    ) : null;

  // Locate and shuffle join the zoom controls, using the same button style.
  const mapActionControls = (
    <>
      <button
        type="button"
        onClick={handleNearMe}
        aria-label="Near me"
        title="Near me"
        className={`focus-ring grid place-items-center border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95 ${MAP_CONTROL.sm.button}`}
      >
        <LocateFixed className={MAP_CONTROL.sm.icon} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={handleSurprise}
        aria-label="Surprise me"
        title="Surprise me"
        className={`focus-ring grid place-items-center border border-line bg-surface text-ink shadow-card transition hover:bg-canvas active:scale-95 ${MAP_CONTROL.sm.button}`}
      >
        <Shuffle className={MAP_CONTROL.sm.icon} aria-hidden="true" />
      </button>
      <p
        role="status"
        className="absolute bottom-0 left-10 w-max max-w-[240px] rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted shadow-card empty:hidden"
      >
        {discoverNotice ?? ''}
      </p>
    </>
  );

  const aboutModal = (
    <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="About World Heritage Explorer">
      <p className="text-sm leading-relaxed text-muted">
        An independent, map-first explorer for UNESCO World Heritage Sites, built from open
        Wikidata. Browse by type, scrub the inscription timeline, and open a site for its story.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Sites, coordinates and images come from Wikidata. Descriptions, countries and
        inscription years come from UNESCO/World Heritage Centre; descriptions are published under
        CC BY-SA 3.0 IGO. Basemap © OpenStreetMap contributors. Boundaries and labels are illustrative. Not affiliated with UNESCO;
        verify details on the official site.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="https://www.wikidata.org/"
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex h-8 items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
        >
          Wikidata
        </a>
        <a
          href="https://whc.unesco.org/"
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex h-8 items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
        >
          UNESCO
        </a>
        <a
          href="https://github.com/watrall/wikidata-world-heritage"
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex h-8 items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition hover:bg-canvas"
        >
          GitHub
        </a>
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
          Keyboard shortcuts
        </h3>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs text-muted">
          <dt className="flex items-center gap-1">
            <span className="kbd">/</span>
          </dt>
          <dd>Search</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">1</span>
            <span className="kbd">2</span>
            <span className="kbd">3</span>
          </dt>
          <dd>Toggle cultural, natural, mixed</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">Space</span>
          </dt>
          <dd>Play or pause the timeline</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">Esc</span>
          </dt>
          <dd>Close panels</dd>
          <dt className="flex items-center gap-1">
            <span className="kbd">?</span>
          </dt>
          <dd>This dialog</dd>
        </dl>
      </div>
    </Modal>
  );

  const searchOverlay = (
    <SearchOverlay
      open={searchOpen}
      onClose={() => setSearchOpen(false)}
      query={query}
      onQueryChange={handleQueryChange}
      sites={filtered}
      selectedId={selectedSite?.id ?? null}
      onSelect={handleSelect}
      recent={recent}
      onClearRecent={clearRecent}
      mobile={!isDesktop}
    />
  );

  if (isDesktop) {
    return (
      <div className="flex h-dvh min-h-0 bg-canvas text-ink">
        <aside className="flex w-[384px] shrink-0 flex-col border-r border-line bg-surface">
          <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <Logo />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                aria-label="About this project"
                className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="border-t border-line px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Sites in view
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                {sortSelect}
                <ExportMenu count={sortedFiltered.length} onExport={handleExport} touch={false} />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">
              <span className="font-semibold text-ink">{formatNumber(listCount)}</span> in view of{' '}
              {pluralize(filtered.length, 'site')} · {pluralize(countries, 'country', 'countries')}
            </p>
          </div>

          <div className="min-h-0 flex-1 border-t border-line">{listBody}</div>

          <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
            <p className="text-xs text-muted">Data: Wikidata · UNESCO</p>
          </footer>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <MapStrip
              query={query}
              onQueryChange={handleQueryChange}
              searchRef={searchRef}
              renderTypes={stripTypes}
              renderFilters={stripFilters}
              extras={stripExtras}
              isFiltered={isFiltered}
              onReset={handleReset}
            />
            <MapView
              ref={mapRef}
              sites={filtered}
              selectedSite={selectedSite}
              highlightedId={highlightedId}
              fitKey={fitKey}
              onSelect={setSelectedSite}
              onHover={(site) => setHighlightedId(site?.id ?? null)}
              onBoundsChange={setBounds}
              onMapClick={() => setSelectedSite(null)}
              controlsBottomClass="bottom-4"
              controlsSideClass="left-4"
              controlSize="sm"
              extraControls={mapActionControls}
              initialFocus={initialFocus}
              rippleYear={playing ? playYear : null}
            />
            <Attribution className="absolute bottom-0 right-0 z-[500] rounded-tl-md bg-surface/90 px-2 py-1" />
            {playing && (
              <PlaybackReadout
                year={playYear}
                added={addedInYear}
                className="absolute left-1/2 top-[4.5rem] z-[500] -translate-x-1/2"
              />
            )}
            {selectedSite && (
              <SiteDetail
                site={selectedSite}
                variant="desktop"
                position={detailPosition}
                onStep={handleStep}
                nearby={nearby?.items}
                nearbyMode={nearby?.mode}
                onSelectNearby={handleSelect}
                saved={saved.has(selectedSite.id)}
                onToggleSaved={() => toggleSaved(selectedSite.id)}
                onFilterCountry={handleFilterCountry}
                newFromYear={domain[1] - 1}
                onClose={() => setSelectedSite(null)}
              />
            )}
            {loading && (
              <div className="pointer-events-none absolute left-4 top-[4.5rem] z-[500] rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-medium text-muted shadow-card backdrop-blur">
                Loading sites from Wikidata…
              </div>
            )}
            {error && (
              <div className="absolute left-4 top-[4.5rem] z-[500] flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs text-muted shadow-card backdrop-blur">
                Data unavailable.
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="font-medium text-ink underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          <Timeline
            sites={timelineSites}
            domain={domain}
            value={yearRange}
            onChange={setYearRange}
            playing={playing}
            onTogglePlay={handlePlayToggle}
            speed={speed}
            onCycleSpeed={() => setSpeed((value) => (value === 1 ? 2 : value === 2 ? 4 : 1))}
            count={filtered.length}
          />
        </main>

        {searchOverlay}
        {aboutModal}
      </div>
    );
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-canvas text-ink">
      <h1 className="sr-only">World Heritage Explorer</h1>
      <MapView
        ref={mapRef}
        sites={filtered}
        selectedSite={selectedSite}
        highlightedId={highlightedId}
        fitKey={fitKey}
        onSelect={setSelectedSite}
        onHover={(site) => setHighlightedId(site?.id ?? null)}
        onBoundsChange={setBounds}
        onMapClick={() => setSelectedSite(null)}
        controlsBottomClass="bottom-[calc(152px+env(safe-area-inset-bottom)+36px)]"
        initialFocus={initialFocus}
        rippleYear={playing ? playYear : null}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[400] bg-gradient-to-b from-canvas/90 to-transparent px-4 pb-6 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="pointer-events-auto relative">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-[52px] w-full items-center gap-2 rounded-2xl border border-line bg-surface/95 px-4 pr-12 text-left shadow-float backdrop-blur"
          >
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="flex-1 truncate text-base text-muted">
              {query || 'Search sites or countries'}
            </span>
          </button>
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              aria-label="Clear search"
              className="focus-ring absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <MobileSheet
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        header={
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {pluralize(filtered.length, 'site')} · {pluralize(countries, 'country', 'countries')}
              </p>
              <p className="mt-0.5 text-xs text-muted">{formatRange(yearRange)}</p>
            </div>
            <div className="flex items-center gap-1">
              {shareButtonFor(true)}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink transition hover:bg-canvas"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                aria-label="About this project"
                className="focus-ring grid h-11 w-11 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        }
        peek={
          <div className="space-y-2">
            {typeFilter}
            <Timeline
              sites={timelineSites}
              domain={domain}
              value={yearRange}
              onChange={setYearRange}
              playing={playing}
              onTogglePlay={handlePlayToggle}
              count={filtered.length}
              compact
            />
          </div>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {countryChip && <div className="px-4 pt-2">{countryChip}</div>}
          {sharedBanner && <div className="px-4 pt-2">{sharedBanner}</div>}
          <div className="px-4 pt-2">{criteriaFilter('inline')}</div>
          <DiscoverActions
            className="px-4 pb-1 pt-2"
            onSurprise={() => {
              handleSurprise();
              setSheetSnap('peek');
            }}
            onNearMe={handleNearMe}
            notice={discoverNotice}
          />
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Sites in view
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-muted">
                {formatNumber(listCount)}
              </span>
              {sortSelect}
              <ExportMenu count={sortedFiltered.length} onExport={handleExport} touch={!isDesktop} />
            </div>
          </div>
          <div className="min-h-0 flex-1">{listBody}</div>
        </div>
      </MobileSheet>

      {playing && (
        <PlaybackReadout
          year={playYear}
          added={addedInYear}
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+80px)] z-[450] -translate-x-1/2"
        />
      )}

      <Attribution className="pointer-events-auto fixed right-0 z-[450] rounded-tl-md bg-surface/90 px-2 py-1 bottom-[calc(152px+env(safe-area-inset-bottom))]" />

      {selectedSite && (
        <SiteDetail
          site={selectedSite}
          variant="mobile"
          position={detailPosition}
          onStep={handleStep}
          nearby={nearby?.items}
          nearbyMode={nearby?.mode}
          onSelectNearby={handleSelect}
          saved={saved.has(selectedSite.id)}
          onToggleSaved={() => toggleSaved(selectedSite.id)}
          onFilterCountry={handleFilterCountry}
          newFromYear={domain[1] - 1}
          onClose={() => setSelectedSite(null)}
        />
      )}

      {loading && (
        <div className="pointer-events-none fixed left-4 top-[calc(env(safe-area-inset-top)+76px)] z-[450] rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-medium text-muted shadow-card backdrop-blur">
          Loading sites…
        </div>
      )}
      {error && (
        <div className="fixed left-4 top-[calc(env(safe-area-inset-top)+76px)] z-[450] flex items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs text-muted shadow-card backdrop-blur">
          Data unavailable.
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="font-medium text-ink underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {searchOverlay}
      {aboutModal}
    </main>
  );
}
