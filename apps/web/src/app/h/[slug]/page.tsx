import { GuestDashboardClient } from "./_components/guest-dashboard-client"

export default function GuestPortalPage({
  params,
}: {
  params: { slug: string }
}) {
  // TODO: fetch real hotel data from API based on params.slug
  // Using static demo data mapped by slug for now
  const HOTELS: Record<string, { id: string; name: string; address: string; imageUrl: string; phone: string; wifiSsid: string; wifiPassword: string }> = {
    "taj-west-end": {
      id: "h_1",
      name: "Taj West End",
      address: "25, Race Course Rd, Bengaluru, Karnataka 560001",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=256&h=256",
      phone: "+91 80 6660 5660",
      wifiSsid: "TajWestEnd_Guest",
      wifiPassword: "welcome@taj2024",
    },
    "itc-windsor": {
      id: "h_2",
      name: "ITC Windsor",
      address: "Golf Course Rd, Bengaluru, Karnataka 560052",
      imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c4fe799e?auto=format&fit=crop&q=80&w=256&h=256",
      phone: "+91 80 2226 9898",
      wifiSsid: "ITCWindsor_Guest",
      wifiPassword: "itcguest2024",
    },
    "mysuru-heritage-lodge": {
      id: "h_3",
      name: "Mysuru Heritage Lodge",
      address: "Palace Rd, Mysuru, Karnataka 570001",
      imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=256&h=256",
      phone: "+91 82 1242 5500",
      wifiSsid: "MHL_Guest",
      wifiPassword: "mysuru2024",
    },
  }

  const hotel = HOTELS[params.slug] ?? HOTELS["taj-west-end"]

  return <GuestDashboardClient hotel={hotel} />
}
