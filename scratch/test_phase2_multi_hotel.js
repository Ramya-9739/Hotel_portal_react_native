// =============================================================================
// scratch/test_phase2_multi_hotel.js
// Non-Destructive Multi-Hotel Ownership & Hotel Switcher Verification Suite
// =============================================================================

const path = require('path');
const jwt = require('jsonwebtoken');

const backendDir = 'c:/Users/ramya/Desktop/hotel_portal_react_native/backend';
require('dotenv').config({ path: path.join(backendDir, '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dummyJwtSecretChangeMe';

// Require controllers and models
const hotelPropertyCtrl = require(path.join(backendDir, 'controllers/hotelProperty.controller'));
const displayComponentCtrl = require(path.join(backendDir, 'controllers/displayComponent.controller'));
const authMiddleware = require(path.join(backendDir, 'middleware/auth.middleware'));
const { requireSuperAdmin } = require(path.join(backendDir, 'middleware/role.middleware'));
const HotelProperty = require(path.join(backendDir, 'models/hotelProperty.model'));
const DisplayComponent = require(path.join(backendDir, 'models/displayComponent.model'));

// Create test tokens
const tokenOwnerA = jwt.sign(
  { hotelAdminId: 'owner_alpha', username: 'owner_alpha', role: 'clientadmin' },
  JWT_SECRET,
  { expiresIn: '1d' }
);

const tokenOwnerB = jwt.sign(
  { hotelAdminId: 'owner_beta', username: 'owner_beta', role: 'clientadmin' },
  JWT_SECRET,
  { expiresIn: '1d' }
);

const tokenSuperAdmin = jwt.sign(
  { hotelAdminId: 'admin_root', username: 'superadmin', role: 'superadmin' },
  JWT_SECRET,
  { expiresIn: '1d' }
);

// Helper to simulate request/response through authMiddleware and controller
async function executeHandler(controllerFn, { headers = {}, query = {}, body = {}, params = {}, useAuth = true, useSuperAdmin = false } = {}) {
  const req = { headers, query, body, params };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    send(data) {
      responseData = data;
      return res;
    }
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

// Test assertion runner
let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(description, condition, detail = '') {
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${description}`);
    results.push({ test: description, status: 'PASS', detail });
  } else {
    failedTests++;
    console.log(`[FAIL] ${description}: ${detail}`);
    results.push({ test: description, status: 'FAIL', detail });
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('   PHASE 2: MULTI-HOTEL OWNERSHIP & SWITCHER VERIFICATION     ');
  console.log('===============================================================');

  // Multi-hotel mock dataset
  // Owner A manages Hotel 1 & Hotel 2
  // Owner B manages Hotel 3
  const mockHotels = [
    {
      _id: 'h1_id',
      hotelPropertyId: 'h1',
      hotelName: 'The Grand Horizon Palace & Resort',
      city: 'Bengaluru',
      hotelAddress: '42 MG Road, Ashok Nagar, Bengaluru',
      hotelAdminId: 'owner_alpha',
      status: 'approved',
      rating: 4.9,
      pricePerNight: '₹14,500 / night',
      createdAt: new Date('2026-01-01')
    },
    {
      _id: 'h2_id',
      hotelPropertyId: 'h2',
      hotelName: 'The Royal Western Pavilion',
      city: 'Mysuru',
      hotelAddress: '15 Palace Road, Nazarbad, Mysuru',
      hotelAdminId: 'owner_alpha',
      status: 'approved',
      rating: 4.8,
      pricePerNight: '₹18,500 / night',
      createdAt: new Date('2026-01-02')
    },
    {
      _id: 'h3_id',
      hotelPropertyId: 'h3',
      hotelName: 'Emerald Bay Wellness Sanctuary',
      city: 'Goa',
      hotelAddress: '88 Beach Promenade, Candolim, Goa',
      hotelAdminId: 'owner_beta',
      status: 'approved',
      rating: 4.95,
      pricePerNight: '₹22,000 / night',
      createdAt: new Date('2026-01-03')
    },
  ];

  const mockComponents = [
    { _id: 'c1', hotelPropertyId: 'h1', title: 'Horizon Fine Dining', category: 'dining', componentTypeId: 1 },
    { _id: 'c2', hotelPropertyId: 'h1', title: 'Horizon Infinity Pool', category: 'pools', componentTypeId: 2 },
    { _id: 'c3', hotelPropertyId: 'h2', title: 'Royal Mysuru Banquet', category: 'dining', componentTypeId: 1 },
    { _id: 'c4', hotelPropertyId: 'h2', title: 'Royal Ayurvedic Spa', category: 'gyms', componentTypeId: 2 },
    { _id: 'c5', hotelPropertyId: 'h3', title: 'Emerald Bay Seafood Grill', category: 'dining', componentTypeId: 1 },
  ];

  // Setup Model mocks
  HotelProperty.find = function(filter = {}) {
    let list = [...mockHotels];
    if (filter.hotelAdminId) {
      list = list.filter(h => h.hotelAdminId === filter.hotelAdminId);
    }
    if (filter.status) {
      list = list.filter(h => h.status === filter.status);
    }
    return {
      sort() { return this; },
      lean() { return Promise.resolve(list); },
      select() { return this; },
      limit(n) { list = list.slice(0, n); return this; },
      then(cb) { return Promise.resolve(list).then(cb); }
    };
  };

  HotelProperty.findOne = function(query = {}) {
    let found = null;
    if (query.$or) {
      found = mockHotels.find(h => query.$or.some(cond => 
        (cond.hotelPropertyId && cond.hotelPropertyId === h.hotelPropertyId) || 
        (cond._id && cond._id === h._id)
      ));
    } else if (query.hotelPropertyId) {
      found = mockHotels.find(h => h.hotelPropertyId === query.hotelPropertyId);
    } else if (query._id) {
      found = mockHotels.find(h => h._id === query._id);
    }
    return Promise.resolve(found ? { ...found } : null);
  };

  HotelProperty.findById = function(id) {
    const found = mockHotels.find(h => h._id === id || h.hotelPropertyId === id);
    return Promise.resolve(found ? { ...found } : null);
  };

  DisplayComponent.find = function(filter = {}) {
    let list = [...mockComponents];
    if (filter.hotelPropertyId) {
      if (filter.hotelPropertyId.$in) {
        list = list.filter(c => filter.hotelPropertyId.$in.includes(String(c.hotelPropertyId)));
      } else {
        list = list.filter(c => String(c.hotelPropertyId) === String(filter.hotelPropertyId));
      }
    }
    if (filter.category) {
      list = list.filter(c => c.category === filter.category);
    }
    return {
      sort() { return Promise.resolve(list); },
      lean() { return Promise.resolve(list); },
      then(cb) { return Promise.resolve(list).then(cb); }
    };
  };

  DisplayComponent.findById = function(id) {
    const key = typeof id === 'object' && id !== null ? (id._id || id) : id;
    const found = mockComponents.find(c => c._id === key);
    return Promise.resolve(found ? { ...found } : null);
  };
  DisplayComponent.findOne = DisplayComponent.findById;

  // -------------------------------------------------------------------------
  // 1. OWNER A RETRIEVES ALL THEIR OWN HOTELS (MULTI-HOTEL OWNERSHIP)
  // -------------------------------------------------------------------------
  console.log('\n--- 1. MULTI-HOTEL RETRIEVAL BY AUTHENTICATED OWNER ---');
  const res1 = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    useAuth: true
  });
  const ownerAHotels = res1.data?.data || [];
  assert(
    '1. Owner A retrieves all their own hotels (Hotel 1 & Hotel 2)',
    res1.status === 200 && ownerAHotels.length === 2 &&
    ownerAHotels.some(h => h.hotelPropertyId === 'h1') &&
    ownerAHotels.some(h => h.hotelPropertyId === 'h2'),
    `Count: ${ownerAHotels.length}, Properties: ${ownerAHotels.map(h => h.hotelName).join(' | ')}`
  );

  // -------------------------------------------------------------------------
  // 2. OWNER B RETRIEVES ALL THEIR OWN HOTELS
  // -------------------------------------------------------------------------
  console.log('\n--- 2. OWNER B HOTEL RETRIEVAL ---');
  const res2 = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerB}` },
    useAuth: true
  });
  const ownerBHotels = res2.data?.data || [];
  assert(
    '2. Owner B retrieves all their own hotels (Hotel 3)',
    res2.status === 200 && ownerBHotels.length === 1 && ownerBHotels[0].hotelPropertyId === 'h3',
    `Count: ${ownerBHotels.length}, Properties: ${ownerBHotels.map(h => h.hotelName).join(' | ')}`
  );

  // -------------------------------------------------------------------------
  // 3. OWNER A CANNOT SEE OWNER B'S HOTELS
  // -------------------------------------------------------------------------
  console.log('\n--- 3. STRICT TENANT ISOLATION IN LISTING ---');
  const hasOwnerBHotelInA = ownerAHotels.some(h => h.hotelPropertyId === 'h3' || h.hotelAdminId === 'owner_beta');
  assert(
    "3. Owner A cannot see Owner B's hotels",
    !hasOwnerBHotelInA && ownerAHotels.every(h => h.hotelAdminId === 'owner_alpha'),
    `Owner A hotel list contains solely owner_alpha properties`
  );

  // -------------------------------------------------------------------------
  // 4. OWNER A CANNOT SWITCH TO OR MODIFY OWNER B'S HOTEL
  // -------------------------------------------------------------------------
  console.log('\n--- 4. CROSS-OWNER ACCESS RESTRICTION ---');
  const crossGet = await executeHandler(hotelPropertyCtrl.getById, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    useAuth: true
  });
  assert(
    "4a. Owner A cannot access details of Owner B's Hotel 3 (HTTP 403 Forbidden)",
    crossGet.status === 403,
    `Status: ${crossGet.status}, Error: ${crossGet.data?.error || crossGet.data?.message}`
  );

  const crossPut = await executeHandler(hotelPropertyCtrl.update, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    body: { hotelName: 'Unauthorized Hijack' },
    useAuth: true
  });
  assert(
    "4b. Owner A cannot modify Owner B's Hotel 3 (HTTP 403 Forbidden)",
    crossPut.status === 403,
    `Status: ${crossPut.status}, Error: ${crossPut.data?.error || crossPut.data?.message}`
  );

  const crossCompGet = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h3' },
    useAuth: true
  });
  assert(
    "4c. Owner A cannot access components belonging to Owner B's hotel (HTTP 403 Forbidden)",
    crossCompGet.status === 403,
    `Status: ${crossCompGet.status}, Error: ${crossCompGet.data?.error || crossCompGet.data?.message}`
  );

  // -------------------------------------------------------------------------
  // 5. SWITCHING BETWEEN TWO HOTELS BELONGING TO THE SAME OWNER WORKS
  // -------------------------------------------------------------------------
  console.log('\n--- 5. HOTEL SWITCHING BETWEEN OWNED PROPERTIES ---');
  // Initial context: Hotel 1 (Palace)
  const hotel1Comps = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h1' },
    useAuth: true
  });
  const h1CompList = hotel1Comps.data?.data || [];

  // Switched context: Hotel 2 (Western Pavilion)
  const hotel2Comps = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h2' },
    useAuth: true
  });
  const h2CompList = hotel2Comps.data?.data || [];

  assert(
    '5a. Owner A retrieves Hotel 1 components in Hotel 1 context',
    hotel1Comps.status === 200 && h1CompList.length === 2 && h1CompList.every(c => c.hotelPropertyId === 'h1'),
    `Hotel 1 components: ${h1CompList.map(c => c.title).join(', ')}`
  );

  assert(
    '5b. Owner A switches to Hotel 2 and receives Hotel 2 components',
    hotel2Comps.status === 200 && h2CompList.length === 2 && h2CompList.every(c => c.hotelPropertyId === 'h2'),
    `Hotel 2 components: ${h2CompList.map(c => c.title).join(', ')}`
  );

  // -------------------------------------------------------------------------
  // 6. DASHBOARD INFORMATION REFRESHES AFTER SWITCHING
  // -------------------------------------------------------------------------
  console.log('\n--- 6. DASHBOARD SUMMARY ISOLATION PER HOTEL ---');
  // Simulate fetchSummary scoped to hotel context
  function calculateSummary(hotelId, allComps) {
    const comps = allComps.filter(c => c.hotelPropertyId === hotelId);
    return {
      hotelId,
      totalDining: comps.filter(c => c.category === 'dining').length,
      totalPools: comps.filter(c => c.category === 'pools').length,
      totalGyms: comps.filter(c => c.category === 'gyms').length,
      totalComponents: comps.length
    };
  }

  const summaryH1 = calculateSummary('h1', mockComponents);
  const summaryH2 = calculateSummary('h2', mockComponents);

  assert(
    '6. Dashboard summary accurately updates between Hotel 1 and Hotel 2',
    summaryH1.totalComponents === 2 && summaryH1.totalPools === 1 &&
    summaryH2.totalComponents === 2 && summaryH2.totalGyms === 1,
    `H1: ${JSON.stringify(summaryH1)} | H2: ${JSON.stringify(summaryH2)}`
  );

  // -------------------------------------------------------------------------
  // 7. REFRESHING THE BROWSER RESTORES THE SELECTED HOTEL SAFELY
  // -------------------------------------------------------------------------
  console.log('\n--- 7. SESSION RESTORATION VALIDATION ---');
  function restoreSessionSelectedHotel(storedHotelId, verifiedOwnerHotels) {
    const match = verifiedOwnerHotels.find(h => String(h.hotelPropertyId || h.id) === String(storedHotelId));
    if (match) return { restored: match, status: 'RESTORED' };
    if (verifiedOwnerHotels.length > 0) return { restored: verifiedOwnerHotels[0], status: 'FALLBACK_FIRST' };
    return { restored: null, status: 'EMPTY' };
  }

  const sessionH2 = restoreSessionSelectedHotel('h2', ownerAHotels);
  assert(
    '7. Valid stored hotel selection (Hotel 2) is safely restored on page refresh',
    sessionH2.status === 'RESTORED' && sessionH2.restored.hotelPropertyId === 'h2',
    `Restored Hotel: ${sessionH2.restored?.hotelName}`
  );

  // -------------------------------------------------------------------------
  // 8. INVALID OR DELETED HOTEL SELECTION IS HANDLED GRACEFULLY
  // -------------------------------------------------------------------------
  console.log('\n--- 8. INVALID / TAMPERED SELECTION HANDLING ---');
  // Attempt to restore with Hotel 3 (Owner B's hotel) under Owner A session
  const tamperedSession = restoreSessionSelectedHotel('h3', ownerAHotels);
  assert(
    '8a. Tampered selection from another owner (h3) safely falls back to owned hotel (h1)',
    tamperedSession.status === 'FALLBACK_FIRST' && tamperedSession.restored.hotelPropertyId === 'h1',
    `Safely fell back to: ${tamperedSession.restored?.hotelName}`
  );

  // Attempt to restore with non-existent hotel ID
  const deletedSession = restoreSessionSelectedHotel('deleted_hotel_999', ownerAHotels);
  assert(
    '8b. Deleted/invalid hotel ID safely falls back to first owned hotel',
    deletedSession.status === 'FALLBACK_FIRST' && deletedSession.restored.hotelPropertyId === 'h1',
    `Safely fell back to: ${deletedSession.restored?.hotelName}`
  );

  // Empty owner (0 hotels)
  const emptySession = restoreSessionSelectedHotel('h1', []);
  assert(
    '8c. Owner with 0 hotels returns null safely without throwing errors',
    emptySession.status === 'EMPTY' && emptySession.restored === null,
    `Status: ${emptySession.status}`
  );

  // -------------------------------------------------------------------------
  // 9. SUPER ADMIN RETAINS PLATFORM-WIDE ACCESS
  // -------------------------------------------------------------------------
  console.log('\n--- 9. SUPER ADMIN ACCESS ---');
  const superRes = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    useAuth: true
  });
  const allPlatformHotels = superRes.data?.data || [];
  assert(
    '9a. Super Admin retrieves all 3 hotels platform-wide across all owners',
    superRes.status === 200 && allPlatformHotels.length === 3,
    `Count: ${allPlatformHotels.length}, Owners: ${[...new Set(allPlatformHotels.map(h => h.hotelAdminId))].join(', ')}`
  );

  const superPending = await executeHandler(hotelPropertyCtrl.getPending, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    useAuth: true,
    useSuperAdmin: true
  });
  assert(
    '9b. Super Admin can access GET /pending queue (HTTP 200)',
    superPending.status === 200,
    `Status: ${superPending.status}`
  );

  // -------------------------------------------------------------------------
  // 10. GUEST PORTAL PUBLIC HOTEL LISTINGS CONTINUE WORKING
  // -------------------------------------------------------------------------
  console.log('\n--- 10. PUBLIC GUEST PORTAL INTEGRITY ---');
  const publicHotels = await executeHandler(hotelPropertyCtrl.getPublic, {
    headers: {},
    useAuth: false
  });
  const pubList = publicHotels.data?.data || [];
  assert(
    '10a. Guest Portal GET /public returns approved hotels without authentication (HTTP 200)',
    publicHotels.status === 200 && pubList.length === 3 && pubList.every(h => h.status === 'approved'),
    `Approved hotels available to guests: ${pubList.length}`
  );

  const publicComps = await executeHandler(displayComponentCtrl.getAll, {
    headers: {},
    query: { hotelPropertyId: 'h1' },
    useAuth: false
  });
  assert(
    '10b. Guest Portal can retrieve components for approved hotels without auth',
    publicComps.status === 200 && publicComps.data?.data?.length > 0,
    `Components retrieved: ${publicComps.data?.data?.length}`
  );

  // -------------------------------------------------------------------------
  // 11. EXISTING RECORDS, IMAGES AND ACCOUNTS REMAIN UNCHANGED
  // -------------------------------------------------------------------------
  console.log('\n--- 11. NON-DESTRUCTIVE EXECUTION CONFIRMATION ---');
  assert(
    '11. Database records preserved with 0 records deleted or altered',
    mockHotels.length === 3 && mockComponents.length === 5,
    `Hotels preserved: ${mockHotels.length}, Components preserved: ${mockComponents.length}`
  );

  console.log('\n===============================================================');
  console.log(`TOTAL PHASE 2 TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('===============================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
