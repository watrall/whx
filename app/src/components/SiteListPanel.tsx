import { formatDistance, distanceKm } from '../lib/geo.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { formatNumber, pluralize } from '../lib/utils.ts';
import { EmptyState } from './EmptyState.tsx';
import { ErrorState, SkeletonList } from './ListStates.tsx';
import { SiteList } from './SiteList.tsx';

export function ListSummary({ e }: { e: Explorer }) {
  const countries = pluralize(e.countries, 'country', 'countries');
  if (e.listScope === 'view') {
    return (
      <>
        <span className="font-semibold text-ink">{formatNumber(e.listSites.length)}</span> in view of{' '}
        {pluralize(e.filtered.length, 'site')} · {countries}
      </>
    );
  }
  return (
    <>
      <span className="font-semibold text-ink">{formatNumber(e.filtered.length)}</span>{' '}
      {e.filtered.length === 1 ? 'site' : 'sites'} · {countries}
    </>
  );
}

export function ListBody({ e }: { e: Explorer }) {
  const { origin } = e;
  if (e.loading) return <SkeletonList />;
  if (e.error) return <ErrorState message={e.error} onRetry={e.reload} />;
  if (e.filtered.length === 0) {
    return (
      <EmptyState
        title="No sites match"
        description="Nothing fits this search, type and year range together."
        actionLabel="Reset filters"
        onAction={e.reset}
      />
    );
  }
  if (e.listSites.length === 0) {
    return (
      <EmptyState
        title="No sites in this part of the map"
        description="There are matches elsewhere. Zoom out, or list all of them."
        actionLabel="List all results"
        onAction={() => e.setListScope('all')}
      />
    );
  }
  return (
    <SiteList
      key={e.listScope}
      sites={e.listSites}
      followHighlight={e.listScope === 'view'}
      selectedId={e.selectedSite?.id ?? null}
      highlightedId={e.highlightedId}
      onSelect={e.select}
      onHover={e.hover}
      rowHeight={e.isDesktop ? 72 : 56}
      extraMeta={
        e.sort === 'distance' && origin
          ? (site) => `${formatDistance(distanceKm(origin, site))} away`
          : undefined
      }
      className="h-full"
    />
  );
}
