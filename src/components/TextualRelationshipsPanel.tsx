import { RotateCcw, Layers, MessageSquareWarning, BookOpen, BookMarked, Lightbulb, FileText, Languages, LayoutGrid, Scale } from 'lucide-react';
import { useRelationshipFilters, type RelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// 9 Relationship Categories with icons and descriptions
const TEXTUAL_CATEGORIES: Record<keyof RelationshipFilters['textual']['categories'], {
  label: string;
  hebrewLabel: string;
  icon: typeof Layers;
  description: string;
  color: string;
}> = {
  nosei_kelim: {
    label: 'Nosei Kelim',
    hebrewLabel: 'נושאי כלים',
    icon: Layers,
    description: 'Texts printed together',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  hasagot: {
    label: 'Hasagot',
    hebrewLabel: 'השגות',
    icon: MessageSquareWarning,
    description: 'Criticisms',
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
  commentary: {
    label: 'Commentary',
    hebrewLabel: 'פירוש',
    icon: BookOpen,
    description: 'Primary interpretation',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
  super_commentary: {
    label: 'Super-Commentary',
    hebrewLabel: 'פירוש על פירוש',
    icon: BookMarked,
    description: 'Meta-commentary',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
  },
  hiddushim: {
    label: 'Hiddushim',
    hebrewLabel: 'חידושים',
    icon: Lightbulb,
    description: 'Novellae',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  },
  abridgement: {
    label: 'Abridgement',
    hebrewLabel: 'קיצור',
    icon: FileText,
    description: 'Shortened versions',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  translation: {
    label: 'Translation',
    hebrewLabel: 'תרגום',
    icon: Languages,
    description: 'Language change',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  },
  reorganization: {
    label: 'Reorganization',
    hebrewLabel: 'סידור מחדש',
    icon: LayoutGrid,
    description: 'Topical rearrangement',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  halakhic_dependency: {
    label: 'Halakhic Dependency',
    hebrewLabel: 'שרשרת הלכתית',
    icon: Scale,
    description: 'Legal chains',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
};

export function TextualRelationshipsPanel() {
  const {
    filters,
    toggleTextualCategory,
    resetFilters,
    activeFilterCount,
  } = useRelationshipFilters();

  const enabledCount = Object.values(filters.textual.categories).filter(Boolean).length;
  const totalCount = Object.keys(filters.textual.categories).length;

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
        <p className="text-xs text-muted-foreground mt-1">
          {enabledCount}/{totalCount} categories active
        </p>
      </div>

      {/* Scrollable Content - Category Buttons */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {(Object.entries(TEXTUAL_CATEGORIES) as [keyof RelationshipFilters['textual']['categories'], typeof TEXTUAL_CATEGORIES[keyof typeof TEXTUAL_CATEGORIES]][]).map(([key, config]) => {
            const enabled = filters.textual.categories[key];
            const Icon = config.icon;
            
            return (
              <button
                key={key}
                onClick={() => toggleTextualCategory(key)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                  enabled
                    ? config.color
                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                )}
              >
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", enabled ? "" : "opacity-50")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-[10px] opacity-70">{config.hebrewLabel}</span>
                  </div>
                  <p className="text-[10px] opacity-70 mt-0.5">{config.description}</p>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                  enabled ? "border-current bg-current/20" : "border-white/30"
                )}>
                  {enabled && <div className="w-2 h-2 rounded-sm bg-current" />}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
