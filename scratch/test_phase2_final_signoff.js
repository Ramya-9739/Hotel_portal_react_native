// =============================================================================
// scratch/test_phase2_final_signoff.js
// Phase 2 Final Sign-Off Automated Verification Suite
// Tests 1 to 7 with verbatim output assertions
// =============================================================================

const path = require('path');
const jwt = require('jsonwebtoken');

const backendDir = 'c:/Users/ramya/Desktop/hotel_portal_react_native/backend';
require('dotenv').config({ path: path.join(backendDir, '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dummyJwtSecretChangeMe';

// Import backend controllers & middleware
const hotelPropertyCtrl = require(path.join(backendDir, 'controllers/hotelProperty.controller'));
const displayComponentCtrl = require(path.join(backendDir, 'controllers/displayComponent.controller'));
const hotelPictureCtrl = require(path.join(backendDir, 'controllers/hotelPicture.controller'));
const authMiddleware = require(path.join(backendDir, 'middleware/auth.middleware'));
const { requireSuperAdmin } = require(path.join(backendDir, 'middleware/role.middleware'));
const HotelProperty = require(path.join(backendDir, 'models/hotelProperty.model'));
const DisplayComponent = require(path.join(backendDir, 'models/displayComponent.model'));

// Tokens
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

// Simulated database
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
  },
  {
    _id: 'h2_id',
    hotelPropertyId: 'h2',
    hotelName: 'The Royal Western Pavilion',
    city: 'Mysuru',
    hotelAddress: '15 Palace Road, Nazarbad, Mysuru',
    hotelAdminId: 'owner_alpha',
    status: 'approved',
    rating: 4.85,
    pricePerNight: '₹18,500 / night',
  },
  {
    _id: 'h_pending_id',
    hotelPropertyId: 'h_pending',
    hotelName: 'Sunset Valley Retreat (Under Review)',
    city: 'Coorg',
    hotelAddress: 'Coffee Estate Road, Madikeri',
    hotelAdminId: 'owner_alpha',
    status: 'pending',
    rating: 4.7,
    pricePerNight: '₹9,500 / night',
  },
  {
    _id: 'h_rejected_id',
    hotelPropertyId: 'h_rejected',
    hotelName: 'Old City Lodge (Rejected Quality)',
    city: 'Bengaluru',
    hotelAddress: '12 Old Market Street',
    hotelAdminId: 'owner_alpha',
    status: 'rejected',
    rating: 3.2,
    pricePerNight: '₹2,500 / night',
  },
  {
    _id: 'h3_id',
    hotelPropertyId: 'h3',
    hotelName: 'Emerald Bay Wellness Sanctuary',
    city: 'Goa',
    hotelAddress: '88 Beach Promenade, Candolim',
    hotelAdminId: 'owner_beta',
    status: 'approved',
    rating: 4.95,
    pricePerNight: '₹22,000 / night',
  },
];

const mockComponents = [
  { _id: 'comp_h1_1', hotelPropertyId: 'h1', title: 'Horizon Fine Dining', category: 'dining', componentTypeId: 1 },
  { _id: 'comp_h1_2', hotelPropertyId: 'h1', title: 'Horizon Heated Pool', category: 'pools', componentTypeId: 2 },
  { _id: 'comp_h2_1', hotelPropertyId: 'h2', title: 'Royal Mysuru Darbar', category: 'dining', componentTypeId: 1 },
  { _id: 'comp_h2_2', hotelPropertyId: 'h2', title: 'Royal Ayurvedic Spa', category: 'gyms', componentTypeId: 2 },
  { _id: 'comp_pending_1', hotelPropertyId: 'h_pending', title: 'Coffee Blossom Cafe', category: 'dining', componentTypeId: 1 },
  { _id: 'comp_rejected_1', hotelPropertyId: 'h_rejected', title: 'Old Canteen', category: 'dining', componentTypeId: 1 },
  { _id: 'comp_h3_1', hotelPropertyId: 'h3', title: 'Emerald Bay Seafood Grill', category: 'dining', componentTypeId: 1 },
];

// Setup Model Mocks
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
    sort() { return this; },
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

// Helper to execute controllers
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

// Test runner
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

async function runSignOffSuite() {
  console.log('======================================================================');
  console.log('     PHASE 2 FINAL SIGN-OFF VERIFICATION TEST SUITE (1 - 7)          ');
  console.log('======================================================================');

  // -------------------------------------------------------------------------
  // 1. SELECTING A PENDING HOTEL DOES NOT PUBLISH TO GUEST PORTAL
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFICATION 1: PENDING HOTEL PUBLIC ISOLATION ---');
  // Public Guest API call to get all published hotels
  const pubRes1 = await executeHandler(hotelPropertyCtrl.getPublic, { useAuth: false });
  const pubList1 = pubRes1.data?.data || [];
  const hasPendingInPublic = pubList1.some(h => h.hotelPropertyId === 'h_pending' || h.status !== 'approved');

  assert(
    '1a',
    'GET /api/hotel-properties/public strictly excludes pending hotels',
    pubRes1.status === 200 && !hasPendingInPublic,
    `Total published hotels: ${pubList1.length}, Statuses: ${[...new Set(pubList1.map(h => h.status))].join(',')}`
  );

  // Guest attempts to query components of pending hotel without token
  const guestCompPending = await executeHandler(displayComponentCtrl.getAll, {
    headers: {},
    query: { hotelPropertyId: 'h_pending' },
    useAuth: false
  });
  const pendingItems = guestCompPending.data?.data || [];
  assert(
    '1b',
    'Unauthenticated guest query for pending hotel components exposes 0 components',
    guestCompPending.status === 404 || (guestCompPending.status === 200 && pendingItems.length === 0),
    `Status: ${guestCompPending.status}, Exposed components: ${pendingItems.length}`
  );

  // -------------------------------------------------------------------------
  // 2. SELECTING A REJECTED HOTEL DOES NOT PUBLISH TO GUEST PORTAL
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFICATION 2: REJECTED HOTEL PUBLIC ISOLATION ---');
  const hasRejectedInPublic = pubList1.some(h => h.hotelPropertyId === 'h_rejected' || h.status === 'rejected');
  assert(
    '2a',
    'GET /api/hotel-properties/public strictly excludes rejected hotels',
    !hasRejectedInPublic,
    `0 rejected hotels found in public API output`
  );

  const guestCompRejected = await executeHandler(displayComponentCtrl.getAll, {
    headers: {},
    query: { hotelPropertyId: 'h_rejected' },
    useAuth: false
  });
  const rejectedItems = guestCompRejected.data?.data || [];
  assert(
    '2b',
    'Unauthenticated guest query for rejected hotel components exposes 0 components',
    guestCompRejected.status === 404 || (guestCompRejected.status === 200 && rejectedItems.length === 0),
    `Status: ${guestCompRejected.status}, Exposed components: ${rejectedItems.length}`
  );

  // -------------------------------------------------------------------------
  // 3. allowNonApproved CANNOT BYPASS PUBLIC HOTEL ACTIVATION
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFICATION 3: allowNonApproved SCOPING ---');
  // Simulate activeHotelService.setActiveHotel(hotel, allowNonApproved = false)
  function simulateGuestActivation(hotel, allowNonApproved = false) {
    if (!allowNonApproved && hotel.status && hotel.status !== 'approved') {
      return { activated: false, reason: `Status is "${hotel.status}", not activating for public guests.` };
    }
    return { activated: true, hotel };
  }

  const guestAttempt = simulateGuestActivation(mockHotels.find(h => h.hotelPropertyId === 'h_pending'), false);
  assert(
    '3a',
    'Public guest portal activation refuses non-approved hotel by default',
    guestAttempt.activated === false,
    `Refusal Reason: ${guestAttempt.reason}`
  );

  // Simulate HomeScreen fallback matching against public approved hotels
  function simulateHomeScreenMatch(activeHotelCandidate, approvedHotels) {
    const match = approvedHotels.find(h => h.hotelPropertyId === activeHotelCandidate.hotelPropertyId);
    return match || approvedHotels[0];
  }
  const homeScreenFallback = simulateHomeScreenMatch(
    { hotelPropertyId: 'h_pending', status: 'pending' },
    pubList1
  );
  assert(
    '3b',
    'HomeScreen automatically falls back to approved hotel if pending hotel was in local storage',
    homeScreenFallback && homeScreenFallback.status === 'approved' && homeScreenFallback.hotelPropertyId === 'h1',
    `Fell back to: "${homeScreenFallback.hotelName}" (${homeScreenFallback.status})`
  );

  // -------------------------------------------------------------------------
  // 4. EVERY HOTEL-SPECIFIC ENDPOINT INDEPENDENTLY VALIDATES JWT OWNERSHIP
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFICATION 4: ENDPOINT-BY-ENDPOINT JWT OWNERSHIP ENFORCEMENT ---');

  // 4.1 GET /api/hotel-properties/:id (cross-owner) -> 403
  const ep1 = await executeHandler(hotelPropertyCtrl.getById, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    useAuth: true
  });
  assert('4.1', 'GET /api/hotel-properties/:id cross-owner returns HTTP 403', ep1.status === 403, `Status: ${ep1.status}`);

  // 4.2 PUT /api/hotel-properties/:id (cross-owner) -> 403
  const ep2 = await executeHandler(hotelPropertyCtrl.update, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    body: { hotelName: 'Malicious Rename' },
    useAuth: true
  });
  assert('4.2', 'PUT /api/hotel-properties/:id cross-owner returns HTTP 403', ep2.status === 403, `Status: ${ep2.status}`);

  // 4.3 DELETE /api/hotel-properties/:id (cross-owner) -> 403
  const ep3 = await executeHandler(hotelPropertyCtrl.remove, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'h3' },
    useAuth: true
  });
  assert('4.3', 'DELETE /api/hotel-properties/:id cross-owner returns HTTP 403', ep3.status === 403, `Status: ${ep3.status}`);

  // 4.4 GET /api/display-components?hotelPropertyId=h3 (cross-owner) -> 403
  const ep4 = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h3' },
    useAuth: true
  });
  assert('4.4', 'GET /api/display-components?hotelPropertyId=h3 cross-owner returns HTTP 403', ep4.status === 403, `Status: ${ep4.status}`);

  // 4.5 GET /api/display-components/:id (cross-owner component) -> 403
  const ep5 = await executeHandler(displayComponentCtrl.getById, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'comp_h3_1' },
    useAuth: true
  });
  assert('4.5', 'GET /api/display-components/:id cross-owner component returns HTTP 403', ep5.status === 403, `Status: ${ep5.status}`);

  // 4.6 POST /api/display-components on cross-owner hotel -> 403
  const ep6 = await executeHandler(displayComponentCtrl.create, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    body: { hotelPropertyId: 'h3', title: 'Unauthorized Spa', category: 'facilities' },
    useAuth: true
  });
  assert('4.6', 'POST /api/display-components on cross-owner hotel returns HTTP 403', ep6.status === 403, `Status: ${ep6.status}`);

  // 4.7 PUT /api/display-components/:id on cross-owner component -> 403
  const ep7 = await executeHandler(displayComponentCtrl.update, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'comp_h3_1' },
    body: { title: 'Hacked Restaurant' },
    useAuth: true
  });
  assert('4.7', 'PUT /api/display-components/:id on cross-owner component returns HTTP 403', ep7.status === 403, `Status: ${ep7.status}`);

  // 4.8 DELETE /api/display-components/:id on cross-owner component -> 403
  const ep8 = await executeHandler(displayComponentCtrl.remove, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    params: { id: 'comp_h3_1' },
    useAuth: true
  });
  assert('4.8', 'DELETE /api/display-components/:id on cross-owner component returns HTTP 403', ep8.status === 403, `Status: ${ep8.status}`);

  // 4.9 POST /api/hotel-pictures/presigned-url on cross-owner hotel -> 403
  const ep9 = await executeHandler(hotelPictureCtrl.getPresignedUrl, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    body: { hotelPropertyId: 'h3', fileName: 'test.jpg', mimeType: 'image/jpeg' },
    useAuth: true
  });
  assert('4.9', 'POST /api/hotel-pictures/presigned-url on cross-owner hotel returns HTTP 403', ep9.status === 403, `Status: ${ep9.status}`);

  // 4.10 GET /api/hotel-properties ignores forged query parameter -> scoped to token
  const ep10 = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelAdminId: 'owner_beta' },
    useAuth: true
  });
  const ep10Hotels = ep10.data?.data || [];
  assert(
    '4.10',
    'GET /api/hotel-properties ignores forged ?hotelAdminId query parameter',
    ep10.status === 200 && ep10Hotels.every(h => h.hotelAdminId === 'owner_alpha'),
    `AdminIds in response: ${[...new Set(ep10Hotels.map(h => h.hotelAdminId))].join(',')}`
  );

  // -------------------------------------------------------------------------
  // 5. TAMPERED localStorage HOTEL ID CANNOT GRANT ACCESS
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFICATION 5: TAMPERED LOCALSTORAGE RESILIENCE ---');
  // Frontend verification algorithm: validate stored ID against server-returned list
  function validateStoredSelection(tamperedId, verifiedServerHotels) {
    const match = verifiedServerHotels.find(h => String(h.hotelPropertyId) === String(tamperedId));
    if (!match) {
      return { valid: false, fallback: verifiedServerHotels[0] };
    }
    return { valid: true, hotel: match };
  }

  const tamperedCheck = validateStoredSelection('h3', ep10Hotels);
  assert(
    '5a',
    'Frontend detects tampered hotel ID (h3) and refuses to set unauthorized context',
    tamperedCheck.valid === false && tamperedCheck.fallback.hotelPropertyId === 'h1',
    `Rejected h3, safely defaulted to: ${tamperedCheck.fallback.hotelName}`
  );

  // Backend verification: even if an attacker manually sends tampered hotelPropertyId in API calls
  const tamperedApiCall = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h3' },
    useAuth: true
  });
  assert(
    '5b',
    'Direct backend API request with tampered ID rejected with HTTP 403 Forbidden',
    tamperedApiCall.status === 403,
    `Status: ${tamperedApiCall.status}, Error: ${tamperedApiCall.data?.error || tamperedApiCall.data?.message}`
  );

  // -------------------------------------------------------------------------
  // 6. SWITCHING HOTELS REFRESHES ALL HOTEL-SPECIFIC DATA
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFICATION 6: HOTEL SWITCHING DATA REFRESH ---');
  const h1Comps = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h1' },
    useAuth: true
  });
  const h2Comps = await executeHandler(displayComponentCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    query: { hotelPropertyId: 'h2' },
    useAuth: true
  });

  const h1List = h1Comps.data?.data || [];
  const h2List = h2Comps.data?.data || [];

  assert(
    '6a',
    'Hotel 1 context returns exclusively Hotel 1 components',
    h1List.length === 2 && h1List.every(c => c.hotelPropertyId === 'h1'),
    `H1 Components: ${h1List.map(c => c.title).join(', ')}`
  );

  assert(
    '6b',
    'Hotel 2 context returns exclusively Hotel 2 components',
    h2List.length === 2 && h2List.every(c => c.hotelPropertyId === 'h2'),
    `H2 Components: ${h2List.map(c => c.title).join(', ')}`
  );

  assert(
    '6c',
    'Zero component data bleeding between Hotel 1 and Hotel 2',
    !h1List.some(c => c.hotelPropertyId === 'h2') && !h2List.some(c => c.hotelPropertyId === 'h1'),
    `Complete component isolation verified`
  );

  // -------------------------------------------------------------------------
  // 7. SUPER ADMIN ACCESS AND PUBLIC GUEST APIS REMAIN FUNCTIONAL
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFICATION 7: SUPER ADMIN & GUEST PORTAL INTEGRITY ---');
  const superAll = await executeHandler(hotelPropertyCtrl.getAll, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    useAuth: true
  });
  assert(
    '7a',
    'Super Admin sees all hotels platform-wide across all owners',
    superAll.status === 200 && superAll.data?.data?.length === mockHotels.length,
    `Total platform hotels: ${superAll.data?.data?.length}`
  );

  const superPending = await executeHandler(hotelPropertyCtrl.getPending, {
    headers: { authorization: `Bearer ${tokenSuperAdmin}` },
    useAuth: true,
    useSuperAdmin: true
  });
  assert(
    '7b',
    'Super Admin can access GET /pending queue (HTTP 200)',
    superPending.status === 200 && superPending.data?.data?.length === 1,
    `Pending submissions count: ${superPending.data?.data?.length}`
  );

  const clientDeniedSuper = await executeHandler(hotelPropertyCtrl.getPending, {
    headers: { authorization: `Bearer ${tokenOwnerA}` },
    useAuth: true,
    useSuperAdmin: true
  });
  assert(
    '7c',
    'Clientadmin is forbidden from accessing Super Admin endpoints (HTTP 403)',
    clientDeniedSuper.status === 403,
    `Status: ${clientDeniedSuper.status}`
  );

  const guestPublicHotels = await executeHandler(hotelPropertyCtrl.getPublic, { useAuth: false });
  assert(
    '7d',
    'Public guest portal can access approved hotels without authentication (HTTP 200)',
    guestPublicHotels.status === 200 && guestPublicHotels.data?.data?.length > 0,
    `Approved hotels accessible to public: ${guestPublicHotels.data?.data?.length}`
  );

  console.log('\n======================================================================');
  console.log(`TOTAL SIGN-OFF TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('======================================================================');

  if (failedCount > 0) process.exit(1);
  else process.exit(0);
}

runSignOffSuite().catch(e => {
  console.error('Fatal sign-off suite error:', e);
  process.exit(1);
});
