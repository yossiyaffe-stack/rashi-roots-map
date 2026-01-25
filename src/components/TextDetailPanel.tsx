import { useState, useMemo } from 'react';
import { X, Book, GitBranch, AlertCircle, Layers, Link2, FileText, Languages, Scissors, ArrowRightLeft, Scale, ExternalLink, ChevronDown, ChevronRight, BookOpen, Library, FileImage, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type WorkWithAuthor, type TextualRelationshipWithWorks, useWorkLocations } from '@/hooks/useWorks';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';

// Helper functions for external links
function getHebrewBooksCover(url: string): string | null {
  const match = url.match(/hebrewbooks\.org\/(\d+)/);
  if (match) {
    return `https://hebrewbooks.org/pagefeed/${match[1]}.gif`;
  }
  return null;
}

function getLinkType(url: string): 'sefaria' | 'hebrewbooks' | 'manuscript' | 'other' {
  if (url.includes('sefaria.org')) return 'sefaria';
  if (url.includes('hebrewbooks.org')) return 'hebrewbooks';
  if (url.includes('nli.org') || url.includes('bodleian') || url.includes('bl.uk') || url.includes('bnf') || url.includes('bsb') || url.includes('vatican')) return 'manuscript';
  return 'other';
}

function getRepositoryName(url: string): string {
  const repos = [
    { pattern: /bodleian|oxford/i, name: 'Bodleian Library' },
    { pattern: /bsb|bayerische/i, name: 'Bayerische Staatsbibliothek' },
    { pattern: /bnf|gallica/i, name: 'BnF' },
    { pattern: /nli\.org|ktiv/i, name: 'NLI' },
    { pattern: /vaticana|vatican/i, name: 'Vatican Library' },
    { pattern: /bl\.uk|british/i, name: 'British Library' },
  ];
  for (const repo of repos) {
    if (repo.pattern.test(url)) return repo.name;
  }
  return 'Digital Repository';
}

// 9 Relationship Types from the guide (with database type mappings)
const RELATIONSHIP_TYPES: Record<string, { 
  label: string; 
  hebrewLabel: string; 
  icon: typeof Layers; 
  color: string; 
  description: string;
  dbTypes?: string[]; // Database types that map to this category
}> = {
  nosei_kelim: { 
    label: 'Nosei Kelim', 
    hebrewLabel: 'נושאי כלים', 
    icon: Layers, 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
    description: 'Texts printed together (e.g., Rashi + Tosafot with Talmud)',
    dbTypes: ['nosei_kelim', 'compilation', 'printed_together']
  },
  hasagot: { 
    label: 'Hasagot', 
    hebrewLabel: 'השגות', 
    icon: AlertCircle, 
    color: 'bg-red-500/20 text-red-400 border-red-500/30', 
    description: 'Criticisms/objections (e.g., Ravad on Maimonides)',
    dbTypes: ['hasagot', 'opposes', 'criticism', 'objection']
  },
  commentary: { 
    label: 'Commentary', 
    hebrewLabel: 'פירוש', 
    icon: Book, 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    description: 'Primary interpretation (e.g., Rashi on Torah)',
    dbTypes: ['commentary', 'interpretation', 'explanation']
  },
  supercommentary: { 
    label: 'Super-Commentary', 
    hebrewLabel: 'פירוש על פירוש', 
    icon: GitBranch, 
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', 
    description: 'Commentary on commentary (e.g., Mizrachi on Rashi)',
    dbTypes: ['supercommentary', 'super_commentary', 'super-supercommentary']
  },
  hiddushim: { 
    label: 'Hiddushim', 
    hebrewLabel: 'חידושים', 
    icon: FileText, 
    color: 'bg-green-500/20 text-green-400 border-green-500/30', 
    description: 'Novellae/innovations (e.g., HaRan on Talmud)',
    dbTypes: ['hiddushim', 'novellae', 'innovation']
  },
  abridgement: { 
    label: 'Abridgement', 
    hebrewLabel: 'קיצור', 
    icon: Scissors, 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
    description: 'Shortened versions (e.g., Kitzur Shulchan Aruch)',
    dbTypes: ['abridgement', 'shortened', 'summary']
  },
  translation: { 
    label: 'Translation', 
    hebrewLabel: 'תרגום', 
    icon: Languages, 
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', 
    description: 'Language translations (e.g., Targum Onkelos)',
    dbTypes: ['translation', 'translated']
  },
  reorganization: { 
    label: 'Reorganization', 
    hebrewLabel: 'סידור מחדש', 
    icon: ArrowRightLeft, 
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', 
    description: 'Topical rearrangement (e.g., Ein Mishpat)',
    dbTypes: ['reorganization', 'rearrangement', 'topical']
  },
  halakhic_dependency: { 
    label: 'Halakhic Dependency', 
    hebrewLabel: 'תלות הלכתית', 
    icon: Scale, 
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
    description: 'Legal chains (e.g., Talmud → Shulchan Aruch)',
    dbTypes: ['halakhic_dependency', 'legal', 'halakhic']
  },
  // Additional types for existing data
  citation: { 
    label: 'Citation', 
    hebrewLabel: 'ציטוט', 
    icon: Link2, 
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', 
    description: 'Direct quotation or reference',
    dbTypes: ['citation', 'references', 'quotes']
  },
  influence: { 
    label: 'Influence', 
    hebrewLabel: 'השפעה', 
    icon: GitBranch, 
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', 
    description: 'Conceptual influence',
    dbTypes: ['influence', 'engagement', 'inspired_by']
  },
  response: { 
    label: 'Response', 
    hebrewLabel: 'תגובה', 
    icon: AlertCircle, 
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', 
    description: 'Direct response or reply',
    dbTypes: ['response', 'reply']
  },
};

