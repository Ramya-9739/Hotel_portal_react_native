"use client"

import * as React from "react"
import { Building2, MapPin, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("demo@tajhotels.com")
  const [password, setPassword] = React.useState("password123")
  const [loading, setLoading] = React.useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate network request
    setTimeout(() => {
      router.push("/admin")
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
          <MapPin className="h-4 w-4 text-brand-foreground" />
        </div>
        <span className="font-semibold text-[16px]">Around Me</span>
      </div>

      <div className="w-full max-w-[400px] bg-background rounded-3xl shadow-xl border overflow-hidden">
        <div className="p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-brand/10 text-brand rounded-2xl mx-auto flex items-center justify-center mb-6">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Client Admin</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your hotel's guest portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@hotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-[13px] text-brand hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-muted/50 border-border"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-[15px] group" disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </Button>
          </form>
        </div>
        
        <div className="bg-muted/30 p-6 text-center border-t border-border">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <Link href="#" className="text-brand font-medium hover:underline">Contact Sales</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
