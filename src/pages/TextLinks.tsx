import { useWorksWithAuthors } from '@/hooks/useWorks';
import { useMapControls } from '@/contexts/MapControlsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ExternalLink, BookOpen, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

// HebrewBooks cover image URL helper
function getHebrewBooksCover(url: string): string | null {
  const match = url.match(/hebrewbooks\.org\/(\d+)/);
  if (match) {
    return `https://hebrewbooks.org/pagefeed/${match[1]}.gif`;
  }
  return null;
}

// Sefaria placeholder
function getSefariaIcon(): string {
  return 'https://www.sefaria.org/static/img/logo.png';
}

export default function TextLinks() {
  const { data: works = [], isLoading } = useWorksWithAuthors();
  const { 
    showTextNamesEnglish, setShowTextNamesEnglish,
    showTextNamesHebrew, setShowTextNamesHebrew,
    showScholarNamesEnglish,
    showScholarNamesHebrew,
  } = useMapControls();

  // Filter works based on URL patterns in manuscript_url
  const sefariaWorks = works.filter(w => w.manuscript_url?.includes('sefaria.org'));
  const hebrewBooksWorks = works.filter(w => w.manuscript_url?.includes('hebrewbooks.org'));

  // Helper to render title based on language settings
  const renderTitle = (title: string, hebrewTitle: string | null) => {
    const showEnglish = showTextNamesEnglish;
    const showHebrew = showTextNamesHebrew && hebrewTitle;
    
    if (showEnglish && showHebrew) {
      return (
        <>
          <span className="truncate">{title}</span>
          <span className="text-xs text-muted-foreground truncate" dir="rtl">{hebrewTitle}</span>
        </>
      );
    }
    if (showHebrew) {
      return <span className="truncate" dir="rtl">{hebrewTitle}</span>;
    }
    return <span className="truncate">{title}</span>;
  };

  // Helper to render author based on language settings
  const renderAuthor = (name: string, hebrewName: string | null) => {
    const showEnglish = showScholarNamesEnglish;
    const showHebrew = showScholarNamesHebrew && hebrewName;
    
    if (showEnglish && showHebrew) {
      return `${name} / ${hebrewName}`;
    }
    if (showHebrew) {
      return hebrewName;
    }
    return name;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Text Links</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Digital editions and scanned texts from Sefaria and HebrewBooks.org
            </p>
          </div>
          
          {/* Language Controls */}
          <div className="flex flex-col gap-2 bg-card/50 p-3 rounded-lg border border-white/10">
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
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Sefaria Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-foreground">Sefaria</h2>
              <span className="text-xs text-muted-foreground">({sefariaWorks.length} texts)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sefariaWorks.map(work => (
                <a
                  key={work.id}
                  href={work.manuscript_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group flex flex-col p-4 rounded-lg border border-white/10 bg-card/50",
                    "hover:border-green-500/50 hover:bg-card transition-all"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-16 rounded bg-green-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={getSefariaIcon()}
                        alt="Sefaria"
                        className="w-8 h-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground group-hover:text-green-400 transition-colors flex flex-col">
                        {renderTitle(work.title, work.hebrew_title)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {renderAuthor(work.author_name, work.author_hebrew_name)}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-green-400 transition-colors shrink-0" />
                  </div>
                </a>
              ))}
            </div>

            {sefariaWorks.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No Sefaria links available</p>
            )}
          </section>

          {/* HebrewBooks Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Library className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-foreground">HebrewBooks.org</h2>
              <span className="text-xs text-muted-foreground">({hebrewBooksWorks.length} texts)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hebrewBooksWorks.map(work => {
                const coverUrl = getHebrewBooksCover(work.manuscript_url!);
                return (
                  <a
                    key={work.id}
                    href={work.manuscript_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group flex flex-col p-4 rounded-lg border border-white/10 bg-card/50",
                      "hover:border-amber-500/50 hover:bg-card transition-all"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-16 rounded bg-amber-500/10 flex items-center justify-center shrink-0 overflow-hidden border border-amber-500/20">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={work.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Library className={cn("w-6 h-6 text-amber-400/60", coverUrl && "hidden")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground group-hover:text-amber-400 transition-colors flex flex-col">
                          {renderTitle(work.title, work.hebrew_title)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {renderAuthor(work.author_name, work.author_hebrew_name)}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors shrink-0" />
                    </div>
                  </a>
                );
              })}
            </div>

            {hebrewBooksWorks.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No HebrewBooks links available</p>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
