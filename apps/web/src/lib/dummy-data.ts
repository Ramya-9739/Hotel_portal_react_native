export const dummyHotel = {
  name: "Mysuru Heritage Lodge",
  tagline: "Affordable comfort near the Palace",
  rating: 4.5,
  coverUrl: "https://images.unsplash.com/photo-1542314831-c6a4d1401340?q=80&w=800&auto=format&fit=crop",
  phone: "+91 80000 00000",
  address: "Sayyaji Rao Rd, Mysuru",
  lat: 12.3051,
  lng: 76.6551,
  wifi: { name: "Lodge-Guest", pass: "heritage24" },
  places: [
    {
      id: "1",
      category: "attractions",
      name: "Mysore Palace",
      distanceText: "1.5 km",
      durationText: "5 min drive",
      imageUrl: "https://images.unsplash.com/photo-1600100397608-f010f419c906?q=80&w=400&auto=format&fit=crop",
      status: "open" as const,
      hours: "10:00 AM - 5:30 PM",
      description: "Historical palace and royal residence."
    },
    {
      id: "2",
      category: "shopping",
      name: "Mall of Mysore",
      distanceText: "3.0 km",
      durationText: "10 min drive",
      imageUrl: "https://images.unsplash.com/photo-1519567281799-9714eb61f6c8?q=80&w=400&auto=format&fit=crop",
      status: "closing_soon" as const,
      hours: "10:00 AM - 9:00 PM",
      description: "Large shopping mall with various brands."
    }
  ]
}
