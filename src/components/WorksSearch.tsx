import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useWorksWithLocations, type WorkWithLocation } from '@/hooks/useWorks';
import { cn } from '@/lib/utils';

interface WorksSearchProps {
  onWorkSelect: (work: WorkWithLocation) => void;
}

// Normalize search query for matching
const normalizeText = (text: string) =>
  text.toLowerCase()
    .replace(/['"״׳]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function WorksSearch({ onWorkSelect }: WorksSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: works = [] } = useWorksWithLocations();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search results
  const results = useMemo(() => {
    if (query.length < 2) return [];
    
    const normalizedQuery = normalizeText(query);
    
    return works.filter(work => {
      const titleMatch = normalizeText(work.title).includes(normalizedQuery);
      const hebrewMatch = work.hebrew_title && work.hebrew_title.includes(query);
      const authorMatch = work.author_name && normalizeText(work.author_name).includes(normalizedQuery);
      return titleMatch || hebrewMatch || authorMatch;
    }).slice(0, 10); // Limit to 10 results
  }, [query, works]);

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

  const handleSelect = (work: WorkWithLocation) => {
    onWorkSelect(work);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search works..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-8 bg-sidebar/95 backdrop-blur-md border-white/20 text-foreground placeholder:text-white/40 w-56"
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
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-sidebar/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[1100] max-h-80 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-4 text-center text-white/50 text-sm">
              No works found
            </div>
          ) : (
            <div className="overflow-y-auto max-h-80">
              {results.map((work) => (
                <button
                  key={work.id}
                  onClick={() => handleSelect(work)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <BookOpen className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {work.title}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mt-0.5 flex items-center gap-1.5">
                      {work.author_name && (
                        <span>{work.author_name}</span>
                      )}
                      {work.year_written && (
                        <>
                          <span className="text-white/30">•</span>
                          <span>{work.year_written}</span>
                        </>
                      )}
                      {work.hebrew_title && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="font-hebrew">{work.hebrew_title}</span>
                        </>
                      )}
                    </div>
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
