import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground hover:bg-muted/80",
        selected: "bg-brand text-brand-foreground shadow-sm",
        outline: "border border-border bg-background hover:bg-muted",
      },
      size: {
        default: "h-11 px-4 py-2", // 44px tap target minimum
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, size, selected, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(chipVariants({ variant: selected ? "selected" : variant, size, className }))}
        aria-pressed={selected}
        {...props}
      />
    )
  }
)
Chip.displayName = "Chip"

export { Chip, chipVariants }
