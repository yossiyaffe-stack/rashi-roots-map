import { X, ExternalLink, BookOpen, Library, FileImage, Play, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { type WorkWithAuthor, type TextualRelationshipWithWorks, useWorkLocations } from '@/hooks/useWorks';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Helper functions for external links
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

interface TextDetailPanelProps {
  text: WorkWithAuthor & { manuscript_url?: string | null };
  relationships: TextualRelationshipWithWorks[];
  onClose: () => void;
}

export function TextDetailPanel({ text, relationships, onClose }: TextDetailPanelProps) {
  const navigate = useNavigate();
  // Fetch manuscript locations for this work
  const { data: workLocations = [] } = useWorkLocations(text.id);
  
  const { 
    showTextNamesEnglish,
    showTextNamesHebrew,
  } = useMapControls();

  // Count relationships for display
  const incomingCount = relationships.filter(r => r.related_work_id === text.id).length;
  const outgoingCount = relationships.filter(r => r.work_id === text.id).length;

  return (
    <div className="w-[400px] h-full border-l border-white/10 bg-card flex flex-col min-h-0">
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
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Description */}
          {text.description && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-white/70">{text.description}</p>
            </div>
          )}

          {/* Relationship Summary */}
          {(incomingCount > 0 || outgoingCount > 0) && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Relationships</p>
              <p className="text-sm text-white/70">
                {incomingCount > 0 && `${incomingCount} work${incomingCount !== 1 ? 's' : ''} reference this text`}
                {incomingCount > 0 && outgoingCount > 0 && ' • '}
                {outgoingCount > 0 && `References ${outgoingCount} other work${outgoingCount !== 1 ? 's' : ''}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">View in Texts Network for details</p>
            </div>
          )}

          {/* External Links Section */}
          {text.manuscript_url && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">External Resources</p>
              
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
            </div>
          )}
          
          {/* Work Journey Button */}
          {workLocations.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                Geographic Journey
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  // Navigate to map and trigger work journey
                  navigate('/?mode=works&workId=' + text.id);
                }}
              >
                <Play className="w-4 h-4" />
                Play Journey on Map
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">
                {workLocations.length} location{workLocations.length !== 1 ? 's' : ''} tracked
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
