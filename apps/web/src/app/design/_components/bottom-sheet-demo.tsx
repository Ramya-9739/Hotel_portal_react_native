"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  BottomSheet, 
  BottomSheetTrigger, 
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription
} from "@/components/ui/bottom-sheet"

export function BottomSheetDemo() {
  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="outline">Open Bottom Sheet</Button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Are you absolutely sure?</BottomSheetTitle>
          <BottomSheetDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <div className="p-4 pb-8 flex flex-col gap-4">
          <Button>Continue</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}
