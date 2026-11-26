import type { CSSProperties, RefObject } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { BASEMAPS } from '../lib/basemaps.ts';
import { PHONE, PHONE_VARS } from '../lib/layout.ts';
import type { Explorer } from '../lib/useExplorer.ts';
import { Attribution } from './Attribution.tsx';
import { DataStatus } from './DataStatus.tsx';
import { DetailCard } from './DetailCard.tsx';
import { ActiveCountryChip, Criteria, MobileTypeFilter, SharedBanner } from './ExplorerControls.tsx';
import { ExplorerDialogs } from './ExplorerDialogs.tsx';
import { ExportMenu } from './ExportMenu.tsx';
import { TRAY_CHIP } from './FilterChip.tsx';
import { ListScopeToggle } from './ListScopeToggle.tsx';
import { LogoMark, MiniWordmark } from './Logo.tsx';
import { NearMeControl } from './MapActions.tsx';
import { MapView } from './MapView.tsx';
import type { MapViewHandle } from './MapView.tsx';
import { MobileSheet } from './MobileSheet.tsx';
import { MoreMenu } from './MoreMenu.tsx';
import { PeekStrip } from './PeekStrip.tsx';
import { PlaybackBar } from './PlaybackBar.tsx';
import { PlayHint } from './PlayHint.tsx';
import { PlaybackReadout } from './PlaybackReadout.tsx';
import { ShareListButton } from './ShareListButton.tsx';
import { ListBody } from './SiteListPanel.tsx';
import { SortSelect } from './SortSelect.tsx';
import { SurpriseButton } from './SurpriseButton.tsx';
import { TimelineRow } from './TimelineRow.tsx';

export function MobileLayout({ e, mapRef }: { e: Explorer; mapRef: RefObject<MapViewHandle | null> }) {
  const mapBottom = e.playing ? PHONE.transport : PHONE.peek;

  return (
    <main
      className="relative h-dvh overflow-hidden bg-canvas text-ink"
      style={{ ...PHONE_VARS, '--map-bottom': `${mapBottom}px` } as CSSProperties}
    >
      <h1 className="sr-only">World Heritage Explorer</h1>
      <MapView
        ref={mapRef}
        sites={e.filtered}
        selectedSite={e.selectedSite}
        highlightedId={e.highlightedId}
        fitKey={e.fitKey}
        onSelect={e.selectOnMap}
        onHover={e.hover}
        onBoundsChange={e.setBounds}
        onMapClick={e.clearSelection}
        controlsBottomClass="bottom-[calc(var(--map-bottom)+env(safe-area-inset-bottom)+36px)]"
        extraControls={<NearMeControl onNearMe={e.nearMe} notice={e.discoverNotice} />}
        initialFocus={e.initialFocus}
        playback={e.playback}
        parts={e.partPoints}
        partsType={e.selectedSite?.type}
        basemaps={BASEMAPS}
        basemap={e.basemap}
        onBasemapChange={e.chooseBasemap}
        onBasemapFailed={e.basemapFailed}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[400] px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="pointer-events-auto relative">
          <button
            type="button"
            onClick={() => e.setSearchOpen(true)}
            className="flex h-[52px] w-full items-center gap-2 rounded-2xl border border-line bg-surface/95 px-4 pr-12 text-left shadow-float backdrop-blur"
          >
            <LogoMark className="h-6 w-6" />
            <span className="flex-1 truncate text-base text-muted">
              {e.query || 'Search sites or countries'}
            </span>
          </button>
          {e.query && (
            <button
              type="button"
              onClick={() => e.changeQuery('')}
              aria-label="Clear search"
              className="focus-ring absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <MobileTypeFilter e={e} />
      </div>

      {!e.playing && (
        <MobileSheet
          snap={e.sheetSnap}
          onSnapChange={e.setSheetSnap}
          pinned={
            <TimelineRow
              e={e}
              open={e.sheetSnap !== 'peek'}
              onToggleTray={() => e.setSheetSnap(e.sheetSnap === 'peek' ? 'mid' : 'peek')}
            />
          }
          peek={<PeekStrip e={e} />}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {e.extra.country && (
              <div className="px-4 pt-2">
                <ActiveCountryChip e={e} />
              </div>
            )}
            {e.extra.listIds && (
              <div className="px-4 pt-2">
                <SharedBanner e={e} />
              </div>
            )}
            <h2 className="sr-only">Sites</h2>
            <div className="flex items-center justify-between gap-1.5 px-4 pt-2">
              <ListScopeToggle
                scope={e.listScope}
                onChange={e.setListScope}
                counts={{ view: e.inViewCount, all: e.sortedCount }}
              />
              <div className="flex items-center gap-1.5">
                <SortSelect sort={e.sort} onChange={e.setSort} hasOrigin={e.origin !== null} touch />
                <ExportMenu count={e.sortedCount} onExport={e.exportSites} touch />
                <MoreMenu onAbout={() => e.setAboutOpen(true)} onGuide={() => e.setGuideOpen(true)} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 pt-3">
              <Criteria e={e} layout="popover" size="chip" />
              <SurpriseButton
                onSurprise={() => {
                  e.surprise();
                  e.setSheetSnap('peek');
                }}
              />
              {e.isFiltered && (
                <button
                  type="button"
                  onClick={e.reset}
                  className={`${TRAY_CHIP} border-line bg-surface text-ink hover:bg-canvas`}
                >
                  <RotateCcw className="h-4 w-4 text-muted" aria-hidden="true" />
                  Reset
                </button>
              )}
              {e.extra.savedOnly && e.saved.size > 0 && (
                <ShareListButton variant="sheet" copied={e.shareCopied} onShare={e.shareSaved} />
              )}
            </div>
            <div className="min-h-0 flex-1 border-t border-line">
              <ListBody e={e} />
            </div>
          </div>
        </MobileSheet>
      )}

      {e.playing && <PlaybackBar e={e} />}

      {e.playing && (
        <PlaybackReadout
          year={e.playYear}
          added={e.addedInYear}
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+var(--map-top))] z-[450] -translate-x-1/2"
        />
      )}

      {e.showHint && e.sheetSnap === 'peek' && !e.playing && (
        <PlayHint placement="mobile" onDismiss={e.dismissHint} />
      )}

      <div className="pointer-events-none fixed left-0 z-[450] rounded-tr-md bg-surface/90 px-2 py-1 bottom-[calc(var(--map-bottom)+env(safe-area-inset-bottom))]">
        <MiniWordmark />
      </div>

      <Attribution
        credits={e.basemap.credits}
        sources={e.basemap.sources}
        compact
        className="pointer-events-auto fixed right-0 z-[450] rounded-tl-md bg-surface px-2 py-1 bottom-[calc(var(--map-bottom)+env(safe-area-inset-bottom))]"
      />

      <DetailCard e={e} variant="mobile" />

      <DataStatus
        loading={e.loading}
        error={e.error}
        onRetry={e.reload}
        className="fixed left-4 top-[calc(env(safe-area-inset-top)+var(--map-top))] z-[450]"
      />

      <ExplorerDialogs e={e} />
    </main>
  );
}
