import { RotateCcw, Users, FileText, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { useRelationshipFilters, type RelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Domain colors for visual identification
const DOMAIN_COLORS = {
  biographical: { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-400', icon: Users },
  textual: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', icon: FileText },
  intellectual: { bg: 'bg-violet-500/20', border: 'border-violet-500', text: 'text-violet-400', icon: Lightbulb },
};

// Category labels - aligned with database categories
const CATEGORY_LABELS = {
  biographical: {
    family: 'Family',
    educational: 'Educational',
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
    methodology: 'Methodology',
    influence: 'Influence',
    authorship: 'Authorship',
    study: 'Study',
    school: 'School',
    transmission: 'Transmission',
  },
};

interface DomainSectionProps {
  title: string;
  domain: 'biographical' | 'textual' | 'intellectual';
  isEnabled: boolean;
  onToggleDomain: () => void;
  categories: Record<string, boolean>;
  onToggleCategory: (category: string) => void;
  labels: Record<string, string>;
}

function DomainSection({ 
  title, 
  domain, 
  isEnabled, 
  onToggleDomain, 
  categories, 
  onToggleCategory,
  labels 
}: DomainSectionProps) {
  const colors = DOMAIN_COLORS[domain];
  const Icon = colors.icon;
  
  const enabledCount = Object.values(categories).filter(Boolean).length;
  const totalCount = Object.keys(categories).length;

  return (
    <div className="space-y-2">
      {/* Domain header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", colors.text)} />
          <Label className="text-sm text-foreground/80 cursor-pointer">{title}</Label>
          <Badge variant="outline" className={cn("text-[10px] px-1.5", colors.text, colors.bg)}>
            {enabledCount}/{totalCount}
          </Badge>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={onToggleDomain}
        />
      </div>
      
      {/* Category checkboxes */}
      {isEnabled && (
        <div className="pl-6 space-y-1">
          {Object.entries(categories).map(([key, enabled]) => (
            <div
              key={key}
              onClick={() => onToggleCategory(key)}
              className={cn(
                "flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors",
                "hover:bg-white/5"
              )}
            >
              <span className="text-xs text-muted-foreground">{labels[key]}</span>
              <div className={cn(
                "w-3 h-3 rounded-sm border transition-colors",
                enabled ? `${colors.bg} ${colors.border}` : 'border-white/30'
              )}>
                {enabled && <div className={cn("w-full h-full rounded-sm", colors.bg.replace('/20', '/60'))} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RelationshipFilterPanel() {
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
    <div className="h-full flex flex-col w-[280px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-accent uppercase tracking-wider">
            Relationship Filters
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
        <div className="p-4 space-y-4">
          {/* Biographical Section */}
          <DomainSection
            title="Biographical"
            domain="biographical"
            isEnabled={filters.domains.biographical}
            onToggleDomain={() => toggleDomain('biographical')}
            categories={filters.biographical.categories}
            onToggleCategory={(cat) => toggleBiographicalCategory(cat as keyof RelationshipFilters['biographical']['categories'])}
            labels={CATEGORY_LABELS.biographical}
          />

          <div className="border-t border-white/10" />

          {/* Textual Section */}
          <DomainSection
            title="Textual"
            domain="textual"
            isEnabled={filters.domains.textual}
            onToggleDomain={() => toggleDomain('textual')}
            categories={filters.textual.categories}
            onToggleCategory={(cat) => toggleTextualCategory(cat as keyof RelationshipFilters['textual']['categories'])}
            labels={CATEGORY_LABELS.textual}
          />

          <div className="border-t border-white/10" />

          {/* Intellectual Section */}
          <DomainSection
            title="Intellectual"
            domain="intellectual"
            isEnabled={filters.domains.intellectual}
            onToggleDomain={() => toggleDomain('intellectual')}
            categories={filters.intellectual.categories}
            onToggleCategory={(cat) => toggleIntellectualCategory(cat as keyof RelationshipFilters['intellectual']['categories'])}
            labels={CATEGORY_LABELS.intellectual}
          />

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