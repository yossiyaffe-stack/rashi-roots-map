import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, ScrollText, Globe, Loader2, Library, Eye, BookOpen, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IIIFManuscriptViewer } from './IIIFManuscriptViewer';

interface SefariaWork {
  ref: string;
  title: string;
  heRef?: string;
  categories?: string[];
  score?: number;
}

interface NLIManuscript {
  id: string;
  title: string;
  creator?: string;
  date?: string;
  type?: string;
  viewerUrl?: string;
  thumbnail?: string;
  iiifManifest?: string;
}

interface ScholarExternalDataProps {
  scholarName: string;
  hebrewName?: string | null;
}

export function ScholarExternalData({ scholarName, hebrewName }: ScholarExternalDataProps) {
  const [activeTab, setActiveTab] = useState('texts');
  const [showManuscriptViewer, setShowManuscriptViewer] = useState(false);
  const [selectedManuscript, setSelectedManuscript] = useState<NLIManuscript | null>(null);

  // Fetch Sefaria works
  const { data: sefariaData, isLoading: sefariaLoading, error: sefariaError } = useQuery({
    queryKey: ['sefaria-works', scholarName],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sefaria-api?action=author-works&query=${encodeURIComponent(scholarName)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch Sefaria data');
      return res.json();
    },
    enabled: activeTab === 'texts',
  });

  // Fetch NLI manuscripts
  const { data: nliData, isLoading: nliLoading, error: nliError } = useQuery({
    queryKey: ['nli-manuscripts', scholarName],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nli-api?action=scholar-manuscripts&query=${encodeURIComponent(scholarName)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch NLI data');
      return res.json();
    },
    enabled: activeTab === 'manuscripts',
  });

  const sefariaWorks: SefariaWork[] = sefariaData?.works || [];
  const nliManuscripts: NLIManuscript[] = nliData?.manuscripts || nliData?.allItems || [];
  
  // Get first manuscript with thumbnail for preview
  const featuredManuscript = nliManuscripts.find(ms => ms.thumbnail) || nliManuscripts[0];
  // Get first text for preview
  const featuredText = sefariaWorks[0];

  return (
    <div className="mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-white/5">
          <TabsTrigger value="texts" className="text-xs data-[state=active]:bg-accent/20">
            <Library className="w-3 h-3 mr-1.5" />
            Printed Editions
          </TabsTrigger>
          <TabsTrigger value="manuscripts" className="text-xs data-[state=active]:bg-accent/20">
            <ScrollText className="w-3 h-3 mr-1.5" />
            Manuscripts
          </TabsTrigger>
        </TabsList>

        {/* Sefaria Texts Tab - Simplified */}
        <TabsContent value="texts" className="mt-3">
          {sefariaLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="ml-2 text-sm text-muted-foreground">Loading from Sefaria...</span>
            </div>
          ) : sefariaError ? (
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <p className="text-sm text-destructive">Failed to load Sefaria data</p>
            </Card>
          ) : sefariaWorks.length === 0 ? (
            <Card className="p-4 bg-white/5">
              <p className="text-sm text-muted-foreground">No texts found on Sefaria</p>
              <a 
                href={`https://www.sefaria.org/search?q=${encodeURIComponent(scholarName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Search Sefaria directly
              </a>
            </Card>
          ) : (
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-start gap-4">
                {/* Representative Image */}
                <a
                  href={featuredText ? `https://www.sefaria.org/${featuredText.ref?.replace(/ /g, '_')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 block"
                >
                  <div className="w-20 h-28 rounded-md bg-gradient-to-b from-emerald-900/40 to-emerald-950/60 border border-emerald-500/30 flex items-center justify-center overflow-hidden hover:border-emerald-400/50 transition-colors">
                    <div className="text-center p-2">
                      <Printer className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <span className="text-[10px] text-emerald-300/80 block">Sefaria</span>
                    </div>
                  </div>
                </a>
                
                {/* Count & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <span className="text-2xl font-bold text-emerald-400">{sefariaWorks.length}</span>
                    <span className="text-sm text-muted-foreground">texts available</span>
                  </div>
                  
                  {featuredText && (
                    <p className="text-sm text-foreground truncate mb-1">
                      {featuredText.title}
                    </p>
                  )}
                  {featuredText?.heRef && (
                    <p className="text-xs text-accent font-hebrew truncate mb-2" dir="rtl">
                      {featuredText.heRef}
                    </p>
                  )}
                  
                  <a
                    href={`https://www.sefaria.org/search?q=${encodeURIComponent(scholarName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    Browse all on Sefaria
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* NLI Manuscripts Tab - Simplified */}
        <TabsContent value="manuscripts" className="mt-3">
          {nliLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="ml-2 text-sm text-muted-foreground">Searching NLI...</span>
            </div>
          ) : nliError ? (
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <p className="text-sm text-destructive">Failed to load NLI data</p>
            </Card>
          ) : nliData?.notice ? (
            <Card className="p-4 bg-amber-500/10 border-amber-500/20">
              <p className="text-sm text-amber-400">{nliData.notice}</p>
              <a 
                href={nliData.searchUrl || `https://www.nli.org.il/en/search?keyword=${encodeURIComponent(scholarName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Search NLI directly
              </a>
            </Card>
          ) : nliManuscripts.length === 0 ? (
            <Card className="p-4 bg-white/5">
              <p className="text-sm text-muted-foreground">No manuscripts found</p>
              <a 
                href={`https://www.nli.org.il/en/search?keyword=${encodeURIComponent(scholarName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Search NLI directly
              </a>
            </Card>
          ) : (
            <>
              {/* IIIF Viewer */}
              {showManuscriptViewer && selectedManuscript && (
                <div className="mb-3">
                  <IIIFManuscriptViewer
                    manuscriptId={selectedManuscript.id}
                    manuscriptTitle={selectedManuscript.title}
                    viewerUrl={selectedManuscript.viewerUrl}
                    onClose={() => {
                      setShowManuscriptViewer(false);
                      setSelectedManuscript(null);
                    }}
                  />
                </div>
              )}
              
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-start gap-4">
                  {/* Representative Manuscript Image */}
                  <button
                    onClick={() => {
                      if (featuredManuscript) {
                        setSelectedManuscript(featuredManuscript);
                        setShowManuscriptViewer(true);
                      }
                    }}
                    className="shrink-0 block"
                  >
                    <div className="w-20 h-28 rounded-md bg-gradient-to-b from-amber-900/40 to-amber-950/60 border border-amber-500/30 flex items-center justify-center overflow-hidden hover:border-amber-400/50 transition-colors cursor-pointer">
                      {featuredManuscript?.thumbnail ? (
                        <img 
                          src={featuredManuscript.thumbnail} 
                          alt="Manuscript preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <ScrollText className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                          <span className="text-[10px] text-amber-300/80 block">NLI</span>
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* Count & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ScrollText className="w-5 h-5 text-amber-500" />
                      <span className="text-2xl font-bold text-amber-400">{nliManuscripts.length}</span>
                      <span className="text-sm text-muted-foreground">manuscripts</span>
                    </div>
                    
                    {featuredManuscript && (
                      <p className="text-sm text-foreground truncate mb-1">
                        {featuredManuscript.title}
                      </p>
                    )}
                    {featuredManuscript?.date && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {featuredManuscript.date}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3">
                      {featuredManuscript && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            setSelectedManuscript(featuredManuscript);
                            setShowManuscriptViewer(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      )}
                      
                      <a
                        href={`https://www.nli.org.il/en/search?keyword=${encodeURIComponent(scholarName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        Browse NLI Collection
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
