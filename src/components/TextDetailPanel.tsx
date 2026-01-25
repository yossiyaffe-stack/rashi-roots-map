import { X, ExternalLink, BookOpen, Library, FileImage, Play, MapPin, Award, TrendingUp, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type WorkWithAuthor, type TextualRelationshipWithWorks, useWorkLocations } from '@/hooks/useWorks';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { WorkScoreBreakdown } from './WorkScoreBreakdown';
import { WorkTemporalView } from './WorkTemporalView';

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

// Work type display names
const WORK_TYPE_LABELS: Record<string, string> = {
  commentary: 'Commentary',
  responsa: 'Responsa',
  talmud_commentary: 'Talmud Commentary',
  halakha: 'Halakha',
  philosophy: 'Philosophy',
  kabbalah: 'Kabbalah',
  supercommentary: 'Supercommentary',
  poetry: 'Poetry',
  grammar: 'Grammar',
  ethics: 'Ethics',
  homiletics: 'Homiletics',
  other: 'Other',
};

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
  const { data: workLocations = [] } = useWorkLocations(text.id);
  
  const { 
    showTextNamesEnglish,
    showTextNamesHebrew,
  } = useMapControls();

  // Check if we have any external resources
  const hasExternalResources = text.sefaria_url || text.hebrewbooks_url || text.manuscript_url;

  return (
    <div className="w-[400px] h-full border-l border-white/10 bg-card flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-accent/20 to-transparent border-b border-white/10 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold">
              {showTextNamesEnglish && text.title}
              {showTextNamesEnglish && showTextNamesHebrew && text.hebrew_title && ' • '}
              {showTextNamesHebrew && text.hebrew_title && (
                <span className="font-hebrew">{text.hebrew_title}</span>
              )}
              {!showTextNamesEnglish && !showTextNamesHebrew && text.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {text.author_name || 'Unknown author'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {text.work_type && (
            <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
              {WORK_TYPE_LABELS[text.work_type] || text.work_type}
            </Badge>
          )}
          {text.year_written && (
            <Badge variant="outline" className="border-white/20 text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              c. {text.year_written}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="score" className="text-xs flex items-center gap-1">
            <Award className="w-3 h-3" />
            Score
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Timeline
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1 p-4">
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Description */}
            {text.description && (
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text.description}</p>
              </div>
            )}

            {/* External Resources */}
            {hasExternalResources && (
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
                  External Resources
                </h3>
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

                  {/* Manuscript Link */}
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
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Geographic Journey
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigate('/?mode=works&workId=' + text.id)}
                >
                  <Play className="w-4 h-4" />
                  Play Journey on Map
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {workLocations.length} location{workLocations.length !== 1 ? 's' : ''} tracked
                </p>
              </div>
            )}
          </TabsContent>

          {/* Score Tab */}
          <TabsContent value="score" className="mt-0">
            <WorkScoreBreakdown
              workId={text.id}
              workTitle={text.title}
              yearWritten={text.year_written}
            />
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Transmission History
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Track how {text.title}'s influence spread over time.
                </p>
              </div>
              
              <WorkTemporalView 
                workId={text.id}
                workTitle={text.title}
                yearWritten={text.year_written}
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
