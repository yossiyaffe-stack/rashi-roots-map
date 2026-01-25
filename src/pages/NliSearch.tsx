import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IIIFManuscriptViewer } from "@/components/IIIFManuscriptViewer";

type NliSearchResult = {
  id: string;
  title?: string;
  creator?: string;
  date?: string;
  description?: string;
  type?: string;
  thumbnail?: string;
  viewerUrl?: string;
};

type NliSearchResponse = {
  query?: string;
  totalResults?: number;
  results?: NliSearchResult[];
  notice?: string;
  searchUrl?: string;
};

export default function NliSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("query") || "").trim();
  const initialInput = useMemo(() => query, [query]);
  const [input, setInput] = useState(initialInput);

  const [selected, setSelected] = useState<{ id: string; title?: string } | null>(null);

  useEffect(() => {
    setInput(initialInput);
  }, [initialInput]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["nli-search", query],
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nli-api?action=search&query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `NLI search failed (${res.status})`);
      }

      return (await res.json()) as NliSearchResponse;
    },
    enabled: query.length > 0,
  });

  const results = data?.results || [];

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      <header className="p-6 border-b border-border shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Manuscript Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search the manuscript catalog via the built-in backend (no direct NLI website access needed).
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Commentary on Torah manuscript Cairo"
              aria-label="Search query"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              const next = input.trim();
              if (!next) return;
              setSelected(null);
              setSearchParams({ query: next });
            }}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            {selected && (
              <div className="mb-4">
                <IIIFManuscriptViewer
                  manuscriptId={selected.id}
                  manuscriptTitle={selected.title}
                  // Avoid linking out to www.nli.org.il (blocked in some environments)
                  viewerUrl={undefined}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}

            {!query ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">
                  Enter a query above to search manuscripts.
                </p>
              </Card>
            ) : isLoading ? (
              <Card className="p-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm text-muted-foreground">Searching…</span>
                </div>
              </Card>
            ) : error ? (
              <Card className="p-4">
                <p className="text-sm text-destructive">{(error as Error).message}</p>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <ScrollText className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground truncate">
                      Results for <span className="font-medium">{query}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {(data?.totalResults ?? results.length).toLocaleString()} found
                  </p>
                </div>

                {data?.notice && (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">{data.notice}</p>
                  </Card>
                )}

                {results.length === 0 ? (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">No results.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {results.map((r) => (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-start gap-4">
                          {r.thumbnail ? (
                            <img
                              src={r.thumbnail}
                              alt={r.title ? `Thumbnail for ${r.title}` : "Manuscript thumbnail"}
                              className="w-20 h-28 object-cover rounded-md border border-border bg-muted"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-20 h-28 rounded-md border border-border bg-muted flex items-center justify-center">
                              <ScrollText className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {r.title || "Untitled"}
                            </p>
                            {(r.creator || r.date) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {[r.creator, r.date].filter(Boolean).join(" • ")}
                              </p>
                            )}
                            {r.description && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                                {r.description}
                              </p>
                            )}

                            <div className="mt-3">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelected({ id: r.id, title: r.title })}
                              >
                                View pages
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
