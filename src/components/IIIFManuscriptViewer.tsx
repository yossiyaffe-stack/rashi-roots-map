import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, 
  Maximize2, Minimize2, Loader2, ExternalLink, Image as ImageIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface IIIFImage {
  id: string;
  thumbnail: string;
  fullImage: string;
  label?: string;
  width?: number;
  height?: number;
}

interface IIIFManifest {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  label?: string | { '@value': string }[];
  sequences?: Array<{
    canvases?: Array<{
      '@id': string;
      label?: string | { '@value': string }[];
      width?: number;
      height?: number;
      images?: Array<{
        resource?: {
          '@id': string;
          service?: {
            '@id': string;
          };
        };
      }>;
    }>;
  }>;
  items?: Array<{
    id: string;
    label?: { en?: string[] };
    width?: number;
    height?: number;
    items?: Array<{
      items?: Array<{
        body?: {
          id: string;
          service?: Array<{
            id: string;
          }>;
        };
      }>;
    }>;
  }>;
}

interface IIIFManuscriptViewerProps {
  manuscriptId: string;
  manuscriptTitle?: string;
  viewerUrl?: string;
  onClose: () => void;
}

function getLabel(label: string | { '@value': string }[] | { en?: string[] } | undefined): string {
  if (!label) return 'Page';
  if (typeof label === 'string') return label;
  if (Array.isArray(label)) {
    const first = label[0];
    if (typeof first === 'string') return first;
    if (first && '@value' in first) return first['@value'];
  }
  if ('en' in label && label.en) return label.en[0] || 'Page';
  return 'Page';
}

export function IIIFManuscriptViewer({ 
  manuscriptId, 
  manuscriptTitle,
  viewerUrl,
  onClose 
}: IIIFManuscriptViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch IIIF manifest
  const { data: manifest, isLoading, error } = useQuery({
    queryKey: ['iiif-manifest', manuscriptId],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nli-api?action=iiif&id=${encodeURIComponent(manuscriptId)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch IIIF manifest');
      return res.json() as Promise<IIIFManifest & { error?: string }>;
    },
  });

  // Parse manifest to get images
  const images: IIIFImage[] = [];
  
  if (manifest && !manifest.error) {
    // IIIF Presentation API 2.x
    if (manifest.sequences) {
      manifest.sequences[0]?.canvases?.forEach((canvas, i) => {
        const image = canvas.images?.[0]?.resource;
        if (image) {
          const serviceId = image.service?.['@id'] || image['@id'];
          images.push({
            id: canvas['@id'],
            label: getLabel(canvas.label) || `Page ${i + 1}`,
            thumbnail: `${serviceId}/full/200,/0/default.jpg`,
            fullImage: `${serviceId}/full/1000,/0/default.jpg`,
            width: canvas.width,
            height: canvas.height,
          });
        }
      });
    }
    // IIIF Presentation API 3.x
    else if (manifest.items) {
      manifest.items.forEach((canvas, i) => {
        const annotationPage = canvas.items?.[0];
        const annotation = annotationPage?.items?.[0];
        const body = annotation?.body;
        
        if (body) {
          const serviceId = body.service?.[0]?.id || body.id;
          images.push({
            id: canvas.id,
            label: getLabel(canvas.label) || `Page ${i + 1}`,
            thumbnail: serviceId.includes('/full/') 
              ? serviceId.replace(/\/full\/[^/]+\//, '/full/200,/') 
              : `${serviceId}/full/200,/0/default.jpg`,
            fullImage: serviceId.includes('/full/') 
              ? serviceId 
              : `${serviceId}/full/1000,/0/default.jpg`,
            width: canvas.width,
            height: canvas.height,
          });
        }
      });
    }
  }

  const currentImage = images[currentPage];
  const totalPages = images.length;

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
    setZoom(1);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
    setZoom(1);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, onClose]);

  if (isLoading) {
    return (
      <Card className={`bg-background/95 backdrop-blur border-accent/20 ${isFullscreen ? 'fixed inset-4 z-50' : 'relative'}`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span className="ml-3 text-muted-foreground">Loading manuscript...</span>
        </div>
      </Card>
    );
  }

  if (error || manifest?.error || images.length === 0) {
    return (
      <Card className="bg-background/95 backdrop-blur border-accent/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-accent">Manuscript Viewer</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            {manifest?.error || 'IIIF images not available for this manuscript'}
          </p>
          {viewerUrl && (
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View on NLI website
            </a>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-background/95 backdrop-blur border-accent/20 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : 'relative'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-accent truncate">
            {manuscriptTitle || 'Manuscript Viewer'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {currentImage?.label} • Page {currentPage + 1} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className={`relative overflow-auto bg-black/50 ${isFullscreen ? 'flex-1' : 'h-64'}`}>
        {currentImage && (
          <div 
            className="min-h-full flex items-center justify-center p-4"
            style={{ minWidth: zoom > 1 ? `${zoom * 100}%` : '100%' }}
          >
            <img
              src={currentImage.fullImage}
              alt={currentImage.label || 'Manuscript page'}
              className="max-w-full transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              onError={(e) => {
                // Fallback to thumbnail if full image fails
                const target = e.target as HTMLImageElement;
                if (target.src !== currentImage.thumbnail) {
                  target.src = currentImage.thumbnail;
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-t border-white/10 bg-background/80">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 min-w-[60px] text-center">
            {currentPage + 1} / {totalPages}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="h-8 w-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="h-8 w-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* External Link */}
        {viewerUrl && (
          <a href={viewerUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              NLI
            </Button>
          </a>
        )}
      </div>

      {/* Thumbnail Strip */}
      {totalPages > 1 && (
        <ScrollArea className="border-t border-white/10">
          <div className="flex gap-2 p-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => { setCurrentPage(i); setZoom(1); }}
                className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                  i === currentPage 
                    ? 'border-accent ring-2 ring-accent/30' 
                    : 'border-transparent hover:border-white/30'
                }`}
              >
                <img
                  src={img.thumbnail}
                  alt={img.label || `Page ${i + 1}`}
                  className="h-12 w-auto object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </Card>
  );
}
