import { useState } from 'react';
import { RotateCcw, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useRelationshipFilters, type RelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Domain colors for visual identification
const DOMAIN_COLORS = {
  textual: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
};

// Textual category labels
const TEXTUAL_CATEGORY_LABELS: Record<string, string> = {
  commentary: 'Commentary',
  citation: 'Citation',
  influence: 'Influence',
  response: 'Response',
  transmission: 'Transmission',
};

export function TextualRelationshipsPanel() {
  const {
    filters,
    toggleDomain,
    toggleTextualCategory,
    toggleCertainty,
    resetFilters,
    activeFilterCount,
  } = useRelationshipFilters();

  const [textualOpen, setTextualOpen] = useState(true);

  const textualCategoriesEnabledCount = Object.values(filters.textual.categories).filter(Boolean).length;

  return (
    <div className="h-full flex flex-col w-[280px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-accent uppercase tracking-wider">
            Text Relationships
          </h3>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/50 hover:text-white border border-white/10 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Textual Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className={cn("w-4 h-4", DOMAIN_COLORS.textual.text)} />
                <Label className="text-sm text-foreground/80 cursor-pointer">Textual</Label>
              </div>
              <Switch
                checked={filters.domains.textual}
                onCheckedChange={() => toggleDomain('textual')}
              />
            </div>
            
            {filters.domains.textual && (
              <Collapsible open={textualOpen} onOpenChange={setTextualOpen}>
                <CollapsibleTrigger className="flex items-center gap-1 pl-6 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                  {textualOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span>Categories ({textualCategoriesEnabledCount}/{Object.keys(filters.textual.categories).length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-6 space-y-1">
                    {Object.entries(filters.textual.categories).map(([key, enabled]) => (
                      <div
                        key={key}
                        onClick={() => toggleTextualCategory(key as keyof RelationshipFilters['textual']['categories'])}
                        className={cn(
                          "flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors",
                          "hover:bg-white/5"
                        )}
                      >
                        <span className="text-xs text-muted-foreground">{TEXTUAL_CATEGORY_LABELS[key]}</span>
                        <div className={cn(
                          "w-3 h-3 rounded-sm border transition-colors",
                          enabled ? `${DOMAIN_COLORS.textual.bg} ${DOMAIN_COLORS.textual.border}` : 'border-white/30'
                        )}>
                          {enabled && <div className="w-full h-full rounded-sm bg-blue-500/60" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Certainty Filter */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-sm font-semibold text-foreground/80 mb-2">
              Certainty Level
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(filters.certainty).map(([level, enabled]) => (
                <button
                  key={level}
                  onClick={() => toggleCertainty(level as keyof RelationshipFilters['certainty'])}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors border",
                    enabled 
                      ? 'bg-accent/20 border-accent/50 text-accent' 
                      : 'bg-transparent border-white/10 text-white/50 hover:border-white/30 hover:text-white/70'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
