import { BookOpen } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DOMAINS, type DomainId } from '@/lib/domains';
import { cn } from '@/lib/utils';

interface DomainSelectorProps {
  value: DomainId;
  onChange: (domain: DomainId) => void;
  className?: string;
  compact?: boolean;
}

export function DomainSelector({ 
  value, 
  onChange,
  className,
  compact = false,
}: DomainSelectorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Domain</span>
        </div>
      )}
      <Select value={value} onValueChange={(v) => onChange(v as DomainId)}>
        <SelectTrigger 
          className={cn(
            "bg-sidebar/80 border-white/10 text-foreground",
            compact ? "h-7 text-xs w-[140px]" : "h-8 text-sm w-[200px]"
          )}
        >
          <SelectValue placeholder="Select domain" />
        </SelectTrigger>
        <SelectContent className="bg-sidebar border-white/10 z-[9999]">
          {Object.entries(DOMAINS).map(([id, domain]) => (
            <SelectItem 
              key={id} 
              value={id}
              className="focus:bg-white/10"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{domain.name}</span>
                {!compact && (
                  <span className="text-[10px] text-muted-foreground">
                    {domain.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
