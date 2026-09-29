import * as React from "react"
import { cn } from "@/lib/utils"
import { SearchX } from "lucide-react"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-[12px] border border-dashed border-border p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon || <SearchX className="h-6 w-6" />}
      </div>
      <h3 className="text-[16px] font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-[250px] text-[14px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
