import { X, ExternalLink, BookOpen, Library, FileImage, Play, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { type WorkWithAuthor, type TextualRelationshipWithWorks, useWorkLocations } from '@/hooks/useWorks';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Helper to extract HebrewBooks cover thumbnail from URL
function getHebrewBooksCover(url: string): string | null {
  const match = url.match(/hebrewbooks\.org\/(\d+)/);
  if (match) {
    return `https://hebrewbooks.org/pagefeed/${match[1]}.gif`;
  }
  return null;
}

// Helper to get repository name from manuscript URL
function getRepositoryName(url: string): string {
  const repos = [
    { pattern: /bodleian|oxford/i, name: 'Bodleian Library' },
    { pattern: /bsb|bayerische/i, name: 'Bayerische Staatsbibliothek' },
    { pattern: /bnf|gallica/i, name: 'BnF' },
    { pattern: /nli\.org|ktiv/i, name: 'National Library of Israel' },
    { pattern: /vaticana|vatican/i, name: 'Vatican Library' },
    { pattern: /bl\.uk|british/i, name: 'British Library' },
  ];
  for (const repo of repos) {
    if (repo.pattern.test(url)) return repo.name;
  }
  return 'Digital Repository';
}

interface TextDetailPanelProps {
  text: WorkWithAuthor & { 
    manuscript_url?: string | null;
    sefaria_url?: string | null;
    hebrewbooks_url?: string | null;
  };
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

  // Check if we have any external resources
  const hasExternalResources = text.sefaria_url || text.hebrewbooks_url || text.manuscript_url;

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

          {/* External Resources Section */}
          {hasExternalResources && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">External Resources</p>
              <div className="space-y-3">
                
                {/* Sefaria Link */}
                {text.sefaria_url && (
                  <a
                    href={text.sefaria_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-green-500/10 border-green-500/20 hover:border-green-500/40 transition-all group"
                  >
                    <div className="w-12 h-12 rounded bg-green-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-green-400">Sefaria</span>
                      <p className="text-xs text-muted-foreground">Read the full text online</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </a>
                )}

                {/* HebrewBooks Link with Thumbnail */}
                {text.hebrewbooks_url && (
                  <a
                    href={text.hebrewbooks_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 transition-all group"
                  >
                    <div className="w-12 h-16 rounded overflow-hidden bg-amber-500/20 shrink-0 flex items-center justify-center">
                      {getHebrewBooksCover(text.hebrewbooks_url) ? (
                        <img 
                          src={getHebrewBooksCover(text.hebrewbooks_url)!}
                          alt="Book cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('fallback-icon');
                          }}
                        />
                      ) : (
                        <Library className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-amber-400">HebrewBooks.org</span>
                      <p className="text-xs text-muted-foreground">Scanned printed edition</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </a>
                )}

                {/* Manuscript Link with Thumbnail */}
                {text.manuscript_url && (
                  <a
                    href={text.manuscript_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
                  >
                    <div className="w-12 h-16 rounded overflow-hidden bg-cyan-500/20 shrink-0 flex items-center justify-center">
                      <FileImage className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-cyan-400">{getRepositoryName(text.manuscript_url)}</span>
                      <p className="text-xs text-muted-foreground">View original manuscript</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </a>
                )}
              </div>
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
