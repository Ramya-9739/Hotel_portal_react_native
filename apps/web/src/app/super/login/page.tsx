"use client"

import * as React from "react"
import { Shield, MapPin, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("super@aroundme.app")
  const [password, setPassword] = React.useState("admin123")
  const [loading, setLoading] = React.useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate network request
    setTimeout(() => {
      router.push("/super")
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-[16px] text-white">Around Me</span>
      </div>

      <div className="w-full max-w-[400px] bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-indigo-500/10 text-indigo-400 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">Platform Admin</h1>
            <p className="text-sm text-slate-400">Super admin access to the Around Me platform.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@aroundme.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-[15px] group bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
