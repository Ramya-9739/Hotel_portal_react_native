"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MapPin, Image as ImageIcon, Settings, Users, QrCode, ExternalLink } from "lucide-react"

export function AdminDashboardClient({ initialProperties }: { initialProperties: any[] }) {
  const [selectedProperty, setSelectedProperty] = useState<any | null>(initialProperties[0] || null);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-background border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="font-display font-bold text-xl text-brand">Admin Portal</h2>
          <p className="text-sm text-muted-foreground mt-1">Taj Hotels</p>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <Button variant="secondary" className="w-full justify-start font-medium"><MapPin className="mr-2 w-4 h-4" /> Properties</Button>
          <Button variant="ghost" className="w-full justify-start font-normal"><QrCode className="mr-2 w-4 h-4" /> QR Codes</Button>
          <Button variant="ghost" className="w-full justify-start font-normal"><ImageIcon className="mr-2 w-4 h-4" /> Branding</Button>
          <Button variant="ghost" className="w-full justify-start font-normal"><Users className="mr-2 w-4 h-4" /> Team</Button>
          <Button variant="ghost" className="w-full justify-start font-normal"><Settings className="mr-2 w-4 h-4" /> Settings</Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-6">
           <h1 className="text-lg font-semibold">Properties</h1>
           <Button>+ New Property</Button>
        </header>

        {/* Content area */}
        <div className="p-6 flex-1 overflow-auto flex gap-6 items-start">
           
           {/* Property List */}
           <div className="w-1/3 bg-background rounded-xl border shadow-sm overflow-hidden">
             <div className="p-4 border-b bg-muted/10 font-medium text-sm">Your Properties</div>
             <div className="divide-y">
               {initialProperties.map(prop => (
                 <div 
                   key={prop.id} 
                   className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedProperty?.id === prop.id ? 'bg-muted/50 border-l-2 border-l-brand' : ''}`}
                   onClick={() => setSelectedProperty(prop)}
                 >
                   <h3 className="font-semibold">{prop.name}</h3>
                   <p className="text-xs text-muted-foreground mt-1 truncate">{prop.address}</p>
                   <div className="mt-2 text-xs">
                     <span className={`px-2 py-0.5 rounded-full ${prop.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                       {prop.status}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Tabbed Editor Demo */}
           {selectedProperty ? (
             <div className="flex-1 bg-background rounded-xl border shadow-sm p-6 max-w-4xl">
               <div className="flex justify-between items-start mb-6">
                 <h2 className="text-xl font-semibold">Edit &quot;{selectedProperty.name}&quot;</h2>
                 <a href={`/h/${selectedProperty.slug}`} target="_blank" rel="noreferrer" className="text-sm flex items-center text-brand hover:underline">
                   View Guest Portal <ExternalLink className="w-3 h-3 ml-1" />
                 </a>
               </div>
               
               <Tabs defaultValue="details" className="w-full">
                 <TabsList className="mb-6">
                   <TabsTrigger value="details">Details</TabsTrigger>
                   <TabsTrigger value="gallery">Gallery</TabsTrigger>
                   <TabsTrigger value="places">Nearby Places</TabsTrigger>
                   <TabsTrigger value="qr">QR Code</TabsTrigger>
                 </TabsList>
                 
                 <TabsContent value="details" className="space-y-4">
                   <div className="grid gap-2 max-w-sm">
                     <label className="text-sm font-medium">Property Name</label>
                     <input type="text" className="h-11 rounded-md border px-3 focus:outline-brand" defaultValue={selectedProperty.name} />
                   </div>
                   <div className="grid gap-2 max-w-sm">
                     <label className="text-sm font-medium">Tagline</label>
                     <input type="text" className="h-11 rounded-md border px-3 focus:outline-brand" defaultValue={selectedProperty.tagline} />
                   </div>
                   <Button className="mt-4">Save Changes</Button>
                 </TabsContent>

                 <TabsContent value="gallery">
                   <div className="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                     <ImageIcon className="w-8 h-8" />
                     <p>Drag and drop images, or click to upload.</p>
                     <Button variant="outline" className="mt-2">Select Files</Button>
                   </div>
                 </TabsContent>

                 <TabsContent value="places">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Manage Places</h3>
                      <Button variant="outline" size="sm">+ Add from Google Places</Button>
                   </div>
                   <div className="rounded-lg border">
                      <div className="p-4 flex items-center justify-between border-b bg-muted/20">
                        <div>
                          <p className="font-medium">Bangalore Palace</p>
                          <p className="text-sm text-muted-foreground">Attractions • 2.5 km</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500">Remove</Button>
                      </div>
                   </div>
                 </TabsContent>

                 <TabsContent value="qr">
                   <div className="flex gap-8">
                     <div className="w-48 h-48 bg-muted rounded-xl border flex items-center justify-center">
                       <QrCode className="w-12 h-12 text-muted-foreground opacity-50" />
                     </div>
                     <div className="space-y-4">
                       <h3 className="font-medium">QR Code Styling</h3>
                       <Button variant="outline">Download PDF (Table Tent)</Button>
                       <Button variant="outline">Download SVG</Button>
                     </div>
                   </div>
                 </TabsContent>
               </Tabs>
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground border border-dashed rounded-xl">
                Select a property to edit
             </div>
           )}
        </div>
      </main>
    </div>
  )
}
