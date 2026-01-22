import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

// ============================================
// FILTER STATE STRUCTURE
// ============================================

export interface RelationshipFilters {
  // Domain toggles
  domains: {
    biographical: boolean;
    textual: boolean;
    intellectual: boolean;
  };
  
  // Biographical filters - simplified to direct relationships only
  biographical: {
    categories: {
      family: boolean;
      teacherStudent: boolean;  // combines educational/pedagogical
    };
    // Family subtypes for granular filtering
    familyTypes: {
      son: boolean;
      son_in_law: boolean;
      daughter: boolean;
      daughter_in_law: boolean;
    };
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
  };
  
  // Intellectual filters - aligned with actual database categories
  intellectual: {
    categories: {
      methodology: boolean;
      influence: boolean;
      authorship: boolean;
      study: boolean;
      school: boolean;
      transmission: boolean;
    };
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
    biographical: true,
    textual: true,
    intellectual: true,
  },
  biographical: {
    categories: {
      family: true,
      teacherStudent: true,
    },
    familyTypes: {
      son: true,
      son_in_law: true,
      daughter: true,
      daughter_in_law: true,
    },
  },
  textual: {
    categories: {
      commentary: true,
      citation: true,
      influence: true,
      response: true,
      transmission: true,
    },
  },
  intellectual: {
    categories: {
      methodology: true,
      influence: true,
      authorship: true,
      study: true,
      school: true,
      transmission: true,
    },
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
  toggleBiographicalCategory: (category: keyof RelationshipFilters['biographical']['categories']) => void;
  toggleFamilyType: (familyType: keyof RelationshipFilters['biographical']['familyTypes']) => void;
  toggleTextualCategory: (category: keyof RelationshipFilters['textual']['categories']) => void;
  toggleIntellectualCategory: (category: keyof RelationshipFilters['intellectual']['categories']) => void;
  toggleCertainty: (level: keyof RelationshipFilters['certainty']) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  shouldShowRelationship: (domain: 'biographical' | 'textual' | 'intellectual', category: string, relationshipType: string | null, certainty: string | null) => boolean;
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

  const toggleBiographicalCategory = useCallback((category: keyof RelationshipFilters['biographical']['categories']) => {
    setFilters(prev => ({
      ...prev,
      biographical: {
        ...prev.biographical,
        categories: {
          ...prev.biographical.categories,
          [category]: !prev.biographical.categories[category],
        },
      },
    }));
  }, []);

  const toggleFamilyType = useCallback((familyType: keyof RelationshipFilters['biographical']['familyTypes']) => {
    setFilters(prev => ({
      ...prev,
      biographical: {
        ...prev.biographical,
        familyTypes: {
          ...prev.biographical.familyTypes,
          [familyType]: !prev.biographical.familyTypes[familyType],
        },
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

  const toggleIntellectualCategory = useCallback((category: keyof RelationshipFilters['intellectual']['categories']) => {
    setFilters(prev => ({
      ...prev,
      intellectual: {
        ...prev.intellectual,
        categories: {
          ...prev.intellectual.categories,
          [category]: !prev.intellectual.categories[category],
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

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    // Count disabled domains
    Object.values(filters.domains).forEach(v => !v && count++);
    // Count disabled categories
    Object.values(filters.biographical.categories).forEach(v => !v && count++);
    Object.values(filters.biographical.familyTypes).forEach(v => !v && count++);
    Object.values(filters.textual.categories).forEach(v => !v && count++);
    Object.values(filters.intellectual.categories).forEach(v => !v && count++);
    Object.values(filters.certainty).forEach(v => !v && count++);
    return count;
  }, [filters]);

  // Helper to check if a relationship should be shown based on current filters
  const shouldShowRelationship = useCallback((
    domain: 'biographical' | 'textual' | 'intellectual',
    category: string,
    relationshipType: string | null,
    certainty: string | null
  ): boolean => {
    // Check domain is enabled
    if (!filters.domains[domain]) return false;
    
    // Normalize category for matching
    const normalizedCategory = category.toLowerCase();
    
    // For biographical, map DB categories to our simplified structure
    if (domain === 'biographical') {
      // Family category
      if (normalizedCategory === 'family') {
        if (!filters.biographical.categories.family) return false;
        
        // Check specific family type if provided
        if (relationshipType) {
          const normalizedType = relationshipType.toLowerCase().replace('-', '_').replace(' ', '_');
          const familyTypes = filters.biographical.familyTypes as Record<string, boolean>;
          const familyTypeKey = Object.keys(familyTypes).find(
            key => key.toLowerCase() === normalizedType
          );
          if (familyTypeKey && !familyTypes[familyTypeKey]) return false;
        }
      }
      // Teacher-Student category (combines educational + pedagogical from DB)
      else if (normalizedCategory === 'educational' || normalizedCategory === 'pedagogical') {
        if (!filters.biographical.categories.teacherStudent) return false;
      }
      // Hide all other biographical categories (professional, social, institutional)
      else {
        return false;
      }
    } else {
      // For textual/intellectual, use standard category matching
      const domainCategories = filters[domain].categories as Record<string, boolean>;
      const categoryKey = Object.keys(domainCategories).find(
        key => key.toLowerCase() === normalizedCategory
      );
      if (categoryKey && !domainCategories[categoryKey]) return false;
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
      toggleBiographicalCategory,
      toggleFamilyType,
      toggleTextualCategory,
      toggleIntellectualCategory,
      toggleCertainty,
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
      toggleBiographicalCategory: () => {},
      toggleFamilyType: () => {},
      toggleTextualCategory: () => {},
      toggleIntellectualCategory: () => {},
      toggleCertainty: () => {},
      resetFilters: () => {},
      activeFilterCount: 0,
      shouldShowRelationship: () => true,
    };
  }
  return context;
}
