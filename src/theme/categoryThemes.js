// =============================================================================
// src/theme/categoryThemes.js
// Distinct, Component-Specific Visual Themes for Category Information Tables
// Each component category has its own distinct, luxury visual identity:
// - Hospitals: Medical Emergency Crimson & Clinical Cyan
// - Pharmacies: Healthcare Emerald & Mint Green
// - Cafes: Warm Roasted Amber & Espresso Caramel Gold
// - Gyms: Electric Neon Cyan & Volt Athletic Blue
// - Restaurants: Royal Champagne Gold & Deep Burgundy Wine
// - Swimming Pools: Caribbean Lagoon Aqua & Azure
// - Parlour & Spa: Royal Lavender & Orchid Rose
// - Express Takeaway: Sunset Tangerine & Flame Coral
// - Suite Delivery: Courier Green & Emerald
// - 24/7 ATMs: Federal Slate & Cash Gold
// =============================================================================

export const CATEGORY_THEMES = {
  hospitals: {
    id: 'hospitals',
    categoryKey: 'hospitals',
    name: 'Emergency Hospitals & Medical Care',
    shortName: 'Hospitals',
    tag: 'CRITICAL HEALTHCARE & EMERGENCY CONCIERGE',
    iconName: 'cross',
    iconEmoji: '🏥',
    primaryColor: '#EF4444', // Emergency Crimson
    secondaryColor: '#06B6D4', // Medical Cyan
    accentBackground: 'rgba(239, 68, 68, 0.12)',
    accentBorder: 'rgba(239, 68, 68, 0.4)',
    badgeBg: 'rgba(239, 68, 68, 0.22)',
    badgeText: '#FCA5A5',
    cardBorder: 'rgba(239, 68, 68, 0.22)',
    surfaceBg: '#120D10',
    headerGradient: ['#200B0E', '#0D1117'],
    tagline: 'Accredited multi-speciality hospitals, emergency trauma units, ICU and cardiac care centers near your stay.',
    emergencyNotice: 'For critical life-threatening emergencies, dial 112 / 108 or contact the hotel front desk immediately. The concierge can dispatch private hospital chauffeur transit with priority emergency clearance.',
    emergencyIcon: 'alert-triangle',
    emergencyActionLabel: 'Call 24/7 Emergency Desk',
    emergencyPhone: '112',
    filterChips: [
      { id: 'all', label: 'All Hospitals' },
      { id: 'emergency24x7', label: '🚨 24/7 Trauma Centers' },
      { id: 'multi', label: '🏥 Multi-Speciality ICU' },
    ],
    timingColLabel: 'Operating Hours',
    emergencyColLabel: 'Emergency Availability',
    emergencyDefaultText: '24/7 Trauma Desk Active',
  },

  pharmacies: {
    id: 'pharmacies',
    categoryKey: 'pharmacies',
    name: '24-Hour Pharmacies & Healthcare Stores',
    shortName: 'Pharmacies',
    tag: '24/7 PHARMACY & ESSENTIAL MEDICAL DISPENSARY',
    iconName: 'shield',
    iconEmoji: '💊',
    primaryColor: '#10B981', // Emerald Green
    secondaryColor: '#34D399', // Mint Green
    accentBackground: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.4)',
    badgeBg: 'rgba(16, 185, 129, 0.22)',
    badgeText: '#6EE7B7',
    cardBorder: 'rgba(16, 185, 129, 0.22)',
    surfaceBg: '#0A1512',
    headerGradient: ['#0A1E16', '#0D1117'],
    tagline: 'Licensed 24-hour chemists, emergency OTC medications, prescription refills and surgical supplies near your hotel.',
    emergencyNotice: 'Need urgent midnight medicines or first-aid supplies? The hotel concierge desk coordinates direct room delivery from verified 24/7 pharmacies.',
    emergencyIcon: 'clock',
    emergencyActionLabel: 'Contact Concierge for Delivery',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Pharmacies' },
      { id: 'open24x7', label: '🕒 24/7 Open' },
      { id: 'delivery', label: '🛵 Room Delivery Available' },
    ],
    timingColLabel: 'Operating Hours',
    emergencyColLabel: 'Emergency / Delivery',
    emergencyDefaultText: '24/7 Emergency Stock & Room Delivery',
  },

  cafes: {
    id: 'cafes',
    categoryKey: 'cafes',
    name: 'Artisanal Cafes, Roasteries & Bakeries',
    shortName: 'Bistros & Cafes',
    tag: 'SPECIALTY ROASTS, PATISSERIES & BISTROS',
    iconName: 'coffee',
    iconEmoji: '☕',
    primaryColor: '#F59E0B', // Caramel Amber Gold
    secondaryColor: '#D97706', // Roast Espresso
    accentBackground: 'rgba(245, 158, 11, 0.12)',
    accentBorder: 'rgba(245, 158, 11, 0.4)',
    badgeBg: 'rgba(245, 158, 11, 0.22)',
    badgeText: '#FDE68A',
    cardBorder: 'rgba(245, 158, 11, 0.22)',
    surfaceBg: '#15110B',
    headerGradient: ['#22170B', '#0D1117'],
    tagline: 'Single-origin espresso, artisanal sourdough bakeries, al fresco brunch patios and calm remote-work sanctuaries.',
    emergencyNotice: 'Priority Table Reservation & Breakfast Privileges available for in-house hotel residents upon presenting your room key card.',
    emergencyIcon: 'sparkles',
    emergencyActionLabel: 'Reserve Priority Table',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Cafes & Bistros' },
      { id: 'roasteries', label: '☕ Artisanal Roasteries' },
      { id: 'breakfast', label: '🥐 All-Day Breakfast & Bakery' },
      { id: 'late_night', label: '🌙 Late Night Brews' },
    ],
    timingColLabel: 'Operating Hours / Timings',
    emergencyColLabel: 'Table / Service Availability',
    emergencyDefaultText: 'All-Day Breakfast & Priority Table Seating',
  },

  gyms: {
    id: 'gyms',
    categoryKey: 'gyms',
    name: 'Elite Fitness Clubs, CrossFit & Yoga',
    shortName: 'Wellness & Gyms',
    tag: 'STRENGTH, YOGA & ATHLETIC WELLNESS CLUBS',
    iconName: 'dumbbell',
    iconEmoji: '⚡',
    primaryColor: '#00F0FF', // Electric Cyan
    secondaryColor: '#3B82F6', // Cobalt Athletic Blue
    accentBackground: 'rgba(0, 240, 255, 0.12)',
    accentBorder: 'rgba(0, 240, 255, 0.4)',
    badgeBg: 'rgba(0, 240, 255, 0.22)',
    badgeText: '#A5F3FC',
    cardBorder: 'rgba(0, 240, 255, 0.22)',
    surfaceBg: '#09121B',
    headerGradient: ['#0A1C2C', '#0D1117'],
    tagline: 'High-performance strength training, cardiovascular zones, Ashtanga yoga studios and recovery steam suites.',
    emergencyNotice: 'Hotel residents enjoy complimentary guest day passes and priority certified personal trainer consultations upon concierge booking.',
    emergencyIcon: 'zap',
    emergencyActionLabel: 'Book Guest Fitness Pass',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Fitness Centers' },
      { id: 'open24x7', label: '⚡ 24/7 Workout Access' },
      { id: 'yoga', label: '🧘 Yoga & Pilates' },
      { id: 'crossfit', label: '🏋️ CrossFit & Free Weights' },
    ],
    timingColLabel: 'Operating Hours / Timings',
    emergencyColLabel: 'Trainer / Emergency First Aid',
    emergencyDefaultText: 'Certified Trainers & First Aid Station On-Duty',
  },

  restaurants: {
    id: 'restaurants',
    categoryKey: 'restaurants',
    name: 'Fine Dining & Heritage Restaurants',
    shortName: 'Restaurants',
    tag: 'MICHELIN & HERITAGE FINE DINING EXPERIENCES',
    iconName: 'utensils',
    iconEmoji: '🍷',
    primaryColor: '#E2C082', // Royal Champagne Gold
    secondaryColor: '#BE123C', // Deep Burgundy Rose
    accentBackground: 'rgba(226, 192, 130, 0.12)',
    accentBorder: 'rgba(226, 192, 130, 0.4)',
    badgeBg: 'rgba(226, 192, 130, 0.22)',
    badgeText: '#FDE68A',
    cardBorder: 'rgba(226, 192, 130, 0.22)',
    surfaceBg: '#140E12',
    headerGradient: ['#221019', '#0D1117'],
    tagline: 'Palace dining halls, royal courtyards, rooftop grills, authentic local thali pavilions and private chef tastings.',
    emergencyNotice: 'Guaranteed chef tasting table and priority candlelight seating arranged exclusively for in-house hotel residents.',
    emergencyIcon: 'star',
    emergencyActionLabel: 'Request Private Table',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Restaurants' },
      { id: 'fine_dining', label: '🍷 Fine Dining & Wine' },
      { id: 'heritage', label: '👑 Palace & Heritage' },
      { id: 'rooftop', label: '🌆 Rooftop Lounge' },
    ],
    timingColLabel: 'Lunch & Dinner Hours',
    emergencyColLabel: 'Reservation / Guest Privilege',
    emergencyDefaultText: 'VIP Priority Table & Valet Parking',
  },

  pools: {
    id: 'pools',
    categoryKey: 'pools',
    name: 'Swimming Pools & Thermal Hydro',
    shortName: 'Swimming Pools',
    tag: 'INFINITY POOLS, CABANAS & THERMAL HYDRO',
    iconName: 'waves',
    iconEmoji: '🌊',
    primaryColor: '#38BDF8', // Lagoon Aqua
    secondaryColor: '#0284C7', // Ocean Blue
    accentBackground: 'rgba(56, 189, 248, 0.12)',
    accentBorder: 'rgba(56, 189, 248, 0.4)',
    badgeBg: 'rgba(56, 189, 248, 0.22)',
    badgeText: '#BAE6FD',
    cardBorder: 'rgba(56, 189, 248, 0.22)',
    surfaceBg: '#09141D',
    headerGradient: ['#0A2030', '#0D1117'],
    tagline: 'Heated outdoor infinity pools, temperature-regulated lap basins, sun loungers and poolside cabana service.',
    emergencyNotice: 'Certified lifeguard always on duty during open hours. Complimentary heated towels, lockers and poolside loungers provided.',
    emergencyIcon: 'life-buoy',
    emergencyActionLabel: 'View Pool Access & Rules',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Swimming Pools' },
      { id: 'heated', label: '♨ Heated & Thermal Pools' },
      { id: 'infinity', label: '🌊 Skyline Infinity Pools' },
    ],
    timingColLabel: 'Pool Operating Hours',
    emergencyColLabel: 'Lifeguard & Safety Status',
    emergencyDefaultText: 'Certified Lifeguard on Duty & Heated Hydro',
  },

  spa: {
    id: 'spa',
    categoryKey: 'spa',
    name: 'Ayurvedic Spa, Salon & Wellness',
    shortName: 'Parlour & Spa',
    tag: 'AYURVEDIC REJUVENATION & BEAUTY SANCTUARY',
    iconName: 'sparkles',
    iconEmoji: '🌿',
    primaryColor: '#C084FC', // Royal Lavender
    secondaryColor: '#F472B6', // Rose Gold
    accentBackground: 'rgba(192, 132, 252, 0.12)',
    accentBorder: 'rgba(192, 132, 252, 0.4)',
    badgeBg: 'rgba(192, 132, 252, 0.22)',
    badgeText: '#E9D5FF',
    cardBorder: 'rgba(192, 132, 252, 0.22)',
    surfaceBg: '#130D19',
    headerGradient: ['#200F29', '#0D1117'],
    tagline: 'Traditional panchakarma rejuvenation, aroma steam baths, hair care ateliers and organic botanical treatments.',
    emergencyNotice: 'Same-day therapist slots reserved for hotel residents. Complimentary organic herbal tea and consultation included.',
    emergencyIcon: 'heart',
    emergencyActionLabel: 'Book Spa Treatment',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Wellness & Spas' },
      { id: 'ayurveda', label: '🌿 Ayurvedic Therapies' },
      { id: 'salon', label: '✂ Hair & Beauty Salon' },
    ],
    timingColLabel: 'Therapy & Session Hours',
    emergencyColLabel: 'Appointment Availability',
    emergencyDefaultText: 'Same-Day Therapist Appointments Active',
  },

  takeaway: {
    id: 'takeaway',
    categoryKey: 'takeaway',
    name: 'Curated Express Takeaway & Pickups',
    shortName: 'Express Takeaway',
    tag: 'FAST CURATED TAKEAWAY & PACKAGED MEALS',
    iconName: 'shopping-bag',
    iconEmoji: '🥡',
    primaryColor: '#FB923C', // Tangerine Orange
    secondaryColor: '#EA580C', // Flame Coral
    accentBackground: 'rgba(251, 146, 60, 0.12)',
    accentBorder: 'rgba(251, 146, 60, 0.4)',
    badgeBg: 'rgba(251, 146, 60, 0.22)',
    badgeText: '#FED7AA',
    cardBorder: 'rgba(251, 146, 60, 0.22)',
    surfaceBg: '#150F0A',
    headerGradient: ['#24140B', '#0D1117'],
    tagline: 'Artisanal quick bites, packaged bento lunches, fresh rolls and coffee pickups ready in 10-15 minutes.',
    emergencyNotice: 'Spill-proof, insulated travel packaging provided for hotel guests on the go. Call ahead to have your order ready on departure.',
    emergencyIcon: 'clock',
    emergencyActionLabel: 'Pre-Order Pickup',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Takeaway Counters' },
      { id: 'quick', label: '⚡ Ready in 10 Mins' },
      { id: 'healthy', label: '🥗 Fresh & Healthy' },
    ],
    timingColLabel: 'Counter Operating Hours',
    emergencyColLabel: 'Preparation & Speed Status',
    emergencyDefaultText: '10-15 Min Express Pickup Packaging Ready',
  },

  delivery: {
    id: 'delivery',
    categoryKey: 'delivery',
    name: 'Suite & In-Room Delivery Services',
    shortName: 'Suite Delivery',
    tag: '24/7 SUITE IN-ROOM COURIER & FOOD DELIVERY',
    iconName: 'truck',
    iconEmoji: '🛵',
    primaryColor: '#22C55E', // Courier Green
    secondaryColor: '#10B981', // Emerald
    accentBackground: 'rgba(34, 197, 94, 0.12)',
    accentBorder: 'rgba(34, 197, 94, 0.4)',
    badgeBg: 'rgba(34, 197, 94, 0.22)',
    badgeText: '#BBF7D0',
    cardBorder: 'rgba(34, 197, 94, 0.22)',
    surfaceBg: '#09150E',
    headerGradient: ['#0B2114', '#0D1117'],
    tagline: 'Comfort meals, midnight munchies, convenience items and curated dishes delivered directly to your room door.',
    emergencyNotice: 'Contactless delivery straight to your suite door. Reception handles courier verification for your complete safety.',
    emergencyIcon: 'check-circle',
    emergencyActionLabel: 'Order In-Room Delivery',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All Delivery Partners' },
      { id: 'late_night', label: '🌙 Late Night (24/7)' },
      { id: 'express', label: '⚡ Express Under 30 Mins' },
    ],
    timingColLabel: 'Delivery Service Hours',
    emergencyColLabel: 'Suite Delivery Status',
    emergencyDefaultText: 'Late-Night Suite Room Drop Active (Under 30 Mins)',
  },

  atms: {
    id: 'atms',
    categoryKey: 'atms',
    name: '24/7 ATMs & Cash Dispensers',
    shortName: '24/7 ATMs',
    tag: '24-HOUR MULTI-BANK CASH DISPENSERS',
    iconName: 'credit-card',
    iconEmoji: '🏧',
    primaryColor: '#94A3B8', // Silver Slate
    secondaryColor: '#F59E0B', // Gold
    accentBackground: 'rgba(148, 163, 184, 0.12)',
    accentBorder: 'rgba(148, 163, 184, 0.4)',
    badgeBg: 'rgba(148, 163, 184, 0.22)',
    badgeText: '#E2E8F0',
    cardBorder: 'rgba(148, 163, 184, 0.22)',
    surfaceBg: '#10131A',
    headerGradient: ['#141924', '#0D1117'],
    tagline: 'Guarded 24-hour bank ATMs accepting Visa, Mastercard, RuPay and international travel cards within walking distance.',
    emergencyNotice: '24-Hour security guard on duty with clean currency note dispensing and zero surcharge access options.',
    emergencyIcon: 'shield',
    emergencyActionLabel: 'Locate Nearest Cash Point',
    emergencyPhone: '+91 80 4000 5000',
    filterChips: [
      { id: 'all', label: 'All ATMs' },
      { id: 'international', label: '💳 International Cards' },
      { id: 'nearby', label: '🚶 Within 500m' },
    ],
    timingColLabel: 'Operating Hours',
    emergencyColLabel: 'Cash / Guard Availability',
    emergencyDefaultText: '24/7 Guarded Kiosk & Multi-Bank Cash Dispenser',
  },
};

