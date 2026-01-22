import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface CircleFilter {
  center: [number, number]; // [lat, lng]
  radius: number; // in meters
}

interface CircleFilterContextType {
  circleFilter: CircleFilter | null;
  setCircleFilter: (filter: CircleFilter | null) => void;
  isDrawingCircle: boolean;
  setIsDrawingCircle: (drawing: boolean) => void;
  clearCircleFilter: () => void;
}

const CircleFilterContext = createContext<CircleFilterContextType | undefined>(undefined);

export function CircleFilterProvider({ children }: { children: ReactNode }) {
  const [circleFilter, setCircleFilter] = useState<CircleFilter | null>(null);
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);

  const clearCircleFilter = useCallback(() => {
    setCircleFilter(null);
    setIsDrawingCircle(false);
  }, []);

  return (
    <CircleFilterContext.Provider value={{
      circleFilter,
      setCircleFilter,
      isDrawingCircle,
      setIsDrawingCircle,
      clearCircleFilter,
    }}>
      {children}
    </CircleFilterContext.Provider>
  );
}

export function useCircleFilter() {
  const context = useContext(CircleFilterContext);
  if (context === undefined) {
    return {
      circleFilter: null,
      setCircleFilter: () => {},
      isDrawingCircle: false,
      setIsDrawingCircle: () => {},
      clearCircleFilter: () => {},
    };
  }
  return context;
}

// Utility function to check if a point is within circle
export function isPointInCircle(
  pointLat: number,
  pointLng: number,
  circleLat: number,
  circleLng: number,
  radiusMeters: number
): boolean {
  const R = 6371000; // Earth's radius in meters
  const dLat = (pointLat - circleLat) * Math.PI / 180;
  const dLng = (pointLng - circleLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(circleLat * Math.PI / 180) * Math.cos(pointLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance <= radiusMeters;
}
