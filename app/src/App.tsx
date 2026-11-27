import { useRef } from 'react';
import { DesktopLayout } from './components/DesktopLayout.tsx';
import { MobileLayout } from './components/MobileLayout.tsx';
import type { MapViewHandle } from './components/MapView.tsx';
import { useExplorer } from './lib/useExplorer.ts';

export default function App() {
  const mapRef = useRef<MapViewHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const explorer = useExplorer(mapRef, searchRef);
  return explorer.isDesktop ? (
    <DesktopLayout explorer={explorer} mapRef={mapRef} searchRef={searchRef} />
  ) : (
    <MobileLayout explorer={explorer} mapRef={mapRef} />
  );
}
