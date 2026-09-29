import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  actionLabel?: string
  onActionClick?: () => void
}

export function SectionHeader({
  title,
  actionLabel,
  onActionClick,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between py-4", className)}
      {...props}
    >
      <h2 className="text-[18px] font-semibold text-foreground tracking-tight">
        {title}
      </h2>
      {actionLabel && (
        <button
          onClick={onActionClick}
          className="group flex h-[44px] items-center gap-1 px-2 text-[14px] font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md"
          aria-label={`${actionLabel} ${title}`}
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  )
}
