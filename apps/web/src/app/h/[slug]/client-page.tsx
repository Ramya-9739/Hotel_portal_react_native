"use client"

import { useState } from "react"
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

// A helper to map S3 keys to public URLs for now.
function getImageUrl(key: string) {
  if (!key) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
  if (key.startsWith('http')) return key;
  // Fallback to Unsplash if LocalStack S3 is unavailable
  return `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80`;
}

export function GuestPortalClient({ property, brand, places }: { property: any, brand: any, places: any[] }) {
  const [activeCategory, setActiveCategory] = useState("all")
  
  // Extract unique categories from places
  const categoriesMap = new Map();
  categoriesMap.set("all", "All");
  
  places.forEach(p => {
    if (p.category_key && !categoriesMap.has(p.category_key)) {
      categoriesMap.set(p.category_key, p.category_label || p.category_key);
    }
  });
  
  const categories = Array.from(categoriesMap.entries()).map(([id, label]) => ({ id, label }));

  const coverUrl = getImageUrl(property.cover_key);
  const brandColor = brand?.brand_primary_color || '#000000';

  return (
    <div className="min-h-screen bg-background text-foreground pb-24" style={{ '--brand': brandColor } as any}>
      {/* Hotel Hero */}
      <div className="relative h-64 w-full bg-muted">
        <img 
          src={coverUrl} 
          alt={property.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 text-white w-full">
          {brand?.logo_key && (
             <img src={getImageUrl(brand.logo_key)} alt="Logo" className="h-10 mb-2 object-contain" />
          )}
          <h1 className="text-3xl font-display font-bold leading-tight drop-shadow-md">{property.name}</h1>
          <p className="text-sm opacity-90 font-medium drop-shadow-sm mt-1">{property.tagline}</p>
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
        {property.show_wifi && property.wifi_name && (
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
                <p className="text-sm font-medium">Network: {property.wifi_name}</p>
                <p className="text-sm font-medium mt-2">Password: {property.wifi_password}</p>
              </div>
            </BottomSheetContent>
          </BottomSheet>
        )}
      </div>

      {/* Map Card */}
      <div className="p-4">
        <div className="relative h-32 w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center cursor-pointer group shadow-sm transition-all hover:shadow-md">
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
          {places.filter(p => activeCategory === 'all' || p.category_key === activeCategory).map(place => (
            <BottomSheet key={place.id}>
              <BottomSheetTrigger asChild>
                <button className="cursor-pointer shrink-0 text-left outline-none transition-transform hover:scale-[1.02] active:scale-[0.98]">
                  <PlaceCard 
                    name={place.name}
                    distanceText={place.distance_m ? `${(place.distance_m / 1000).toFixed(1)} km` : 'Near'}
                    durationText={place.duration_walk_s ? `${Math.ceil(place.duration_walk_s / 60)} min walk` : ''}
                    imageUrl={getImageUrl(place.image_keys?.[0])}
                    status={place.hours || 'open'}
                  />
                </button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <img src={getImageUrl(place.image_keys?.[0])} alt={place.name} className="w-full h-48 object-cover rounded-xl mt-4" />
                <BottomSheetHeader>
                  <BottomSheetTitle>{place.name}</BottomSheetTitle>
                  <div className="flex gap-2 items-center mt-2">
                    <span className="text-sm text-muted-foreground">{place.hours}</span>
                  </div>
                </BottomSheetHeader>
                <div className="py-2 text-sm text-foreground leading-relaxed">
                  <p>{place.description}</p>
                </div>
                <div className="mt-auto pt-4 flex gap-3 border-t">
                  <Button className="flex-1"><Navigation className="w-4 h-4 mr-2" /> Navigate</Button>
                </div>
              </BottomSheetContent>
            </BottomSheet>
          ))}
          {places.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center w-full">
               No places found around this property.
            </div>
          )}
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
