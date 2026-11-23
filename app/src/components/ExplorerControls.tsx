import { Bookmark, TriangleAlert } from 'lucide-react';
import type { Explorer } from '../lib/useExplorer.ts';
import { CountryChip } from './CountryChip.tsx';
import { CriteriaFilter } from './CriteriaFilter.tsx';
import { FilterChip } from './FilterChip.tsx';
import { FiltersMenu } from './FiltersMenu.tsx';
import { SharedListBanner, SharedListChip } from './SharedListBanner.tsx';
import { ShareListButton } from './ShareListButton.tsx';
import { TypeFilter } from './TypeFilter.tsx';

type Variant = 'desktop' | 'mobile' | 'strip';

function DangerChip({ e, variant }: { e: Explorer; variant: Variant }) {
  return (
    <FilterChip
      label="In danger"
      icon={<TriangleAlert className={variant === 'mobile' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />}
      count={e.dangerCount}
      active={e.extra.danger}
      onClick={e.toggleDanger}
      variant={variant}
      tone="danger"
    />
  );
}

function SavedChip({ e, variant }: { e: Explorer; variant: Variant }) {
  return (
    <FilterChip
      label="Saved"
      icon={<Bookmark className={variant === 'mobile' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />}
      count={e.saved.size}
      active={e.extra.savedOnly}
      onClick={e.toggleSavedOnly}
      variant={variant}
    />
  );
}

export function Criteria({
  e,
  layout,
  size = 'rail',
}: {
  e: Explorer;
  layout: 'popover' | 'inline';
  size?: 'rail' | 'strip';
}) {
  return (
    <CriteriaFilter
      selected={e.extra.criteria}
      counts={e.criteriaCounts}
      onToggle={e.toggleCriterion}
      onClear={e.clearCriteria}
      layout={layout}
      size={size}
    />
  );
}

export function ActiveCountryChip({ e }: { e: Explorer }) {
  if (!e.extra.country) return null;
  return <CountryChip country={e.extra.country} onClear={() => e.filterCountry(null)} />;
}

export function SharedBanner({ e }: { e: Explorer }) {
  if (!e.extra.listIds) return null;
  return (
    <SharedListBanner
      count={e.extra.listIds.size}
      unsaved={e.sharedUnsaved}
      onSaveAll={e.saveAllShared}
      onShowAll={e.showAllShared}
    />
  );
}

export function MobileTypeFilter({ e }: { e: Explorer }) {
  return (
    <TypeFilter
      types={e.types}
      counts={e.typeCounts}
      total={e.typeTotal}
      onToggle={e.toggleType}
      onClear={e.clearTypes}
      variant="mobile"
      extras={
        <>
          <DangerChip e={e} variant="mobile" />
          <SavedChip e={e} variant="mobile" />
        </>
      }
    />
  );
}

export function StripTypes({ e, compact }: { e: Explorer; compact: boolean }) {
  return (
    <TypeFilter
      types={e.types}
      counts={e.typeCounts}
      total={e.typeTotal}
      onToggle={e.toggleType}
      onClear={e.clearTypes}
      variant="strip"
      compact={compact}
    />
  );
}

export function StripFilters({ e, wide }: { e: Explorer; wide: boolean }) {
  if (wide) {
    return (
      <>
        <DangerChip e={e} variant="strip" />
        <SavedChip e={e} variant="strip" />
        <Criteria e={e} layout="popover" size="strip" />
      </>
    );
  }
  return (
    <>
      <DangerChip e={e} variant="strip" />
      <FiltersMenu activeCount={(e.extra.savedOnly ? 1 : 0) + e.extra.criteria.size}>
        <SavedChip e={e} variant="desktop" />
        <Criteria e={e} layout="inline" />
      </FiltersMenu>
    </>
  );
}

export function hasStripExtras(e: Explorer): boolean {
  return Boolean(e.extra.country || e.extra.listIds || (e.extra.savedOnly && e.saved.size > 0));
}

export function StripExtras({ e }: { e: Explorer }) {
  const sharing = e.extra.savedOnly && e.saved.size > 0;
  return (
    <>
      <ActiveCountryChip e={e} />
      {e.extra.listIds && (
        <SharedListChip
          count={e.extra.listIds.size}
          unsaved={e.sharedUnsaved}
          onSaveAll={e.saveAllShared}
          onShowAll={e.showAllShared}
        />
      )}
      {sharing && <ShareListButton variant="strip" copied={e.shareCopied} onShare={e.shareSaved} />}
    </>
  );
}
