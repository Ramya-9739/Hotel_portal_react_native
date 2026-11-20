// =============================================================================
// src/data/curatedLandmarks.js
// Deprecated: Hardcoded static landmarks removed in Stage 2.
// The Guest Portal uses dynamic MongoDB data for tourist places, shopping, and transit.
// =============================================================================

export const CURATED_BENGALURU_ATTRACTIONS = [];
export const CURATED_BENGALURU_SHOPPING = [];
export const CURATED_BENGALURU_TRANSIT = [];

export function getCuratedAttractions(city = '') {
  return [];
}

export function getCuratedShopping(city = '') {
  return [];
}

export function getCuratedTransit(city = '') {
  return [];
}
