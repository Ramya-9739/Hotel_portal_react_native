"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, Download, Printer } from "lucide-react"

export function QrStudio() {
  const [color, setColor] = useState("#0F5C5C")
  
  return (
    <div className="flex flex-col md:flex-row gap-8 bg-background p-6 rounded-xl border">
      {/* Settings */}
      <div className="flex-1 space-y-6">
        <div>
          <h3 className="font-medium mb-3">QR Style Options</h3>
          <div className="grid gap-2">
            <label className="text-sm">Primary Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={color} 
                onChange={e => setColor(e.target.value)} 
                className="w-10 h-10 rounded border"
              />
              <span className="text-sm self-center">{color}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Placement Variants</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Lobby</Button>
            <Button variant="outline" size="sm">Rooms</Button>
            <Button variant="outline" size="sm">Restaurant</Button>
          </div>
        </div>

        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-200">
          <strong>Note on contrast:</strong> Ensure the chosen color maintains a 3:1 contrast ratio against white for reliable scanning. Error correction is set to Level H.
        </div>
      </div>

      {/* Preview and Export */}
      <div className="w-full md:w-72 flex flex-col items-center border rounded-xl p-6 bg-muted/20">
        <div className="w-48 h-48 bg-white rounded-xl shadow-sm border flex items-center justify-center relative overflow-hidden">
          <QrCode className="w-32 h-32" style={{ color }} />
          {/* Simulated logo in center */}
          <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-slate-100">
             <span className="text-[10px] font-bold text-slate-800">LOGO</span>
          </div>
        </div>
        
        <p className="text-sm font-medium mt-4 text-center">Scan to explore nearby</p>
        <p className="text-xs text-muted-foreground mt-1 text-center">Short URL: /q/LOBBY1</p>

        <div className="grid w-full gap-2 mt-6">
          <Button variant="default" className="w-full"><Download className="w-4 h-4 mr-2" /> PNG</Button>
          <Button variant="secondary" className="w-full"><Download className="w-4 h-4 mr-2" /> SVG</Button>
          <Button variant="outline" className="w-full"><Printer className="w-4 h-4 mr-2" /> Print PDF (A5)</Button>
        </div>
      </div>
    </div>
  )
}
