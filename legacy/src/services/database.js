// =============================================================================
// src/services/database.js
// Internal SQLite Database Service ("Salute Database")
// Cross-platform support for Android, iOS, macOS, Windows OS, and Web.
// Manages the 'display_components' table and SQL query operations.
// =============================================================================

// Safe platform detection for React Native, Node, and Web
const isNativePlatform = () => {
  try {
    const { Platform } = require('react-native');
    return Platform && Platform.OS !== 'web';
  } catch (e) {
    return false;
  }
};

import { DisplayComponent } from '../models/DisplayComponent.js';

// SQLite Storage Key for Web / Desktop persistence (bumped to v2 to eradicate stale cache)
const SQLITE_STORAGE_KEY = '@sqlite_display_components_v2_db';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.memoryStore = new Map();
  }

  /**
   * Completely purges all cached components from memory and browser storage
   */
  purgeLegacyData() {
    this.memoryStore.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SQLITE_STORAGE_KEY);
      window.localStorage.removeItem('@sqlite_display_components_db');
      console.log('[SQLite] Purged legacy database storage cache.');
    }
  }

  /**
   * Initializes the SQLite Database and creates the display_components table
   */
  async initDatabase() {
    if (this.isInitialized) return true;

    try {
      // Always remove the old legacy key that contained dummy coastal data
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('@sqlite_display_components_db');
      }

      // 1. Check for native expo-sqlite on Android / iOS
      if (isNativePlatform()) {
        try {
          const SQLite = require('expo-sqlite');
          if (SQLite.openDatabaseSync) {
            this.db = SQLite.openDatabaseSync('hotel_portal.db');
            this.db.execSync(`
              CREATE TABLE IF NOT EXISTS display_components (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                imageLink TEXT,
                likes INTEGER DEFAULT 0,
                shortDescription TEXT,
                componentType INTEGER NOT NULL,
                customerRatings REAL DEFAULT 0.0,
                priority INTEGER DEFAULT 0,
                externalUrl TEXT,
                timing TEXT,
                offer TEXT,
                location TEXT,
                additionalInfo TEXT,
                category TEXT
              );
            `);
            console.log('[SQLite] Native SQLite database initialized successfully.');
          }
        } catch (nativeErr) {
          console.log('[SQLite] Native module fallback to persistent SQL store:', nativeErr.message);
        }
      }

      // 2. Web / Desktop Persistent Storage Engine
      if (!this.db && typeof window !== 'undefined' && window.localStorage) {
        const storedJson = window.localStorage.getItem(SQLITE_STORAGE_KEY);
        if (storedJson) {
          try {
            const records = JSON.parse(storedJson);
            if (Array.isArray(records)) {
              // Verify no coastal dummy records exist in store
              const cleanRecords = records.filter((row) => {
                const str = JSON.stringify(row).toLowerCase();
                return !str.includes('harbor') && !str.includes('waterfront') && !str.includes('marine') && !str.includes('promenade') && !str.includes('oceanfront');
              });

              if (cleanRecords.length < records.length) {
                console.warn('[SQLite] Found legacy dummy records in local storage. Purging...');
                this.purgeLegacyData();
              } else {
                cleanRecords.forEach((row) => this.memoryStore.set(row.id, row));
                console.log(`[SQLite] Loaded ${cleanRecords.length} records from local database store.`);
              }
            }
          } catch (e) {
            console.error('[SQLite] Error reading existing local database store:', e);
          }
        }
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('[SQLite] Failed to initialize database:', err);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Upserts an array of DisplayComponent instances into the SQLite table
   */
  async saveComponents(components) {
    await this.initDatabase();

    if (!Array.isArray(components) || components.length === 0) {
      return false;
    }

    try {
      // If Native SQLite is active
      if (this.db) {
        const statement = this.db.prepareSync(`
          INSERT OR REPLACE INTO display_components (
            id, title, subtitle, imageLink, likes, shortDescription, componentType, customerRatings, priority,
            externalUrl, timing, offer, location, additionalInfo, category
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);

        for (const item of components) {
          const params = item instanceof DisplayComponent ? item.toDatabaseParams() : new DisplayComponent(item).toDatabaseParams();
          statement.executeSync(params);
        }
        statement.finalizeSync();
        console.log(`[SQLite] Saved ${components.length} components to native SQLite.`);
        return true;
      }

      // Web / Cross-Platform Store: ALWAYS clear memoryStore so orphan legacy keys are erased!
      this.memoryStore.clear();
      components.forEach((item) => {
        const component = item instanceof DisplayComponent ? item : new DisplayComponent(item);
        const str = JSON.stringify(component).toLowerCase();
        if (!str.includes('harbor') && !str.includes('waterfront') && !str.includes('marine') && !str.includes('promenade') && !str.includes('oceanfront')) {
          this.memoryStore.set(component.id, component.toJson());
        }
      });

      if (typeof window !== 'undefined' && window.localStorage) {
        const dataToPersist = Array.from(this.memoryStore.values());
        window.localStorage.setItem(SQLITE_STORAGE_KEY, JSON.stringify(dataToPersist));
      }

      console.log(`[SQLite] Persisted ${this.memoryStore.size} components to internal database.`);
      return true;
    } catch (err) {
      console.error('[SQLite] Error saving components to database:', err);
      return false;
    }
  }

  /**
   * Queries all DisplayComponent records from SQLite sorted by priority ASC
   */
  async getAllComponents() {
    await this.initDatabase();

    try {
      // Native SQLite query
      if (this.db) {
        const rows = this.db.getAllSync(`
          SELECT * FROM display_components ORDER BY priority ASC;
        `);
        return rows.map((row) => DisplayComponent.fromDatabaseRow(row));
      }

      // Web / Cross-Platform Store query
      const records = Array.from(this.memoryStore.values());
      records.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      return records.map((row) => DisplayComponent.fromDatabaseRow(row));
    } catch (err) {
      console.error('[SQLite] Error querying all components:', err);
      return [];
    }
  }

  /**
   * Queries components by panel location:
   * 0: Top, 1: Left, 2: Center, 3: Right, 4: Bottom
   */
  async getComponentsByType(componentType) {
    const all = await this.getAllComponents();
    return all.filter((c) => parseInt(c.componentType, 10) === parseInt(componentType, 10));
  }

  /**
   * Deletes a component by ID from SQLite table
   */
  async deleteComponent(id) {
    await this.initDatabase();
    try {
      if (this.db) {
        const stmt = this.db.prepareSync('DELETE FROM display_components WHERE id = ?;');
        stmt.executeSync([id]);
        stmt.finalizeSync();
      }
      this.memoryStore.delete(id);
      if (typeof window !== 'undefined' && window.localStorage) {
        const dataToPersist = Array.from(this.memoryStore.values());
        window.localStorage.setItem(SQLITE_STORAGE_KEY, JSON.stringify(dataToPersist));
      }
      console.log(`[SQLite] Deleted component with id: ${id}`);
      return true;
    } catch (err) {
      console.error('[SQLite] Delete component error:', err);
      return false;
    }
  }

  /**
   * Upserts a single component into SQLite table
   */
  async upsertComponent(item) {
    return await this.saveComponents([item]);
  }

  /**
   * Clears the display_components table
   */
  async clearDatabase() {
    await this.initDatabase();
    if (this.db) {
      this.db.execSync('DELETE FROM display_components;');
    }
    this.memoryStore.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SQLITE_STORAGE_KEY);
    }
    console.log('[SQLite] Local database cleared.');
    return true;
  }
}

export const database = new DatabaseService();
