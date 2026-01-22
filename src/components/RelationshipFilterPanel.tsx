import { ChevronDown, ChevronRight, Filter, RotateCcw, Users, FileText, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { useRelationshipFilters, type RelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Domain colors for visual identification
const DOMAIN_COLORS = {
  biographical: { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-400', icon: Users },
  textual: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', icon: FileText },
  intellectual: { bg: 'bg-violet-500/20', border: 'border-violet-500', text: 'text-violet-400', icon: Lightbulb },
};

// Category labels
const CATEGORY_LABELS = {
  biographical: {
    family: 'Family',
    pedagogical: 'Teacher-Student',
    professional: 'Professional',
    social: 'Social',
    institutional: 'Institutional',
  },
  textual: {
    commentary: 'Commentary',
    citation: 'Citation',
    influence: 'Influence',
    response: 'Response',
    transmission: 'Transmission',
  },
  intellectual: {
    authorship: 'Authorship',
    study: 'Study',
    methodology: 'Methodology',
    school: 'School',
    transmission: 'Transmission',
  },
};

interface FilterSectionProps {
  title: string;
  domain: 'biographical' | 'textual' | 'intellectual';
  isEnabled: boolean;
  onToggleDomain: () => void;
  categories: Record<string, boolean>;
  onToggleCategory: (category: string) => void;
  labels: Record<string, string>;
}

function FilterSection({ 
  title, 
  domain, 
  isEnabled, 
  onToggleDomain, 
  categories, 
  onToggleCategory,
  labels 
}: FilterSectionProps) {
  // Start collapsed so the parent panel can show the 3 domains first,
  // and users can expand each domain on demand.
  const [isOpen, setIsOpen] = useState(false);
  const colors = DOMAIN_COLORS[domain];
  const Icon = colors.icon;
  
  const enabledCount = Object.values(categories).filter(Boolean).length;
  const totalCount = Object.keys(categories).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
          "hover:bg-white/5 border",
          isEnabled ? colors.border : 'border-white/10 opacity-60'
        )}>
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
            <Icon className={cn("w-4 h-4", colors.text)} />
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5", colors.text, colors.bg)}>
              {enabledCount}/{totalCount}
            </Badge>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggleDomain}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="pl-8 pr-2 py-2 space-y-1">
          {Object.entries(categories).map(([key, enabled]) => (
            <div
              key={key}
              onClick={() => onToggleCategory(key)}
              className={cn(
                "flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-colors",
                "hover:bg-white/5",
                !isEnabled && 'opacity-50 pointer-events-none'
              )}
            >
              <span className="text-xs text-white/70">{labels[key]}</span>
              <div className={cn(
                "w-3 h-3 rounded-sm border transition-colors",
                enabled ? `${colors.bg} ${colors.border}` : 'border-white/30'
              )}>
                {enabled && <div className={cn("w-full h-full rounded-sm", colors.bg.replace('/20', '/60'))} />}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RelationshipFilterPanel() {
  const [panelOpen, setPanelOpen] = useState(false);
  const {
    filters,
    toggleDomain,
    toggleBiographicalCategory,
    toggleTextualCategory,
    toggleIntellectualCategory,
    toggleCertainty,
    resetFilters,
    activeFilterCount,
  } = useRelationshipFilters();

  return (
    <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
      <div className="space-y-3">
        {/* Header (collapsible) */}
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-1 items-center gap-2 text-left",
                "rounded-md px-1 py-1",
                "hover:bg-white/5 transition-colors"
              )}
            >
              <Filter className="w-4 h-4 text-accent" />
              <span className="text-xs uppercase tracking-widest text-accent font-bold">Relationships</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {activeFilterCount} filtered
                </Badge>
              )}
              <span className="ml-auto text-white/40">
                {panelOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            </button>
          </CollapsibleTrigger>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 px-2 text-xs text-white/50 hover:text-white"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <CollapsibleContent className="space-y-3">
          {/* Domain Sections */}
          <div className="space-y-2">
            <FilterSection
              title="Biographical"
              domain="biographical"
              isEnabled={filters.domains.biographical}
              onToggleDomain={() => toggleDomain('biographical')}
              categories={filters.biographical.categories}
              onToggleCategory={(cat) => toggleBiographicalCategory(cat as keyof RelationshipFilters['biographical']['categories'])}
              labels={CATEGORY_LABELS.biographical}
            />
            
            <FilterSection
              title="Textual"
              domain="textual"
              isEnabled={filters.domains.textual}
              onToggleDomain={() => toggleDomain('textual')}
              categories={filters.textual.categories}
              onToggleCategory={(cat) => toggleTextualCategory(cat as keyof RelationshipFilters['textual']['categories'])}
              labels={CATEGORY_LABELS.textual}
            />
            
            <FilterSection
              title="Intellectual"
              domain="intellectual"
              isEnabled={filters.domains.intellectual}
              onToggleDomain={() => toggleDomain('intellectual')}
              categories={filters.intellectual.categories}
              onToggleCategory={(cat) => toggleIntellectualCategory(cat as keyof RelationshipFilters['intellectual']['categories'])}
              labels={CATEGORY_LABELS.intellectual}
            />
          </div>

          {/* Certainty Filter */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Certainty Level</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(filters.certainty).map(([level, enabled]) => (
                <button
                  key={level}
                  onClick={() => toggleCertainty(level as keyof RelationshipFilters['certainty'])}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors border",
                    enabled 
                      ? 'bg-white/10 border-white/30 text-white' 
                      : 'bg-transparent border-white/10 text-white/40'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
