import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"

export interface PlaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  imageUrl?: string
  distanceText?: string
  durationText?: string
  status?: "open" | "closed" | "closing_soon"
}

export function PlaceCard({
  name,
  imageUrl,
  distanceText,
  durationText,
  status,
  className,
  ...props
}: PlaceCardProps) {
  return (
    <div
      className={cn(
        "group relative flex w-[156px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-background shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2",
        className
      )}
      {...props}
    >
      <div className="relative h-[84px] w-full overflow-hidden bg-muted rounded-[12px]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest">
            No Photo
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1 p-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {name}
        </h3>
        
        {(distanceText || durationText) && (
          <p className="text-[12px] text-muted-foreground truncate">
            {distanceText}{distanceText && durationText ? ' · ' : ''}{durationText}
          </p>
        )}

        {status && (
          <div className="mt-1">
            <Badge variant={status} className="px-1.5 py-0 rounded-[4px] text-[10px] font-medium leading-4">
              {status === "open" ? "Open" : status === "closed" ? "Closed" : "Closes soon"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
