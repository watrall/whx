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

function DangerChip({ explorer, variant }: { explorer: Explorer; variant: Variant }) {
  return (
    <FilterChip
      label="In danger"
      icon={<TriangleAlert className={variant === 'mobile' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />}
      count={explorer.dangerCount}
      active={explorer.extra.danger}
      onClick={explorer.toggleDanger}
      variant={variant}
      tone="danger"
    />
  );
}

function SavedChip({ explorer, variant }: { explorer: Explorer; variant: Variant }) {
  return (
    <FilterChip
      label="Saved"
      icon={<Bookmark className={variant === 'mobile' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />}
      count={explorer.saved.size}
      active={explorer.extra.savedOnly}
      onClick={explorer.toggleSavedOnly}
      pulse={explorer.savePulse}
      variant={variant}
    />
  );
}

export function Criteria({
  explorer,
  layout,
  size = 'rail',
}: {
  explorer: Explorer;
  layout: 'popover' | 'inline';
  size?: 'rail' | 'strip' | 'chip';
}) {
  return (
    <CriteriaFilter
      selected={explorer.extra.criteria}
      counts={explorer.criteriaCounts}
      onToggle={explorer.toggleCriterion}
      onClear={explorer.clearCriteria}
      layout={layout}
      size={size}
    />
  );
}

export function ActiveCountryChip({ explorer }: { explorer: Explorer }) {
  if (!explorer.extra.country) return null;
  return <CountryChip country={explorer.extra.country} onClear={() => explorer.filterCountry(null)} />;
}

export function SharedBanner({ explorer }: { explorer: Explorer }) {
  if (!explorer.extra.listIds) return null;
  return (
    <SharedListBanner
      count={explorer.extra.listIds.size}
      unsaved={explorer.sharedUnsaved}
      onSaveAll={explorer.saveAllShared}
      onShowAll={explorer.showAllShared}
    />
  );
}

export function MobileTypeFilter({ explorer }: { explorer: Explorer }) {
  return (
    <TypeFilter
      types={explorer.types}
      counts={explorer.typeCounts}
      total={explorer.typeTotal}
      onToggle={explorer.toggleType}
      onClear={explorer.clearTypes}
      variant="mobile"
      className="pointer-events-auto -mx-4 mt-1 scroll-px-4 px-4 py-1.5"
      extras={
        <>
          <DangerChip explorer={explorer} variant="mobile" />
          <SavedChip explorer={explorer} variant="mobile" />
        </>
      }
    />
  );
}

export function StripTypes({ explorer, compact }: { explorer: Explorer; compact: boolean }) {
  return (
    <TypeFilter
      types={explorer.types}
      counts={explorer.typeCounts}
      total={explorer.typeTotal}
      onToggle={explorer.toggleType}
      onClear={explorer.clearTypes}
      variant="strip"
      compact={compact}
    />
  );
}

export function StripFilters({ explorer, wide }: { explorer: Explorer; wide: boolean }) {
  if (wide) {
    return (
      <>
        <DangerChip explorer={explorer} variant="strip" />
        <SavedChip explorer={explorer} variant="strip" />
        <Criteria explorer={explorer} layout="popover" size="strip" />
      </>
    );
  }
  return (
    <>
      <DangerChip explorer={explorer} variant="strip" />
      <FiltersMenu activeCount={(explorer.extra.savedOnly ? 1 : 0) + explorer.extra.criteria.size}>
        <SavedChip explorer={explorer} variant="desktop" />
        <Criteria explorer={explorer} layout="inline" />
      </FiltersMenu>
    </>
  );
}

export function hasStripExtras(explorer: Explorer): boolean {
  return Boolean(
    explorer.extra.country || explorer.extra.listIds || (explorer.extra.savedOnly && explorer.saved.size > 0),
  );
}

export function StripExtras({ explorer }: { explorer: Explorer }) {
  const sharing = explorer.extra.savedOnly && explorer.saved.size > 0;
  return (
    <>
      <ActiveCountryChip explorer={explorer} />
      {explorer.extra.listIds && (
        <SharedListChip
          count={explorer.extra.listIds.size}
          unsaved={explorer.sharedUnsaved}
          onSaveAll={explorer.saveAllShared}
          onShowAll={explorer.showAllShared}
        />
      )}
      {sharing && (
        <ShareListButton variant="strip" copied={explorer.shareCopied} onShare={explorer.shareSaved} />
      )}
    </>
  );
}
