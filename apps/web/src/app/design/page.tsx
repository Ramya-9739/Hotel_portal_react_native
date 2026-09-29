import * as React from "react"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Badge } from "@/components/ui/badge"
import { PlaceCard } from "@/components/ui/place-card"
import { PlaceRow } from "@/components/ui/place-row"
import { Panel, PanelHeader, PanelTitle, PanelContent } from "@/components/ui/panel"
import { SectionHeader } from "@/components/ui/section-header"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Map, List, MapPin, SearchX, Download } from "lucide-react"

// For client components we can import dynamically or mock
// Segmented, BottomSheet, Tabs
import { SegmentedDemo } from "./_components/segmented-demo"
import { BottomSheetDemo } from "./_components/bottom-sheet-demo"

export const metadata = {
  title: "Design System Preview",
}

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Design System Primitives</h1>
        <p className="text-muted-foreground mt-2">Preview of all UI components per AROUND_ME_DESIGN specs.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="icon" aria-label="Download"><Download className="h-5 w-5" /></Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Chips</h2>
        <div className="flex flex-wrap gap-4">
          <Chip>Attractions</Chip>
          <Chip count={10}>Shopping</Chip>
          <Chip selected count={5}>Selected</Chip>
          <Chip variant="outline">Outline</Chip>
          <Chip size="sm">Small Chip</Chip>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="open">Open</Badge>
          <Badge variant="closing_soon">Closes soon</Badge>
          <Badge variant="closed">Closed</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Cards & Rows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">PlaceCard (Vertical)</h3>
            <PlaceCard 
              name="Bangalore Palace"
              distanceText="1.5 km"
              durationText="5 min drive"
              status="open"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">PlaceRow (Compact)</h3>
            <div className="space-y-2 max-w-sm">
              <PlaceRow 
                name="UB City Mall"
                metaText="Mall · Open till 10 PM"
                distanceText="0.8 km"
              />
              <PlaceRow 
                name="Indiranagar 100ft Road"
                metaText="Shopping District"
                distanceText="3.2 km"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 max-w-2xl">
        <h2 className="text-xl font-semibold border-b pb-2">Containers & Headers</h2>
        <SectionHeader title="Nearby Attractions" actionLabel="See all 12" />
        <Panel>
          <PanelHeader>
            <PanelTitle>Panel Content</PanelTitle>
          </PanelHeader>
          <PanelContent>
            <p className="text-sm text-muted-foreground">Standard panel with border and radius.</p>
          </PanelContent>
        </Panel>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">States (Empty & Skeleton)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EmptyState 
            title="No places found"
            description="Try adjusting your filters or search term."
            action={<Button variant="outline">Clear Filters</Button>}
          />
          <div className="space-y-4">
            <Skeleton className="h-[156px] w-[156px]" />
            <Skeleton className="h-[56px] w-full" />
          </div>
        </div>
      </section>

      <section className="space-y-4 pb-20">
        <h2 className="text-xl font-semibold border-b pb-2">Interactive (Client)</h2>
        <div className="flex gap-4 items-center">
          <SegmentedDemo />
          <BottomSheetDemo />
        </div>
      </section>
    </main>
  )
}