/**
 * Helper to retrieve the theme by category ID, with safe fallback
 */
export function getCategoryTheme(catKey) {
  if (!catKey) return CATEGORY_THEMES.cafes;
  const normalized = String(catKey).toLowerCase().trim();
  if (normalized.includes('hosp')) return CATEGORY_THEMES.hospitals;
  if (normalized.includes('pharm')) return CATEGORY_THEMES.pharmacies;
  if (normalized.includes('cafe') || normalized.includes('bistro')) return CATEGORY_THEMES.cafes;
  if (normalized.includes('gym') || normalized.includes('fitness')) return CATEGORY_THEMES.gyms;
  if (normalized.includes('restaur') || normalized.includes('dine')) return CATEGORY_THEMES.restaurants;
  if (normalized.includes('pool') || normalized.includes('swim')) return CATEGORY_THEMES.pools;
  if (normalized.includes('spa') || normalized.includes('parlour') || normalized.includes('salon')) return CATEGORY_THEMES.spa;
  if (normalized.includes('takeaway')) return CATEGORY_THEMES.takeaway;
  if (normalized.includes('delivery')) return CATEGORY_THEMES.delivery;
  if (normalized.includes('atm') || normalized.includes('bank')) return CATEGORY_THEMES.atms;
  return CATEGORY_THEMES[normalized] || CATEGORY_THEMES.cafes;
}
