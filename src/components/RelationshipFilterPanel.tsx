import { useState } from 'react';
import { RotateCcw, Heart, GraduationCap, ChevronDown, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import { useRelationshipFilters, type RelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface RelationshipFilterPanelProps {
  onClose?: () => void;
}

// Domain colors for visual identification - Scholar domains only (Family & Teacher-Student)
const DOMAIN_COLORS = {
  family: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400' },
  teacherStudent: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
};

// Family type labels
const FAMILY_TYPE_LABELS: Record<string, { label: string; isDotted?: boolean }> = {
  son: { label: 'Son' },
  son_in_law: { label: 'Son-in-Law', isDotted: true },
  daughter: { label: 'Daughter' },
  daughter_in_law: { label: 'Daughter-in-Law', isDotted: true },
};

export function RelationshipFilterPanel({ onClose }: RelationshipFilterPanelProps) {
  const {
    filters,
    toggleDomain,
    toggleFamilyType,
    toggleCertainty,
    resetFilters,
    activeFilterCount,
  } = useRelationshipFilters();

  const [familyOpen, setFamilyOpen] = useState(false);

  const familyTypesEnabledCount = Object.values(filters.familyTypes).filter(Boolean).length;

  return (
    <div className="h-full flex flex-col w-[280px]">
      {/* Header with back arrow */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-accent font-bold hover:text-accent/80 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <Filter className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Scholar Relationships</span>
        </button>
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

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* 1. Family Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className={cn("w-4 h-4", DOMAIN_COLORS.family.text)} />
                <Label className="text-sm text-foreground/80 cursor-pointer">Family</Label>
              </div>
              <Switch
                checked={filters.domains.family}
                onCheckedChange={() => toggleDomain('family')}
              />
            </div>
            
            {filters.domains.family && (
              <Collapsible open={familyOpen} onOpenChange={setFamilyOpen}>
                <CollapsibleTrigger className="flex items-center gap-1 pl-6 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                  {familyOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span>Types ({familyTypesEnabledCount}/{Object.keys(filters.familyTypes).length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-6 space-y-1">
                    {Object.entries(filters.familyTypes).map(([key, enabled]) => {
                      const typeInfo = FAMILY_TYPE_LABELS[key];
                      return (
                        <div
                          key={key}
                          onClick={() => toggleFamilyType(key as keyof RelationshipFilters['familyTypes'])}
                          className={cn(
                            "flex items-center justify-between py-1 px-2 rounded cursor-pointer transition-colors",
                            "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{typeInfo?.label || key}</span>
                            {typeInfo?.isDotted && (
                              <span className="text-[9px] text-white/30 border border-dashed border-white/30 px-1 rounded">in-law</span>
                            )}
                          </div>
                          <div className={cn(
                            "w-3 h-3 rounded-sm border transition-colors",
                            enabled ? `${DOMAIN_COLORS.family.bg} ${DOMAIN_COLORS.family.border}` : 'border-white/30'
                          )}>
                            {enabled && <div className="w-full h-full rounded-sm bg-amber-500/60" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          <div className="border-t border-white/10" />

          {/* 2. Teacher-Student Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className={cn("w-4 h-4", DOMAIN_COLORS.teacherStudent.text)} />
                <Label className="text-sm text-foreground/80 cursor-pointer">Teacher-Student</Label>
              </div>
              <Switch
                checked={filters.domains.teacherStudent}
                onCheckedChange={() => toggleDomain('teacherStudent')}
              />
            </div>
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
