import { RotateCcw, Layers, MessageSquareWarning, BookOpen, BookMarked, Lightbulb, FileText, Languages, LayoutGrid, Scale, CheckSquare, ChevronLeft, Filter } from 'lucide-react';
import { useRelationshipFilters, type RelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TextualRelationshipsPanelProps {
  onClose?: () => void;
}

// 9 Relationship Categories with icons and descriptions - MORE VIBRANT colors
const TEXTUAL_CATEGORIES: Record<keyof RelationshipFilters['textual']['categories'], {
  label: string;
  hebrewLabel: string;
  icon: typeof Layers;
  description: string;
  activeColor: string;
  inactiveColor: string;
}> = {
  nosei_kelim: {
    label: 'Nosei Kelim',
    hebrewLabel: 'נושאי כלים',
    icon: Layers,
    description: 'Texts printed together',
    activeColor: 'bg-purple-500/30 text-purple-300 border-purple-400/60',
    inactiveColor: 'bg-purple-500/10 text-purple-400/50 border-purple-500/20',
  },
  hasagot: {
    label: 'Hasagot',
    hebrewLabel: 'השגות',
    icon: MessageSquareWarning,
    description: 'Criticisms',
    activeColor: 'bg-red-500/30 text-red-300 border-red-400/60',
    inactiveColor: 'bg-red-500/10 text-red-400/50 border-red-500/20',
  },
  commentary: {
    label: 'Commentary',
    hebrewLabel: 'פירוש',
    icon: BookOpen,
    description: 'Primary interpretation',
    activeColor: 'bg-blue-500/30 text-blue-300 border-blue-400/60',
    inactiveColor: 'bg-blue-500/10 text-blue-400/50 border-blue-500/20',
  },
  super_commentary: {
    label: 'Super-Commentary',
    hebrewLabel: 'פירוש על פירוש',
    icon: BookMarked,
    description: 'Meta-commentary',
    activeColor: 'bg-indigo-500/30 text-indigo-300 border-indigo-400/60',
    inactiveColor: 'bg-indigo-500/10 text-indigo-400/50 border-indigo-500/20',
  },
  hiddushim: {
    label: 'Hiddushim',
    hebrewLabel: 'חידושים',
    icon: Lightbulb,
    description: 'Novellae',
    activeColor: 'bg-yellow-500/30 text-yellow-300 border-yellow-400/60',
    inactiveColor: 'bg-yellow-500/10 text-yellow-400/50 border-yellow-500/20',
  },
  abridgement: {
    label: 'Abridgement',
    hebrewLabel: 'קיצור',
    icon: FileText,
    description: 'Shortened versions',
    activeColor: 'bg-emerald-500/30 text-emerald-300 border-emerald-400/60',
    inactiveColor: 'bg-emerald-500/10 text-emerald-400/50 border-emerald-500/20',
  },
  translation: {
    label: 'Translation',
    hebrewLabel: 'תרגום',
    icon: Languages,
    description: 'Language change',
    activeColor: 'bg-cyan-500/30 text-cyan-300 border-cyan-400/60',
    inactiveColor: 'bg-cyan-500/10 text-cyan-400/50 border-cyan-500/20',
  },
  reorganization: {
    label: 'Reorganization',
    hebrewLabel: 'סידור מחדש',
    icon: LayoutGrid,
    description: 'Topical rearrangement',
    activeColor: 'bg-orange-500/30 text-orange-300 border-orange-400/60',
    inactiveColor: 'bg-orange-500/10 text-orange-400/50 border-orange-500/20',
  },
  halakhic_dependency: {
    label: 'Halakhic Dependency',
    hebrewLabel: 'שרשרת הלכתית',
    icon: Scale,
    description: 'Legal chains',
    activeColor: 'bg-amber-500/30 text-amber-300 border-amber-400/60',
    inactiveColor: 'bg-amber-500/10 text-amber-400/50 border-amber-500/20',
  },
};

export function TextualRelationshipsPanel({ onClose }: TextualRelationshipsPanelProps) {
  const {
    filters,
    toggleTextualCategory,
    setAllTextualCategories,
    resetFilters,
    activeFilterCount,
  } = useRelationshipFilters();

  const enabledCount = Object.values(filters.textual.categories).filter(Boolean).length;
  const totalCount = Object.keys(filters.textual.categories).length;
  const allSelected = enabledCount === totalCount;

  const handleSelectAll = () => {
    setAllTextualCategories(true);
  };

  const handleDeselectAll = () => {
    setAllTextualCategories(false);
  };

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
          <span className="text-xs uppercase tracking-widest">Text Relationships</span>
        </button>
        <div className="flex items-center gap-2">
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
        
        {/* Select All / Deselect All buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSelectAll}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
              allSelected
                ? "bg-accent/20 text-accent border-accent/50"
                : "bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white"
            )}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
              enabledCount === 0
                ? "bg-white/10 text-white/50 border-white/20"
                : "bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:text-white"
            )}
          >
            Clear All
          </button>
        </div>
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
                  enabled ? config.activeColor : config.inactiveColor,
                  "hover:brightness-110"
                )}
              >
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", enabled ? "" : "opacity-60")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", enabled ? "text-white" : "")}>{config.label}</span>
                    <span className={cn("text-[10px]", enabled ? "text-white/80" : "opacity-70")}>{config.hebrewLabel}</span>
                  </div>
                  <p className={cn("text-[10px] mt-0.5", enabled ? "text-white/70" : "opacity-60")}>{config.description}</p>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                  enabled ? "border-white/80 bg-white/20" : "border-current/50"
                )}>
                  {enabled && <div className="w-2 h-2 rounded-sm bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
