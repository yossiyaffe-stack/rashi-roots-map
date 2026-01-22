import { createContext, useContext, useState, ReactNode } from 'react';

interface MapControlsContextType {
  showBoundaries: boolean;
  setShowBoundaries: (show: boolean) => void;
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
}

const MapControlsContext = createContext<MapControlsContextType | undefined>(undefined);

export function MapControlsProvider({ children }: { children: ReactNode }) {
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showMigrations, setShowMigrations] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showPlaceNamesEnglish, setShowPlaceNamesEnglish] = useState(true);
  const [showPlaceNamesHebrew, setShowPlaceNamesHebrew] = useState(true);
  const [showScholarNamesEnglish, setShowScholarNamesEnglish] = useState(true);
  const [showScholarNamesHebrew, setShowScholarNamesHebrew] = useState(false);

  return (
    <MapControlsContext.Provider value={{
      showBoundaries,
      setShowBoundaries,
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
    };
  }
  return context;
}
