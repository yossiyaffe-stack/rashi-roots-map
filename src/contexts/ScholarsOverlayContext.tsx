import { createContext, useContext, useState, ReactNode } from 'react';

interface ScholarsOverlayContextType {
  isOverlayOpen: boolean;
  setIsOverlayOpen: (open: boolean) => void;
}

const ScholarsOverlayContext = createContext<ScholarsOverlayContextType | null>(null);

export function ScholarsOverlayProvider({ children }: { children: ReactNode }) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <ScholarsOverlayContext.Provider value={{ isOverlayOpen, setIsOverlayOpen }}>
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
