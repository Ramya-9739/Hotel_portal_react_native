// =============================================================================
// src/services/syncService.js
// Synchronization Coordinator
// 1. Reads cached DisplayComponents from the internal SQLite database.
// 2. Performs REST API call to backend server.
// 3. Populates / updates the SQLite database with fresh records.
// 4. Provides categorized panels (Top, Left, Center, Right, Bottom).
// =============================================================================

import { database } from './database.js';
import { apiService } from './apiService.js';

class SyncService {
  /**
   * Loads cached DisplayComponents from the internal SQLite database.
   * If SQLite has legacy dummy records or is missing items, it purges and syncs fresh.
   */
  async loadInitialData() {
    let localComponents = await database.getAllComponents();

    const hasLegacyData = localComponents.some(
      (c) => c._isDemo || c.isLegacyDemo
    );

    if (hasLegacyData) {
      console.warn('[SyncService] Detected legacy demo data in cache. Purging...');
      database.purgeLegacyData();
      localComponents = [];
    }

    let grouped = this.groupComponents(localComponents);
    return {
      success: true,
      source: 'sqlite_cache',
      components: localComponents,
      grouped: grouped,
    };
  }

  /**
   * Triggers a REST API call to backend, updates SQLite database, and returns fresh components.
   */
  async syncWithBackend() {
    try {
      console.log('[SyncService] Starting REST API fetch from backend server...');
      const apiResult = await apiService.fetchDisplayComponents();

      if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
        await database.saveComponents(apiResult.data);
        const updatedLocal = await database.getAllComponents();
        return {
          success: true,
          source: apiResult.source,
          components: updatedLocal,
          grouped: this.groupComponents(updatedLocal),
          timestamp: new Date().toLocaleTimeString(),
        };
      }
    } catch (err) {
      console.warn('[SyncService] REST fetch encountered issue:', err.message);
    }

    // No fallback to hardcoded data — return empty state
    return {
      success: true,
      source: 'empty',
      components: [],
      grouped: this.groupComponents([]),
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  /**
   * Groups and sorts components into the 5 spatial quadrants per supervisor architecture:
   * 1: Center Hotel Showcase
   * 2: Top Content Cards (Attractions)
   * 3: Left Content Cards (Shopping)
   * 4: Right Content Cards (Transit & Medical Care)
   * 5+: Bottom Content Cards (Cafes, Pools, Parks, Dining)
   */
  groupComponents(components = []) {
    const top = [];
    const left = [];
    let center = null;
    const right = [];
    const bottom = [];

    const dedupe = (arr) => {
      const seen = new Set();
      return arr.filter((item) => {
        const key = (item.title || item.id || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    components.forEach((item) => {
      if (!item) return;
      const type = parseInt(item.componentType, 10);
      const id = String(item.id || '').toLowerCase();
      const cat = String(item.category || '').toLowerCase();

      // 1. Center Hotel Showcase
      if (id.includes('center')) {
        if (!center || (item.priority || 0) < (center.priority || 999)) {
          center = item;
        }
      }
      // 2. ID-based exact quadrant mapping (Prevents cross-quadrant pollution)
      else if (id.includes('top')) {
        top.push(item);
      } else if (id.includes('left')) {
        left.push(item);
      } else if (id.includes('right')) {
        right.push(item);
      } else if (id.includes('bottom')) {
        bottom.push(item);
      }
      // 3. Category & Type fallbacks (for custom added items without prefix in ID)
      else if (cat.includes('hotel') || cat.includes('resort') || type === 1) {
        if (!center) center = item;
      } else if (
        cat.includes('cafe') ||
        cat.includes('pool') ||
        cat.includes('park') ||
        cat.includes('dining') ||
        cat.includes('leisure') ||
        cat.includes('spa') ||
        cat.includes('bakery') ||
        cat.includes('bistro') ||
        cat.includes('lounge') ||
        cat.includes('restaurant') ||
        cat.includes('skybar') ||
        type >= 5
      ) {
        bottom.push(item);
      } else if (
        cat.includes('tourist') ||
        cat.includes('monument') ||
        cat.includes('attraction') ||
        cat.includes('promenade') ||
        cat.includes('museum') ||
        cat.includes('beach') ||
        type === 2
      ) {
        top.push(item);
      } else if (
        cat.includes('mall') ||
        cat.includes('shopping') ||
        cat.includes('bazaar') ||
        cat.includes('boutique') ||
        cat.includes('galleria') ||
        cat.includes('market') ||
        type === 3
      ) {
        left.push(item);
      } else if (
        cat.includes('transit') ||
        cat.includes('transport') ||
        cat.includes('metro') ||
        cat.includes('hospital') ||
        cat.includes('clinic') ||
        cat.includes('ambulance') ||
        cat.includes('airport') ||
        type === 4
      ) {
        right.push(item);
      } else {
        bottom.push(item);
      }
    });

    // Return actual data — no fallback to hardcoded dummy components
    const finalTop = dedupe(top);
    const finalLeft = dedupe(left);
    const finalCenter = center || null;
    const finalRight = dedupe(right);
    const finalBottom = dedupe(bottom);

    // Sort all arrays by priority ASC
    finalTop.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    finalLeft.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    finalRight.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    finalBottom.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    return {
      top: finalTop,
      left: finalLeft,
      center: finalCenter,
      right: finalRight,
      bottom: finalBottom,
    };
  }
}

export const syncService = new SyncService();
