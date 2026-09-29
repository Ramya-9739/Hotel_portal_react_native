import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Badge } from "@/components/ui/badge"
import { PlaceCard } from "@/components/ui/place-card"
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from "@/components/ui/bottom-sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-20 sm:p-12 font-sans">
      <h1 className="text-3xl font-display font-bold mb-8 text-brand">Design System Preview</h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link Button</Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Chips</h2>
        <div className="flex flex-wrap gap-4">
          <Chip>Unselected Chip</Chip>
          <Chip selected>Selected Chip</Chip>
          <Chip variant="outline">Outline Chip</Chip>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="open">Open</Badge>
          <Badge variant="closed">Closed</Badge>
          <Badge variant="closing_soon">Closing Soon</Badge>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Place Card</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <PlaceCard 
            name="Mysore Palace" 
            distanceText="1.5 km" 
            durationText="5 min drive" 
            status="open"
          />
          <PlaceCard 
            name="Mall of Mysore" 
            distanceText="3.0 km" 
            durationText="10 min drive" 
            status="closing_soon"
          />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Bottom Sheet</h2>
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <Button>Open Place Details</Button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>Mysore Palace</BottomSheetTitle>
              <BottomSheetDescription>
                A historical palace and a royal residence. It is the official residence of the Wadiyar dynasty.
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="py-4 flex flex-col gap-4">
               <div className="flex gap-2">
                 <Badge variant="open">Open</Badge>
                 <span className="text-sm text-muted-foreground">Closes 5:30 PM</span>
               </div>
               <Button className="w-full">Get Directions</Button>
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Tabs</h2>
        <Tabs defaultValue="details" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="p-4 border rounded-xl bg-background mt-2">
            Property details go here.
          </TabsContent>
          <TabsContent value="gallery" className="p-4 border rounded-xl bg-background mt-2">
            Gallery uploads go here.
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
