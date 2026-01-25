import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PeriodMode, RegionMode, RegionOption } from '@/constants/filterOptions';
import { RABBINIC_REGIONS, SECULAR_REGIONS } from '@/constants/filterOptions';

interface FilterBounds {
  north: number;
  south: number;
  east: number;
  west: number;
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
  
  // Panel state
  isFilterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  
  // Helpers
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  
  // Check if a scholar's location falls within selected regions
  isLocationInSelectedRegions: (lat: number, lng: number) => boolean;
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
        isFilterPanelOpen,
        setFilterPanelOpen,
        clearAllFilters,
        hasActiveFilters,
        isLocationInSelectedRegions,
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
