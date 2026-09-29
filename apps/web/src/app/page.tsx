import Link from "next/link"
import { Building2, QrCode, MapPin, ChevronRight, Shield } from "lucide-react"

export const metadata = {
  title: "Around Me — Hotel Guest Portal",
  description: "Scan a QR code at your hotel and discover everything around you.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="h-14 border-b flex items-center justify-between px-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
            <MapPin className="h-4 w-4 text-brand-foreground" />
          </div>
          <span className="font-semibold text-[16px]">Around Me</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/super/login" className="hidden sm:flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <Shield className="h-3.5 w-3.5" /> Platform
          </Link>
          <Link
            href="/admin/login"
            className="ml-4 inline-flex h-9 items-center rounded-xl bg-brand px-4 text-[13px] font-medium text-brand-foreground hover:bg-brand/90 transition-colors"
          >
            Admin Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-3xl mx-auto">
        <div className="h-20 w-20 rounded-3xl bg-brand/10 flex items-center justify-center mb-8">
          <MapPin className="h-10 w-10 text-brand" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
          Everything around<br />your hotel, instantly.
        </h1>
        <p className="mt-6 text-[16px] text-muted-foreground max-w-xl leading-relaxed">
          One QR scan. Attractions, shopping, transport, hospitals — all at the right distance, with real hours and live open/closed status.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link
            href="/h/taj-west-end"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-medium text-brand-foreground hover:bg-brand/90 transition-colors"
          >
            <QrCode className="h-5 w-5" /> Try Guest Portal Demo
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-6 text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Building2 className="h-5 w-5" /> Client Login
          </Link>
        </div>
      </main>

      {/* Quick links */}
      <section className="border-t py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/h/taj-west-end", icon: MapPin, label: "Guest Portal", desc: "Taj West End demo" },
            { href: "/admin/login", icon: Building2, label: "Client Login", desc: "Manage properties & places" },
            { href: "/super/login", icon: Shield, label: "Super Admin", desc: "Platform management view" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-border p-4 hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold">{label}</p>
                <p className="text-[12px] text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <footer className="h-12 border-t flex items-center justify-center text-[12px] text-muted-foreground">
        Around Me © 2024 · Built on AWS · Next.js
      </footer>
    </div>
  )
}
