"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { MapPin, Image as ImageIcon, Settings, Users, QrCode } from "lucide-react"

export default function AdminDashboardPage() {
  // const [activeTab, setActiveTab] = useState("properties")

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-background border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h2 className="font-display font-bold text-xl text-brand">Admin Portal</h2>
          <p className="text-sm text-muted-foreground mt-1">Taj Hotels</p>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <Button variant="ghost" className="w-full justify-start font-normal"><MapPin className="mr-2 w-4 h-4" /> Properties</Button>
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
        <div className="p-6 flex-1 overflow-auto">
           {/* Tabbed Editor Demo */}
           <div className="bg-background rounded-xl border shadow-sm p-6 max-w-5xl">
             <h2 className="text-xl font-semibold mb-6">Edit &quot;Taj West End&quot;</h2>
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
                   <input type="text" className="h-11 rounded-md border px-3 focus:outline-brand" defaultValue="Taj West End" />
                 </div>
                 <div className="grid gap-2 max-w-sm">
                   <label className="text-sm font-medium">Tagline</label>
                   <input type="text" className="h-11 rounded-md border px-3 focus:outline-brand" defaultValue="Luxury Heritage Hotel" />
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
        </div>
      </main>
    </div>
  )
}
