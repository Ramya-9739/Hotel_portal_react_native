"use client"

import * as React from "react"
import {
  MapPin, QrCode, Image as ImageIcon, Users, Settings,
  LayoutDashboard, Search, Plus, ExternalLink, Star,
  GripVertical, Trash2, Phone, Globe, ChevronRight,
  Download, X, CheckCircle2, AlertCircle, Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property {
  id: string
  name: string
  slug: string
  address: string
  tagline?: string
  phone?: string
  website?: string
  status: "published" | "draft"
  nearbyCount?: number
}

interface NearbyPlace {
  id: string
  name: string
  category: string
  distanceText: string
  status: "open" | "closed" | "closing_soon"
  featured: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PROPERTIES: Property[] = [
  { id: "1", name: "Taj West End", slug: "taj-west-end", address: "25, Race Course Rd, Bengaluru", tagline: "A century of luxury in the Garden City", phone: "+91 80 6660 5660", website: "https://tajhotels.com", status: "published", nearbyCount: 29 },
  { id: "2", name: "ITC Windsor", slug: "itc-windsor", address: "Golf Course Rd, Bengaluru", tagline: "Where heritage meets modernity", status: "published", nearbyCount: 17 },
  { id: "3", name: "Mysuru Heritage Lodge", slug: "mysuru-heritage-lodge", address: "Palace Rd, Mysuru", status: "draft", nearbyCount: 0 },
]

const MOCK_PLACES: NearbyPlace[] = [
  { id: "p1", name: "Bangalore Palace", category: "Attractions", distanceText: "1.5 km · 5 min", status: "open", featured: true },
  { id: "p2", name: "UB City Mall", category: "Shopping", distanceText: "0.8 km · 3 min", status: "open", featured: false },
  { id: "p3", name: "Indiranagar 100ft Road", category: "Shopping", distanceText: "3.2 km · 12 min", status: "open", featured: false },
  { id: "p4", name: "MG Road Metro Station", category: "Transport", distanceText: "1.1 km · 4 min", status: "open", featured: true },
  { id: "p5", name: "Columbia Asia Hospital", category: "Hospitals", distanceText: "2.4 km · 9 min", status: "open", featured: false },
  { id: "p6", name: "Chinnaswamy Stadium", category: "Attractions", distanceText: "2.0 km · 7 min", status: "closed", featured: false },
]

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "branding", label: "Branding", icon: ImageIcon },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminDashboardClient({ initialProperties }: { initialProperties?: Property[] }) {
  const properties = initialProperties?.length ? initialProperties : MOCK_PROPERTIES
  const [activeNav, setActiveNav] = React.useState("properties")
  const [selectedProp, setSelectedProp] = React.useState<Property>(properties[0])
  const [activeTab, setActiveTab] = React.useState("places")
  const [search, setSearch] = React.useState("")
  const [places, setPlaces] = React.useState<NearbyPlace[]>(MOCK_PLACES)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }, 800)
  }

  const toggleStar = (id: string) =>
    setPlaces(p => p.map(x => x.id === id ? { ...x, featured: !x.featured } : x))

  const removePlace = (id: string) =>
    setPlaces(p => p.filter(x => x.id !== id))

  const filteredPlaces = places.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar (desktop) ──────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[240px] lg:w-[240px] border-r bg-background shrink-0 transition-all">
        {/* Logo */}
        <div className="flex items-center gap-3 h-14 px-5 border-b shrink-0">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-brand-foreground" />
          </div>
          <span className="font-semibold text-[15px] text-foreground">Around Me</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={cn(
                "flex items-center gap-3 w-full h-11 px-3 rounded-xl text-[14px] font-medium transition-colors",
                activeNav === id
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Org badge */}
        <div className="px-4 py-4 border-t">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-brand/20 flex items-center justify-center text-[11px] font-bold text-brand">TH</div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate">Taj Hotels</p>
              <p className="text-[11px] text-muted-foreground">client_admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 md:px-6 shrink-0 gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile logo */}
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center md:hidden shrink-0">
              <LayoutDashboard className="h-4 w-4 text-brand-foreground" />
            </div>
            <h1 className="text-[16px] font-semibold text-foreground">Properties</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="Search properties…" className="pl-9 h-9 w-48 text-[13px]" />
            </div>
            <Button size="sm" className="h-9 px-3 text-[13px]">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Property list (left panel) */}
          <aside className="w-[240px] md:w-[260px] border-r bg-muted/20 flex-col hidden sm:flex overflow-y-auto shrink-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input placeholder="Filter…" className="pl-8 h-8 text-[12px] bg-background" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {properties.map(prop => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProp(prop)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-background transition-colors group",
                    selectedProp?.id === prop.id && "bg-background border-l-2 border-l-brand"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-foreground leading-snug">{prop.name}</p>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{prop.address}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      prop.status === "published" ? "bg-status-open-bg text-status-open" : "bg-muted text-muted-foreground"
                    )}>
                      {prop.status === "published" ? "Live" : "Draft"}
                    </span>
                    {prop.nearbyCount ? (
                      <span className="text-[10px] text-muted-foreground">{prop.nearbyCount} places</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Editor panel */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {selectedProp ? (
              <>
                {/* Editor header */}
                <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background shrink-0">
                  <div>
                    <h2 className="text-[15px] font-semibold">{selectedProp.name}</h2>
                    <p className="text-[12px] text-muted-foreground">{selectedProp.address}</p>
                  </div>
                  <a
                    href={`/h/${selectedProp.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
                  >
                    Preview <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Tabs */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="rounded-none border-b h-auto p-0 bg-transparent justify-start gap-0 shrink-0 overflow-x-auto no-scrollbar">
                      {["details", "gallery", "places", "qr"].map(t => (
                        <TabsTrigger
                          key={t}
                          value={t}
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 h-12 text-[13px] font-medium capitalize"
                        >
                          {t === "places" ? "Nearby Places" : t === "qr" ? "QR Code" : t.charAt(0).toUpperCase() + t.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* ── Details Tab ── */}
                    <TabsContent value="details" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                      <div className="max-w-xl space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="prop-name">Property Name</Label>
                            <Input id="prop-name" defaultValue={selectedProp.name} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prop-slug">URL Slug</Label>
                            <Input id="prop-slug" defaultValue={selectedProp.slug} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prop-tagline">Tagline</Label>
                          <Input id="prop-tagline" defaultValue={selectedProp.tagline ?? ""} placeholder="A short memorable line about the property" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prop-address">Address</Label>
                          <Textarea id="prop-address" defaultValue={selectedProp.address} rows={2} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="prop-phone">Phone</Label>
                            <Input id="prop-phone" defaultValue={selectedProp.phone ?? ""} placeholder="+91 80 …" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prop-website">Website</Label>
                            <Input id="prop-website" defaultValue={selectedProp.website ?? ""} placeholder="https://…" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <div className="flex gap-3">
                            {(["published", "draft"] as const).map(s => (
                              <label key={s} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="status" defaultChecked={selectedProp.status === s} className="accent-brand h-4 w-4" />
                                <span className="text-[14px] capitalize">{s === "published" ? "Live" : "Draft"}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── Gallery Tab ── */}
                    <TabsContent value="gallery" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                      <div className="max-w-2xl">
                        <p className="text-[13px] text-muted-foreground mb-4">Up to 10 images. First image is the hero. Drag to reorder.</p>
                        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3 hover:border-brand/50 transition-colors cursor-pointer">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[14px] font-medium">Drag photos here</p>
                            <p className="text-[12px] text-muted-foreground mt-1">WebP, JPG or PNG · Max 5 MB each</p>
                          </div>
                          <Button variant="outline" size="sm">Select Files</Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── Nearby Places Tab ── */}
                    <TabsContent value="places" className="flex-1 flex flex-col overflow-hidden m-0">
                      {/* Places toolbar */}
                      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b bg-background shrink-0 flex-wrap">
                        <div className="relative flex-1 min-w-[160px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            placeholder="Search places…"
                            className="pl-8 h-9 text-[13px]"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                          />
                        </div>
                        <Button size="sm" variant="outline" className="h-9 text-[13px] shrink-0">
                          <Plus className="h-4 w-4 mr-1" /> Add Place
                        </Button>
                      </div>

                      {/* Places list */}
                      <div className="flex-1 overflow-y-auto">
                        {filteredPlaces.length === 0 ? (
                          <EmptyState
                            title="No places found"
                            description="Try a different search, or add a new place."
                            className="m-6"
                          />
                        ) : (
                          <div className="divide-y divide-border/50">
                            {filteredPlaces.map(place => (
                              <div key={place.id} className="group flex items-center gap-3 px-4 md:px-6 py-3 h-[60px] hover:bg-muted/30 transition-colors">
                                {/* Drag handle */}
                                <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab shrink-0" aria-hidden />
                                {/* Category colour dot */}
                                <div className={cn("h-2 w-2 rounded-full shrink-0", {
                                  "bg-brand": place.category === "Attractions",
                                  "bg-amber-500": place.category === "Shopping",
                                  "bg-sky-500": place.category === "Transport",
                                  "bg-rose-500": place.category === "Hospitals",
                                })} />
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium truncate">{place.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{place.category} · {place.distanceText}</p>
                                </div>
                                {/* Status badge */}
                                <Badge
                                  variant={place.status as any}
                                  className="text-[10px] shrink-0 hidden sm:inline-flex"
                                >
                                  {place.status === "open" ? "Open" : place.status === "closing_soon" ? "Closing soon" : "Closed"}
                                </Badge>
                                {/* Star */}
                                <button
                                  onClick={() => toggleStar(place.id)}
                                  aria-label={place.featured ? "Unfeature" : "Feature"}
                                  className={cn(
                                    "h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-muted",
                                    place.featured ? "text-amber-500" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                                  )}
                                >
                                  <Star className={cn("h-4 w-4", place.featured && "fill-amber-500")} />
                                </button>
                                {/* Remove */}
                                <button
                                  onClick={() => removePlace(place.id)}
                                  aria-label="Remove place"
                                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors group-hover:text-muted-foreground"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mini guest preview strip */}
                      <div className="border-t bg-muted/20 px-4 md:px-6 py-3 shrink-0">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Guest Preview — Featured</p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                          {places.filter(p => p.featured).map(p => (
                            <div key={p.id} className="shrink-0 flex items-center gap-2 bg-background border rounded-xl px-3 py-2">
                              <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                                {p.category[0]}
                              </div>
                              <span className="text-[12px] font-medium whitespace-nowrap">{p.name}</span>
                              <span className="text-[10px] text-muted-foreground">{p.distanceText.split("·")[0].trim()}</span>
                            </div>
                          ))}
                          {places.filter(p => p.featured).length === 0 && (
                            <p className="text-[12px] text-muted-foreground italic">Star a place to feature it</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── QR Tab ── */}
                    <TabsContent value="qr" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                      <div className="max-w-xl">
                        <div className="flex gap-6 items-start flex-wrap">
                          {/* QR preview */}
                          <div className="h-48 w-48 bg-background border-2 border-border rounded-2xl flex items-center justify-center shrink-0">
                            <QrCode className="h-20 w-20 text-foreground" />
                          </div>
                          <div className="space-y-4 flex-1 min-w-[200px]">
                            <div>
                              <p className="text-[14px] font-semibold">Guest URL</p>
                              <p className="text-[12px] text-muted-foreground mt-1 font-mono break-all">
                                https://aroundme.app/h/{selectedProp.slug}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Button variant="outline" className="w-full justify-start gap-2">
                                <Download className="h-4 w-4" /> Download PDF (Table Tent)
                              </Button>
                              <Button variant="outline" className="w-full justify-start gap-2">
                                <Download className="h-4 w-4" /> Download SVG
                              </Button>
                              <Button variant="outline" className="w-full justify-start gap-2">
                                <Download className="h-4 w-4" /> Download PNG (High-Res)
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Sticky save bar */}
                {activeTab === "details" && (
                  <div className="h-16 border-t bg-background flex items-center justify-between px-4 md:px-6 shrink-0">
                    <p className="text-[13px] text-muted-foreground">
                      {saved ? (
                        <span className="text-status-open flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Saved</span>
                      ) : "Unsaved changes"}
                    </p>
                    <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={<Building2 className="h-6 w-6" />}
                title="Select a property"
                description="Choose a property from the list to start editing."
                className="m-8"
              />
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden flex h-16 border-t bg-background">
        {NAV.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveNav(id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              activeNav === id ? "text-brand" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