// Map database relationship_type to our canonical types
const normalizeRelationshipType = (dbType: string): string => {
  const normalizedType = dbType.toLowerCase().replace(/[-_\s]/g, '_');
  
  for (const [canonicalType, config] of Object.entries(RELATIONSHIP_TYPES)) {
    if (config.dbTypes?.some(t => normalizedType.includes(t.replace(/[-_\s]/g, '_')))) {
      return canonicalType;
    }
  }
  
  // Check if the type itself is a canonical type
  if (RELATIONSHIP_TYPES[normalizedType]) {
    return normalizedType;
  }
  
  return 'other';
};

interface TextDetailPanelProps {
  text: WorkWithAuthor & { manuscript_url?: string | null };
  relationships: TextualRelationshipWithWorks[];
  onClose: () => void;
}

export function TextDetailPanel({ text, relationships, onClose }: TextDetailPanelProps) {
  // Fetch manuscript locations for this work
  const { data: workLocations = [] } = useWorkLocations(text.id);
  const [activeTab, setActiveTab] = useState<'all' | 'commentaries' | 'references'>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const { 
    showTextNamesEnglish,
    showTextNamesHebrew,
    showScholarNamesEnglish,
    showScholarNamesHebrew,
    showPlaceNamesEnglish,
    showPlaceNamesHebrew,
  } = useMapControls();

  // Get relationships for this text (filtering out anonymous manuscript placeholders)
  const textRelationships = useMemo(() => {
    // Filter to exclude anonymous works (which are manuscript placeholders, not real literary connections)
    const isRealWork = (work: { author_name?: string | null } | undefined | null) => {
      if (!work?.author_name) return true;
      return !work.author_name.toLowerCase().includes('anonymous');
    };
    
    // Incoming: relationships where this text is the target (related_work_id)
    const incoming = relationships
      .filter(r => r.related_work_id === text.id)
      .filter(r => isRealWork(r.from_work));
    // Outgoing: relationships where this text is the source (work_id)
    const outgoing = relationships
      .filter(r => r.work_id === text.id)
      .filter(r => isRealWork(r.to_work));
    
    return { incoming, outgoing };
  }, [relationships, text.id]);

  // Group relationships by normalized type
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, { incoming: TextualRelationshipWithWorks[]; outgoing: TextualRelationshipWithWorks[] }> = {};
    
    textRelationships.incoming.forEach(rel => {
      const type = normalizeRelationshipType(rel.relationship_type || 'other');
      if (!groups[type]) groups[type] = { incoming: [], outgoing: [] };
      groups[type].incoming.push(rel);
    });
    
    textRelationships.outgoing.forEach(rel => {
      const type = normalizeRelationshipType(rel.relationship_type || 'other');
      if (!groups[type]) groups[type] = { incoming: [], outgoing: [] };
      groups[type].outgoing.push(rel);
    });
    
    return groups;
  }, [textRelationships]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTitle = (work: { title: string; hebrew_title?: string | null }) => {
    const parts: string[] = [];
    if (showTextNamesEnglish) parts.push(work.title);
    if (showTextNamesHebrew && work.hebrew_title) parts.push(work.hebrew_title);
    if (parts.length === 0) return work.title;
    return parts.join(' • ');
  };

  const tabs = [
    { key: 'all', label: 'All', count: textRelationships.incoming.length + textRelationships.outgoing.length },
    { key: 'commentaries', label: 'Commentaries On', count: textRelationships.incoming.length },
    { key: 'references', label: 'References', count: textRelationships.outgoing.length },
  ] as const;

  const displayRelationships = activeTab === 'all' 
    ? [...textRelationships.incoming, ...textRelationships.outgoing]
    : activeTab === 'commentaries' 
      ? textRelationships.incoming 
      : textRelationships.outgoing;

  return (
    <div className="w-[400px] h-full border-l border-white/10 bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-bold mb-1">
              {showTextNamesEnglish && text.title}
              {showTextNamesEnglish && showTextNamesHebrew && text.hebrew_title && ' • '}
              {showTextNamesHebrew && text.hebrew_title && (
                <span className="font-hebrew">{text.hebrew_title}</span>
              )}
              {!showTextNamesEnglish && !showTextNamesHebrew && text.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {text.author_name || 'Unknown author'} • {text.year_written || '?'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {text.description && (
          <p className="text-sm text-white/70 mt-3">{text.description}</p>
        )}
        
        {/* External Links Section */}
        {(text.manuscript_url || workLocations.length > 0) && (
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">External Resources</p>
            
            {/* Digital Text Links (Sefaria/HebrewBooks) */}
            {text.manuscript_url && (
              <a
                href={text.manuscript_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-all group",
                  getLinkType(text.manuscript_url) === 'sefaria' 
                    ? "bg-green-500/10 border-green-500/20 hover:border-green-500/40" 
                    : getLinkType(text.manuscript_url) === 'hebrewbooks'
                      ? "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40"
                      : "bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40"
                )}
              >
                {getLinkType(text.manuscript_url) === 'sefaria' ? (
                  <BookOpen className="w-4 h-4 text-green-400 shrink-0" />
                ) : getLinkType(text.manuscript_url) === 'hebrewbooks' ? (
                  <Library className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <FileImage className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-xs font-medium",
                    getLinkType(text.manuscript_url) === 'sefaria' ? "text-green-400" :
                    getLinkType(text.manuscript_url) === 'hebrewbooks' ? "text-amber-400" : "text-cyan-400"
                  )}>
                    {getLinkType(text.manuscript_url) === 'sefaria' ? 'Sefaria' :
                     getLinkType(text.manuscript_url) === 'hebrewbooks' ? 'HebrewBooks.org' :
                     getRepositoryName(text.manuscript_url)}
                  </span>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {getLinkType(text.manuscript_url) === 'sefaria' ? 'Digital edition' : 
                     getLinkType(text.manuscript_url) === 'hebrewbooks' ? 'Scanned text' : 'Digital manuscript'}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </a>
            )}
            
            {/* Manuscript Summary - clickable to show on Work Journey map */}
            {workLocations.filter(loc => loc.location_type === 'manuscript_copy').length > 0 && (
              <a
                href={`/work-journey?workId=${text.id}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group"
              >
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-lg font-bold text-purple-400">
                    {workLocations.filter(loc => loc.location_type === 'manuscript_copy').length}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    surviving manuscript{workLocations.filter(loc => loc.location_type === 'manuscript_copy').length !== 1 ? 's' : ''} worldwide
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-400 transition-colors shrink-0" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
              activeTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {displayRelationships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No relationships found</p>
            </div>
          ) : (
            Object.entries(groupedRelationships).map(([type, { incoming, outgoing }]) => {
              const typeConfig = RELATIONSHIP_TYPES[type as keyof typeof RELATIONSHIP_TYPES] || {
                label: type,
                hebrewLabel: '',
                icon: Link2,
                color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                description: '',
              };
              const Icon = typeConfig.icon;
              
              const relevantRels = activeTab === 'all' 
                ? [...incoming, ...outgoing]
                : activeTab === 'commentaries' 
                  ? incoming 
                  : outgoing;
              
              if (relevantRels.length === 0) return null;
              
              const sectionKey = `${type}-${activeTab}`;
              const isExpanded = expandedSections[sectionKey] !== false; // Default open
              
              return (
                <Collapsible key={sectionKey} open={isExpanded} onOpenChange={() => toggleSection(sectionKey)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                      typeConfig.color
                    )}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-medium text-sm flex-1 text-left">
                        {typeConfig.label}
                        {showTextNamesHebrew && typeConfig.hebrewLabel && (
                          <span className="ml-2 font-hebrew opacity-70">{typeConfig.hebrewLabel}</span>
                        )}
                      </span>
                      <span className="text-xs opacity-60 mr-2">{relevantRels.length}</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 mt-2 ml-2 pl-4 border-l border-white/10">
                      {relevantRels.map(rel => {
                        const isIncoming = rel.related_work_id === text.id;
                        const relatedWork = isIncoming ? rel.from_work : rel.to_work;
                        
                        if (!relatedWork) return null;
                        
                        return (
                          <div
                            key={rel.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">
                                  {renderTitle(relatedWork)}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {relatedWork.author_name || 'Unknown'} • {relatedWork.year_written || '?'}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                                {isIncoming ? 'on this' : 'referenced'}
                              </Badge>
                            </div>
                            
                            {rel.notes && (
                              <p className="text-xs text-white/60 mt-2">{rel.notes}</p>
                            )}
                            
                            {rel.section_reference && (
                              <p className="text-xs text-accent/80 mt-1">
                                Section: {rel.section_reference}
                              </p>
                            )}
                            
                            {rel.certainty && rel.certainty !== 'certain' && (
                              <Badge variant="outline" className="mt-2 text-[9px] capitalize">
                                {rel.certainty}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer with relationship type legend */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Relationship Types</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(RELATIONSHIP_TYPES).slice(0, 6).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={key}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border",
                  config.color
                )}
                title={config.description}
              >
                <Icon className="w-2.5 h-2.5" />
                {config.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
