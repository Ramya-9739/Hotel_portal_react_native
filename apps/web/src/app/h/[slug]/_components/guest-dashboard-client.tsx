"use client"

import * as React from "react"
import {
  MapPin, Phone, Route, Wifi, AlertCircle, Globe,
  Map, List, X, ExternalLink, Navigation, Clock, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/ui/segmented"
import { Chip } from "@/components/ui/chip"
import { PlaceCard } from "@/components/ui/place-card"
import { PlaceRow } from "@/components/ui/place-row"
import { SectionHeader } from "@/components/ui/section-header"
import { Badge } from "@/components/ui/badge"
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from "@/components/ui/bottom-sheet"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Hotel {
  id: string
  name: string
  address: string
  imageUrl: string
  phone?: string
  wifiSsid?: string
  wifiPassword?: string
}

interface Place {
  id: string
  name: string
  category: string
  distanceText: string
  durationText?: string
  imageUrl?: string
  metaText?: string
  status: "open" | "closed" | "closing_soon"
  address?: string
  phone?: string
  hours?: string
  description?: string
}

// ─── Rich mock data ───────────────────────────────────────────────────────────
const MOCK_ATTRACTIONS: Place[] = [
  { id: "a1", name: "Bangalore Palace", category: "Attractions", distanceText: "1.5 km", durationText: "5 min drive", status: "open", address: "Vasanth Nagar, Bengaluru", hours: "Mon–Sun 10 AM – 5:30 PM", description: "A stunning palace built in 1878 inspired by Windsor Castle.", imageUrl: "https://images.unsplash.com/photo-1593693397690-362a06bf4d13?auto=format&fit=crop&q=80&w=400&h=300" },
  { id: "a2", name: "Cubbon Park", category: "Attractions", distanceText: "2.1 km", durationText: "8 min drive", status: "open", address: "Kasturba Rd, Bengaluru", hours: "6 AM – 6 PM daily", imageUrl: "https://images.unsplash.com/photo-1589136777351-fdc9c9cb1669?auto=format&fit=crop&q=80&w=400&h=300" },
  { id: "a3", name: "Visvesvaraya Museum", category: "Attractions", distanceText: "2.4 km", durationText: "9 min drive", status: "open", address: "Kasturba Rd, Bengaluru", hours: "10 AM – 5 PM, closed Mon", imageUrl: "https://images.unsplash.com/photo-1566324209587-5742c38cc017?auto=format&fit=crop&q=80&w=400&h=300" },
  { id: "a4", name: "Lalbagh Botanical Garden", category: "Attractions", distanceText: "4.2 km", durationText: "15 min drive", status: "open", address: "Mavalli, Bengaluru", imageUrl: "https://images.unsplash.com/photo-1580196656754-3e9114d59a7f?auto=format&fit=crop&q=80&w=400&h=300" },
  { id: "a5", name: "HAL Aerospace Museum", category: "Attractions", distanceText: "8.0 km", durationText: "25 min drive", status: "closed", address: "HAL Airport Rd, Bengaluru", hours: "9 AM – 5 PM, closed Mon", imageUrl: "https://images.unsplash.com/photo-1614271810578-8d4eecb0e8b3?auto=format&fit=crop&q=80&w=400&h=300" },
  { id: "a6", name: "Chinnaswamy Stadium", category: "Attractions", distanceText: "2.0 km", durationText: "7 min drive", status: "closing_soon", address: "MG Road, Bengaluru", imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400&h=300" },
]

const MOCK_SHOPPING: Place[] = [
  { id: "s1", name: "UB City Mall", category: "Shopping", distanceText: "0.8 km", metaText: "Mall · Open till 10 PM", durationText: "3 min walk", status: "open", address: "24, Vittal Mallya Rd, Bengaluru" },
  { id: "s2", name: "Indiranagar 100ft Road", category: "Shopping", distanceText: "3.2 km", metaText: "Shopping District", durationText: "12 min drive", status: "open" },
  { id: "s3", name: "Commercial Street", category: "Shopping", distanceText: "1.5 km", metaText: "Street Market · Open till 9 PM", durationText: "6 min drive", status: "open" },
]

const MOCK_TRANSPORT: Place[] = [
  { id: "t1", name: "MG Road Metro Station", category: "Transport", distanceText: "1.1 km", metaText: "Metro · 5 AM – 11 PM", durationText: "4 min walk", status: "open" },
  { id: "t2", name: "Kempegowda Bus Station", category: "Transport", distanceText: "5.0 km", metaText: "Bus Terminus", durationText: "18 min drive", status: "open" },
  { id: "t3", name: "KSR Bengaluru Railway Station", category: "Transport", distanceText: "6.2 km", metaText: "Railway", durationText: "22 min drive", status: "open" },
  { id: "t4", name: "Kempegowda Int'l Airport", category: "Transport", distanceText: "38 km", metaText: "Airport · 24 hrs", durationText: "60 min drive", status: "open" },
]

const MOCK_HOSPITALS: Place[] = [
  { id: "h1", name: "Columbia Asia Hospital", category: "Hospitals", distanceText: "2.4 km", metaText: "Hospital · 24 hrs", durationText: "9 min drive", status: "open", phone: "+91 80 6161 6161" },
  { id: "h2", name: "Manipal Hospital", category: "Hospitals", distanceText: "3.5 km", metaText: "Hospital · 24 hrs", durationText: "13 min drive", status: "open", phone: "+91 80 2502 4444" },
  { id: "h3", name: "Apollo Pharmacy", category: "Hospitals", distanceText: "0.5 km", metaText: "Pharmacy · Open till 11 PM", durationText: "2 min walk", status: "open" },
]

const CATEGORIES = [
  { id: "all", label: "All", count: undefined },
  { id: "attractions", label: "Attractions", count: MOCK_ATTRACTIONS.length },
  { id: "shopping", label: "Shopping", count: MOCK_SHOPPING.length },
  { id: "transport", label: "Transport", count: MOCK_TRANSPORT.length },
  { id: "hospitals", label: "Hospitals", count: MOCK_HOSPITALS.length },
]

// ─── Place Detail Sheet ───────────────────────────────────────────────────────
function PlaceDetailSheet({ place, hotel }: { place: Place; hotel: Hotel }) {
  const mapsUrl = place.address
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hotel.address)}&destination=${encodeURIComponent(place.address)}`
    : `https://www.google.com/maps/search/${encodeURIComponent(place.name + " " + hotel.address)}`

  return (
    <BottomSheetContent>
      <div className="px-4 pb-safe">
        <BottomSheetHeader className="text-left px-0 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant={place.status as any} className="mb-2">
                {place.status === "open" ? "Open now" : place.status === "closing_soon" ? "Closing soon" : "Closed"}
              </Badge>
              <BottomSheetTitle className="text-[20px]">{place.name}</BottomSheetTitle>
              <BottomSheetDescription className="text-[13px] mt-1">{place.category}</BottomSheetDescription>
            </div>
          </div>
        </BottomSheetHeader>

        {/* Distance/Duration tiles */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Distance</p>
            <p className="text-[18px] font-semibold mt-1">{place.distanceText}</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Drive time</p>
            <p className="text-[18px] font-semibold mt-1">{place.durationText ?? "—"}</p>
          </div>
        </div>

        {place.hours && (
          <div className="flex items-start gap-2 py-3 border-t border-border">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[14px]">{place.hours}</p>
          </div>
        )}
        {place.address && (
          <div className="flex items-start gap-2 py-3 border-t border-border">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[14px]">{place.address}</p>
          </div>
        )}
        {place.description && (
          <p className="text-[14px] text-muted-foreground py-3 border-t border-border">{place.description}</p>
        )}

        {/* CTA bar */}
        <div className="flex gap-3 pt-4 pb-6">
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex-1">
            <Button className="w-full gap-2">
              <Navigation className="h-4 w-4" /> Directions from hotel
            </Button>
          </a>
          {place.phone && (
            <a href={`tel:${place.phone}`}>
              <Button variant="outline" size="icon" aria-label={`Call ${place.name}`}>
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </BottomSheetContent>
  )
}

// ─── "See All" Sheet ─────────────────────────────────────────────────────────
function SeeAllSheet({ title, places, hotel }: { title: string; places: Place[]; hotel: Hotel }) {
  return (
    <BottomSheetContent>
      <div className="px-4 pb-safe">
        <BottomSheetHeader className="text-left px-0 pt-4">
          <BottomSheetTitle>{title}</BottomSheetTitle>
          <BottomSheetDescription>{places.length} places nearby</BottomSheetDescription>
        </BottomSheetHeader>
        <div className="flex flex-col gap-1 mt-2 pb-8 overflow-y-auto max-h-[60vh]">
          {places.map(place => (
            <BottomSheet key={place.id}>
              <BottomSheetTrigger asChild>
                <button className="text-left w-full">
                  <PlaceRow
                    name={place.name}
                    metaText={place.metaText ?? `${place.category} · ${place.status === "open" ? "Open" : "Closed"}`}
                    distanceText={place.distanceText}
                  />
                </button>
              </BottomSheetTrigger>
              <PlaceDetailSheet place={place} hotel={hotel} />
            </BottomSheet>
          ))}
        </div>
      </div>
    </BottomSheetContent>
  )
}

// ─── WiFi Sheet ───────────────────────────────────────────────────────────────
function WifiSheet({ ssid, password }: { ssid?: string; password?: string }) {
  return (
    <BottomSheetContent>
      <div className="px-4 pb-8">
        <BottomSheetHeader className="text-left px-0 pt-4">
          <BottomSheetTitle>Wi-Fi</BottomSheetTitle>
          <BottomSheetDescription>Connect to the hotel network</BottomSheetDescription>
        </BottomSheetHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Network Name (SSID)</p>
            <p className="text-[18px] font-semibold">{ssid ?? "TajHotels_Guest"}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Password</p>
            <p className="text-[18px] font-semibold font-mono">{password ?? "welcome@taj"}</p>
          </div>
          <p className="text-[12px] text-muted-foreground">Wi-Fi is complimentary for all guests. For assistance, dial 0 from your room phone.</p>
        </div>
      </div>
    </BottomSheetContent>
  )
}

// ─── Emergency Sheet ──────────────────────────────────────────────────────────
function EmergencySheet({ hotel }: { hotel: Hotel }) {
  const numbers = [
    { label: "Hotel Front Desk", number: hotel.phone ?? "+91 80 6660 5660", primary: true },
    { label: "Police", number: "100" },
    { label: "Ambulance / Medical", number: "108" },
    { label: "Fire", number: "101" },
    { label: "National Emergency", number: "112" },
    { label: "Women Helpline", number: "181" },
  ]
  return (
    <BottomSheetContent>
      <div className="px-4 pb-8">
        <BottomSheetHeader className="text-left px-0 pt-4">
          <BottomSheetTitle>Emergency Numbers</BottomSheetTitle>
          <BottomSheetDescription>India · Tap to call</BottomSheetDescription>
        </BottomSheetHeader>
        <div className="flex flex-col gap-2 mt-4">
          {numbers.map(n => (
            <a key={n.label} href={`tel:${n.number}`} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:bg-muted/50 transition-colors">
              <div>
                <p className={cn("text-[14px] font-medium", n.primary && "text-brand")}>{n.label}</p>
                {n.primary && <p className="text-[11px] text-muted-foreground">24 hours</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold font-mono">{n.number}</span>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </BottomSheetContent>
  )
}

// ─── Language Sheet ───────────────────────────────────────────────────────────
const LANGUAGES = ["English", "हिंदी", "ಕನ್ನಡ", "தமிழ்", "Français", "Deutsch", "中文", "العربية", "日本語"]

function LanguageSheet({ currentLang, onSelect }: { currentLang: string; onSelect: (l: string) => void }) {
  return (
    <BottomSheetContent>
      <div className="px-4 pb-8">
        <BottomSheetHeader className="text-left px-0 pt-4">
          <BottomSheetTitle>Language</BottomSheetTitle>
          <BottomSheetDescription>Choose your preferred language</BottomSheetDescription>
        </BottomSheetHeader>
        <div className="flex flex-col gap-1 mt-4">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => onSelect(lang)}
              className={cn(
                "flex items-center justify-between h-12 px-4 rounded-xl text-[15px] font-medium transition-colors",
                currentLang === lang ? "bg-brand text-brand-foreground" : "hover:bg-muted"
              )}
            >
              {lang}
              {currentLang === lang && <span className="text-[12px]">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </BottomSheetContent>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function GuestDashboardClient({ hotel }: { hotel: Hotel }) {
  const [viewMode, setViewMode] = React.useState<"list" | "map">("list")
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [language, setLanguage] = React.useState("English")

  const mapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address)}`

  // Category → places mapping
  const placesByCat: Record<string, Place[]> = {
    attractions: MOCK_ATTRACTIONS,
    shopping: MOCK_SHOPPING,
    transport: MOCK_TRANSPORT,
    hospitals: MOCK_HOSPITALS,
  }

  const showSection = (catId: string) => activeCategory === "all" || activeCategory === catId

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background no-scrollbar" role="none">
      <main id="main-content" className="contents">

        {/* ── 1. Hotel Header ─────────────────────────────────── */}
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
            {/* Call — functional tel: link */}
            {hotel.phone ? (
              <a href={`tel:${hotel.phone}`} className="flex-1">
                <Button variant="secondary" className="w-full text-[14px]">
                  <Phone className="h-4 w-4" /> Call
                </Button>
              </a>
            ) : (
              <Button variant="secondary" className="flex-1 text-[14px]" disabled>
                <Phone className="h-4 w-4" /> Call
              </Button>
            )}
            {/* Route — opens Google Maps */}
            <a href={mapsRouteUrl} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="secondary" className="w-full text-[14px]">
                <Route className="h-4 w-4" /> Route
              </Button>
            </a>
            {/* Wi-Fi — bottom sheet */}
            <BottomSheet>
              <BottomSheetTrigger asChild>
                <Button variant="secondary" className="flex-1 text-[14px]">
                  <Wifi className="h-4 w-4" /> Wi-Fi
                </Button>
              </BottomSheetTrigger>
              <WifiSheet ssid={hotel.wifiSsid} password={hotel.wifiPassword} />
            </BottomSheet>
          </div>
        </header>

        {/* ── 2. Map Card / Toggle ─────────────────────────────── */}
        <div className="px-4 py-2 shrink-0">
          <div className="relative h-[132px] w-full overflow-hidden rounded-2xl bg-muted border border-border">
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

        {/* ── List View ─────────────────────────────────────────── */}
        {viewMode === "list" && (
          <div className="flex-1 pb-20">
            {/* 3. Category Chips — filter sections */}
            <div className="sticky top-[168px] z-30 flex gap-2 overflow-x-auto bg-background/95 backdrop-blur px-4 py-3 no-scrollbar -mx-4 w-[calc(100%+32px)]">
              <div className="flex gap-2 px-4">
                {CATEGORIES.map((c) => (
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
            {showSection("attractions") && (
              <div className="px-4 pt-2 pb-6">
                <SectionHeader title="Attractions" />
                <div
                  className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x snap-mandatory"
                  tabIndex={0}
                  role="region"
                  aria-label="Attractions — scroll to explore"
                >
                  {MOCK_ATTRACTIONS.map((place) => (
                    <BottomSheet key={place.id}>
                      <BottomSheetTrigger asChild>
                        <button className="snap-start shrink-0 text-left">
                          <PlaceCard
                            name={place.name}
                            distanceText={place.distanceText}
                            durationText={place.durationText}
                            status={place.status}
                            imageUrl={place.imageUrl}
                          />
                        </button>
                      </BottomSheetTrigger>
                      <PlaceDetailSheet place={place} hotel={hotel} />
                    </BottomSheet>
                  ))}
                </div>
              </div>
            )}

            {/* 5. List sections */}
            <div className="px-4 space-y-8 pb-8">
              {(
                [
                  { catId: "shopping", title: "Shopping", places: MOCK_SHOPPING },
                  { catId: "transport", title: "Transport", places: MOCK_TRANSPORT },
                  { catId: "hospitals", title: "Hospitals", places: MOCK_HOSPITALS },
                ] as const
              ).map(({ catId, title, places }) =>
                showSection(catId) ? (
                  <section key={catId}>
                    <BottomSheet>
                      <div className="flex items-center justify-between py-4">
                        <h2 className="text-[18px] font-semibold text-foreground tracking-tight">{title}</h2>
                        <BottomSheetTrigger asChild>
                          <button className="flex items-center gap-1 text-[14px] font-medium text-brand hover:underline h-[44px] px-2">
                            See all {places.length} <ChevronRight className="h-4 w-4" />
                          </button>
                        </BottomSheetTrigger>
                      </div>
                      <div className="flex flex-col gap-2">
                        {places.slice(0, 3).map((place) => (
                          <BottomSheet key={place.id}>
                            <BottomSheetTrigger asChild>
                              <button className="text-left w-full">
                                <PlaceRow
                                  name={place.name}
                                  metaText={place.metaText}
                                  distanceText={place.distanceText}
                                />
                              </button>
                            </BottomSheetTrigger>
                            <PlaceDetailSheet place={place} hotel={hotel} />
                          </BottomSheet>
                        ))}
                      </div>
                      <SeeAllSheet title={title} places={places} hotel={hotel} />
                    </BottomSheet>
                  </section>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* ── Map View ──────────────────────────────────────────── */}
        {viewMode === "map" && (
          <div className="flex-1 relative bg-[#E5E3DF] flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <MapPin className="h-12 w-12 text-brand" />
            <p className="text-[14px] font-medium text-foreground">{hotel.name}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open in Google Maps
              </Button>
            </a>
          </div>
        )}

        {/* ── Bottom Bar ─────────────────────────────────────────── */}
        <div className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-center justify-between border-t border-border bg-background px-4">
          <BottomSheet>
            <BottomSheetTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground -ml-4">
                <AlertCircle className="mr-2 h-4 w-4" /> Emergency
              </Button>
            </BottomSheetTrigger>
            <EmergencySheet hotel={hotel} />
          </BottomSheet>

          <BottomSheet>
            <BottomSheetTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground -mr-4">
                <Globe className="mr-2 h-4 w-4" /> {language}
              </Button>
            </BottomSheetTrigger>
            <LanguageSheet currentLang={language} onSelect={setLanguage} />
          </BottomSheet>
        </div>

      </main>
    </div>
  )
}
