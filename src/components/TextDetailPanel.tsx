import { useState, useMemo } from 'react';
import { X, Book, GitBranch, AlertCircle, Layers, Link2, FileText, Languages, Scissors, ArrowRightLeft, Scale, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type WorkWithAuthor, type TextualRelationshipWithWorks } from '@/hooks/useWorks';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';

// 9 Relationship Types from the guide
const RELATIONSHIP_TYPES = {
  nosei_kelim: { label: 'Nosei Kelim', hebrewLabel: 'נושאי כלים', icon: Layers, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', description: 'Texts printed together' },
  hasagot: { label: 'Hasagot', hebrewLabel: 'השגות', icon: AlertCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30', description: 'Criticisms/objections' },
  commentary: { label: 'Commentary', hebrewLabel: 'פירוש', icon: Book, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', description: 'Primary interpretation' },
  super_commentary: { label: 'Super-Commentary', hebrewLabel: 'פירוש על פירוש', icon: GitBranch, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', description: 'Commentary on commentary' },
  hiddushim: { label: 'Hiddushim', hebrewLabel: 'חידושים', icon: FileText, color: 'bg-green-500/20 text-green-400 border-green-500/30', description: 'Novellae/innovations' },
  abridgement: { label: 'Abridgement', hebrewLabel: 'קיצור', icon: Scissors, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', description: 'Shortened versions' },
  translation: { label: 'Translation', hebrewLabel: 'תרגום', icon: Languages, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', description: 'Language translations' },
  reorganization: { label: 'Reorganization', hebrewLabel: 'סידור', icon: ArrowRightLeft, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', description: 'Structural rearrangements' },
  halakhic_dependency: { label: 'Halakhic Dependency', hebrewLabel: 'תלות הלכתית', icon: Scale, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', description: 'Legal source chains' },
  citation: { label: 'Citation', hebrewLabel: 'ציטוט', icon: Link2, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', description: 'Direct quotation' },
  influence: { label: 'Influence', hebrewLabel: 'השפעה', icon: GitBranch, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', description: 'Conceptual influence' },
  response: { label: 'Response', hebrewLabel: 'תגובה', icon: AlertCircle, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', description: 'Direct response' },
  transmission: { label: 'Transmission', hebrewLabel: 'מסירה', icon: ArrowRightLeft, color: 'bg-lime-500/20 text-lime-400 border-lime-500/30', description: 'Text transmission' },
};

interface TextDetailPanelProps {
  text: WorkWithAuthor;
  relationships: TextualRelationshipWithWorks[];
  onClose: () => void;
}

export function TextDetailPanel({ text, relationships, onClose }: TextDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'commentaries' | 'references'>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const { 
    showTextNamesEnglish,
    showTextNamesHebrew,
    showScholarNamesEnglish,
    showScholarNamesHebrew,
  } = useMapControls();

  // Get relationships for this text
  const textRelationships = useMemo(() => {
    // Incoming: relationships where this text is the target (related_work_id)
    const incoming = relationships.filter(r => r.related_work_id === text.id);
    // Outgoing: relationships where this text is the source (work_id)
    const outgoing = relationships.filter(r => r.work_id === text.id);
    
    return { incoming, outgoing };
  }, [relationships, text.id]);

  // Group relationships by type
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, { incoming: TextualRelationshipWithWorks[]; outgoing: TextualRelationshipWithWorks[] }> = {};
    
    textRelationships.incoming.forEach(rel => {
      const type = rel.relationship_type || 'other';
      if (!groups[type]) groups[type] = { incoming: [], outgoing: [] };
      groups[type].incoming.push(rel);
    });
    
    textRelationships.outgoing.forEach(rel => {
      const type = rel.relationship_type || 'other';
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
        
        {/* External links */}
        {text.manuscript_url && (
          <a
            href={text.manuscript_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-accent hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View Manuscript
          </a>
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
