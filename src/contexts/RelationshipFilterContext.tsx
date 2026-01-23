import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

// ============================================
// FILTER STATE STRUCTURE
// ============================================

export interface RelationshipFilters {
  // Domain toggles - 3 separate top-level categories
  domains: {
    family: boolean;
    teacherStudent: boolean;
    textual: boolean;
  };
  
  // Family subtypes for granular filtering
  familyTypes: {
    son: boolean;
    son_in_law: boolean;
    daughter: boolean;
    daughter_in_law: boolean;
  };
  
  // Textual filters - aligned with actual database categories
  textual: {
    categories: {
      commentary: boolean;
      citation: boolean;
      influence: boolean;
      response: boolean;
      transmission: boolean;
    };
    // Depth level filter - only show direct relationships (daughter), not granddaughter
    depthLevel: 'daughter' | 'all';
  };
  
  // Certainty filter
  certainty: {
    certain: boolean;
    probable: boolean;
    possible: boolean;
    speculated: boolean;
  };
}

const DEFAULT_FILTERS: RelationshipFilters = {
  domains: {
    family: true,
    teacherStudent: true,
    textual: true,
  },
  familyTypes: {
    son: true,
    son_in_law: true,
    daughter: true,
    daughter_in_law: true,
  },
  textual: {
    categories: {
      commentary: true,
      citation: true,
      influence: true,
      response: true,
      transmission: true,
    },
    depthLevel: 'daughter',
  },
  certainty: {
    certain: true,
    probable: true,
    possible: true,
    speculated: false,
  },
};

interface RelationshipFilterContextType {
  filters: RelationshipFilters;
  setFilters: (filters: RelationshipFilters) => void;
  toggleDomain: (domain: keyof RelationshipFilters['domains']) => void;
  toggleFamilyType: (familyType: keyof RelationshipFilters['familyTypes']) => void;
  toggleTextualCategory: (category: keyof RelationshipFilters['textual']['categories']) => void;
  toggleCertainty: (level: keyof RelationshipFilters['certainty']) => void;
  setDepthLevel: (level: 'daughter' | 'all') => void;
  resetFilters: () => void;
  activeFilterCount: number;
  shouldShowRelationship: (domain: 'family' | 'teacherStudent' | 'textual', category: string, relationshipType: string | null, certainty: string | null, depthLevel?: number) => boolean;
}

const RelationshipFilterContext = createContext<RelationshipFilterContextType | undefined>(undefined);

export function RelationshipFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<RelationshipFilters>(DEFAULT_FILTERS);

  const toggleDomain = useCallback((domain: keyof RelationshipFilters['domains']) => {
    setFilters(prev => ({
      ...prev,
      domains: {
        ...prev.domains,
        [domain]: !prev.domains[domain],
      },
    }));
  }, []);

  const toggleFamilyType = useCallback((familyType: keyof RelationshipFilters['familyTypes']) => {
    setFilters(prev => ({
      ...prev,
      familyTypes: {
        ...prev.familyTypes,
        [familyType]: !prev.familyTypes[familyType],
      },
    }));
  }, []);

  const toggleTextualCategory = useCallback((category: keyof RelationshipFilters['textual']['categories']) => {
    setFilters(prev => ({
      ...prev,
      textual: {
        ...prev.textual,
        categories: {
          ...prev.textual.categories,
          [category]: !prev.textual.categories[category],
        },
      },
    }));
  }, []);

  const toggleCertainty = useCallback((level: keyof RelationshipFilters['certainty']) => {
    setFilters(prev => ({
      ...prev,
      certainty: {
        ...prev.certainty,
        [level]: !prev.certainty[level],
      },
    }));
  }, []);

  const setDepthLevel = useCallback((level: 'daughter' | 'all') => {
    setFilters(prev => ({
      ...prev,
      textual: {
        ...prev.textual,
        depthLevel: level,
      },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    // Count disabled domains
    Object.values(filters.domains).forEach(v => !v && count++);
    // Count disabled family types
    Object.values(filters.familyTypes).forEach(v => !v && count++);
    // Count disabled textual categories
    Object.values(filters.textual.categories).forEach(v => !v && count++);
    Object.values(filters.certainty).forEach(v => !v && count++);
    return count;
  }, [filters]);

  // Helper to check if a relationship should be shown based on current filters
  const shouldShowRelationship = useCallback((
    domain: 'family' | 'teacherStudent' | 'textual',
    category: string,
    relationshipType: string | null,
    certainty: string | null,
    depthLevel?: number
  ): boolean => {
    // Check domain is enabled
    if (!filters.domains[domain]) return false;
    
    // For family domain, check specific family type
    if (domain === 'family' && relationshipType) {
      const normalizedType = relationshipType.toLowerCase().replace('-', '_').replace(' ', '_');
      const familyTypes = filters.familyTypes as Record<string, boolean>;
      const familyTypeKey = Object.keys(familyTypes).find(
        key => key.toLowerCase() === normalizedType
      );
      if (familyTypeKey && !familyTypes[familyTypeKey]) return false;
    }
    
    // For textual domain, check category and depth level
    if (domain === 'textual') {
      const normalizedCategory = category.toLowerCase();
      const categoryKey = Object.keys(filters.textual.categories).find(
        key => key.toLowerCase() === normalizedCategory
      );
      if (categoryKey && !filters.textual.categories[categoryKey as keyof typeof filters.textual.categories]) return false;
      
      // Check depth level - if set to 'daughter', only show depth_level 1 (direct relationships)
      if (filters.textual.depthLevel === 'daughter' && depthLevel !== undefined && depthLevel > 1) {
        return false;
      }
    }
    
    // Check certainty is enabled
    if (certainty) {
      const normalizedCertainty = certainty.toLowerCase() as keyof RelationshipFilters['certainty'];
      if (filters.certainty[normalizedCertainty] === false) return false;
    }
    
    return true;
  }, [filters]);

  return (
    <RelationshipFilterContext.Provider value={{
      filters,
      setFilters,
      toggleDomain,
      toggleFamilyType,
      toggleTextualCategory,
      toggleCertainty,
      setDepthLevel,
      resetFilters,
      activeFilterCount,
      shouldShowRelationship,
    }}>
      {children}
    </RelationshipFilterContext.Provider>
  );
}

export function useRelationshipFilters() {
  const context = useContext(RelationshipFilterContext);
  if (context === undefined) {
    // Return default values if used outside provider
    return {
      filters: DEFAULT_FILTERS,
      setFilters: () => {},
      toggleDomain: () => {},
      toggleFamilyType: () => {},
      toggleTextualCategory: () => {},
      toggleCertainty: () => {},
      setDepthLevel: () => {},
      resetFilters: () => {},
      activeFilterCount: 0,
      shouldShowRelationship: () => true,
    };
  }
  return context;
}
