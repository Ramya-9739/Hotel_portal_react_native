"use client"

import * as React from "react"
import {
  Building2, QrCode, Image as ImageIcon, Users, Settings,
  LayoutDashboard, Search, Plus, ExternalLink, Star,
  GripVertical, Trash2, CheckCircle2, Download, X, ChevronRight,
  MapPin, Phone, Globe, Shield, AlertTriangle, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property {
  id: string; name: string; slug: string; address: string
  tagline?: string; phone?: string; website?: string
  status: "published" | "draft"; nearbyCount?: number
}
interface NearbyPlace {
  id: string; name: string; category: string; distanceText: string
  status: "open" | "closed" | "closing_soon"; featured: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_PROPERTIES: Property[] = [
  { id: "1", name: "Taj West End", slug: "taj-west-end", address: "25, Race Course Rd, Bengaluru", tagline: "A century of luxury in the Garden City", phone: "+91 80 6660 5660", website: "https://tajhotels.com", status: "published", nearbyCount: 29 },
  { id: "2", name: "ITC Windsor", slug: "itc-windsor", address: "Golf Course Rd, Bengaluru", tagline: "Where heritage meets modernity", phone: "+91 80 2226 9898", status: "published", nearbyCount: 17 },
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

const NAV = [
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "qr", label: "QR Codes", icon: QrCode },
  { id: "branding", label: "Branding", icon: ImageIcon },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
]

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-background rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[14px] font-medium">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  )
}

// ─── New Property Form ────────────────────────────────────────────────────────
function NewPropertySheet({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Property) => void }) {
  const [form, setForm] = React.useState({ name: "", slug: "", address: "", phone: "", tagline: "" })
  const [saving, setSaving] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      onAdd({ ...form, id: Date.now().toString(), status: "draft", nearbyCount: 0 })
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-background h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-[16px]">New Property</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2"><Label htmlFor="n-name">Property Name *</Label><Input id="n-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))} placeholder="Taj West End" /></div>
          <div className="space-y-2"><Label htmlFor="n-slug">URL Slug *</Label><Input id="n-slug" required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="taj-west-end" /></div>
          <div className="space-y-2"><Label htmlFor="n-tagline">Tagline</Label><Input id="n-tagline" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="A short memorable line" /></div>
          <div className="space-y-2"><Label htmlFor="n-address">Address *</Label><Textarea id="n-address" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="25, Race Course Rd, Bengaluru" rows={2} /></div>
          <div className="space-y-2"><Label htmlFor="n-phone">Phone</Label><Input id="n-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 80 …" /></div>
        </form>
        <div className="px-5 py-4 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={() => document.querySelector("form")?.requestSubmit()}>{saving ? "Creating…" : "Create Property"}</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Place Form ───────────────────────────────────────────────────────────
const PLACE_SUGGESTIONS = [
  "Bangalore Palace", "Cubbon Park", "UB City Mall", "Commercial Street",
  "MG Road Metro Station", "Columbia Asia Hospital", "Lalbagh Garden",
  "Indiranagar 100ft Road", "Chinnaswamy Stadium", "HAL Aerospace Museum",
]

function AddPlaceSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (p: NearbyPlace) => void }) {
  const [search, setSearch] = React.useState("")
  const filtered = PLACE_SUGGESTIONS.filter(s => s.toLowerCase().includes(search.toLowerCase()))
  const cats = ["Attractions", "Shopping", "Transport", "Hospitals", "Tech Parks"]
  const [selected, setSelected] = React.useState("")
  const [category, setCategory] = React.useState("Attractions")
  const [adding, setAdding] = React.useState(false)

  const handleAdd = () => {
    if (!selected) return
    setAdding(true)
    setTimeout(() => {
      onAdd({ id: Date.now().toString(), name: selected, category, distanceText: "—", status: "open", featured: false })
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-background h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-[16px]">Add Nearby Place</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="ap-search">Search Place</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input id="ap-search" className="pl-9" placeholder="e.g. Bangalore Palace" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="border rounded-xl divide-y max-h-[220px] overflow-y-auto">
            {filtered.map(s => (
              <button key={s} onClick={() => setSelected(s)} className={cn("w-full text-left px-4 py-2.5 text-[13px] hover:bg-muted/50 transition-colors", selected === s && "bg-brand/10 font-medium text-brand")}>
                {s} {selected === s && "✓"}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-4 py-3 text-[13px] text-muted-foreground">No matches — you can still type a custom name above</div>}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {cats.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={cn("px-3 py-1.5 rounded-full text-[13px] border transition-colors", category === c ? "bg-brand text-brand-foreground border-brand" : "border-border hover:bg-muted")}>{c}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!selected || adding} onClick={handleAdd}>{adding ? "Adding…" : "Add Place"}</Button>
        </div>
      </div>
    </div>
  )
}

// ─── QR Panel ─────────────────────────────────────────────────────────────────
function QrCodesPanel({ properties }: { properties: Property[] }) {
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-2xl space-y-4">
        <p className="text-[14px] text-muted-foreground">One QR code per property. Scan redirects guests to the live portal.</p>
        {properties.map(prop => (
          <div key={prop.id} className="bg-background rounded-2xl border p-4 flex items-center gap-4">
            <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="h-8 w-8 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px]">{prop.name}</p>
              <p className="text-[12px] text-muted-foreground font-mono mt-0.5">aroundme.app/h/{prop.slug}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5 text-[12px]"><Download className="h-3.5 w-3.5" /> PDF</Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-[12px]"><Download className="h-3.5 w-3.5" /> SVG</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Branding Panel ───────────────────────────────────────────────────────────
function BrandingPanel() {
  const [color, setColor] = React.useState("#0E5A5A")
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-xl space-y-6">
        <div className="space-y-2">
          <Label>Brand Color</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-11 w-16 rounded-lg border cursor-pointer" />
            <Input value={color} onChange={e => setColor(e.target.value)} className="font-mono w-32" />
          </div>
          <p className="text-[12px] text-muted-foreground">Used for buttons and highlights in the guest portal.</p>
        </div>
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-brand/50 transition-colors">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground">Upload a PNG or SVG, max 2 MB</p>
            <Button variant="outline" size="sm">Select File</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Font Preference</Label>
          <select className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand">
            <option>Plus Jakarta Sans (Default)</option>
            <option>Inter</option>
            <option>Roboto</option>
          </select>
        </div>
        <Button>Save Branding</Button>
      </div>
    </div>
  )
}

// ─── Team Panel ───────────────────────────────────────────────────────────────
const MOCK_TEAM = [
  { id: "u1", name: "Priya Sharma", email: "priya@tajhotels.com", role: "Admin" },
  { id: "u2", name: "Rahul Nair", email: "rahul@tajhotels.com", role: "Editor" },
]

function TeamPanel() {
  const [team, setTeam] = React.useState(MOCK_TEAM)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [confirmRemove, setConfirmRemove] = React.useState<string | null>(null)

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setTeam(t => [...t, { id: Date.now().toString(), name: inviteEmail.split("@")[0], email: inviteEmail, role: "Editor" }])
    setInviteEmail("")
  }

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-xl space-y-6">
        {confirmRemove && (
          <ConfirmDialog
            message="Remove this team member? They will lose access immediately."
            onConfirm={() => { setTeam(t => t.filter(u => u.id !== confirmRemove)); setConfirmRemove(null) }}
            onCancel={() => setConfirmRemove(null)}
          />
        )}
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input placeholder="colleague@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1" type="email" />
          <Button type="submit" disabled={!inviteEmail} className="shrink-0">Invite</Button>
        </form>
        <div className="bg-background rounded-2xl border divide-y">
          {team.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-brand/15 flex items-center justify-center text-[12px] font-bold text-brand shrink-0">
                {u.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{u.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
              </div>
              <select defaultValue={u.role} className="h-8 rounded-lg border text-[12px] px-2 bg-background mr-2">
                <option>Admin</option><option>Editor</option><option>Viewer</option>
              </select>
              <button onClick={() => setConfirmRemove(u.id)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel() {
  const [saved, setSaved] = React.useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="s-orgname">Organisation Name</Label>
          <Input id="s-orgname" defaultValue="Taj Hotels" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-timezone">Default Timezone</Label>
          <select id="s-timezone" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand">
            <option>Asia/Kolkata (IST, UTC+5:30)</option>
            <option>Asia/Dubai (GST, UTC+4)</option>
            <option>Europe/London (GMT, UTC+0)</option>
            <option>America/New_York (EST, UTC-5)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Plan</Label>
          <div className="rounded-xl border bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-[14px]">Professional</p>
              <p className="text-[12px] text-muted-foreground">Up to 10 properties · Unlimited places</p>
            </div>
            <Button variant="outline" size="sm">Upgrade</Button>
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <Label className="text-destructive">Danger Zone</Label>
          <Button variant="destructive" className="w-full">Delete Organisation</Button>
        </div>
        <Button onClick={handleSave}>
          {saved ? <><CheckCircle2 className="h-4 w-4 mr-2" />Saved</> : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminDashboardClient({ initialProperties }: { initialProperties?: Property[] }) {
  const [properties, setProperties] = React.useState<Property[]>(initialProperties?.length ? initialProperties : MOCK_PROPERTIES)
  const [activeNav, setActiveNav] = React.useState("properties")
  const [selectedProp, setSelectedProp] = React.useState<Property>(properties[0])
  const [activeTab, setActiveTab] = React.useState("places")
  const [search, setSearch] = React.useState("")
  const [propFilter, setPropFilter] = React.useState("")
  const [places, setPlaces] = React.useState<NearbyPlace[]>(MOCK_PLACES)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [showNewProp, setShowNewProp] = React.useState(false)
  const [showAddPlace, setShowAddPlace] = React.useState(false)
  const [confirmRemovePlace, setConfirmRemovePlace] = React.useState<string | null>(null)

  const handleSave = () => { setSaving(true); setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }, 800) }
  const toggleStar = (id: string) => setPlaces(p => p.map(x => x.id === id ? { ...x, featured: !x.featured } : x))
  const removePlace = (id: string) => { setPlaces(p => p.filter(x => x.id !== id)); setConfirmRemovePlace(null) }

  const filteredPlaces = places.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )
  const filteredProps = properties.filter(p =>
    p.name.toLowerCase().includes(propFilter.toLowerCase()) ||
    p.address.toLowerCase().includes(propFilter.toLowerCase())
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {showNewProp && <NewPropertySheet onClose={() => setShowNewProp(false)} onAdd={(p) => { setProperties(prev => [...prev, p]); setSelectedProp(p); setShowNewProp(false) }} />}
      {showAddPlace && <AddPlaceSheet onClose={() => setShowAddPlace(false)} onAdd={(p) => { setPlaces(prev => [...prev, p]); setShowAddPlace(false) }} />}
      {confirmRemovePlace && (
        <ConfirmDialog
          message="Remove this place from the guest portal?"
          onConfirm={() => removePlace(confirmRemovePlace)}
          onCancel={() => setConfirmRemovePlace(null)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[240px] border-r bg-background shrink-0">
        <div className="flex items-center gap-3 h-14 px-5 border-b shrink-0">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-brand-foreground" />
          </div>
          <span className="font-semibold text-[15px]">Around Me</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveNav(id)}
              className={cn("flex items-center gap-3 w-full h-11 px-3 rounded-xl text-[14px] font-medium transition-colors",
                activeNav === id ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-4 w-4 shrink-0" />{label}
            </button>
          ))}
        </nav>
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

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 md:px-6 shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center md:hidden shrink-0">
              <LayoutDashboard className="h-4 w-4 text-brand-foreground" />
            </div>
            <h1 className="text-[16px] font-semibold">{NAV.find(n => n.id === activeNav)?.label}</h1>
          </div>
          <div className="flex items-center gap-2">
            {activeNav === "properties" && (
              <Button size="sm" className="h-9 px-3 text-[13px]" onClick={() => setShowNewProp(true)}>
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            )}
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Non-Properties nav panels ── */}
          {activeNav === "qr" && <QrCodesPanel properties={properties} />}
          {activeNav === "branding" && <BrandingPanel />}
          {activeNav === "team" && <TeamPanel />}
          {activeNav === "settings" && <SettingsPanel />}

          {/* ── Properties Panel ── */}
          {activeNav === "properties" && (
            <>
              {/* Property list */}
              <aside className="w-[240px] md:w-[260px] border-r bg-muted/20 flex-col hidden sm:flex overflow-y-auto shrink-0">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input placeholder="Filter…" className="pl-8 h-8 text-[12px] bg-background" value={propFilter} onChange={e => setPropFilter(e.target.value)} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                  {filteredProps.map(prop => (
                    <button key={prop.id} onClick={() => setSelectedProp(prop)}
                      className={cn("w-full text-left px-4 py-3 hover:bg-background transition-colors group", selectedProp?.id === prop.id && "bg-background border-l-2 border-l-brand")}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium leading-snug">{prop.name}</p>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{prop.address}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          prop.status === "published" ? "bg-status-open-bg text-status-open" : "bg-muted text-muted-foreground")}>
                          {prop.status === "published" ? "Live" : "Draft"}
                        </span>
                        {prop.nearbyCount ? <span className="text-[10px] text-muted-foreground">{prop.nearbyCount} places</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              {/* Editor */}
              <main className="flex-1 flex flex-col overflow-hidden">
                {selectedProp ? (
                  <>
                    <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background shrink-0">
                      <div>
                        <h2 className="text-[15px] font-semibold">{selectedProp.name}</h2>
                        <p className="text-[12px] text-muted-foreground">{selectedProp.address}</p>
                      </div>
                      <a href={`/h/${selectedProp.slug}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                        Preview <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="rounded-none border-b h-auto p-0 bg-transparent justify-start gap-0 shrink-0 overflow-x-auto no-scrollbar">
                          {["details", "gallery", "places", "qr"].map(t => (
                            <TabsTrigger key={t} value={t}
                              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 h-12 text-[13px] font-medium capitalize">
                              {t === "places" ? "Nearby Places" : t === "qr" ? "QR Code" : t.charAt(0).toUpperCase() + t.slice(1)}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {/* Details */}
                        <TabsContent value="details" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                          <div className="max-w-xl space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              <div className="space-y-2"><Label htmlFor="p-name">Name</Label><Input id="p-name" defaultValue={selectedProp.name} /></div>
                              <div className="space-y-2"><Label htmlFor="p-slug">URL Slug</Label><Input id="p-slug" defaultValue={selectedProp.slug} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="p-tagline">Tagline</Label><Input id="p-tagline" defaultValue={selectedProp.tagline ?? ""} /></div>
                            <div className="space-y-2"><Label htmlFor="p-address">Address</Label><Textarea id="p-address" defaultValue={selectedProp.address} rows={2} /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              <div className="space-y-2"><Label htmlFor="p-phone">Phone</Label><Input id="p-phone" defaultValue={selectedProp.phone ?? ""} /></div>
                              <div className="space-y-2"><Label htmlFor="p-website">Website</Label><Input id="p-website" defaultValue={selectedProp.website ?? ""} /></div>
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

                        {/* Gallery */}
                        <TabsContent value="gallery" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                          <div className="max-w-2xl space-y-4">
                            <p className="text-[13px] text-muted-foreground">Images are stored on AWS S3. First image is the hero on the guest portal.</p>
                            <label htmlFor="gallery-upload" className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-brand/50 transition-colors cursor-pointer">
                              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div className="text-center">
                                <p className="text-[14px] font-medium">Drag photos here or click to upload</p>
                                <p className="text-[12px] text-muted-foreground mt-1">WebP, JPG or PNG · Max 5 MB each · Stored on S3</p>
                              </div>
                              <input
                                id="gallery-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                  // TODO: get S3 presigned URL from /api/upload, then PUT to S3
                                  const files = e.target.files
                                  if (files?.length) alert(`${files.length} file(s) selected — S3 upload coming soon`)
                                }}
                              />
                            </label>
                          </div>
                        </TabsContent>

                        {/* Nearby Places */}
                        <TabsContent value="places" className="flex-1 flex flex-col overflow-hidden m-0">
                          <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b bg-background shrink-0 flex-wrap">
                            <div className="relative flex-1 min-w-[160px]">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                              <Input placeholder="Search places…" className="pl-8 h-9 text-[13px]" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Button size="sm" variant="outline" className="h-9 text-[13px] shrink-0" onClick={() => setShowAddPlace(true)}>
                              <Plus className="h-4 w-4 mr-1" /> Add Place
                            </Button>
                          </div>
                          <div className="flex-1 overflow-y-auto">
                            {filteredPlaces.length === 0
                              ? <EmptyState title="No places found" description="Try a different search, or add a new place." className="m-6" />
                              : <div className="divide-y divide-border/50">
                                {filteredPlaces.map(place => (
                                  <div key={place.id} className="group flex items-center gap-3 px-4 md:px-6 py-3 h-[60px] hover:bg-muted/30 transition-colors">
                                    <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab shrink-0" aria-hidden />
                                    <div className={cn("h-2 w-2 rounded-full shrink-0", { "bg-brand": place.category === "Attractions", "bg-amber-500": place.category === "Shopping", "bg-sky-500": place.category === "Transport", "bg-rose-500": place.category === "Hospitals" })} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium truncate">{place.name}</p>
                                      <p className="text-[11px] text-muted-foreground">{place.category} · {place.distanceText}</p>
                                    </div>
                                    <Badge variant={place.status as any} className="text-[10px] shrink-0 hidden sm:inline-flex">
                                      {place.status === "open" ? "Open" : place.status === "closing_soon" ? "Closing soon" : "Closed"}
                                    </Badge>
                                    <button onClick={() => toggleStar(place.id)} aria-label={place.featured ? "Unfeature" : "Feature"}
                                      className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-muted", place.featured ? "text-amber-500" : "text-muted-foreground/40 group-hover:text-muted-foreground")}>
                                      <Star className={cn("h-4 w-4", place.featured && "fill-amber-500")} />
                                    </button>
                                    <button onClick={() => setConfirmRemovePlace(place.id)} aria-label="Remove"
                                      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            }
                          </div>
                          {/* Guest Preview */}
                          <div className="border-t bg-muted/20 px-4 md:px-6 py-3 shrink-0">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Guest Preview — Featured</p>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                              {places.filter(p => p.featured).map(p => (
                                <div key={p.id} className="shrink-0 flex items-center gap-2 bg-background border rounded-xl px-3 py-2">
                                  <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">{p.category[0]}</div>
                                  <span className="text-[12px] font-medium whitespace-nowrap">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{p.distanceText.split("·")[0].trim()}</span>
                                </div>
                              ))}
                              {places.filter(p => p.featured).length === 0 && <p className="text-[12px] text-muted-foreground italic">Star a place to feature it</p>}
                            </div>
                          </div>
                        </TabsContent>

                        {/* QR Code */}
                        <TabsContent value="qr" className="flex-1 overflow-y-auto p-4 md:p-6 m-0">
                          <div className="max-w-xl">
                            <div className="flex gap-6 items-start flex-wrap">
                              <div className="h-48 w-48 bg-background border-2 border-border rounded-2xl flex items-center justify-center shrink-0">
                                <QrCode className="h-20 w-20 text-foreground" />
                              </div>
                              <div className="space-y-4 flex-1 min-w-[200px]">
                                <div>
                                  <p className="text-[14px] font-semibold">Guest URL</p>
                                  <p className="text-[12px] text-muted-foreground mt-1 font-mono break-all">https://aroundme.app/h/{selectedProp.slug}</p>
                                </div>
                                <div className="space-y-2">
                                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => alert("PDF download: coming soon (generates table-tent PDF)")}>
                                    <Download className="h-4 w-4" /> Download PDF (Table Tent)
                                  </Button>
                                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => alert("SVG download: coming soon")}>
                                    <Download className="h-4 w-4" /> Download SVG
                                  </Button>
                                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => alert("PNG download: coming soon")}>
                                    <Download className="h-4 w-4" /> Download PNG (High-Res)
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {activeTab === "details" && (
                      <div className="h-16 border-t bg-background flex items-center justify-between px-4 md:px-6 shrink-0">
                        <p className="text-[13px] text-muted-foreground">
                          {saved ? <span className="text-status-open flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Saved</span> : "Unsaved changes"}
                        </p>
                        <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">{saving ? "Saving…" : "Save Changes"}</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState icon={<Building2 className="h-6 w-6" />} title="Select a property" description="Choose from the list to start editing." className="m-8" />
                )}
              </main>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden flex h-16 border-t bg-background">
        {NAV.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveNav(id)}
            className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors", activeNav === id ? "text-brand" : "text-muted-foreground")}>
            <Icon className="h-5 w-5" />{label}
          </button>
        ))}
      </nav>
    </div>
  )
}
