import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PeriodMode, RegionMode, RegionOption } from '@/constants/filterOptions';
import { RABBINIC_REGIONS, SECULAR_REGIONS } from '@/constants/filterOptions';

interface FilterBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Map viewport bounds for syncing scholars list with visible map area
export interface MapViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Timeline range for filtering scholars
export interface TimelineRange {
  start: number;
  end: number;
}

interface FilterContextType {
  // Period filters
  selectedPeriods: string[];
  setSelectedPeriods: (periods: string[]) => void;
  periodMode: PeriodMode;
  setPeriodMode: (mode: PeriodMode) => void;
  
  // Region filters
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  regionMode: RegionMode;
  setRegionMode: (mode: RegionMode) => void;
  
  // Computed bounds from selected regions
  selectedBounds: FilterBounds | null;
  
  // Time range derived from period selection
  derivedTimeRange: [number, number] | null;
  setDerivedTimeRange: (range: [number, number] | null) => void;
  
  // Map viewport sync for Scholars page
  mapViewportBounds: MapViewportBounds | null;
  setMapViewportBounds: (bounds: MapViewportBounds | null) => void;
  
  // Timeline range for filtering
  timelineRange: TimelineRange | null;
  setTimelineRange: (range: TimelineRange | null) => void;
  
  // Panel state
  isFilterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  
  // Helpers
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  
  // Check if a scholar's location falls within selected regions
  isLocationInSelectedRegions: (lat: number, lng: number) => boolean;
  
  // Check if a scholar is within the current map viewport
  isInMapViewport: (lat: number | null, lng: number | null) => boolean;
  
  // Check if a scholar's lifespan overlaps with timeline range
  isInTimelineRange: (birthYear: number | null, deathYear: number | null) => boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Period state
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('jewish');
  const [derivedTimeRange, setDerivedTimeRange] = useState<[number, number] | null>(null);
  
  // Region state
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionMode, setRegionMode] = useState<RegionMode>('rabbinic');
  
  // Panel state
  const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);
  
  // Map viewport sync state
  const [mapViewportBounds, setMapViewportBounds] = useState<MapViewportBounds | null>(null);
  const [timelineRange, setTimelineRange] = useState<TimelineRange | null>(null);

  // Calculate combined bounds from selected regions
  const selectedBounds = React.useMemo((): FilterBounds | null => {
    if (selectedRegions.length === 0) return null;
    
    const regions = regionMode === 'rabbinic' ? RABBINIC_REGIONS : SECULAR_REGIONS;
    const selectedRegionObjects = regions.filter((r) => selectedRegions.includes(r.id));
    const boundsWithData = selectedRegionObjects.filter((r) => r.bounds);
    
    if (boundsWithData.length === 0) return null;
    
    return {
      north: Math.max(...boundsWithData.map((r) => r.bounds!.north)),
      south: Math.min(...boundsWithData.map((r) => r.bounds!.south)),
      east: Math.max(...boundsWithData.map((r) => r.bounds!.east)),
      west: Math.min(...boundsWithData.map((r) => r.bounds!.west)),
    };
  }, [selectedRegions, regionMode]);

  const hasActiveFilters = selectedPeriods.length > 0 || selectedRegions.length > 0;

  const clearAllFilters = useCallback(() => {
    setSelectedPeriods([]);
    setSelectedRegions([]);
    setDerivedTimeRange(null);
    setMapViewportBounds(null);
    setTimelineRange(null);
  }, []);

  const isLocationInSelectedRegions = useCallback((lat: number, lng: number): boolean => {
    if (selectedRegions.length === 0) return true; // No filter = all pass
    
    const regions = regionMode === 'rabbinic' ? RABBINIC_REGIONS : SECULAR_REGIONS;
    const selectedRegionObjects = regions.filter((r) => selectedRegions.includes(r.id));
    
    return selectedRegionObjects.some((region) => {
      if (!region.bounds) return false;
      const { north, south, east, west } = region.bounds;
      return lat <= north && lat >= south && lng <= east && lng >= west;
    });
  }, [selectedRegions, regionMode]);
  
  // Check if a scholar is within the current map viewport
  const isInMapViewport = useCallback((lat: number | null, lng: number | null): boolean => {
    if (!mapViewportBounds) return true; // No viewport filter = all pass
    if (lat === null || lng === null) return false; // No coordinates = exclude
    
    const { north, south, east, west } = mapViewportBounds;
    return lat <= north && lat >= south && lng <= east && lng >= west;
  }, [mapViewportBounds]);
  
  // Check if a scholar's lifespan overlaps with timeline range
  const isInTimelineRange = useCallback((birthYear: number | null, deathYear: number | null): boolean => {
    if (!timelineRange) return true; // No timeline filter = all pass
    
    const { start, end } = timelineRange;
    
    // If we have no dates, include by default (uncertain dates)
    if (birthYear === null && deathYear === null) return true;
    
    // Use reasonable defaults for missing dates
    const effectiveBirth = birthYear ?? (deathYear ? deathYear - 80 : start);
    const effectiveDeath = deathYear ?? (birthYear ? birthYear + 80 : end);
    
    // Check for overlap: scholar's lifespan intersects with timeline range
    return effectiveDeath >= start && effectiveBirth <= end;
  }, [timelineRange]);

  return (
    <FilterContext.Provider
      value={{
        selectedPeriods,
        setSelectedPeriods,
        periodMode,
        setPeriodMode,
        selectedRegions,
        setSelectedRegions,
        regionMode,
        setRegionMode,
        selectedBounds,
        derivedTimeRange,
        setDerivedTimeRange,
        mapViewportBounds,
        setMapViewportBounds,
        timelineRange,
        setTimelineRange,
        isFilterPanelOpen,
        setFilterPanelOpen,
        clearAllFilters,
        hasActiveFilters,
        isLocationInSelectedRegions,
        isInMapViewport,
        isInTimelineRange,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
