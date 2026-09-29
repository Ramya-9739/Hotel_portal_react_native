// =============================================================================
// src/data/dummyComponents.js
// ZERO hardcoded business data.
//
// Previously contained hardcoded demo data.
// All that data has been removed per the Zero Hardcoded Data requirement.
//
// All content is now sourced from:
//   1. The Admin-configured Active Hotel (activeHotelService)
//   2. Real nearby search results (placeSearchService.searchNearby)
//
// These empty exports are kept for backward compatibility with component imports.
// No component should fall back to these — they are intentionally empty.
// =============================================================================

// Central hotel display — empty. The active hotel from activeHotelService is used instead.
export const INITIAL_CENTRAL_COMPONENT = null;

// All section data — intentionally empty.
// Do NOT add any hardcoded places, restaurants, gyms, pharmacies, hospitals,
// shopping malls, tourist places, or any other business data here.
export const TOP_COMPONENTS = [];
export const LEFT_COMPONENTS = [];
export const RIGHT_COMPONENTS = [];
export const BOTTOM_COMPONENTS = [];

// Category-specific data — intentionally empty.
// All data comes from real nearby search based on active hotel coordinates.
export const HOTELS_DATA = [];
export const RESTAURANTS_DATA = [];
export const GYMS_DATA = [];
export const TAKEAWAY_DATA = [];
export const HOME_DELIVERY_DATA = [];
export const ATM_DATA = [];
export const POOLS_DATA = [];
export const PARLOUR_DATA = [];
