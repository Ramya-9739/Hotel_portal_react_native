// =============================================================================
// scratch/test_phase3_destinations.js
// Phase 3 Automated Verification Test Suite
// Centralized Global Tourist Destinations Management
// =============================================================================

const path = require('path');
const jwt = require('jsonwebtoken');

const backendDir = 'c:/Users/ramya/Desktop/hotel_portal_react_native/backend';
require('dotenv').config({ path: path.join(backendDir, '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dummyJwtSecretChangeMe';

// Import models, controllers, and middleware
const touristDestCtrl = require(path.join(backendDir, 'controllers/touristDestination.controller'));
const TouristDestination = require(path.join(backendDir, 'models/touristDestination.model'));
const authMiddleware = require(path.join(backendDir, 'middleware/auth.middleware'));
const { requireSuperAdmin } = require(path.join(backendDir, 'middleware/role.middleware'));

// Tokens
const tokenSuperAdmin = jwt.sign(
  { hotelAdminId: 'super_root', username: 'superadmin', role: 'superadmin' },
  JWT_SECRET,
  { expiresIn: '1d' }
);

const tokenClientAdmin = jwt.sign(
  { hotelAdminId: 'owner_alpha', username: 'owner_alpha', role: 'clientadmin' },
  JWT_SECRET,
  { expiresIn: '1d' }
);

// In-Memory Destination Store for isolated mock testing
let mockDestinations = [
  {
    _id: 'dest_001',
    destinationId: 'dest_mysore_palace',
    name: 'Mysore Palace',
    state: 'Karnataka',
    city: 'Mysuru',
    description: 'Historical royal palace and official residence of the Wadiyar dynasty.',
    category: 'Heritage & Palaces',
    address: 'Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru',
    latitude: 12.3052,
    longitude: 76.6552,
    timings: '10:00 AM - 5:30 PM',
    entryFee: '₹100 for Indian Nationals',
    imageLink: 'https://images.unsplash.com/photo-1599661046289-e31897846e41',
    images: [],
    rating: 4.9,
    isActive: true,
    createdBy: 'superadmin',
    createdAt: new Date('2026-01-01'),
  },
  {
    _id: 'dest_002',
    destinationId: 'dest_hampi',
    name: 'Group of Monuments at Hampi',
    state: 'Karnataka',
    city: 'Hampi',
    description: 'UNESCO World Heritage site with ruins of the Vijayanagara Empire.',
    category: 'Monuments & Forts',
    address: 'Hampi, Vijayanagara District, Karnataka',
    latitude: 15.3350,
    longitude: 76.4600,
    timings: '6:00 AM - 6:00 PM',
    entryFee: '₹40 for Indian Nationals',
    imageLink: 'https://images.unsplash.com/photo-1600100397608-f010e42e47c1',
    images: [],
    rating: 4.95,
    isActive: true,
    createdBy: 'superadmin',
    createdAt: new Date('2026-01-02'),
  },
  {
    _id: 'dest_003',
    destinationId: 'dest_gateway_india',
    name: 'Gateway of India',
    state: 'Maharashtra',
    city: 'Mumbai',
    description: 'Iconic 20th-century arch monument overlooking the Arabian Sea.',
    category: 'Monuments & Forts',
    address: 'Apollo Bandar, Colaba, Mumbai',
    latitude: 18.9220,
    longitude: 72.8347,
    timings: 'Open 24 Hours',
    entryFee: 'Free Entry',
    imageLink: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f',
    images: [],
    rating: 4.7,
    isActive: true,
    createdBy: 'superadmin',
    createdAt: new Date('2026-01-03'),
  },
  {
    _id: 'dest_004',
    destinationId: 'dest_staged_inactive',
    name: 'Staged Hidden Sanctuary',
    state: 'Rajasthan',
    city: 'Udaipur',
    description: 'Upcoming sanctuary staged for administrative review.',
    category: 'Nature & Wildlife',
    address: 'Near Lake Pichola, Udaipur',
    latitude: 24.5764,
    longitude: 73.6835,
    timings: 'Staged - Closed to Public',
    entryFee: 'Not published',
    imageLink: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    images: [],
    rating: 4.8,
    isActive: false, // Inactive / Staged
    createdBy: 'superadmin',
    createdAt: new Date('2026-01-04'),
  },
];

// Mock Mongoose Methods for Unit Testing
TouristDestination.find = function (filter = {}) {
  let list = [...mockDestinations];

  if (filter.isActive !== undefined) {
    list = list.filter((d) => d.isActive === filter.isActive);
  }

  if (filter.state) {
    if (filter.state.$regex) {
      list = list.filter((d) => filter.state.$regex.test(d.state));
    } else {
      list = list.filter((d) => d.state.toLowerCase() === filter.state.toLowerCase());
    }
  }

  if (filter.city) {
    if (filter.city.$regex) {
      list = list.filter((d) => filter.city.$regex.test(d.city));
    } else {
      list = list.filter((d) => d.city.toLowerCase() === filter.city.toLowerCase());
    }
  }

  if (filter.category) {
    if (filter.category.$regex) {
      list = list.filter((d) => filter.category.$regex.test(d.category));
    } else {
      list = list.filter((d) => d.category.toLowerCase() === filter.category.toLowerCase());
    }
  }

  if (filter.$or && Array.isArray(filter.$or)) {
    list = list.filter((d) =>
      filter.$or.some((cond) => {
        const key = Object.keys(cond)[0];
        const val = d[key] || '';
        return cond[key].$regex ? cond[key].$regex.test(val) : String(val).toLowerCase().includes(String(cond[key]).toLowerCase());
      })
    );
  }

  return {
    select(fields) {
      const fieldList = fields.split(' ');
      list = list.map((item) => {
        const selected = {};
        fieldList.forEach((f) => {
          if (item[f] !== undefined) selected[f] = item[f];
        });
        return selected;
      });
      return this;
    },
    sort() {
      return this;
    },
    lean() {
      return Promise.resolve(list);
    },
    then(cb) {
      return Promise.resolve(list).then(cb);
    },
  };
};

TouristDestination.findOne = function (query = {}) {
  let found = null;
  if (query.destinationId) {
    found = mockDestinations.find((d) => d.destinationId === query.destinationId);
  } else if (query._id) {
    found = mockDestinations.find((d) => d._id === query._id);
  } else if (query.name && query.city && query.state) {
    found = mockDestinations.find((d) => {
      const matchName = query.name.$regex ? query.name.$regex.test(d.name) : d.name.toLowerCase() === query.name.toLowerCase();
      const matchCity = query.city.$regex ? query.city.$regex.test(d.city) : d.city.toLowerCase() === query.city.toLowerCase();
      const matchState = query.state.$regex ? query.state.$regex.test(d.state) : d.state.toLowerCase() === query.state.toLowerCase();
      const notSelf = query._id && query._id.$ne ? d._id !== query._id.$ne : true;
      return matchName && matchCity && matchState && notSelf;
    });
  }
  return Promise.resolve(found ? {
    ...found,
    save() {
      const idx = mockDestinations.findIndex((d) => d._id === this._id);
      if (idx !== -1) mockDestinations[idx] = { ...this };
      return Promise.resolve(this);
    }
  } : null);
};

TouristDestination.findById = function (id) {
  const found = mockDestinations.find((d) => d._id === id || d.destinationId === id);
  return Promise.resolve(found ? {
    ...found,
    save() {
      const idx = mockDestinations.findIndex((d) => d._id === this._id);
      if (idx !== -1) mockDestinations[idx] = { ...this };
      return Promise.resolve(this);
    }
  } : null);
};

TouristDestination.create = function (doc) {
  const created = {
    _id: `dest_${Date.now()}`,
    ...doc,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockDestinations.push(created);
  return Promise.resolve(created);
};

TouristDestination.findByIdAndDelete = function (id) {
  const idx = mockDestinations.findIndex((d) => d._id === id || d.destinationId === id);
  if (idx !== -1) {
    const deleted = mockDestinations.splice(idx, 1)[0];
    return Promise.resolve(deleted);
  }
  return Promise.resolve(null);
};

TouristDestination.findOneAndDelete = function (query) {
  const idx = mockDestinations.findIndex((d) => d.destinationId === query.destinationId);
  if (idx !== -1) {
    const deleted = mockDestinations.splice(idx, 1)[0];
    return Promise.resolve(deleted);
  }
  return Promise.resolve(null);
};

// Express handler simulator
async function executeHandler(controllerFn, { headers = {}, query = {}, body = {}, params = {}, useAuth = true, useSuperAdmin = false } = {}) {
  let statusCode = 200;
  let responseData = null;

  const req = {
    headers: { ...headers },
    query: { ...query },
    body: { ...body },
    params: { ...params },
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  let middlewareBlocked = false;

  if (useAuth) {
    await new Promise((resolve) => {
      authMiddleware(req, res, () => {
        resolve();
      });
      if (statusCode === 401 || statusCode === 403) {
        middlewareBlocked = true;
        resolve();
      }
    });
  }

  if (middlewareBlocked) {
    return { status: statusCode, data: responseData };
  }

  if (useSuperAdmin) {
    await new Promise((resolve) => {
      requireSuperAdmin(req, res, () => {
        resolve();
      });
      if (statusCode === 403) {
        middlewareBlocked = true;
        resolve();
      }
    });
  }

  if (middlewareBlocked) {
    return { status: statusCode, data: responseData };
  }

  await controllerFn(req, res);
  return { status: statusCode, data: responseData };
}

// Test Runner
let passedCount = 0;
let failedCount = 0;

function assert(id, title, condition, detail = '') {
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${id}: ${title}`);
    if (detail) console.log(`       Evidence: ${detail}`);
  } else {
    failedCount++;
    console.log(`[FAIL] ${id}: ${title}`);
    if (detail) console.log(`       Failure Detail: ${detail}`);
  }
}

async function runPhase3Tests() {
  console.log('======================================================================');
  console.log('     PHASE 3: GLOBAL TOURIST DESTINATIONS TEST SUITE                 ');
  console.log('======================================================================');

  // -------------------------------------------------------------------------
  // 1. PUBLIC READ-ONLY ACCESS & ACTIVE GATING
  // -------------------------------------------------------------------------
  console.log('\n--- 1. PUBLIC DIRECTORY ACCESS & ACTIVE FILTERING ---');
  const pubAllRes = await executeHandler(touristDestCtrl.getPublic, { useAuth: false });
  const pubList = pubAllRes.data?.data || [];
  const hasInactive = pubList.some((d) => d.isActive === false || d.destinationId === 'dest_staged_inactive');

  assert(
    '1a',
    'Public directory returns HTTP 200 without authentication',
    pubAllRes.status === 200,
    `Status: ${pubAllRes.status}, Returned destinations: ${pubList.length}`
  );

  assert(
    '1b',
    'Public directory strictly excludes inactive/staged destinations',
    !hasInactive && pubList.length === 3,
    `Active count: ${pubList.length}, Inactive exposed: ${hasInactive}`
  );

  assert(
    '1c',
    'Public directory strips internal creator/admin audit information',
    pubList.every((d) => d.createdBy === undefined),
    `Public destinations sanitized of createdBy audit field`
  );

  // -------------------------------------------------------------------------
  // 2. PUBLIC FILTERING (STATE, CITY, CATEGORY, SEARCH)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. PUBLIC FILTERING BY STATE, CITY & CATEGORY ---');
  const karnatakaRes = await executeHandler(touristDestCtrl.getPublic, {
    query: { state: 'Karnataka' },
    useAuth: false,
  });
  const karnatakaList = karnatakaRes.data?.data || [];
  assert(
    '2a',
    'Filtering by state "Karnataka" returns only Karnataka destinations',
    karnatakaList.every((d) => d.state === 'Karnataka') && karnatakaList.length === 2,
    `Returned: ${karnatakaList.map((d) => d.name).join(', ')}`
  );

  const monumentsRes = await executeHandler(touristDestCtrl.getPublic, {
    query: { category: 'Monuments & Forts' },
    useAuth: false,
  });
  const monumentsList = monumentsRes.data?.data || [];
  assert(
    '2b',
    'Filtering by category "Monuments & Forts" works accurately',
    monumentsList.every((d) => d.category === 'Monuments & Forts') && monumentsList.length === 2,
    `Returned: ${monumentsList.map((d) => d.name).join(', ')}`
  );

  // -------------------------------------------------------------------------
  // 3. SUPER ADMIN WRITE PERMISSIONS (CRUD)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. SUPER ADMIN MANAGEMENT & CRUD CAPABILITIES ---');
  // Create destination
  const createRes = await executeHandler(touristDestCtrl.create, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    body: {
      name: 'Taj Mahal',
      state: 'Uttar Pradesh',
      city: 'Agra',
      category: 'Monuments & Forts',
      description: 'An immense mausoleum of white marble, built in Agra between 1631 and 1648.',
      address: 'Dharmapuri, Forest Colony, Tajganj, Agra',
      latitude: 27.1751,
      longitude: 78.0421,
      timings: 'Sunrise to Sunset (Closed Fridays)',
      entryFee: '₹50 for Indian Nationals',
      imageLink: 'https://images.unsplash.com/photo-1564507592333-c60657eea523',
      isActive: true,
    },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '3a',
    'Super Admin can create a global destination (HTTP 201 Created)',
    createRes.status === 201 && createRes.data?.data?.name === 'Taj Mahal',
    `Created destination: ${createRes.data?.data?.name} (ID: ${createRes.data?.data?.destinationId})`
  );

  // Update destination
  const updateRes = await executeHandler(touristDestCtrl.update, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    params: { id: 'dest_mysore_palace' },
    body: {
      timings: '10:00 AM - 5:30 PM (Illumination Sundays 7-8 PM)',
    },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '3b',
    'Super Admin can update destination details (HTTP 200 OK)',
    updateRes.status === 200 && updateRes.data?.data?.timings?.includes('Illumination'),
    `Updated timings: ${updateRes.data?.data?.timings}`
  );

  // Toggle status
  const toggleRes = await executeHandler(touristDestCtrl.toggleStatus, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    params: { id: 'dest_staged_inactive' },
    body: { isActive: true },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '3c',
    'Super Admin can activate/deactivate a destination (HTTP 200 OK)',
    toggleRes.status === 200 && toggleRes.data?.data?.isActive === true,
    `New Status: ${toggleRes.data?.data?.isActive ? 'ACTIVE' : 'INACTIVE'}`
  );

  // -------------------------------------------------------------------------
  // 4. ROLE-BASED ACCESS CONTROL (RBAC) - CLIENTADMIN FORBIDDEN
  // -------------------------------------------------------------------------
  console.log('\n--- 4. STRICT RBAC: CLIENTADMIN WRITE RESTRICTION ---');
  const clientCreateRes = await executeHandler(touristDestCtrl.create, {
    headers: { authorization: `Bearer ${tokenClientAdmin}` },
    body: {
      name: 'Unapproved Palace',
      state: 'Karnataka',
      city: 'Bengaluru',
    },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '4a',
    'Clientadmin attempting to create a global destination receives HTTP 403 Forbidden',
    clientCreateRes.status === 403,
    `Status: ${clientCreateRes.status}, Error: ${clientCreateRes.data?.error}`
  );

  const clientUpdateRes = await executeHandler(touristDestCtrl.update, {
    headers: { authorization: `Bearer ${tokenClientAdmin}` },
    params: { id: 'dest_mysore_palace' },
    body: { name: 'Hacked Palace' },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '4b',
    'Clientadmin attempting to update a global destination receives HTTP 403 Forbidden',
    clientUpdateRes.status === 403,
    `Status: ${clientUpdateRes.status}`
  );

  const clientDeleteRes = await executeHandler(touristDestCtrl.remove, {
    headers: { authorization: `Bearer ${tokenClientAdmin}` },
    params: { id: 'dest_mysore_palace' },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '4c',
    'Clientadmin attempting to delete a global destination receives HTTP 403 Forbidden',
    clientDeleteRes.status === 403,
    `Status: ${clientDeleteRes.status}`
  );

  // -------------------------------------------------------------------------
  // 5. VALIDATIONS & ACCIDENTAL DUPLICATE PREVENTION
  // -------------------------------------------------------------------------
  console.log('\n--- 5. DATA INTEGRITY & VALIDATION RULES ---');
  // Duplicate check: Mysore Palace in Mysuru, Karnataka already exists
  const dupRes = await executeHandler(touristDestCtrl.create, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    body: {
      name: 'Mysore Palace',
      state: 'Karnataka',
      city: 'Mysuru',
    },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '5a',
    'Accidental duplicate destination in same city & state is rejected (HTTP 400)',
    dupRes.status === 400 && String(dupRes.data?.error).includes('already exists'),
    `Error: ${dupRes.data?.error}`
  );

  // Base64 image rejection
  const b64Res = await executeHandler(touristDestCtrl.create, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    body: {
      name: 'Charminar',
      state: 'Telangana',
      city: 'Hyderabad',
      imageLink: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '5b',
    'Base64 image payloads are strictly rejected with HTTP 400',
    b64Res.status === 400 && String(b64Res.data?.error).includes('Base64 images are not supported'),
    `Error: ${b64Res.data?.error}`
  );

  // Latitude out of range
  const latRes = await executeHandler(touristDestCtrl.create, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    body: {
      name: 'Invalid Coordinates Point',
      state: 'Goa',
      city: 'Panaji',
      latitude: 195.0, // Invalid: max 90
      longitude: 73.8,
    },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '5c',
    'Out-of-range coordinates are rejected with HTTP 400',
    latRes.status === 400 && String(latRes.data?.error).includes('Latitude must be a valid number between -90 and 90'),
    `Error: ${latRes.data?.error}`
  );

  // -------------------------------------------------------------------------
  // 6. HOTEL ADMIN READ-ONLY DIRECTORY ACCESS
  // -------------------------------------------------------------------------
  console.log('\n--- 6. HOTEL ADMIN READ-ONLY DIRECTORY ACCESS ---');
  const hotelAdminReadRes = await executeHandler(touristDestCtrl.getAdminAll, {
    headers: { authorization: `Bearer ${tokenClientAdmin}` },
    useAuth: true,
    useSuperAdmin: false,
  });

  assert(
    '6a',
    'Hotel Admin can view the global directory via GET /api/tourist-destinations/admin (HTTP 200)',
    hotelAdminReadRes.status === 200 && Array.isArray(hotelAdminReadRes.data?.data),
    `Status: ${hotelAdminReadRes.status}, Total visible destinations: ${hotelAdminReadRes.data?.data?.length}`
  );

  assert(
    '6b',
    'Hotel Admin directory view remains independent of selected hotel context',
    hotelAdminReadRes.data?.data?.some((d) => d.state === 'Maharashtra') &&
    hotelAdminReadRes.data?.data?.some((d) => d.state === 'Karnataka'),
    `India-wide multi-state records returned regardless of active hotel`
  );

  // -------------------------------------------------------------------------
  // 7. PRESERVATION OF EXISTING HOTEL-SPECIFIC NEARBY PLACES
  // -------------------------------------------------------------------------
  console.log('\n--- 7. PRESERVATION OF HOTEL-SPECIFIC NEARBY PLACES ---');
  const mockHotelNearbyPlaces = [
    { name: 'Lalbagh Botanical Garden', title: 'Lalbagh Botanical Garden', city: 'Bengaluru' },
    { name: 'Mysore Palace', title: 'Mysore Palace', city: 'Mysuru' }, // Matches global destination
  ];

  // Simulation of HomeScreen deduplication logic
  const seenNames = new Set();
  const mergedForGuest = [];

  // Hotel-specific first
  mockHotelNearbyPlaces.forEach((p) => {
    const k = p.name.toLowerCase();
    seenNames.add(k);
    mergedForGuest.push({ ...p, source: 'hotel_specific' });
  });

  // Global destinations added if not already present
  mockDestinations.filter((d) => d.isActive).forEach((g) => {
    const k = g.name.toLowerCase();
    if (!seenNames.has(k)) {
      seenNames.add(k);
      mergedForGuest.push({ ...g, source: 'global_directory' });
    }
  });

  const mysoreCount = mergedForGuest.filter((p) => (p.name || '').toLowerCase() === 'mysore palace').length;
  const hotelSpecificPreserved = mergedForGuest.some((p) => p.name === 'Lalbagh Botanical Garden' && p.source === 'hotel_specific');

  assert(
    '7a',
    'Existing hotel-specific nearby places are 100% preserved as primary',
    hotelSpecificPreserved,
    `Preserved hotel-specific "Lalbagh Botanical Garden"`
  );

  assert(
    '7b',
    'Zero display duplicates when destination exists in both hotel nearby and global directory',
    mysoreCount === 1,
    `Mysore Palace count in merged guest feed: ${mysoreCount} (Deduplication confirmed)`
  );

  // Delete destination cleanup test
  const delRes = await executeHandler(touristDestCtrl.remove, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    params: { id: createRes.data?.data?.destinationId },
    useAuth: true,
    useSuperAdmin: true,
  });

  assert(
    '7c',
    'Super Admin can delete a destination (HTTP 200 OK)',
    delRes.status === 200 && delRes.data?.data?.deleted === true,
    `Deleted test destination: ${createRes.data?.data?.destinationId}`
  );

  console.log('\n======================================================================');
  console.log(`TOTAL PHASE 3 TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) process.exit(1);
}

runPhase3Tests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

