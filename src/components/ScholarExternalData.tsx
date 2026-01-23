import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, BookOpen, ScrollText, Globe, Loader2, FileText, Library } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

interface ScholarExternalDataProps {
  scholarName: string;
  hebrewName?: string | null;
}

export function ScholarExternalData({ scholarName, hebrewName }: ScholarExternalDataProps) {
  const [activeTab, setActiveTab] = useState('texts');

  // Fetch Sefaria works
  const { data: sefariaData, isLoading: sefariaLoading, error: sefariaError } = useQuery({
    queryKey: ['sefaria-works', scholarName],
    queryFn: async () => {
      const response = await supabase.functions.invoke('sefaria-api', {
        body: null,
        method: 'GET',
      });
      
      // Use fetch directly since we need query params
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

  return (
    <div className="mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-white/5">
          <TabsTrigger value="texts" className="text-xs data-[state=active]:bg-accent/20">
            <Library className="w-3 h-3 mr-1.5" />
            Sefaria Texts
          </TabsTrigger>
          <TabsTrigger value="manuscripts" className="text-xs data-[state=active]:bg-accent/20">
            <ScrollText className="w-3 h-3 mr-1.5" />
            NLI Manuscripts
          </TabsTrigger>
        </TabsList>

        {/* Sefaria Texts Tab */}
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
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {sefariaWorks.slice(0, 10).map((work, i) => (
                  <Card key={i} className="p-3 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{work.title}</p>
                        {work.heRef && (
                          <p className="text-xs text-accent font-hebrew truncate" dir="rtl">
                            {work.heRef}
                          </p>
                        )}
                        {work.categories && work.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {work.categories.slice(0, 2).map((cat, j) => (
                              <Badge key={j} variant="outline" className="text-[10px]">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <a
                        href={`https://www.sefaria.org/${work.ref?.replace(/ /g, '_')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2"
                      >
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <a
            href={`https://www.sefaria.org/search?q=${encodeURIComponent(scholarName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 mt-3 text-xs text-accent hover:underline"
          >
            <Globe className="w-3 h-3" />
            View all on Sefaria
          </a>
        </TabsContent>

        {/* NLI Manuscripts Tab */}
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
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {nliManuscripts.slice(0, 10).map((ms, i) => (
                  <Card key={i} className="p-3 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ms.title}</p>
                        {ms.creator && (
                          <p className="text-xs text-muted-foreground truncate">
                            {ms.creator}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {ms.date && (
                            <Badge variant="outline" className="text-[10px]">
                              {ms.date}
                            </Badge>
                          )}
                          {ms.type && (
                            <Badge variant="secondary" className="text-[10px]">
                              {ms.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {ms.viewerUrl && (
                        <a
                          href={ms.viewerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2"
                        >
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <a
            href={`https://www.nli.org.il/en/search?keyword=${encodeURIComponent(scholarName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 mt-3 text-xs text-accent hover:underline"
          >
            <Globe className="w-3 h-3" />
            Browse NLI Collection
          </a>
        </TabsContent>
      </Tabs>
    </div>
  );
}
