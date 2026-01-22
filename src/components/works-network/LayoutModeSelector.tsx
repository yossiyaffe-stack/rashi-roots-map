import { GitBranch, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LayoutMode } from './types';

interface LayoutModeSelectorProps {
  mode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
}

export const LayoutModeSelector = ({ mode, onModeChange }: LayoutModeSelectorProps) => {
  return (
    <div className="flex bg-card/90 backdrop-blur rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => onModeChange('timeline')}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
          mode === 'timeline' 
            ? "bg-accent text-accent-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
        )}
      >
        <GitBranch className="w-4 h-4" />
        <span className="hidden sm:inline">Timeline</span>
      </button>
      <button
        onClick={() => onModeChange('radial')}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
          mode === 'radial' 
            ? "bg-accent text-accent-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
        )}
      >
        <Circle className="w-4 h-4" />
        <span className="hidden sm:inline">Radial</span>
      </button>
    </div>
  );
};
