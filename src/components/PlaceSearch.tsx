import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Languages } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { cn } from '@/lib/utils';

interface PlaceSearchProps {
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

export function PlaceSearch({ onPlaceSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, isSearching, searchPlaces, clearResults } = usePlaceSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchPlaces]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: typeof results[0]) => {
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

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search places (Hebrew, Yiddish, Latin...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-8 bg-sidebar/95 backdrop-blur-md border-white/20 text-foreground placeholder:text-white/40 w-64"
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

      {/* Dropdown Results */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[1100] max-h-80 overflow-hidden">
          {isSearching ? (
            <div className="p-4 text-center text-white/50 text-sm">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-white/50 text-sm">
              No places found
            </div>
          ) : (
            <div className="overflow-y-auto max-h-80">
              {results.map((result) => (
                <button
                  key={`${result.place_id}-${result.matched_name}`}
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
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
                      <div className="text-xs text-white/50 mt-0.5 flex items-center gap-1.5">
                        <span>{result.name_english}</span>
                        {result.name_hebrew && (
                          <>
                            <span className="text-white/30">•</span>
                            <span className="font-hebrew">{result.name_hebrew}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
