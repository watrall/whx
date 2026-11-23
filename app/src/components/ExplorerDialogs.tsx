import type { Explorer } from '../lib/useExplorer.ts';
import { AboutModal } from './AboutModal.tsx';
import { SearchOverlay } from './SearchOverlay.tsx';
import { WorldHeritageDialog } from './WorldHeritageDialog.tsx';

export function ExplorerDialogs({ e }: { e: Explorer }) {
  return (
    <>
      <SearchOverlay
        open={e.searchOpen}
        onClose={() => e.setSearchOpen(false)}
        query={e.query}
        onQueryChange={e.changeQuery}
        sites={e.filtered}
        selectedId={e.selectedSite?.id ?? null}
        onSelect={e.select}
        recent={e.recent}
        onClearRecent={e.clearRecent}
        mobile={!e.isDesktop}
      />
      <AboutModal open={e.aboutOpen} onClose={() => e.setAboutOpen(false)} />
      <WorldHeritageDialog
        open={e.introVisible || e.guideOpen}
        view={e.guideOpen ? 'guide' : 'intro'}
        canGoBack={e.introVisible}
        onReadMore={() => e.setGuideOpen(true)}
        onBack={() => e.setGuideOpen(false)}
        onClose={(remember) => {
          e.setGuideOpen(false);
          e.closeIntro(remember);
        }}
        onAbout={(remember) => {
          e.setGuideOpen(false);
          e.closeIntro(remember);
          e.setAboutOpen(true);
        }}
      />
    </>
  );
}
