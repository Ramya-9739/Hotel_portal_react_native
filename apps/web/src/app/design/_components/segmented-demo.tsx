"use client"

import * as React from "react"
import { Segmented } from "@/components/ui/segmented"
import { Map, List } from "lucide-react"

export function SegmentedDemo() {
  const [view, setView] = React.useState("map")
  
  return (
    <Segmented
      value={view}
      onChange={setView}
      options={[
        { label: "Map", value: "map", icon: <Map className="h-4 w-4" /> },
        { label: "List", value: "list", icon: <List className="h-4 w-4" /> }
      ]}
    />
  )
}
