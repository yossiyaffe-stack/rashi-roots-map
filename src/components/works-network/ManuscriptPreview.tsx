import { useState } from 'react';
import { ExternalLink, BookOpen, Scroll } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import type { WorkWithAuthor } from '@/hooks/useWorks';

interface ManuscriptPreviewProps {
  work: WorkWithAuthor;
  children: React.ReactNode;
}

// Extract useful info from manuscript URL
const parseManuscriptUrl = (url: string): { source: string; id: string | null } => {
  if (url.includes('hebrewbooks.org')) {
    const match = url.match(/hebrewbooks\.org\/(\d+)/);
    return { source: 'HebrewBooks', id: match ? match[1] : null };
  }
  if (url.includes('sefaria.org')) {
    const pathMatch = url.match(/sefaria\.org\/(.+)/);
    return { source: 'Sefaria', id: pathMatch ? pathMatch[1] : null };
  }
  return { source: 'Digital Edition', id: null };
};

// Generate thumbnail URL for HebrewBooks
const getHebrewBooksThumbnail = (id: string): string => {
  return `https://hebrewbooks.org/reader/reader.aspx?sfno=${id}`;
};

export const ManuscriptPreview = ({ work, children }: ManuscriptPreviewProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!work.manuscript_url) {
    return <>{children}</>;
  }

  const { source, id } = parseManuscriptUrl(work.manuscript_url);
  const isHebrewBooks = source === 'HebrewBooks' && id;
  const isSefaria = source === 'Sefaria';

  // HebrewBooks cover image pattern
  const coverImageUrl = isHebrewBooks 
    ? `https://hebrewbooks.org/reader/cover.aspx?req=${id}` 
    : null;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-72 p-0 overflow-hidden bg-card border-border shadow-xl"
        side="right"
        sideOffset={12}
      >
        {/* Preview header */}
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {isSefaria ? (
              <Scroll className="w-4 h-4 text-emerald-400" />
            ) : (
              <BookOpen className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-medium text-muted-foreground">{source}</span>
          </div>
        </div>

        {/* Cover image for HebrewBooks */}
        {coverImageUrl && !imageError && (
          <div className="relative aspect-[3/4] bg-muted overflow-hidden">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground text-sm">Loading preview...</div>
              </div>
            )}
            <img
              src={coverImageUrl}
              alt={`Cover of ${work.title}`}
              className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Sefaria text preview placeholder */}
        {isSefaria && (
          <div className="aspect-[4/3] bg-gradient-to-br from-emerald-950/30 to-background flex items-center justify-center p-4">
            <div className="text-center">
              <Scroll className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                View on Sefaria
              </p>
              <p className="text-xs text-emerald-400 mt-1 font-hebrew">
                {work.hebrew_title || 'ספריא'}
              </p>
            </div>
          </div>
        )}

        {/* Fallback for other sources or failed images */}
        {(!coverImageUrl || imageError) && !isSefaria && (
          <div className="aspect-[4/3] bg-gradient-to-br from-amber-950/20 to-background flex items-center justify-center p-4">
            <div className="text-center">
              <BookOpen className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Digital manuscript available
              </p>
            </div>
          </div>
        )}

        {/* Work info */}
        <div className="p-3 space-y-1">
          <h4 className="font-semibold text-sm text-foreground leading-tight">
            {work.title}
          </h4>
          {work.hebrew_title && (
            <p className="text-sm text-muted-foreground font-hebrew leading-tight">
              {work.hebrew_title}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            by {work.author_name}
            {work.year_written && ` (c. ${work.year_written})`}
          </p>
        </div>

        {/* Open link button */}
        <a
          href={work.manuscript_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-sm font-medium transition-colors border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <span>View Digital Edition</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </HoverCardContent>
    </HoverCard>
  );
};
