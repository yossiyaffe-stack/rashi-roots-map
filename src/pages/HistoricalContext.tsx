import { useState } from 'react';
import { useHistoricalEvents } from '@/hooks/useScholars';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Flame, BookOpen, Users } from 'lucide-react';

const HistoricalContext = () => {
  const { data: events = [], isLoading } = useHistoricalEvents();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'major': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'foundational': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'critical': return <Flame className="w-4 h-4" />;
      case 'major': return <Crown className="w-4 h-4" />;
      case 'foundational': return <BookOpen className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const categorizeEvents = () => {
    return {
      all: events,
      critical: events.filter(e => e.importance === 'critical'),
      major: events.filter(e => e.importance === 'major'),
      foundational: events.filter(e => e.importance === 'foundational'),
      scholarly: events.filter(e => e.importance === 'scholarly'),
    };
  };

  const categorized = categorizeEvents();

  if (isLoading) {
    return (
      <div className="w-full h-full p-8 bg-background">
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background">
      <ScrollArea className="h-full">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Historical Context</h1>
            <p className="text-muted-foreground">
              Key events that shaped the world of medieval Jewish scholarship
            </p>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All ({categorized.all.length})</TabsTrigger>
              <TabsTrigger value="critical" className="text-red-400">
                Critical ({categorized.critical.length})
              </TabsTrigger>
              <TabsTrigger value="major" className="text-amber-400">
                Major ({categorized.major.length})
              </TabsTrigger>
              <TabsTrigger value="foundational" className="text-blue-400">
                Foundational ({categorized.foundational.length})
              </TabsTrigger>
              <TabsTrigger value="scholarly">
                Scholarly ({categorized.scholarly.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Events Grid */}
          <div className="space-y-4">
            {categorized[selectedCategory as keyof typeof categorized]
              .sort((a, b) => a.year - b.year)
              .map(event => (
                <Card key={event.id} className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getImportanceColor(event.importance)}`}>
                          {getImportanceIcon(event.importance)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <CardDescription className="text-accent font-medium">
                            {event.year} CE
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getImportanceColor(event.importance)}
                      >
                        {event.importance}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description || 'No description available.'}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>

          {categorized[selectedCategory as keyof typeof categorized].length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No events found in this category.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HistoricalContext;
