import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, GraduationCap, BookOpen, MapPin, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useScholars, type DbScholar } from '@/hooks/useScholars';
import { useScholarNameVariants } from '@/hooks/useScholarNameVariants';
import { useWorksWithLocations, type WorkWithLocation } from '@/hooks/useWorks';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { cn } from '@/lib/utils';

type SearchCategory = 'all' | 'scholars' | 'works' | 'places';

interface UnifiedSearchProps {
  onScholarSelect: (scholar: DbScholar) => void;
  onWorkSelect: (work: WorkWithLocation) => void;
  onPlaceSelect: (latitude: number, longitude: number, placeName: string) => void;
}

const languageLabels: Record<string, string> = {
  hebrew: 'Hebrew',
  yiddish: 'Yiddish',
  latin: 'Latin',
  arabic: 'Arabic',
  german: 'German',
  french: 'French',
  polish: 'Polish',
  czech: 'Czech',
  italian: 'Italian',
  spanish: 'Spanish',
  english: 'English',
  lithuanian: 'Lithuanian',
};

// Normalize search query for matching
const normalizeText = (text: string) =>
  text.toLowerCase()
    .replace(/['"״׳]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function UnifiedSearch({ onScholarSelect, onWorkSelect, onPlaceSelect }: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<SearchCategory>('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const { data: scholars = [] } = useScholars();
  const nameVariants = useScholarNameVariants(scholars);
  const { data: works = [] } = useWorksWithLocations();
  const { results: placeResults, isSearching: isSearchingPlaces, searchPlaces, clearResults } = usePlaceSearch();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search scholars
  const scholarResults = useMemo(() => {
    if (query.length < 2 || (category !== 'all' && category !== 'scholars')) return [];
    
    const normalizedQuery = normalizeText(query);
    
    return scholars.filter(scholar => {
      const variants = nameVariants.get(scholar.id) || [];
      return variants.some(v => normalizeText(v).includes(normalizedQuery)) ||
        normalizeText(scholar.name).includes(normalizedQuery) ||
        (scholar.hebrew_name && scholar.hebrew_name.includes(query));
    }).slice(0, category === 'scholars' ? 15 : 5);
  }, [query, scholars, nameVariants, category]);

  // Search works
  const workResults = useMemo(() => {
    if (query.length < 2 || (category !== 'all' && category !== 'works')) return [];
    
    const normalizedQuery = normalizeText(query);
    
    return works.filter(work => {
      const titleMatch = normalizeText(work.title).includes(normalizedQuery);
      const hebrewMatch = work.hebrew_title && work.hebrew_title.includes(query);
      const authorMatch = work.author_name && normalizeText(work.author_name).includes(normalizedQuery);
      return titleMatch || hebrewMatch || authorMatch;
    }).slice(0, category === 'works' ? 15 : 5);
  }, [query, works, category]);

  // Debounced place search
  useEffect(() => {
    if (category !== 'all' && category !== 'places') {
      clearResults();
      return;
    }
    const timer = setTimeout(() => {
      searchPlaces(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchPlaces, category, clearResults]);

  const limitedPlaceResults = useMemo(() => {
    return placeResults.slice(0, category === 'places' ? 15 : 5);
  }, [placeResults, category]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScholarSelect = (scholar: DbScholar) => {
    onScholarSelect(scholar);
    setQuery('');
    setIsOpen(false);
    clearResults();
  };

  const handleWorkSelect = (work: WorkWithLocation) => {
    onWorkSelect(work);
    setQuery('');
    setIsOpen(false);
    clearResults();
  };

  const handlePlaceSelect = (result: typeof placeResults[0]) => {
    onPlaceSelect(result.latitude, result.longitude, result.name_english);
    setQuery('');
    setIsOpen(false);
    clearResults();
  };

  const handleClear = () => {
    setQuery('');
    clearResults();
    inputRef.current?.focus();
  };

  const hasResults = scholarResults.length > 0 || workResults.length > 0 || limitedPlaceResults.length > 0;
  const totalResults = scholarResults.length + workResults.length + limitedPlaceResults.length;

  const categoryLabels: Record<SearchCategory, { label: string; icon: React.ReactNode }> = {
    all: { label: 'All', icon: <Search className="w-3.5 h-3.5" /> },
    scholars: { label: 'Scholars', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    works: { label: 'Works', icon: <BookOpen className="w-3.5 h-3.5" /> },
    places: { label: 'Places', icon: <MapPin className="w-3.5 h-3.5" /> },
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex">
        {/* Category Selector */}
        <button
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          className="flex items-center gap-1.5 px-3 py-2 bg-sidebar/95 backdrop-blur-md border border-r-0 border-white/20 rounded-l-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          {categoryLabels[category].icon}
          <span className="hidden sm:inline">{categoryLabels[category].label}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={`Search ${category === 'all' ? 'scholars, works, places...' : categoryLabels[category].label.toLowerCase()}...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-8 bg-sidebar/95 backdrop-blur-md border-white/20 text-foreground placeholder:text-white/40 w-64 rounded-l-none"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5 text-white/40" />
            </button>
          )}
        </div>
      </div>

      {/* Category Dropdown */}
      {showCategoryDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-sidebar/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[1200] overflow-hidden">
          {(Object.entries(categoryLabels) as [SearchCategory, { label: string; icon: React.ReactNode }][]).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => {
                setCategory(key);
                setShowCategoryDropdown(false);
                inputRef.current?.focus();
              }}
              className={cn(
                "w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/10 transition-colors text-left text-sm",
                category === key ? "text-accent" : "text-white/70"
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[1100] max-h-[400px] overflow-hidden">
          {!hasResults && !isSearchingPlaces ? (
            <div className="p-4 text-center text-white/50 text-sm">
              No results found
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[400px]">
              {/* Scholars Section */}
              {scholarResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-white/5 border-b border-white/10 sticky top-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/50">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Scholars ({scholarResults.length})</span>
                    </div>
                  </div>
                  {scholarResults.map((scholar) => (
                    <button
                      key={scholar.id}
                      onClick={() => handleScholarSelect(scholar)}
                      className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                    >
                      <GraduationCap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">{scholar.name}</span>
                        <span className="text-xs text-white/50">
                          {scholar.birth_year || '?'}–{scholar.death_year || '?'}
                          {scholar.hebrew_name && <span className="ml-2 font-hebrew">{scholar.hebrew_name}</span>}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Works Section */}
              {workResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-white/5 border-b border-white/10 sticky top-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/50">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Works ({workResults.length})</span>
                    </div>
                  </div>
                  {workResults.map((work) => (
                    <button
                      key={work.id}
                      onClick={() => handleWorkSelect(work)}
                      className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                    >
                      <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">{work.title}</span>
                        <span className="text-xs text-white/50">
                          {work.author_name}
                          {work.year_written && ` • ${work.year_written}`}
                          {work.hebrew_title && <span className="ml-2 font-hebrew">{work.hebrew_title}</span>}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Places Section */}
              {limitedPlaceResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-white/5 border-b border-white/10 sticky top-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/50">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Places ({limitedPlaceResults.length})</span>
                    </div>
                  </div>
                  {limitedPlaceResults.map((result) => (
                    <button
                      key={`${result.place_id}-${result.matched_name}`}
                      onClick={() => handlePlaceSelect(result)}
                      className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                    >
                      <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium text-sm",
                            result.matched_script === 'hebrew' ? 'font-hebrew' : ''
                          )}>
                            {result.matched_name}
                          </span>
                          {result.matched_language !== 'english' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent uppercase tracking-wide">
                              {languageLabels[result.matched_language] || result.matched_language}
                            </span>
                          )}
                        </div>
                        {result.matched_name !== result.name_english && (
                          <span className="text-xs text-white/50 block">
                            {result.name_english}
                            {result.name_hebrew && <span className="ml-2 font-hebrew">{result.name_hebrew}</span>}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearchingPlaces && (
                <div className="p-3 text-center text-white/50 text-xs">
                  Searching places...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
