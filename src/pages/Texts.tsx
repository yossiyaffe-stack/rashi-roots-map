import { useState, useMemo } from 'react';
import { Search, BookOpen, Book, GitBranch, AlertCircle, Layers, Link2, FileText, Languages, Scissors, ArrowRightLeft, Scale } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TextDetailPanel } from '@/components/TextDetailPanel';
import { useWorksWithAuthors, useTextualRelationshipsWithWorks, type WorkWithAuthor } from '@/hooks/useWorks';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';

// Work type display config
const WORK_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  commentary: { label: 'Commentary', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  responsa: { label: 'Responsa', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  talmud_commentary: { label: 'Talmud Commentary', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  halakha: { label: 'Halakha', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  philosophy: { label: 'Philosophy', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  kabbalah: { label: 'Kabbalah', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  supercommentary: { label: 'Super-Commentary', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  poetry: { label: 'Poetry', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  grammar: { label: 'Grammar', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  ethics: { label: 'Ethics', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  homiletics: { label: 'Homiletics', color: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
  other: { label: 'Other', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const Texts = () => {
  const [selectedText, setSelectedText] = useState<WorkWithAuthor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const { data: works = [], isLoading: worksLoading } = useWorksWithAuthors();
  const { data: relationships = [], isLoading: relationshipsLoading } = useTextualRelationshipsWithWorks();
  
  const { 
    showTextNamesEnglish, setShowTextNamesEnglish,
    showTextNamesHebrew, setShowTextNamesHebrew,
    showScholarNamesEnglish,
    showScholarNamesHebrew,
  } = useMapControls();

  const isLoading = worksLoading || relationshipsLoading;

  // Build relationship counts per work
  const relationshipCounts = useMemo(() => {
    const counts: Record<string, { incoming: number; outgoing: number }> = {};
    relationships.forEach(rel => {
      // Outgoing: this work references another
      if (rel.work_id) {
        counts[rel.work_id] = counts[rel.work_id] || { incoming: 0, outgoing: 0 };
        counts[rel.work_id].outgoing++;
      }
      // Incoming: another work references this
      if (rel.related_work_id) {
        counts[rel.related_work_id] = counts[rel.related_work_id] || { incoming: 0, outgoing: 0 };
        counts[rel.related_work_id].incoming++;
      }
    });
    return counts;
  }, [relationships]);

  const filteredWorks = useMemo(() => {
    let result = works;
    
    // Filter by type
    if (filterType) {
      result = result.filter(w => w.work_type === filterType);
    }
    
    // Filter by search term
    if (searchTerm !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(w => 
        w.title.toLowerCase().includes(term) ||
        w.hebrew_title?.toLowerCase().includes(term) ||
        w.author_name?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [works, searchTerm, filterType]);

  // Group works by type
  const worksByType = useMemo(() => {
    const groups: Record<string, WorkWithAuthor[]> = {};
    filteredWorks.forEach(work => {
      const type = work.work_type || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(work);
    });
    // Sort each group by year
    Object.values(groups).forEach(g => g.sort((a, b) => (a.year_written || 0) - (b.year_written || 0)));
    return groups;
  }, [filteredWorks]);

  // Get unique types for filter
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    works.forEach(w => types.add(w.work_type || 'other'));
    return Array.from(types).sort();
  }, [works]);

  const renderTitle = (work: WorkWithAuthor) => {
    const parts: string[] = [];
    if (showTextNamesEnglish) parts.push(work.title);
    if (showTextNamesHebrew && work.hebrew_title) parts.push(work.hebrew_title);
    if (parts.length === 0) return work.title;
    return parts.join(' • ');
  };

  const renderAuthor = (work: WorkWithAuthor) => {
    if (!work.author_name) return 'Unknown author';
    return work.author_name;
  };

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Texts</h2>
            <span className="text-sm text-muted-foreground">
              ({filteredWorks.length} total)
            </span>
          </div>
          
          {/* Language Controls */}
          <div className="flex items-center gap-4 bg-card/50 p-3 rounded-lg border border-white/10">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Display</span>
            <div className="flex items-center gap-2">
              <Switch
                id="text-english"
                checked={showTextNamesEnglish}
                onCheckedChange={setShowTextNamesEnglish}
              />
              <Label htmlFor="text-english" className="text-xs cursor-pointer">English</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="text-hebrew"
                checked={showTextNamesHebrew}
                onCheckedChange={setShowTextNamesHebrew}
              />
              <Label htmlFor="text-hebrew" className="text-xs cursor-pointer">Hebrew</Label>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search texts by title, Hebrew name, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          
          {/* Type Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                filterType === null
                  ? "bg-accent/20 border-accent/50 text-accent"
                  : "bg-transparent border-white/10 text-white/50 hover:border-white/30"
              )}
            >
              All
            </button>
            {availableTypes.slice(0, 5).map(type => {
              const config = WORK_TYPE_CONFIG[type] || WORK_TYPE_CONFIG.other;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(filterType === type ? null : type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                    filterType === type
                      ? config.color
                      : "bg-transparent border-white/10 text-white/50 hover:border-white/30"
                  )}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Texts Grid */}
        <ScrollArea className="flex-1">
          <div className="space-y-8 pr-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : (
              Object.entries(worksByType).map(([type, typeWorks]) => {
                const config = WORK_TYPE_CONFIG[type] || WORK_TYPE_CONFIG.other;
                return (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-accent mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                      <Badge className={cn("border", config.color)}>{config.label}</Badge>
                      <span className="text-sm font-normal text-muted-foreground">
                        ({typeWorks.length})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {typeWorks.map(work => {
                        const counts = relationshipCounts[work.id] || { incoming: 0, outgoing: 0 };
                        const totalRels = counts.incoming + counts.outgoing;
                        
                        return (
                          <div
                            key={work.id}
                            onClick={() => setSelectedText(work)}
                            className={cn(
                              "group p-4 rounded-xl cursor-pointer transition-all border bg-white/5",
                              selectedText?.id === work.id
                                ? "border-accent bg-accent/10"
                                : "border-white/10 hover:border-white/20 hover:bg-white/10"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-sm group-hover:text-accent transition-colors line-clamp-2">
                                {renderTitle(work)}
                              </h4>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2">
                              {renderAuthor(work)} • {work.year_written || '?'}
                            </p>
                            
                            {work.description && (
                              <p className="text-xs text-white/60 line-clamp-2 mb-2">
                                {work.description}
                              </p>
                            )}
                            
                            {/* Relationship indicators */}
                            {totalRels > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                {counts.incoming > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    {counts.incoming} commentar{counts.incoming === 1 ? 'y' : 'ies'}
                                  </span>
                                )}
                                {counts.outgoing > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                    {counts.outgoing} reference{counts.outgoing === 1 ? '' : 's'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Text Detail Panel */}
      {selectedText && (
        <TextDetailPanel
          text={selectedText}
          relationships={relationships}
          onClose={() => setSelectedText(null)}
        />
      )}
    </div>
  );
};

export default Texts;
