"use client"

import { useState, use } from "react"
import { dummyHotel } from "@/lib/dummy-data"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { PlaceCard } from "@/components/ui/place-card"
import { Badge } from "@/components/ui/badge"
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from "@/components/ui/bottom-sheet"
import { PhoneCall, Navigation, Wifi, Map as MapIcon, ShieldAlert, Globe } from "lucide-react"

export default function GuestPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug; // eslint-disable-line @typescript-eslint/no-unused-vars
  const [activeCategory, setActiveCategory] = useState("all")
  
  // Group places by category
  const categories = [
    { id: "all", label: "All" },
    { id: "attractions", label: "Attractions" },
    { id: "shopping", label: "Shopping & Malls" },
    { id: "hospitals", label: "Hospitals" }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hotel Hero */}
      <div className="relative h-64 w-full bg-muted">
        <img 
          src={dummyHotel.coverUrl} 
          alt={dummyHotel.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h1 className="text-2xl font-display font-bold leading-tight">{dummyHotel.name}</h1>
          <p className="text-sm opacity-90">{dummyHotel.tagline}</p>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 p-3 backdrop-blur shadow-sm">
        <Button variant="secondary" size="sm" className="flex-1 mr-2 bg-brand/10 text-brand hover:bg-brand/20">
          <PhoneCall className="w-4 h-4 mr-1" /> Call
        </Button>
        <Button variant="secondary" size="sm" className="flex-1 mx-1 bg-brand/10 text-brand hover:bg-brand/20">
          <Navigation className="w-4 h-4 mr-1" /> Route
        </Button>
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <Button variant="secondary" size="sm" className="flex-1 ml-2 bg-brand/10 text-brand hover:bg-brand/20">
              <Wifi className="w-4 h-4 mr-1" /> Wi-Fi
            </Button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>Wi-Fi Access</BottomSheetTitle>
              <BottomSheetDescription>Connect to the hotel network</BottomSheetDescription>
            </BottomSheetHeader>
            <div className="mt-4 p-4 border rounded-xl bg-muted/50">
              <p className="text-sm font-medium">Network: {dummyHotel.wifi.name}</p>
              <p className="text-sm font-medium mt-2">Password: {dummyHotel.wifi.pass}</p>
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </div>

      {/* Map Card */}
      <div className="p-4">
        <div className="relative h-32 w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center cursor-pointer group">
          <div className="absolute inset-0 bg-[url('https://maps.gstatic.com/tactile/basemap_styler/v8/styles/roadmap_1.png')] bg-cover opacity-50 transition-opacity group-hover:opacity-70" />
          <Button variant="default" className="relative z-10 shadow-md">
            <MapIcon className="w-4 h-4 mr-2" /> Open Map
          </Button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="sticky top-[61px] z-20 bg-background/95 backdrop-blur border-b">
        <div className="flex overflow-x-auto p-3 gap-2 no-scrollbar">
          {categories.map(c => (
            <Chip 
              key={c.id} 
              selected={activeCategory === c.id} 
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Places Carousel */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">Around You</h2>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {dummyHotel.places.filter(p => activeCategory === 'all' || p.category === activeCategory).map(place => (
            <BottomSheet key={place.id}>
              <BottomSheetTrigger asChild>
                <button className="cursor-pointer shrink-0 text-left outline-none">
                  <PlaceCard 
                    name={place.name}
                    distanceText={place.distanceText}
                    durationText={place.durationText}
                    imageUrl={place.imageUrl}
                    status={place.status}
                  />
                </button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <img src={place.imageUrl} alt={place.name} className="w-full h-48 object-cover rounded-xl mt-4" />
                <BottomSheetHeader>
                  <BottomSheetTitle>{place.name}</BottomSheetTitle>
                  <div className="flex gap-2 items-center mt-2">
                    <Badge variant={place.status}>{(place.status as string) === 'open' ? 'Open' : (place.status as string) === 'closed' ? 'Closed' : 'Closing Soon'}</Badge>
                    <span className="text-sm text-muted-foreground">{place.hours}</span>
                  </div>
                </BottomSheetHeader>
                <div className="py-2 text-sm text-foreground">
                  <p>{place.description}</p>
                </div>
                <div className="mt-auto pt-4 flex gap-3 border-t">
                  <Button className="flex-1"><Navigation className="w-4 h-4 mr-2" /> Navigate</Button>
                </div>
              </BottomSheetContent>
            </BottomSheet>
          ))}
        </div>
      </div>

      {/* Footer Strip */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex justify-between items-center text-sm text-muted-foreground z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <div className="flex gap-3">
           <button className="flex items-center gap-1 text-red-500 hover:underline">
             <ShieldAlert className="w-4 h-4" /> Emergency
           </button>
           <button className="flex items-center gap-1 hover:underline">
             <Globe className="w-4 h-4" /> English
           </button>
         </div>
         <span className="text-xs">Powered by Platform</span>
      </div>
    </div>
  )
}
