"use client"

import { Button } from "@/components/ui/button"
import { Users, Activity, Eye, Shield } from "lucide-react"

export default function SuperAdminDashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Super Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> Platform Admin
          </h2>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800 hover:text-white"><Users className="mr-2 w-4 h-4" /> Clients</Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-slate-800 hover:text-white"><Activity className="mr-2 w-4 h-4" /> Analytics</Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-slate-800 hover:text-white"><Eye className="mr-2 w-4 h-4" /> Audit Log</Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Banner for View As Client */}
        <div className="bg-indigo-600 text-white p-2 text-center text-sm font-medium flex justify-center items-center gap-4">
           You are viewing the platform as super admin.
        </div>

        <header className="h-16 border-b bg-background flex items-center justify-between px-6">
           <h1 className="text-lg font-semibold">Clients</h1>
           <Button className="bg-indigo-600 hover:bg-indigo-700">+ Invite New Client</Button>
        </header>

        <div className="p-6 flex-1 overflow-auto">
           <div className="bg-background rounded-xl border shadow-sm">
             <table className="w-full text-sm text-left">
               <thead className="border-b bg-muted/50 text-muted-foreground">
                 <tr>
                   <th className="px-6 py-3 font-medium">Organization</th>
                   <th className="px-6 py-3 font-medium">Plan</th>
                   <th className="px-6 py-3 font-medium">Status</th>
                   <th className="px-6 py-3 font-medium text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 <tr className="hover:bg-muted/30">
                   <td className="px-6 py-4 font-medium">Taj Hotels</td>
                   <td className="px-6 py-4">Enterprise</td>
                   <td className="px-6 py-4"><span className="text-green-600 font-medium">Active</span></td>
                   <td className="px-6 py-4 text-right space-x-2">
                     <Button variant="outline" size="sm">View as Client</Button>
                     <Button variant="ghost" size="sm" className="text-red-500">Suspend</Button>
                   </td>
                 </tr>
                 <tr className="hover:bg-muted/30">
                   <td className="px-6 py-4 font-medium">Mysuru Heritage Lodge</td>
                   <td className="px-6 py-4">Basic</td>
                   <td className="px-6 py-4"><span className="text-green-600 font-medium">Active</span></td>
                   <td className="px-6 py-4 text-right space-x-2">
                     <Button variant="outline" size="sm">View as Client</Button>
                     <Button variant="ghost" size="sm" className="text-red-500">Suspend</Button>
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>
      </main>
    </div>
  )
}
