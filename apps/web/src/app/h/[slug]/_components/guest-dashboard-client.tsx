"use client"

import * as React from "react"
import { MapPin, Phone, Route, Wifi, AlertCircle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/ui/segmented"
import { Chip } from "@/components/ui/chip"
import { PlaceCard } from "@/components/ui/place-card"
import { PlaceRow } from "@/components/ui/place-row"
import { SectionHeader } from "@/components/ui/section-header"
import { Map, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestDashboardClientProps {
  hotel: {
    id: string
    name: string
    address: string
    imageUrl: string
  }
}

export function GuestDashboardClient({ hotel }: GuestDashboardClientProps) {
  const [viewMode, setViewMode] = React.useState<"list" | "map">("list")
  const [activeCategory, setActiveCategory] = React.useState("all")

  // Mock data
  const categories = [
    { id: "all", label: "All" },
    { id: "attractions", label: "Attractions", count: 12 },
    { id: "shopping", label: "Shopping", count: 8 },
    { id: "transport", label: "Transport", count: 4 },
    { id: "hospitals", label: "Hospitals", count: 5 },
  ]

  const attractions = Array(6).fill({
    name: "Bangalore Palace",
    distanceText: "1.5 km",
    durationText: "5 min drive",
    status: "open" as const,
  })

  const shopping = Array(3).fill({
    name: "UB City Mall",
    metaText: "Mall · Open till 10 PM",
    distanceText: "0.8 km",
  })

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background no-scrollbar" role="none">
      <main id="main-content" className="contents">
      {/* 1. Hotel Header */}
      <header className="sticky top-0 z-40 flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-4 pt-6 px-4 shrink-0 transition-all">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <img src={hotel.imageUrl} alt={hotel.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-display font-bold leading-tight text-foreground">{hotel.name}</h1>
            <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{hotel.address}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1 text-[14px]">
            <Phone className="h-4 w-4" /> Call
          </Button>
          <Button variant="secondary" className="flex-1 text-[14px]">
            <Route className="h-4 w-4" /> Route
          </Button>
          <Button variant="secondary" className="flex-1 text-[14px]">
            <Wifi className="h-4 w-4" /> Wi-Fi
          </Button>
        </div>
      </header>

      {/* 2. Map Card / Toggle */}
      <div className="px-4 py-2 shrink-0">
        <div className="relative h-[132px] w-full overflow-hidden rounded-2xl bg-muted border border-border">
          {/* Placeholder for map */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#E5E3DF]">
            <MapPin className="h-8 w-8 text-brand absolute" style={{ top: "40%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as "list" | "map")}
              options={[
                { label: "Map", value: "map", icon: <Map className="h-4 w-4" /> },
                { label: "List", value: "list", icon: <List className="h-4 w-4" /> },
              ]}
            />
          </div>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="flex-1 pb-20">
          {/* 3. Category Chips */}
          <div className="sticky top-[168px] z-30 flex gap-2 overflow-x-auto bg-background/95 backdrop-blur px-4 py-3 no-scrollbar -mx-4 w-[calc(100%+32px)]">
            <div className="flex gap-2 px-4">
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  selected={activeCategory === c.id}
                  onClick={() => setActiveCategory(c.id)}
                  count={c.count}
                >
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* 4. Attractions Strip */}
          <div className="px-4 pt-2 pb-6">
            <SectionHeader title="Attractions" />
            <div
              className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x snap-mandatory"
              tabIndex={0}
              role="region"
              aria-label="Attractions — scroll to explore"
            >
              {attractions.map((place, i) => (
                <div key={i} className="snap-start shrink-0">
                  <PlaceCard {...place} />
                </div>
              ))}
            </div>
          </div>

          {/* 5. List Rows (Shopping, Transport, etc) */}
          <div className="px-4 space-y-8 pb-8">
            <section>
              <SectionHeader title="Shopping" actionLabel="See all 8" />
              <div className="flex flex-col gap-2">
                {shopping.map((place, i) => (
                  <PlaceRow key={i} {...place} />
                ))}
              </div>
            </section>
            <section>
              <SectionHeader title="Transport" actionLabel="See all 4" />
              <div className="flex flex-col gap-2">
                {shopping.map((place, i) => (
                  <PlaceRow key={i} {...place} />
                ))}
              </div>
            </section>
            <section>
              <SectionHeader title="Hospitals" actionLabel="See all 5" />
              <div className="flex flex-col gap-2">
                {shopping.map((place, i) => (
                  <PlaceRow key={i} {...place} />
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {viewMode === "map" && (
        <div className="flex-1 relative bg-[#E5E3DF] min-h-[400px]">
          {/* Map view expands here. We would render the actual map. */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium">
            Interactive Map Area (Fills Screen)
          </div>
        </div>
      )}

      {/* 6. Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-center justify-between border-t border-border bg-background px-4">
        <Button variant="ghost" className="text-muted-foreground -ml-4">
          <AlertCircle className="mr-2 h-4 w-4" /> Emergency
        </Button>
        <Button variant="ghost" className="text-muted-foreground -mr-4">
          <Globe className="mr-2 h-4 w-4" /> English
        </Button>
      </div>
      </main>
    </div>
  )
}
