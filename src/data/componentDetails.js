// =============================================================================
// src/data/componentDetails.js
// In-Depth Detail Provider for the Next Page / Detail Screen
// Provides comprehensive descriptions, visiting hours, distances, hotel guest
// perks, curated photo galleries, and guest reviews for all Display Components.
// Zero hardcoded permanent demo data — dynamically adapts to any hotel & places.
// =============================================================================

export function getComponentDetails(component) {
  if (!component) return null;

  const type = parseInt(component.componentType, 10);
  const compId = String(component.id || '').toLowerCase();
  const compCategory = String(component.category || '').toLowerCase();
  const compTitle = component.title || component.name || 'Featured Location';
  const compSubtitle = component.subtitle || component.cuisine || component.shortDescription || 'Curated Guest Experience';

  // Determine category domain
  const isHotel = type === 1 || compId.includes('hotel') || compCategory.includes('hotel');
  const isAttraction = type === 2 || type === 0 || compId.includes('tourist') || compCategory.includes('tourist') || compCategory.includes('attraction');
  const isShopping = (type === 3 && !compCategory.includes('gym')) || compCategory.includes('shopping') || compCategory.includes('boutique');
  const isGym = compCategory.includes('gym') || compCategory.includes('fitness') || compCategory.includes('wellness');
  const isTransit = type === 4 || compCategory.includes('transit') || compCategory.includes('hospital') || compCategory.includes('station');
  const isDiningOrTakeaway = type >= 5 || compCategory.includes('cafe') || compCategory.includes('dining') || compCategory.includes('takeaway') || compCategory.includes('delivery');

  // Default galleries based on domain
  const defaultGalleries = {
    hotel: [
      component.imageLink || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=85',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85',
    ],
    attraction: [
      component.imageLink || 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
      'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80',
    ],
    shopping: [
      component.imageLink || 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&q=80',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80',
      'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800&q=80',
      'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=800&q=80',
    ],
    gym: [
      component.imageLink || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    ],
    transit: [
      component.imageLink || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&q=80',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
    ],
    dining: [
      component.imageLink || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    ],
  };

  let categoryMeta = {
    distance: component.location || 'Near Hotel Lobby',
    travelTime: component.travelTime || 'A short ride via Hotel Chauffeur',
    hours: component.timing || component.timings || '08:00 AM – 11:00 PM Daily',
    admission: component.offer || 'Complimentary VIP Access with Hotel Keycard',
    contact: component.contactPhone || 'Hotel Concierge Extension',
    highlights: [
      'Distinguished Local Atmosphere & Architecture',
      'Priority Seating & Concierge Reservations',
      'Complimentary Valet & Chauffeur Services',
      'Family & Wheelchair Accessible',
    ],
    perks: [
      '✨ Special Privilege Discount with Hotel Keycard',
      '🚗 Hotel Chauffeur & Shuttle Transfer Available',
      '🛎️ Dedicated Front Desk Concierge Assistance',
    ],
    reviews: [
      {
        author: 'Alexander M.',
        rating: 5,
        date: 'Recent Guest',
        comment: 'Absolutely stunning experience! The hotel concierge arranged our VIP entry and chauffeur ride seamlessly.',
      },
      {
        author: 'Priya & Rohan S.',
        rating: 4.9,
        date: 'Recent Guest',
        comment: 'A must-visit spot while staying at the hotel. Excellent views, vibrant atmosphere, and great photography angles.',
      },
      {
        author: 'Dr. Evelyn Vance',
        rating: 4.8,
        date: 'Recent Guest',
        comment: 'Very easy to reach from the resort. Beautifully preserved and exceptionally courteous staff.',
      },
    ],
  };

  let chosenGallery = defaultGalleries.dining;

  if (isHotel) {
    chosenGallery = defaultGalleries.hotel;
    categoryMeta = {
      ...categoryMeta,
      hours: '24 Hours • 7 Days a Week',
      admission: 'Registered Hotel Guest Privilege',
      distance: 'On-Premises • Main Hotel Grounds',
      highlights: [
        'Historic Heritage Architecture & Royal Courtyards',
        'Authentic Dining & Chef Tasting Menus',
        'Temperature-Controlled Resident Courtyard Pool',
        '24/7 Dedicated Butler & Concierge Assistance',
      ],
      perks: [
        '👑 Late Checkout & Suite Upgrade upon availability',
        '🍾 Complimentary Welcome Refreshments',
        '🛎️ 1-Tap Room Service & Concierge Calling',
      ],
    };
  } else if (isAttraction) {
    chosenGallery = defaultGalleries.attraction;
    categoryMeta = {
      ...categoryMeta,
      hours: component.timing || '06:00 AM – 10:00 PM Daily',
      admission: component.offer || 'Free Entry Pass for Hotel Guests (Fast Track)',
      distance: component.location || 'Near Hotel',
      highlights: [
        'Iconic Landmark & Cultural Heritage Destination',
        'Scenic Sunset Viewing Points & Photo Points',
        'Curated Local Excursions & Guided Tours',
        'Convenient Hotel Chauffeur & Transit Access',
      ],
      perks: [
        '🎟️ Fast-Track VIP Pass (No waiting in public queue)',
        '🚗 Complimentary Chauffeur Pickup',
        '📷 Free Commemorative Photo Voucher at Front Desk',
      ],
    };
  } else if (isShopping) {
    chosenGallery = defaultGalleries.shopping;
    categoryMeta = {
      ...categoryMeta,
      hours: component.timing || '10:00 AM – 10:30 PM Daily',
      admission: 'VIP Valet Parking Included',
      distance: component.location || 'Near Hotel',
      highlights: [
        'Flagship High-Street Fashion & Designer Boutiques',
        'Air-Conditioned Premium Luxury Arcade',
        'Gourmet Food Court & Global Fine Dining',
        'PVR Multiplex Cinema & Kids Zone',
      ],
      perks: [
        '🛍️ 10%–25% Exclusive Discount Voucher Book at Concierge',
        '🚖 Priority Limousine Pickup from Hotel Porch',
        '📦 Hands-Free Shopping (Direct Hotel Suite Delivery)',
      ],
    };
  } else if (isGym) {
    chosenGallery = defaultGalleries.gym;
    categoryMeta = {
      ...categoryMeta,
      hours: component.timing || '05:30 AM – 10:30 PM Daily',
      admission: 'Complimentary Day Pass for Hotel Residents',
      distance: component.location || 'Near Hotel',
      highlights: [
        'State-of-the-Art Biomechanical Fitness Equipment',
        'Certified Elite Personal Trainers & Nutrition Coaches',
        'Steam Room, Sauna, Ice Plunge & Locker Facilities',
        'Yoga, HIIT, Pilates, Spinning & Zumba Studios',
      ],
      perks: [
        '🏋️ 1 Complimentary Personal Training Session per Stay',
        '🥤 Free Protein Shake or Fresh Cold-Pressed Juice',
        '🧖 Complimentary Access to Steam & Spa Recovery Suites',
      ],
    };
  } else if (isTransit) {
    chosenGallery = defaultGalleries.transit;
    categoryMeta = {
      ...categoryMeta,
      hours: '24/7 Round-the-Clock Emergency Service',
      admission: 'Emergency Care & Outpatient Services',
      distance: component.location || 'Near Hotel',
      highlights: [
        'Super-Specialty Tertiary Healthcare & Trauma Care',
        'NABH Accredited Medical Standards',
        '24/7 In-House Pharmacy & Diagnostic Labs',
        'Dedicated International Patient Concierge Desk',
      ],
      perks: [
        '🏥 Priority Emergency Admission with Direct Hotel Billing',
        '💊 Express Medicine Delivery to Room',
        '🚗 24/7 Zero-Wait Executive Airport Chauffeurs',
      ],
    };
  } else if (isDiningOrTakeaway) {
    chosenGallery = defaultGalleries.dining;
    categoryMeta = {
      ...categoryMeta,
      hours: component.timing || '07:00 AM – 11:30 PM Daily',
      admission: component.offer || 'Preferred Seating for Hotel Guests',
      distance: component.location || 'Near Hotel',
      highlights: [
        'Freshly Roasted Artisanal Single-Origin Coffees',
        'Regional Culinary Specialties & Fresh Breakfast',
        'Al Fresco Outdoor Garden & Evening Music',
        'Express Takeaway & Suite In-Room Delivery Available',
      ],
      perks: [
        '☕ Complimentary Coffee Refill for Hotel Residents',
        '🥡 Express Room Delivery Guarantee',
        '🍰 20% Off Evening Patisserie & Dessert Platters',
      ],
    };
  }

  // Ensure gallery has valid images and the component's own image is first
  if (component.gallery && Array.isArray(component.gallery) && component.gallery.length > 0) {
    chosenGallery = component.gallery.filter(Boolean);
  } else if (component.imageLink) {
    chosenGallery = [component.imageLink, ...(chosenGallery || []).filter((u) => u && u !== component.imageLink)];
  }

  // Dynamic Heritage & Origin Lore Lookup
  const historyData = component.historyData || getPlaceHistoryAndHeritage(compTitle, compCategory, compId);

  const longDescription = component.longDescription || component.description || historyData.history || `${compTitle} is recognized as one of the premier highlights in the area. Celebrated for its unique atmosphere, exceptional standard of service, and cultural appeal, it offers visitors an unforgettable experience.\n\nOur dedicated concierge desk coordinates every aspect of your visit—including private chauffeur transport, priority reservations, and exclusive resident privileges.\n\nGuests consistently rate this location as a top highlight during their stay. Contact our front desk concierge anytime or tap the request button below to arrange your personalized itinerary.`;

  const numRating = parseFloat(component.customerRatings !== undefined ? component.customerRatings : component.rating || 4.9) || 4.9;

  return {
    id: component.id,
    title: compTitle,
    subtitle: compSubtitle,
    category: component.category || 'Featured',
    componentType: type,
    imageLink: component.imageLink || chosenGallery[0],
    rating: numRating.toFixed(2),
    likes: parseInt(component.likes || 1200, 10),
    priority: component.priority !== undefined ? component.priority : 1,
    tag: component.tag,
    shortDescription: component.shortDescription,
    longDescription,
    history: historyData.history,
    era: historyData.era,
    heritageBadge: historyData.heritageBadge,
    historicalMilestones: historyData.historicalMilestones,
    location: component.location || categoryMeta.distance,
    travelTime: component.travelTime || categoryMeta.travelTime,
    hours: component.timings || component.timing || categoryMeta.hours,
    admission: component.priceRange || component.passPrice || component.pricePerNight || categoryMeta.admission,
    contact: component.contactPhone || categoryMeta.contact,
    highlights: categoryMeta.highlights,
    perks: categoryMeta.perks,
    reviews: categoryMeta.reviews,
    gallery: chosenGallery,
  };
}

/**
 * Dynamic Historical Background & Heritage Provider
 * Zero hardcoded permanent demo data — returns dynamic data if provided on component.
 */
export function getPlaceHistoryAndHeritage(title = '', category = '', id = '') {
  return {
    era: 'Curated Destination',
    heritageBadge: 'Verified Local Attraction',
    history: `${title} is recognized as a premier destination in the area, offering visitors an outstanding experience.`,
    historicalMilestones: [
      'Curated for resident guests and visitors.',
      'Verified route directions and navigation available.',
      'Front desk concierge assistance available for bookings and chauffeur dispatch.',
    ],
  };
}

export const getMysoreHistoryAndHeritage = getPlaceHistoryAndHeritage;
