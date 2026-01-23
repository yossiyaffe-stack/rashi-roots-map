import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { DbScholar } from '@/hooks/useScholars';

interface ScholarsOverlayContextType {
  isOverlayOpen: boolean;
  setIsOverlayOpen: (open: boolean) => void;
  selectedScholar: DbScholar | null;
  setSelectedScholar: (scholar: DbScholar | null) => void;
  clearSelection: () => void;
}

const ScholarsOverlayContext = createContext<ScholarsOverlayContextType | null>(null);

export function ScholarsOverlayProvider({ children }: { children: ReactNode }) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedScholar(null);
  }, []);

  return (
    <ScholarsOverlayContext.Provider value={{ 
      isOverlayOpen, 
      setIsOverlayOpen,
      selectedScholar,
      setSelectedScholar,
      clearSelection,
    }}>
      {children}
    </ScholarsOverlayContext.Provider>
  );
}

export function useScholarsOverlay() {
  const context = useContext(ScholarsOverlayContext);
  if (!context) {
    throw new Error('useScholarsOverlay must be used within ScholarsOverlayProvider');
  }
  return context;
}
