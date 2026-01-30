import { useState } from 'react';
import { Search, Users, LayoutGrid, Clock, TrendingUp, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { InfluenceScoreBadge } from '@/components/InfluenceScoreBadge';
import { ImpressiveStatHighlight } from '@/components/ScoreStatsBadge';
import { DomainSelector } from '@/components/DomainSelector';
import { type DbScholar } from '@/hooks/useScholars';
import { useScholarNameVariants } from '@/hooks/useScholarNameVariants';
import { useFilteredScholars, type ScholarSortMode } from '@/hooks/useFilteredScholars';
import { useScholars } from '@/hooks/useScholars';
import { useMapControls } from '@/contexts/MapControlsContext';
import { useFilters } from '@/contexts/FilterContext';
import { cn } from '@/lib/utils';
import { type DomainId } from '@/lib/domains';
import { useSefariaScholar, getBriefBio } from '@/hooks/useSefariaScholar';

const SORT_OPTIONS: { mode: ScholarSortMode; icon: typeof Clock; label: string }[] = [
  { mode: 'period', icon: Clock, label: 'Period' },
  { mode: 'alphabetical', icon: LayoutGrid, label: 'A-Z' },
  { mode: 'influence', icon: TrendingUp, label: 'Influence' },
];

const Scholars = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainId>('all');
  const [sortMode, setSortMode] = useState<ScholarSortMode>('period');

  const { data: allScholars = [] } = useScholars();
  const { 
    showScholarNamesEnglish, setShowScholarNamesEnglish,
    showScholarNamesHebrew, setShowScholarNamesHebrew,
  } = useMapControls();
  
  const { mapViewportBounds, timelineRange } = useFilters();
  
  // Build search index from scholar names
  const scholarNameMap = useScholarNameVariants(allScholars);
  
  // Get filtered and sorted scholars
  const { 
    scholars: filteredScholars, 
    scholarsByPeriod, 
    isLoading,
    totalCount,
    filteredCount,
    hasActiveFilters,
  } = useFilteredScholars(searchTerm, sortMode, selectedDomain, scholarNameMap);

  const hasMapSync = Boolean(mapViewportBounds || timelineRange);

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
              ({filteredCount}{hasActiveFilters && ` of ${totalCount}`})
            </span>
            {hasMapSync && (
              <Badge variant="outline" className="gap-1 text-xs border-accent/50 text-accent">
                <MapPin className="w-3 h-3" />
                Map Synced
              </Badge>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-4">
            <DomainSelector
              value={selectedDomain}
              onChange={setSelectedDomain}
            />
            
            {/* Sort Controls */}
            <div className="flex items-center gap-1 bg-card/50 p-1 rounded-lg border border-white/10">
              {SORT_OPTIONS.map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 gap-1.5",
                    sortMode === mode && "bg-accent/20 text-accent"
                  )}
                  onClick={() => setSortMode(mode)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
            
            {/* Language Controls */}
            <div className="flex items-center gap-4 bg-card/50 p-3 rounded-lg border border-white/10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Display</span>
              <div className="flex items-center gap-2">
                <Switch
                  id="scholar-english"
                  checked={showScholarNamesEnglish}
                  onCheckedChange={setShowScholarNamesEnglish}
                />
                <Label htmlFor="scholar-english" className="text-xs cursor-pointer">English</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="scholar-hebrew"
                  checked={showScholarNamesHebrew}
                  onCheckedChange={setShowScholarNamesHebrew}
                />
                <Label htmlFor="scholar-hebrew" className="text-xs cursor-pointer">Hebrew</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search: Rashi, רש״י, Maimonides, רמב״ם..."
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
            ) : sortMode === 'period' ? (
              // Period-grouped view
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
                      <ScholarCard
                        key={scholar.id}
                        scholar={scholar}
                        scoreData={scholar.influenceScore}
                        isSelected={selectedScholar?.id === scholar.id}
                        onClick={() => setSelectedScholar(scholar)}
                        showEnglish={showScholarNamesEnglish}
                        showHebrew={showScholarNamesHebrew}
                        domain={selectedDomain}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Flat list view (alphabetical or influence sorted)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredScholars.map(scholar => (
                  <ScholarCard
                    key={scholar.id}
                    scholar={scholar}
                    scoreData={scholar.influenceScore}
                    isSelected={selectedScholar?.id === scholar.id}
                    onClick={() => setSelectedScholar(scholar)}
                    showEnglish={showScholarNamesEnglish}
                    showHebrew={showScholarNamesHebrew}
                    domain={selectedDomain}
                  />
                ))}
              </div>
            )}
            
            {filteredCount === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No scholars found matching your criteria.</p>
                {hasMapSync && (
                  <p className="text-sm mt-2">
                    Try adjusting the map view or timeline to see more scholars.
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Scholar Detail Panel */}
      {selectedScholar && (
        <ScholarDetailPanel
          scholar={selectedScholar}
          onClose={() => setSelectedScholar(null)}
          domain={selectedDomain}
        />
      )}
    </div>
  );
};

// Scholar Card Component (extracted for cleaner code)
interface ScholarCardProps {
  scholar: DbScholar & { influenceScore?: any };
  scoreData?: any;
  isSelected: boolean;
  onClick: () => void;
  showEnglish: boolean;
  showHebrew: boolean;
  domain: DomainId;
}

function ScholarCard({ 
  scholar, 
  scoreData, 
  isSelected, 
  onClick, 
  showEnglish, 
  showHebrew,
  domain 
}: ScholarCardProps) {
  const { data: sefariaData } = useSefariaScholar(scholar.name, scholar.slug);
  
  // Use Sefaria bio if available, otherwise fall back to local bio
  const briefBio = getBriefBio(sefariaData?.description) || scholar.bio;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group p-4 rounded-xl cursor-pointer transition-all border bg-white/5",
        isSelected
          ? "border-accent bg-accent/10"
          : "border-white/10 hover:border-white/20 hover:bg-white/10"
      )}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showEnglish && (
            <h4 className="font-semibold text-sm group-hover:text-accent transition-colors truncate">
              {scholar.name}
            </h4>
          )}
          {!showEnglish && !showHebrew && (
            <h4 className="font-semibold text-sm group-hover:text-accent transition-colors truncate">
              {scholar.name}
            </h4>
          )}
          {scoreData && (
            <InfluenceScoreBadge 
              scoreData={scoreData} 
              size="sm" 
              domain={domain}
            />
          )}
        </div>
        {showHebrew && scholar.hebrew_name && (
          <span className={cn(
            "text-sm font-hebrew text-accent/80 shrink-0",
            showEnglish && "ml-2"
          )}>
            {scholar.hebrew_name}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {scholar.birth_place || 'Unknown'} • {scholar.birth_year || '?'}–{scholar.death_year || '?'}
      </p>
      {briefBio && (
        <p className="text-xs text-white/60 line-clamp-2">
          {briefBio}
        </p>
      )}
      {/* Impressive stat highlight */}
      {scoreData && (
        <div className="mt-2">
          <ImpressiveStatHighlight
            manuscripts={scoreData.manuscripts_cumulative}
            editions={scoreData.print_editions}
            regions={scoreData.geographic_regions}
          />
        </div>
      )}
    </div>
  );
}

export default Scholars;
