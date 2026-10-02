// =============================================================================
// backend/test_approval_flow.js
// Automated Verification Script for Super Admin Approval Workflow & RBAC
// Tests:
// Test A: Hotel Owner submits a hotel -> status = 'pending'
// Test B: Public Guest endpoint -> pending hotel is NOT visible
// Test C: Super Admin approves hotel -> status = 'approved'
// Test D: Public Guest endpoint -> approved hotel is now visible
// Test E: Super Admin rejects hotel with reason -> status = 'rejected', guest cannot see
// Test F: RBAC Security:
//   - Hotel Owner cannot approve/reject hotels (403 Forbidden)
//   - Hotel Owner A cannot update Hotel Owner B's hotel (403 Forbidden)
// =============================================================================

const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('STARTING SUPER ADMIN WORKFLOW & SECURITY TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Setup: Register/Login Super Admin and Two Distinct Hotel Owners
    // -------------------------------------------------------------------------
    console.log('[Setup] Authenticating test personas...');

    // 1. Super Admin Login
    const superLogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-admins/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { username: 'admin', password: 'admin123' });

    assert(superLogin.status === 200 && superLogin.body?.data?.token, 'Super Admin logged in successfully');
    const superToken = superLogin.body?.data?.token;

    // 2. Register/Login Hotel Owner A
    const ownerAId = 'owner_alpha_' + Date.now();
    await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-admins/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      hotelAdminId: ownerAId,
      username: ownerAId,
      password: 'password123',
      role: 'clientadmin',
    });

    const ownerALogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-admins/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { username: ownerAId, password: 'password123' });

    assert(ownerALogin.status === 200 && ownerALogin.body?.data?.token, 'Hotel Owner A logged in');
    const ownerAToken = ownerALogin.body?.data?.token;

    // 3. Register/Login Hotel Owner B
    const ownerBId = 'owner_beta_' + Date.now();
    await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-admins/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      hotelAdminId: ownerBId,
      username: ownerBId,
      password: 'password123',
      role: 'clientadmin',
    });

    const ownerBLogin = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-admins/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { username: ownerBId, password: 'password123' });

    assert(ownerBLogin.status === 200 && ownerBLogin.body?.data?.token, 'Hotel Owner B logged in');
    const ownerBToken = ownerBLogin.body?.data?.token;

    // -------------------------------------------------------------------------
    // TEST A: Hotel Owner Submits a Hotel -> status = 'pending'
    // -------------------------------------------------------------------------
    console.log('\n[Test A] Hotel Owner A submits a new hotel property...');
    const testHotelPropId = 'prop_test_' + Date.now();
    const createRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-properties',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerAToken}`,
      },
    }, {
      hotelPropertyId: testHotelPropId,
      hotelName: 'The Royal Emerald Suites',
      hotelAddress: '15 Residency Road, Bengaluru',
      hotelLatLong: '12.9698,77.6033',
      city: 'Bengaluru',
      pricePerNight: '₹22,000 / night',
    });

    assert(createRes.status === 201, 'Hotel creation request returned HTTP 201');
    assert(createRes.body?.data?.status === 'pending', 'Submitted hotel has status = "pending"');
    assert(createRes.body?.data?.hotelAdminId === ownerAId, 'Submitted hotel is securely tagged to Owner A ID');

    // -------------------------------------------------------------------------
    // TEST B: Public Guest Endpoint -> Pending Hotel must NOT appear
    // -------------------------------------------------------------------------
    console.log('\n[Test B] Public Guest endpoint query for active hotels...');
    const publicRes1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-properties/public',
      method: 'GET',
    });

    assert(publicRes1.status === 200, 'Public endpoint returns HTTP 200');
    const publicHotels1 = publicRes1.body?.data || [];
    const foundInPublicBefore = publicHotels1.some(
      (h) => h.hotelPropertyId === testHotelPropId || h.hotelName === 'The Royal Emerald Suites'
    );
    assert(!foundInPublicBefore, 'Pending hotel does NOT appear in public guest endpoint');

    // -------------------------------------------------------------------------
    // TEST C: Super Admin Reviews & Accepts Hotel -> status = 'approved'
    // -------------------------------------------------------------------------
    console.log('\n[Test C] Super Admin reviews pending queue and approves hotel...');
    const pendingRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-properties/pending',
      method: 'GET',
      headers: { Authorization: `Bearer ${superToken}` },
    });

    assert(pendingRes.status === 200, 'Super Admin pending endpoint returns HTTP 200');
    const pendingList = pendingRes.body?.data || [];
    const isPendingListed = pendingList.some((h) => h.hotelPropertyId === testHotelPropId);
    assert(isPendingListed, 'Hotel is present in Super Admin pending queue');

    const approveRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/hotel-properties/${testHotelPropId}/approve`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superToken}` },
    });

    assert(approveRes.status === 200, 'Super Admin approve request returns HTTP 200');
    assert(approveRes.body?.data?.status === 'approved', 'Hotel status changed to "approved"');
    assert(approveRes.body?.data?.rejectionReason === '', 'Rejection reason is empty');

    // -------------------------------------------------------------------------
    // TEST D: Public Guest Endpoint -> Approved Hotel now appears
    // -------------------------------------------------------------------------
    console.log('\n[Test D] Public Guest endpoint query after approval...');
    const publicRes2 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-properties/public',
      method: 'GET',
    });

    assert(publicRes2.status === 200, 'Public endpoint returns HTTP 200');
    const publicHotels2 = publicRes2.body?.data || [];
    const foundInPublicAfter = publicHotels2.some(
      (h) => h.hotelPropertyId === testHotelPropId
    );
    assert(foundInPublicAfter, 'Approved hotel IS now visible in public guest endpoint');

    // -------------------------------------------------------------------------
    // TEST E: Super Admin Rejection Flow with Explanation Reason
    // -------------------------------------------------------------------------
    console.log('\n[Test E] Rejection workflow with explanation reason...');
    const rejectHotelId = 'prop_reject_' + Date.now();
    await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-properties',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerAToken}`,
      },
    }, {
      hotelPropertyId: rejectHotelId,
      hotelName: 'Unverified Inn',
      hotelAddress: 'Nowhere Lane',
      city: 'Unknown',
    });

    const rejectRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/hotel-properties/${rejectHotelId}/reject`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superToken}`,
      },
    }, {
      rejectionReason: 'Incomplete hotel address and invalid GPS coordinates',
    });

    assert(rejectRes.status === 200, 'Super Admin reject request returns HTTP 200');
    assert(rejectRes.body?.data?.status === 'rejected', 'Hotel status changed to "rejected"');
    assert(
      rejectRes.body?.data?.rejectionReason === 'Incomplete hotel address and invalid GPS coordinates',
      'Rejection explanation reason is stored accurately'
    );

    const publicRes3 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-properties/public',
      method: 'GET',
    });
    const foundRejectedInPublic = (publicRes3.body?.data || []).some(
      (h) => h.hotelPropertyId === rejectHotelId
    );
    assert(!foundRejectedInPublic, 'Rejected hotel does NOT appear on public guest website');

    // -------------------------------------------------------------------------
    // TEST F: Role Authorization & Security Validation
    // -------------------------------------------------------------------------
    console.log('\n[Test F] Testing RBAC Security & Ownership Enforcement...');

    // 1. Hotel Owner cannot approve hotels
    const unauthorizedApprove = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/hotel-properties/${rejectHotelId}/approve`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerAToken}` },
    });
    assert(
      unauthorizedApprove.status === 403,
      'Hotel Owner calling /approve is blocked with HTTP 403 Forbidden'
    );

    // 2. Hotel Owner cannot access Super Admin pending queue
    const unauthorizedPending = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/hotel-properties/pending',
      method: 'GET',
      headers: { Authorization: `Bearer ${ownerAToken}` },
    });
    assert(
      unauthorizedPending.status === 403,
      'Hotel Owner calling /pending is blocked with HTTP 403 Forbidden'
    );

    // 3. Hotel Owner B CANNOT update Hotel Owner A's hotel
    const crossOwnerUpdate = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/hotel-properties/${testHotelPropId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerBToken}`,
      },
    }, {
      hotelName: 'Hacked by Owner B',
    });
    assert(
      crossOwnerUpdate.status === 403,
      'Hotel Owner B attempting to update Owner A hotel is blocked with HTTP 403 Forbidden'
    );

    // 4. Hotel Owner B CANNOT delete Hotel Owner A's hotel
    const crossOwnerDelete = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/hotel-properties/${testHotelPropId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerBToken}` },
    });
    assert(
      crossOwnerDelete.status === 403,
      'Hotel Owner B attempting to delete Owner A hotel is blocked with HTTP 403 Forbidden'
    );

    // 5. Hotel Owner A CAN update their own hotel
    const legitimateOwnerUpdate = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/hotel-properties/${testHotelPropId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerAToken}`,
      },
    }, {
      hotelName: 'The Royal Emerald Suites & Spa',
    });
    assert(
      legitimateOwnerUpdate.status === 200,
      'Hotel Owner A successfully updates their own hotel'
    );
    assert(
      legitimateOwnerUpdate.body?.data?.status === 'pending',
      'Modifying hotel resubmits it with status = "pending" for Super Admin re-approval'
    );

    console.log('\n===============================================================');
    console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');
  } catch (err) {
    console.error('Test Suite encountered an error:', err);
  }
}

// Start backend server in-process if not already listening
const app = require('./server'); // Note server.js calls app.listen
setTimeout(runTests, 1500);
