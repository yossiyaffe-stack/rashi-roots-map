import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showTooltip = false, formatValue, value, defaultValue, ...props }, ref) => {
  const [isDragging, setIsDragging] = React.useState<number | null>(null);
  const values = value ?? defaultValue ?? [0];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      value={value}
      defaultValue={defaultValue}
      onPointerDown={() => setIsDragging(0)}
      onPointerUp={() => setIsDragging(null)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-accent/60 to-accent transition-all" />
      </SliderPrimitive.Track>
      {Array.isArray(values) && values.map((val, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className={cn(
            "block h-5 w-5 rounded-full border-2 border-accent bg-sidebar ring-offset-background transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:scale-110 hover:border-accent hover:bg-accent/20",
            isDragging !== null && "scale-125 bg-accent/30"
          )}
        >
          {showTooltip && isDragging !== null && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-accent text-sidebar text-xs font-bold rounded whitespace-nowrap animate-fade-in">
              {formatValue ? formatValue(val) : val}
            </div>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
