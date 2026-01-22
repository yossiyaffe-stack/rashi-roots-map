import { useState, useMemo } from 'react';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { useScholars, type DbScholar } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

const Scholars = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: scholars = [], isLoading } = useScholars();

  const filteredScholars = useMemo(() => {
    return scholars.filter(s => {
      const matchesSearch = searchTerm === '' ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.hebrew_name && s.hebrew_name.includes(searchTerm));
      return matchesSearch;
    });
  }, [scholars, searchTerm]);

  // Group scholars by period
  const scholarsByPeriod = useMemo(() => {
    const groups: Record<string, DbScholar[]> = {};
    filteredScholars.forEach(scholar => {
      const period = scholar.period || 'Unknown Period';
      if (!groups[period]) groups[period] = [];
      groups[period].push(scholar);
    });
    return groups;
  }, [filteredScholars]);

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Scholars</h2>
            <span className="text-sm text-muted-foreground">
              ({filteredScholars.length} total)
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or Hebrew name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>

        {/* Scholar Grid */}
        <ScrollArea className="flex-1">
          <div className="space-y-8 pr-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : (
              Object.entries(scholarsByPeriod).map(([period, periodScholars]) => (
                <div key={period}>
                  <h3 className="text-lg font-semibold text-accent mb-4 border-b border-white/10 pb-2">
                    {period}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({periodScholars.length})
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {periodScholars.map(scholar => (
                      <div
                        key={scholar.id}
                        onClick={() => setSelectedScholar(scholar)}
                        className={cn(
                          "group p-4 rounded-xl cursor-pointer transition-all border bg-white/5",
                          selectedScholar?.id === scholar.id
                            ? "border-accent bg-accent/10"
                            : "border-white/10 hover:border-white/20 hover:bg-white/10"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm group-hover:text-accent transition-colors">
                            {scholar.name}
                          </h4>
                          {scholar.hebrew_name && (
                            <span className="text-sm font-hebrew text-accent/80 shrink-0 ml-2">
                              {scholar.hebrew_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {scholar.birth_place || 'Unknown'} • {scholar.birth_year || '?'}–{scholar.death_year || '?'}
                        </p>
                        {scholar.bio && (
                          <p className="text-xs text-white/60 line-clamp-2">
                            {scholar.bio}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Scholar Detail Panel */}
      {selectedScholar && (
        <ScholarDetailPanel
          scholar={selectedScholar}
          onClose={() => setSelectedScholar(null)}
        />
      )}
    </div>
  );
};

export default Scholars;
