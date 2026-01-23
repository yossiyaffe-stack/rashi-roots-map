import { X, BookOpen, MapPin, Calendar, Users, ExternalLink, GitBranch, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useScholarWithWorks, type DbScholar } from '@/hooks/useScholars';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { WorkWithTextualRelationships } from '@/hooks/useScholars';
import { ScholarJourney } from '@/components/ScholarJourney';
import { ScholarExternalData } from '@/components/ScholarExternalData';

interface WorkCardProps {
  work: WorkWithTextualRelationships;
  supercommentaries: NonNullable<WorkWithTextualRelationships['supercommentaries']>;
  hasSupercommentaries: boolean;
}

function WorkCard({ work, supercommentaries, hasSupercommentaries }: WorkCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
      <div className="p-3">
        <div className="flex justify-between items-start">
          <span className="font-medium text-foreground">{work.title}</span>
          {work.hebrew_title && (
            <span className="font-hebrew text-xs text-accent">{work.hebrew_title}</span>
          )}
        </div>
        {work.description && (
          <p className="text-xs text-muted-foreground mt-1">{work.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {work.work_type}
          </Badge>
          {work.manuscript_id && (
            <Badge variant="secondary" className="text-xs bg-accent/10 text-accent">
              {work.manuscript_id}
            </Badge>
          )}
        </div>
        {work.manuscript_url && (
          <a 
            href={work.manuscript_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 mt-2 text-xs text-accent hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View Manuscript / Digital Access
          </a>
        )}
      </div>
      
      {/* Supercommentaries Section */}
      {hasSupercommentaries && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full px-3 py-2 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400 hover:bg-emerald-500/15 transition-colors">
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <GitBranch className="w-3 h-3" />
            <span className="font-medium">Supercommentaries ({supercommentaries.length})</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 py-2 bg-emerald-500/5 space-y-2">
              {supercommentaries.map(sc => (
                <div key={sc.id} className="pl-4 border-l-2 border-emerald-500/30">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-foreground">{sc.title}</span>
                    {sc.hebrew_title && (
                      <span className="font-hebrew text-[10px] text-emerald-400">{sc.hebrew_title}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">by {sc.author_name}</p>
                  {sc.notes && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{sc.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

interface ScholarDetailPanelProps {
  scholar: DbScholar;
  onClose: () => void;
  onFlyToLocation?: (lat: number, lng: number) => void;
}

export function ScholarDetailPanel({ scholar, onClose, onFlyToLocation }: ScholarDetailPanelProps) {
  const { data: scholarDetails, isLoading } = useScholarWithWorks(scholar.id);

  const works = scholarDetails?.works || [];
  const relationships = scholarDetails?.relationships || [];

  return (
    <div className="absolute bottom-6 left-6 right-6 max-h-[45vh] md:max-h-none md:left-auto md:right-6 md:top-6 md:bottom-6 md:w-[400px] z-[1000]">
      <div className="bg-sidebar/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-accent/20 to-transparent border-b border-white/10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{scholar.name}</h2>
              {scholar.hebrew_name && (
                <p className="font-hebrew text-accent text-lg mt-1">{scholar.hebrew_name}</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {scholar.period && (
              <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                {scholar.period}
              </Badge>
            )}
            {scholar.relationship_type && (
              <Badge variant="outline" className="border-white/20 text-muted-foreground">
                {scholar.relationship_type.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {/* Dates & Location */}
          <div className="space-y-3 mb-6">
            {(scholar.birth_year || scholar.death_year) && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">
                  {scholar.birth_year || '?'} – {scholar.death_year || '?'}
                </span>
              </div>
            )}
            {scholar.birth_place && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">{scholar.birth_place}</span>
              </div>
            )}
          </div>

          {/* Biography */}
          {scholar.bio && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
                Biography
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{scholar.bio}</p>
            </div>
          )}

          {/* Life Journey */}
          <ScholarJourney 
            scholarId={scholar.id} 
            scholarName={scholar.name}
            onLocationClick={onFlyToLocation}
          />

          {/* Works with Supercommentaries */}
          {works.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Works ({works.length})
              </h3>
              <div className="space-y-3">
                {works.map(work => {
                  const supercommentaries = work.supercommentaries || [];
                  const hasSupercommentaries = supercommentaries.length > 0;
                  
                  return (
                    <WorkCard 
                      key={work.id} 
                      work={work} 
                      supercommentaries={supercommentaries}
                      hasSupercommentaries={hasSupercommentaries}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Relationships */}
          {relationships.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Connections ({relationships.length})
              </h3>
              <div className="space-y-2">
                {relationships.map(rel => (
                  <div 
                    key={rel.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                  >
                    <Badge className="mb-1" variant="outline">{rel.type}</Badge>
                    {rel.description && (
                      <p className="text-xs text-muted-foreground mt-1">{rel.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Data: Sefaria & NLI */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
              External Resources
            </h3>
            <ScholarExternalData 
              scholarName={scholar.name} 
              hebrewName={scholar.hebrew_name}
            />
          </div>

          {/* Notes */}
          {scholar.notes && (
            <div className="mt-6 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs text-accent">{scholar.notes}</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
