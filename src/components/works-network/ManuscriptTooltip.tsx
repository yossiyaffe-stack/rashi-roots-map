import { useState, useCallback } from 'react';
import { ExternalLink, BookOpen, Scroll } from 'lucide-react';
import type { WorkWithAuthor } from '@/hooks/useWorks';

interface ManuscriptTooltipProps {
  work: WorkWithAuthor;
  position: { x: number; y: number };
  zoom: number;
  pan: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement>;
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

export const ManuscriptTooltip = ({ 
  work, 
  position, 
  zoom, 
  pan,
  containerRef 
}: ManuscriptTooltipProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!work.manuscript_url) return null;

  const { source, id } = parseManuscriptUrl(work.manuscript_url);
  const isHebrewBooks = source === 'HebrewBooks' && id;
  const isSefaria = source === 'Sefaria';

  // HebrewBooks cover image
  const coverImageUrl = isHebrewBooks 
    ? `https://hebrewbooks.org/reader/cover.aspx?req=${id}` 
    : null;

  // Calculate screen position from SVG coordinates
  const container = containerRef.current;
  if (!container) return null;

  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Transform SVG position to screen position
  const screenX = centerX + (position.x - 600) * zoom + pan.x;
  const screenY = centerY + (position.y - 450) * zoom + pan.y;

  return (
    <div 
      className="fixed z-[100] w-64 rounded-lg border border-border bg-card shadow-xl overflow-hidden animate-scale-in"
      style={{
        left: screenX + 90,
        top: screenY - 80,
      }}
    >
      {/* Header */}
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

      {/* Cover image */}
      {coverImageUrl && !imageError && (
        <div className="relative h-40 bg-muted overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground text-xs">Loading...</div>
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

      {/* Sefaria placeholder */}
      {isSefaria && (
        <div className="h-32 bg-gradient-to-br from-emerald-950/30 to-background flex items-center justify-center p-4">
          <div className="text-center">
            <Scroll className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-emerald-400 font-hebrew">
              {work.hebrew_title || 'ספריא'}
            </p>
          </div>
        </div>
      )}

      {/* Fallback */}
      {(!coverImageUrl || imageError) && !isSefaria && (
        <div className="h-24 bg-gradient-to-br from-amber-950/20 to-background flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-amber-400" />
        </div>
      )}

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <h4 className="font-semibold text-xs text-foreground truncate">
          {work.title}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {work.author_name} {work.year_written && `(${work.year_written})`}
        </p>
      </div>

      {/* Link */}
      <a
        href={work.manuscript_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Open</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
