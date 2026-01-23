import { useWorksWithAuthors } from '@/hooks/useWorks';
import { useAllWorkLocations } from '@/hooks/useWorks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, FileImage, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Known manuscript repositories with IIIF support
const IIIF_REPOSITORIES = [
  { pattern: /bodleian|oxford/i, name: 'Bodleian Library, Oxford' },
  { pattern: /bsb|bayerische/i, name: 'Bayerische Staatsbibliothek' },
  { pattern: /bnf|gallica/i, name: 'Bibliothèque nationale de France' },
  { pattern: /nli\.org|ktiv/i, name: 'National Library of Israel' },
  { pattern: /vaticana|vatican/i, name: 'Vatican Library' },
  { pattern: /bl\.uk|british/i, name: 'British Library' },
];

function getRepositoryName(url: string): string {
  for (const repo of IIIF_REPOSITORIES) {
    if (repo.pattern.test(url)) {
      return repo.name;
    }
  }
  return 'Digital Repository';
}

export default function ManuscriptLinks() {
  const { data: works = [], isLoading: worksLoading } = useWorksWithAuthors();
  const { data: locations = [], isLoading: locationsLoading } = useAllWorkLocations();

  // Get works with manuscript_copy locations that have IIIF or digital links
  const manuscriptLocations = locations.filter(
    loc => loc.location_type === 'manuscript_copy' && loc.place
  );

  // Group by work
  const manuscriptsByWork = new Map<string, typeof manuscriptLocations>();
  manuscriptLocations.forEach(loc => {
    if (!manuscriptsByWork.has(loc.work_id)) {
      manuscriptsByWork.set(loc.work_id, []);
    }
    manuscriptsByWork.get(loc.work_id)!.push(loc);
  });

  // Also include works with manuscript_url (digital access)
  const worksWithManuscriptUrl = works.filter(
    w => w.manuscript_url && !w.manuscript_url.includes('hebrewbooks.org')
  );

  const isLoading = worksLoading || locationsLoading;

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
        <h1 className="text-2xl font-bold text-foreground">Manuscript Links</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Links to digitized manuscripts preserved in libraries around the world
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Physical Manuscript Locations */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-foreground">Manuscript Locations</h2>
              <span className="text-xs text-muted-foreground">
                ({manuscriptLocations.length} manuscripts in {manuscriptsByWork.size} works)
              </span>
            </div>

            <div className="space-y-4">
              {Array.from(manuscriptsByWork.entries()).map(([workId, locs]) => {
                const work = works.find(w => w.id === workId);
                if (!work) return null;

                return (
                  <div
                    key={workId}
                    className="p-4 rounded-lg border border-white/10 bg-card/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">{work.title}</h3>
                        {work.hebrew_title && (
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            {work.hebrew_title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          by {work.author_name}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {locs.map(loc => (
                        <div
                          key={loc.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/20",
                            "text-sm"
                          )}
                        >
                          <FileImage className="w-4 h-4 text-purple-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground truncate">
                              {loc.place?.name_english}
                            </p>
                            {loc.notes && (
                              <p className="text-xs text-muted-foreground truncate">
                                {loc.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {manuscriptsByWork.size === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No manuscript location data available
              </p>
            )}
          </section>

          {/* Digital Manuscript Access */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileImage className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-foreground">Digital Manuscripts</h2>
              <span className="text-xs text-muted-foreground">
                ({worksWithManuscriptUrl.length} available)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {worksWithManuscriptUrl.map(work => {
                const repoName = getRepositoryName(work.manuscript_url!);
                return (
                  <a
                    key={work.id}
                    href={work.manuscript_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group flex flex-col p-4 rounded-lg border border-white/10 bg-card/50",
                      "hover:border-cyan-500/50 hover:bg-card transition-all"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-16 rounded bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                        <FileImage className="w-6 h-6 text-cyan-400/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate group-hover:text-cyan-400 transition-colors">
                          {work.title}
                        </h3>
                        {work.hebrew_title && (
                          <p className="text-xs text-muted-foreground truncate" dir="rtl">
                            {work.hebrew_title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {work.author_name}
                        </p>
                        <p className="text-[10px] text-cyan-400/70 mt-1 truncate">
                          {repoName}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors shrink-0" />
                    </div>
                  </a>
                );
              })}
            </div>

            {worksWithManuscriptUrl.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No digital manuscript links available
              </p>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
