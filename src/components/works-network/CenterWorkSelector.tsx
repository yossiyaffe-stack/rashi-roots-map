import { useState } from 'react';
import { Search, X, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkWithAuthor } from '@/hooks/useWorks';

interface CenterWorkSelectorProps {
  works: WorkWithAuthor[];
  selectedCenterWork: WorkWithAuthor | null;
  onSelectCenterWork: (work: WorkWithAuthor | null) => void;
}

export const CenterWorkSelector = ({ 
  works, 
  selectedCenterWork, 
  onSelectCenterWork 
}: CenterWorkSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorks = works.filter(work => 
    work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by importance (older works first as foundational texts)
  const sortedWorks = [...filteredWorks].sort((a, b) => 
    (a.year_written ?? 1500) - (b.year_written ?? 1500)
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
          selectedCenterWork 
            ? "bg-amber-500/20 border-amber-500/50 text-amber-200" 
            : "bg-card/90 border-border text-foreground hover:bg-accent/20"
        )}
      >
        <Target className="w-4 h-4" />
        {selectedCenterWork ? (
          <span className="max-w-[150px] truncate">{selectedCenterWork.title}</span>
        ) : (
          <span>Select Center</span>
        )}
        {selectedCenterWork && (
          <X 
            className="w-3 h-3 ml-1 hover:text-destructive" 
            onClick={(e) => {
              e.stopPropagation();
              onSelectCenterWork(null);
            }}
          />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50 animate-scale-in">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search works..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto p-1">
              {sortedWorks.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">No works found</p>
              ) : (
                sortedWorks.map(work => (
                  <button
                    key={work.id}
                    onClick={() => {
                      onSelectCenterWork(work);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      selectedCenterWork?.id === work.id
                        ? "bg-amber-500/20 text-amber-200"
                        : "hover:bg-accent/20"
                    )}
                  >
                    <div className="font-medium truncate">{work.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {work.author_name} {work.year_written ? `(${work.year_written})` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
