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
        "group relative flex w-[260px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2",
        className
      )}
      {...props}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        {status && (
          <div className="absolute right-2 top-2">
            <Badge variant={status}>
              {status === "open" ? "Open" : status === "closed" ? "Closed" : "Closing soon"}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight text-foreground">
          {name}
        </h3>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-auto">
          {distanceText && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{distanceText}</span>
            </div>
          )}
          {durationText && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{durationText}</span>
            </div>
          )}
        </div>
      </div>
      
      <button className="absolute inset-0 outline-none" aria-label={`View details for ${name}`}>
        <span className="sr-only">View Details</span>
      </button>
    </div>
  )
}
