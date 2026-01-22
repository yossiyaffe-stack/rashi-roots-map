import { createContext, useContext, useState, ReactNode } from 'react';

interface MapControlsContextType {
  showBoundaries: boolean;
  setShowBoundaries: (show: boolean) => void;
  showMigrations: boolean;
  setShowMigrations: (show: boolean) => void;
  showConnections: boolean;
  setShowConnections: (show: boolean) => void;
}

const MapControlsContext = createContext<MapControlsContextType | undefined>(undefined);

export function MapControlsProvider({ children }: { children: ReactNode }) {
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showMigrations, setShowMigrations] = useState(false);
  const [showConnections, setShowConnections] = useState(false);

  return (
    <MapControlsContext.Provider value={{
      showBoundaries,
      setShowBoundaries,
      showMigrations,
      setShowMigrations,
      showConnections,
      setShowConnections,
    }}>
      {children}
    </MapControlsContext.Provider>
  );
}

export function useMapControls() {
  const context = useContext(MapControlsContext);
  if (context === undefined) {
    throw new Error('useMapControls must be used within a MapControlsProvider');
  }
  return context;
}
