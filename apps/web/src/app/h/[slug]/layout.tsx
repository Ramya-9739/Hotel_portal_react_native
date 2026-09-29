import { notFound } from "next/navigation"

export default function GuestPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-background overflow-hidden">
      {children}
    </div>
  )
}
