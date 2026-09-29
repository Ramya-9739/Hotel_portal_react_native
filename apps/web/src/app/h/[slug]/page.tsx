import { GuestDashboardClient } from "./_components/guest-dashboard-client"

export default function GuestPortalPage({
  params,
}: {
  params: { slug: string }
}) {
  // In a real app we'd fetch the hotel data here based on params.slug.
  // Using static demo data for layout implementation.
  const hotel = {
    id: "h_1",
    name: "Taj West End",
    address: "25, Race Course Rd, Bengaluru, Karnataka",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=256&h=256",
  }

  return <GuestDashboardClient hotel={hotel} />
}
