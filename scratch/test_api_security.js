const jwt = require('../backend/node_modules/jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dummyJwtSecretChangeMe';

// 1. Generate test tokens
const superAdminToken = jwt.sign(
  { hotelAdminId: 'admin', username: 'admin', role: 'superadmin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const hotelAdminAToken = jwt.sign(
  { hotelAdminId: 'admin_hotel_a', username: 'hotel_a_admin', role: 'clientadmin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const hotelAdminBToken = jwt.sign(
  { hotelAdminId: 'owner_alpha_1790948169368', username: 'owner_alpha', role: 'clientadmin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function runSecurityTests() {
  console.log('=== STARTING SECURITY & TENANT ISOLATION AUDIT ===\n');
  const results = [];

  // TEST 1: Unauthenticated Guest attempting POST /api/display-components
  try {
    const res = await fetch('http://localhost:3000/api/display-components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked Component', hotelPropertyId: '1000000001' }),
    });
    const json = await res.json().catch(() => ({}));
    results.push({
      test: 'Guest cannot POST /api/display-components',
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      response: json.error || json.message,
    });
  } catch (e) {
    results.push({ test: 'Guest POST /api/display-components', passed: false, error: e.message });
  }

  // TEST 2: Unauthenticated Guest attempting PUT /api/display-components/:id
  try {
    const res = await fetch('http://localhost:3000/api/display-components/6abbcd9d9131d1158d2cb4c8', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked Update' }),
    });
    const json = await res.json().catch(() => ({}));
    results.push({
      test: 'Guest cannot PUT /api/display-components/:id',
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      response: json.error || json.message,
    });
  } catch (e) {
    results.push({ test: 'Guest PUT /api/display-components/:id', passed: false, error: e.message });
  }

  // TEST 3: Unauthenticated Guest attempting DELETE /api/display-components/:id
  try {
    const res = await fetch('http://localhost:3000/api/display-components/6abbcd9d9131d1158d2cb4c8', {
      method: 'DELETE',
    });
    const json = await res.json().catch(() => ({}));
    results.push({
      test: 'Guest cannot DELETE /api/display-components/:id',
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      response: json.error || json.message,
    });
  } catch (e) {
    results.push({ test: 'Guest DELETE /api/display-components/:id', passed: false, error: e.message });
  }

  // TEST 4: Guest attempting POST /api/tourist-destinations
  try {
    const res = await fetch('http://localhost:3000/api/tourist-destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Destination' }),
    });
    const json = await res.json().catch(() => ({}));
    results.push({
      test: 'Guest cannot POST /api/tourist-destinations',
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      response: json.error || json.message,
    });
  } catch (e) {
    results.push({ test: 'Guest POST /api/tourist-destinations', passed: false, error: e.message });
  }

  // TEST 5: Hotel Admin (clientadmin) attempting POST /api/tourist-destinations (SuperAdmin only)
  try {
    const res = await fetch('http://localhost:3000/api/tourist-destinations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hotelAdminAToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Destination' }),
    });
    const json = await res.json().catch(() => ({}));
    results.push({
      test: 'Client Admin cannot POST /api/tourist-destinations (403 Forbidden)',
      expectedStatus: 403,
      actualStatus: res.status,
      passed: res.status === 403,
      response: json.error || json.message,
    });
  } catch (e) {
    results.push({ test: 'Client Admin POST /api/tourist-destinations', passed: false, error: e.message });
  }

  // TEST 6: Tenant Isolation: Admin A attempting POST /api/display-components for Hotel B
  // Hotel B is 'prop_test_1790948169764' owned by 'owner_alpha_1790948169368'
  try {
    const res = await fetch('http://localhost:3000/api/display-components', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hotelAdminAToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Cross-Tenant Component',
        hotelPropertyId: 'prop_test_1790948169764',
        category: 'facilities',
      }),
    });
    const json = await res.json().catch(() => ({}));
    results.push({
      test: 'Tenant Isolation: Hotel Admin A cannot add component to Hotel B (403 Forbidden)',
      expectedStatus: 403,
      actualStatus: res.status,
      passed: res.status === 403,
      response: json.error || json.message,
    });
  } catch (e) {
    results.push({ test: 'Tenant isolation test', passed: false, error: e.message });
  }

  // TEST 7: Super Admin CAN create tourist destination (clean cleanup after test)
  try {
    const res = await fetch('http://localhost:3000/api/tourist-destinations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Temporary Security Audit Test Destination',
        city: 'Bengaluru',
        state: 'Karnataka',
        description: 'Test destination for RBAC verification',
        category: 'Heritage & Palaces',
      }),
    });
    const json = await res.json().catch(() => ({}));
    const passed = (res.status === 201 || res.status === 200) && json.success === true;
    results.push({
      test: 'Super Admin can create tourist destination',
      expectedStatus: 201,
      actualStatus: res.status,
      passed,
      destinationId: json.data?.destinationId || json.data?._id,
    });

    // Cleanup the test destination
    if (json.data && (json.data.destinationId || json.data._id)) {
      const delId = json.data.destinationId || json.data._id;
      await fetch(`http://localhost:3000/api/tourist-destinations/${delId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      console.log('Cleaned up test destination:', delId);
    }
  } catch (e) {
    results.push({ test: 'Super Admin create destination', passed: false, error: e.message });
  }

  console.log(JSON.stringify(results, null, 2));
}

runSecurityTests().catch(console.error);
