const path = require('path');
const jwt = require('jsonwebtoken');

const backendDir = 'c:/Users/ramya/Desktop/hotel_portal_react_native/backend';
require('dotenv').config({ path: path.join(backendDir, '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dummyJwtSecretChangeMe';

// Require controllers and models
const hotelPropertyCtrl = require(path.join(backendDir, 'controllers/hotelProperty.controller'));
const displayComponentCtrl = require(path.join(backendDir, 'controllers/displayComponent.controller'));
const hotelPictureCtrl = require(path.join(backendDir, 'controllers/hotelPicture.controller'));
const authMiddleware = require(path.join(backendDir, 'middleware/auth.middleware'));
const { requireSuperAdmin } = require(path.join(backendDir, 'middleware/role.middleware'));
const HotelProperty = require(path.join(backendDir, 'models/hotelProperty.model'));
const DisplayComponent = require(path.join(backendDir, 'models/displayComponent.model'));

// Create tokens
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
      authMiddleware(req, res, () => resolve());
      // If authMiddleware sent a response without calling next(), it resolved or blocked
      if (statusCode !== 200 || responseData) {
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
      requireSuperAdmin(req, res, () => resolve());
      if (statusCode !== 200 || responseData) {
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

async function runTests() {
  console.log('===============================================================');
  console.log('   PHASE 1: AUTHENTICATION AND MULTI-TENANT SECURITY TESTS');
  console.log('===============================================================');

  const results = [];
  function assert(testName, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      results.push({ name: testName, status: 'PASS', details });
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      results.push({ name: testName, status: 'FAIL', details });
    }
  }

  // -------------------------------------------------------------------------
  // TEST SUITE A: UNAUTHENTICATED ACCESS PROTECTION
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE A: UNAUTHENTICATED ACCESS RESTRICTIONS ---');

  // A1: GET /api/hotel-properties without token -> 401
  const a1 = await executeHandler(hotelPropertyCtrl.getAll, { useAuth: true });
  assert('A1: GET /api/hotel-properties unauthenticated returns 401', a1.status === 401, `Status: ${a1.status}`);

  // A2: GET /api/hotel-properties/search without token -> 401
  const a2 = await executeHandler(hotelPropertyCtrl.search, { query: { q: 'Taj' }, useAuth: true });
  assert('A2: GET /api/hotel-properties/search unauthenticated returns 401', a2.status === 401, `Status: ${a2.status}`);

  // A3: GET /api/hotel-properties/:id without token -> 401
  const a3 = await executeHandler(hotelPropertyCtrl.getById, { params: { id: 'sample-id' }, useAuth: true });
  assert('A3: GET /api/hotel-properties/:id unauthenticated returns 401', a3.status === 401, `Status: ${a3.status}`);

  // A4: POST /api/hotel-properties without token -> 401
  const a4 = await executeHandler(hotelPropertyCtrl.create, { body: { hotelName: 'Hacker Hotel' }, useAuth: true });
  assert('A4: POST /api/hotel-properties unauthenticated returns 401', a4.status === 401, `Status: ${a4.status}`);

  // A5: PUT /api/hotel-properties/:id without token -> 401
  const a5 = await executeHandler(hotelPropertyCtrl.update, { params: { id: 'sample-id' }, body: {}, useAuth: true });
  assert('A5: PUT /api/hotel-properties/:id unauthenticated returns 401', a5.status === 401, `Status: ${a5.status}`);

  // A6: DELETE /api/hotel-properties/:id without token -> 401
  const a6 = await executeHandler(hotelPropertyCtrl.remove, { params: { id: 'sample-id' }, useAuth: true });
  assert('A6: DELETE /api/hotel-properties/:id unauthenticated returns 401', a6.status === 401, `Status: ${a6.status}`);

  // -------------------------------------------------------------------------
  // TEST SUITE B: OWNER ISOLATION & MULTI-HOTEL COMPATIBILITY
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE B: OWNER ISOLATION & MULTI-HOTEL COMPATIBILITY ---');

  // Mock HotelProperty.find and findOne to test controller logic in isolation
  const originalFind = HotelProperty.find;
  const originalFindOne = HotelProperty.findOne;
  const originalFindById = HotelProperty.findById;
  const originalFindByIdAndUpdate = HotelProperty.findByIdAndUpdate;
  const originalFindByIdAndDelete = HotelProperty.findByIdAndDelete;

  const mockHotels = [
    { _id: 'h1_id', hotelPropertyId: 'h1', hotelName: 'Owner A - Hotel 1 (Palace)', hotelAdminId: 'owner_alpha', status: 'approved' },
    { _id: 'h2_id', hotelPropertyId: 'h2', hotelName: 'Owner A - Hotel 2 (Resort)', hotelAdminId: 'owner_alpha', status: 'approved' },
    { _id: 'h3_id', hotelPropertyId: 'h3', hotelName: 'Owner B - Hotel 3 (Grand)', hotelAdminId: 'owner_beta', status: 'approved' },
  ];

  HotelProperty.find = function(filter = {}) {
    let list = mockHotels;
    if (filter.hotelAdminId) {
      list = list.filter(h => h.hotelAdminId === filter.hotelAdminId);
    }
    if (filter.status) {
      list = list.filter(h => h.status === filter.status);
    }
    if (filter.$or) {
      // Regex match simulator
      list = list.filter(h => filter.$or.some(cond => {
        for (const [k, v] of Object.entries(cond)) {
          if (v instanceof RegExp && v.test(h[k] || '')) return true;
        }
        return false;
      }));
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
      found = mockHotels.find(h => query.$or.some(cond => (cond.hotelPropertyId && cond.hotelPropertyId === h.hotelPropertyId) || (cond._id && cond._id === h._id)));
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

  // B1: Owner A calls GET /api/hotel-properties -> receives only Hotel 1 & 2
  const b1 = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    useAuth: true
  });
  const b1Hotels = b1.data?.data || [];
  assert(
    'B1: Owner A sees exactly their 2 hotels (Multi-hotel ownership verified)',
    b1.status === 200 && b1Hotels.length === 2 && b1Hotels.every(h => h.hotelAdminId === 'owner_alpha'),
    `Count: ${b1Hotels.length}, AdminIds: ${b1Hotels.map(h => h.hotelAdminId).join(',')}`
  );

  // B2: Owner B calls GET /api/hotel-properties -> receives only Hotel 3
  const b2 = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerB}` },
    useAuth: true
  });
  const b2Hotels = b2.data?.data || [];
  assert(
    'B2: Owner B sees exactly their 1 hotel',
    b2.status === 200 && b2Hotels.length === 1 && b2Hotels[0].hotelAdminId === 'owner_beta',
    `Count: ${b2Hotels.length}, AdminIds: ${b2Hotels.map(h => h.hotelAdminId).join(',')}`
  );

  // B3: Owner A attempts to forge query parameter (?hotelAdminId=owner_beta) -> Ignored, locked to verified JWT!
  const b3 = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelAdminId: 'owner_beta' },
    useAuth: true
  });
  const b3Hotels = b3.data?.data || [];
  assert(
    'B3: Client-provided hotelAdminId query parameter is IGNORED for clientadmin',
    b3.status === 200 && b3Hotels.length === 2 && b3Hotels.every(h => h.hotelAdminId === 'owner_alpha'),
    `Count: ${b3Hotels.length}, AdminIds: ${b3Hotels.map(h => h.hotelAdminId).join(',')}`
  );

  // B4: Owner A calls GET /api/hotel-properties/search?q=Palace -> finds Hotel 1
  const b4 = await executeHandler(hotelPropertyCtrl.search, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { q: 'Palace' },
    useAuth: true
  });
  const b4Results = b4.data?.data || [];
  assert(
    'B4: Owner A searches their own hotels successfully',
    b4.status === 200 && b4Results.length === 1 && b4Results[0].hotelPropertyId === 'h1',
    `Found: ${b4Results.map(h => h.hotelName).join(',')}`
  );

  // B5: Owner A calls GET /api/hotel-properties/search?q=Grand (Hotel 3) -> 0 results (Owner B hotel is NOT exposed)
  const b5 = await executeHandler(hotelPropertyCtrl.search, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { q: 'Grand' },
    useAuth: true
  });
  const b5Results = b5.data?.data || [];
  assert(
    'B5: Owner A cannot search or discover Owner B hotels',
    b5.status === 200 && b5Results.length === 0,
    `Found: ${b5Results.length}`
  );

  // B6: Owner A attempts to GET details of Owner B's Hotel 3 -> 403 Forbidden
  const b6 = await executeHandler(hotelPropertyCtrl.getById, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    useAuth: true
  });
  assert(
    'B6: Owner A cannot view details of Owner B hotel (HTTP 403)',
    b6.status === 403,
    `Status: ${b6.status}, Message: ${b6.data?.error || b6.data?.message}`
  );

  // B7: Owner A attempts to update Owner B's Hotel 3 -> 403 Forbidden
  const b7 = await executeHandler(hotelPropertyCtrl.update, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    body: { hotelName: 'Hacked Hotel Name' },
    useAuth: true
  });
  assert(
    'B7: Owner A cannot modify Owner B hotel (HTTP 403)',
    b7.status === 403,
    `Status: ${b7.status}, Message: ${b7.data?.error || b7.data?.message}`
  );

  // B8: Owner A attempts to delete Owner B's Hotel 3 -> 403 Forbidden
  const b8 = await executeHandler(hotelPropertyCtrl.remove, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    useAuth: true
  });
  assert(
    'B8: Owner A cannot delete Owner B hotel (HTTP 403)',
    b8.status === 403,
    `Status: ${b8.status}, Message: ${b8.data?.error || b8.data?.message}`
  );

  // -------------------------------------------------------------------------
  // TEST SUITE C: COMPONENT OWNERSHIP ENFORCEMENT
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE C: COMPONENT OWNERSHIP ENFORCEMENT ---');

  const mockComponents = [
    { _id: 'comp1_id', hotelPropertyId: 'h1', title: 'Royal Pavilion Dining', category: 'dining' },
    { _id: 'comp3_id', hotelPropertyId: 'h3', title: 'Grand Hotel Gym', category: 'gyms' },
  ];

  DisplayComponent.find = function(filter = {}) {
    let list = mockComponents;
    if (filter.hotelPropertyId?.$in) {
      list = list.filter(c => filter.hotelPropertyId.$in.includes(String(c.hotelPropertyId)));
    }
    return {
      sort() { return Promise.resolve(list); },
      then(cb) { return Promise.resolve(list).then(cb); }
    };
  };

  DisplayComponent.findById = function(id) {
    const key = typeof id === 'object' && id !== null ? (id._id || id) : id;
    const found = mockComponents.find(c => c._id === key);
    return Promise.resolve(found ? { ...found } : null);
  };
  DisplayComponent.findOne = function(query) {
    const key = typeof query === 'object' && query !== null ? (query._id || query) : query;
    const found = mockComponents.find(c => c._id === key);
    return Promise.resolve(found ? { ...found } : null);
  };
  DisplayComponent.create = function(doc) {
    return Promise.resolve({ _id: 'new_comp_id', ...doc });
  };
  DisplayComponent.findByIdAndUpdate = function(id, update) {
    const found = mockComponents.find(c => c._id === id);
    return Promise.resolve({ ...found, ...update });
  };
  DisplayComponent.findByIdAndDelete = function(id) {
    return Promise.resolve({ _id: id });
  };

  // C1: Owner A attempts to create component on Owner B's Hotel 3 -> 403 Forbidden
  const c1 = await executeHandler(displayComponentCtrl.create, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    body: { hotelPropertyId: 'h3', title: 'Malicious Restaurant', category: 'dining' },
    useAuth: true
  });
  assert(
    'C1: Owner A cannot create component on Owner B hotel (HTTP 403)',
    c1.status === 403,
    `Status: ${c1.status}, Message: ${c1.data?.error || c1.data?.message}`
  );

  // C2: Owner A creates component on their own Hotel 1 -> 201 Created
  const c2 = await executeHandler(displayComponentCtrl.create, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    body: { hotelPropertyId: 'h1', title: 'New Royal Spa', category: 'facilities' },
    useAuth: true
  });
  assert(
    'C2: Owner A can create component on their own hotel (HTTP 201)',
    c2.status === 201,
    `Status: ${c2.status}`
  );

  // C3: Owner A attempts to modify component belonging to Owner B's Hotel 3 -> 403 Forbidden
  const c3 = await executeHandler(displayComponentCtrl.update, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'comp3_id' },
    body: { title: 'Hacked Gym Name' },
    useAuth: true
  });
  assert(
    'C3: Owner A cannot modify Owner B component (HTTP 403)',
    c3.status === 403,
    `Status: ${c3.status}, Message: ${c3.data?.error || c3.data?.message}`
  );

  // C4: Owner A attempts to delete component belonging to Owner B's Hotel 3 -> 403 Forbidden
  const c4 = await executeHandler(displayComponentCtrl.remove, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'comp3_id' },
    useAuth: true
  });
  assert(
    'C4: Owner A cannot delete Owner B component (HTTP 403)',
    c4.status === 403,
    `Status: ${c4.status}, Message: ${c4.data?.error || c4.data?.message}`
  );

  // C5: Owner A calls GET /api/display-components?hotelPropertyId=h3 -> 403 Forbidden
  const c5 = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h3' },
    useAuth: false // uses optionalAuth
  });
  // attach decoded token manually since useAuth: false
  const reqC5 = {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h3' },
    hotelAdmin: { hotelAdminId: 'owner_alpha', role: 'clientadmin' }
  };
  let c5ResCode = 200;
  let c5ResData = null;
  const mockResC5 = {
    status(c) { c5ResCode = c; return mockResC5; },
    json(d) { c5ResData = d; return mockResC5; }
  };
  await displayComponentCtrl.getAll(reqC5, mockResC5);
  assert(
    'C5: Owner A cannot query components of Owner B hotel (HTTP 403)',
    c5ResCode === 403,
    `Status: ${c5ResCode}, Message: ${c5ResData?.error}`
  );

  // -------------------------------------------------------------------------
  // TEST SUITE D: SUPER ADMIN PRIVILEGES & RBAC
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE D: SUPER ADMIN PRIVILEGES & RBAC ---');

  // D1: Super Admin calls GET /api/hotel-properties -> returns all 3 hotels
  const d1 = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    useAuth: true
  });
  const d1Hotels = d1.data?.data || [];
  assert(
    'D1: Super Admin retains platform-wide access (sees all hotels)',
    d1.status === 200 && d1Hotels.length === 3,
    `Count: ${d1Hotels.length}`
  );

  // D2: Client Admin attempts to access Super Admin endpoint (GET /pending) -> 403
  const d2 = await executeHandler(hotelPropertyCtrl.getPending, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    useAuth: true,
    useSuperAdmin: true
  });
  assert(
    'D2: Clientadmin cannot access Super Admin endpoint (HTTP 403)',
    d2.status === 403,
    `Status: ${d2.status}, Message: ${d2.data?.error || d2.data?.message}`
  );

  // D3: Super Admin accesses GET /pending -> 200 OK
  const d3 = await executeHandler(hotelPropertyCtrl.getPending, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    useAuth: true,
    useSuperAdmin: true
  });
  assert(
    'D3: Super Admin can access GET /pending (HTTP 200)',
    d3.status === 200,
    `Status: ${d3.status}`
  );

  // -------------------------------------------------------------------------
  // TEST SUITE E: PUBLIC GUEST PORTAL INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE E: PUBLIC GUEST PORTAL INTEGRITY ---');

  // E1: Unauthenticated Guest calls GET /api/hotel-properties/public -> 200 OK
  const e1 = await executeHandler(hotelPropertyCtrl.getPublic, {
    useAuth: false
  });
  assert(
    'E1: Public Guest portal GET /public returns approved hotels without auth (HTTP 200)',
    e1.status === 200 && Array.isArray(e1.data?.data),
    `Status: ${e1.status}`
  );

  // E2: Unauthenticated Guest calls GET /api/display-components?hotelPropertyId=h1 (approved hotel) -> 200 OK
  const reqE2 = {
    headers: {},
    query: { hotelPropertyId: 'h1' }
  };
  let e2Code = 200;
  let e2Data = null;
  const mockResE2 = {
    status(c) { e2Code = c; return mockResE2; },
    json(d) { e2Data = d; return mockResE2; }
  };
  await displayComponentCtrl.getAll(reqE2, mockResE2);
  assert(
    'E2: Public Guest portal can view components of approved hotel (HTTP 200)',
    e2Code === 200 && Array.isArray(e2Data?.data),
    `Status: ${e2Code}, Count: ${e2Data?.data?.length}`
  );

  // Restore mocks
  HotelProperty.find = originalFind;
  HotelProperty.findOne = originalFindOne;
  HotelProperty.findById = originalFindById;
  HotelProperty.findByIdAndUpdate = originalFindByIdAndUpdate;
  HotelProperty.findByIdAndDelete = originalFindByIdAndDelete;

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  const passedCount = results.filter(r => r.status === 'PASS').length;
  const failedCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
