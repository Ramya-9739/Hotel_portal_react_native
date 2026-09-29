import * as React from "react"
import { cn } from "@/lib/utils"

export interface PlaceRowProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  imageUrl?: string
  metaText?: string
  distanceText?: string
}

export function PlaceRow({
  name,
  imageUrl,
  metaText,
  distanceText,
  className,
  ...props
}: PlaceRowProps) {
  return (
    <div
      className={cn(
        "group relative flex h-[56px] w-full items-center gap-3 rounded-[12px] bg-background p-2 transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2",
        className
      )}
      {...props}
    >
      <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-[8px] bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
            No img
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <h3 className="truncate text-[14px] font-semibold leading-tight text-foreground">
          {name}
        </h3>
        {metaText && (
          <p className="truncate text-[12px] text-muted-foreground">
            {metaText}
          </p>
        )}
      </div>

      {distanceText && (
        <div className="shrink-0 pl-2 text-right">
          <span className="text-[12px] font-medium text-foreground">
            {distanceText}
          </span>
        </div>
      )}
    </div>
  )
}
