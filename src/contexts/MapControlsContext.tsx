import { createContext, useContext, useState, ReactNode } from 'react';
import type { LocationReason } from '@/hooks/useScholars';

export type CityFilter = 'all' | 'major';
export type MapEntityMode = 'scholars' | 'works';

interface MapControlsContextType {
  showBoundaries: boolean;
  setShowBoundaries: (show: boolean) => void;
  showBoundaryShading: boolean;
  setShowBoundaryShading: (show: boolean) => void;
  showMigrations: boolean;
  setShowMigrations: (show: boolean) => void;
  showConnections: boolean;
  setShowConnections: (show: boolean) => void;
  showPlaceNamesEnglish: boolean;
  setShowPlaceNamesEnglish: (show: boolean) => void;
  showPlaceNamesHebrew: boolean;
  setShowPlaceNamesHebrew: (show: boolean) => void;
  showScholarNamesEnglish: boolean;
  setShowScholarNamesEnglish: (show: boolean) => void;
  showScholarNamesHebrew: boolean;
  setShowScholarNamesHebrew: (show: boolean) => void;
  cityFilter: CityFilter;
  setCityFilter: (filter: CityFilter) => void;
  showOnlyScholarCities: boolean;
  setShowOnlyScholarCities: (show: boolean) => void;
  showJourneyMarkers: boolean;
  setShowJourneyMarkers: (show: boolean) => void;
  journeyReasonFilter: LocationReason[];
  setJourneyReasonFilter: (reasons: LocationReason[]) => void;
  mapEntityMode: MapEntityMode;
  setMapEntityMode: (mode: MapEntityMode) => void;
}

const MapControlsContext = createContext<MapControlsContextType | undefined>(undefined);

export function MapControlsProvider({ children }: { children: ReactNode }) {
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showBoundaryShading, setShowBoundaryShading] = useState(false);
  const [showMigrations, setShowMigrations] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showPlaceNamesEnglish, setShowPlaceNamesEnglish] = useState(true);
  const [showPlaceNamesHebrew, setShowPlaceNamesHebrew] = useState(true);
  const [showScholarNamesEnglish, setShowScholarNamesEnglish] = useState(true);
  const [showScholarNamesHebrew, setShowScholarNamesHebrew] = useState(false);
  const [cityFilter, setCityFilter] = useState<CityFilter>('all');
  const [showOnlyScholarCities, setShowOnlyScholarCities] = useState(false);
  const [showJourneyMarkers, setShowJourneyMarkers] = useState(false);
  const [journeyReasonFilter, setJourneyReasonFilter] = useState<LocationReason[]>([]);
  const [mapEntityMode, setMapEntityMode] = useState<MapEntityMode>('scholars');

  return (
    <MapControlsContext.Provider value={{
      showBoundaries,
      setShowBoundaries,
      showBoundaryShading,
      setShowBoundaryShading,
      showMigrations,
      setShowMigrations,
      showConnections,
      setShowConnections,
      showPlaceNamesEnglish,
      setShowPlaceNamesEnglish,
      showPlaceNamesHebrew,
      setShowPlaceNamesHebrew,
      showScholarNamesEnglish,
      setShowScholarNamesEnglish,
      showScholarNamesHebrew,
      setShowScholarNamesHebrew,
      cityFilter,
      setCityFilter,
      showOnlyScholarCities,
      setShowOnlyScholarCities,
      showJourneyMarkers,
      setShowJourneyMarkers,
      journeyReasonFilter,
      setJourneyReasonFilter,
      mapEntityMode,
      setMapEntityMode,
    }}>
      {children}
    </MapControlsContext.Provider>
  );
}

export function useMapControls() {
  const context = useContext(MapControlsContext);
  if (context === undefined) {
    // Return default values if used outside provider (for non-map pages)
    return {
      showBoundaries: true,
      setShowBoundaries: () => {},
      showBoundaryShading: true,
      setShowBoundaryShading: () => {},
      showMigrations: false,
      setShowMigrations: () => {},
      showConnections: false,
      setShowConnections: () => {},
      showPlaceNamesEnglish: true,
      setShowPlaceNamesEnglish: () => {},
      showPlaceNamesHebrew: true,
      setShowPlaceNamesHebrew: () => {},
      showScholarNamesEnglish: true,
      setShowScholarNamesEnglish: () => {},
      showScholarNamesHebrew: false,
      setShowScholarNamesHebrew: () => {},
      cityFilter: 'all' as CityFilter,
      setCityFilter: () => {},
      showOnlyScholarCities: false,
      setShowOnlyScholarCities: () => {},
      showJourneyMarkers: false,
      setShowJourneyMarkers: () => {},
      journeyReasonFilter: [] as LocationReason[],
      setJourneyReasonFilter: () => {},
      mapEntityMode: 'scholars' as MapEntityMode,
      setMapEntityMode: () => {},
    };
  }
  return context;
}
