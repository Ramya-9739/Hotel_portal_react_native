const http = require('http');
const path = require('path');

const backendDir = 'c:/Users/ramya/Desktop/hotel_portal_react_native/backend';
const jwt = require(path.join(backendDir, 'node_modules/jsonwebtoken'));
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'dummyJwtSecretChangeMe';

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('=== STARTING BACKEND SECURITY AND ENDPOINT AUDIT ===');

  // Test 1: Unauthenticated POST
  const unauthPost = await makeRequest('POST', '/api/display-components', {}, {
    hotelPropertyId: '1000000001',
    name: 'Unauthorized Cafe',
    category: 'cafes',
  });
  console.log(`Test 1 [Unauthenticated POST /api/display-components]: HTTP ${unauthPost.status} (Expected: 401)`);
  if (unauthPost.status !== 401) throw new Error(`Expected 401, got ${unauthPost.status}`);

  // Test 2: Unauthenticated PUT
  const unauthPut = await makeRequest('PUT', '/api/display-components/fake-id-1234', {}, {
    name: 'Hacked Name',
  });
  console.log(`Test 2 [Unauthenticated PUT /api/display-components/fake-id]: HTTP ${unauthPut.status} (Expected: 401)`);
  if (unauthPut.status !== 401) throw new Error(`Expected 401, got ${unauthPut.status}`);

  // Test 3: Unauthenticated PATCH
  const unauthPatch = await makeRequest('PATCH', '/api/display-components/fake-id-1234', {}, {
    name: 'Hacked Name',
  });
  console.log(`Test 3 [Unauthenticated PATCH /api/display-components/fake-id]: HTTP ${unauthPatch.status} (Expected: 401)`);
  if (unauthPatch.status !== 401) throw new Error(`Expected 401, got ${unauthPatch.status}`);

  // Test 4: Unauthenticated DELETE
  const unauthDel = await makeRequest('DELETE', '/api/display-components/fake-id-1234');
  console.log(`Test 4 [Unauthenticated DELETE /api/display-components/fake-id]: HTTP ${unauthDel.status} (Expected: 401)`);
  if (unauthDel.status !== 401) throw new Error(`Expected 401, got ${unauthDel.status}`);

  // Test 5: Guest / Unauthorized role token test -> HTTP 403 Forbidden
  const guestToken = jwt.sign(
    { hotelAdminId: 'guest_user_99', role: 'guest' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const guestAttempt = await makeRequest('POST', '/api/display-components', {
    Authorization: `Bearer ${guestToken}`,
  }, {
    hotelPropertyId: '1000000001',
    name: 'Guest Injected Cafe',
    category: 'cafes',
  });
  console.log(`Test 5 [Guest Role Attempt POST /api/display-components]: HTTP ${guestAttempt.status} (Expected: 403 Forbidden)`);
  if (guestAttempt.status !== 403) throw new Error(`Expected 403, got ${guestAttempt.status}`);

  // Test 6: Authorized Client Admin creating component for their hotel ('1000000001')
  const clientAdminToken = jwt.sign(
    { hotelAdminId: 'admin', role: 'clientadmin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const createRes = await makeRequest('POST', '/api/display-components', {
    Authorization: `Bearer ${clientAdminToken}`,
  }, {
    hotelPropertyId: '1000000001',
    name: 'The Royal Roast Cafe Test',
    title: 'The Royal Roast Cafe Test',
    subtitle: 'Artisanal roastery and patisserie',
    category: 'cafes',
    componentTypeId: 1,
    tag: 'ARTISANAL BISTRO',
    data1: 'Single Origin Arabica & French Croissants',
    data2: '0.4 km from Palace Lobby',
    data3: '07:00 AM – 11:30 PM Daily',
    data4: 'In-Suite Butler Delivery Active',
    data5: '★ 4.95 (1,450+ verified guest reviews)',
  });
  console.log(`Test 6 [Authorized Admin Create Component]: HTTP ${createRes.status} (Expected: 201)`);
  if (createRes.status !== 201) {
    throw new Error('Failed to create component: ' + JSON.stringify(createRes.body));
  }
  const createdId = createRes.body.data._id;
  console.log('Created component ID:', createdId);

  // Test 7: Authorized Admin Updating Component
  const updateRes = await makeRequest('PUT', `/api/display-components/${createdId}`, {
    Authorization: `Bearer ${clientAdminToken}`,
  }, {
    subtitle: 'Updated artisanal roastery & espresso bar',
  });
  console.log(`Test 7 [Authorized Admin Update Component]: HTTP ${updateRes.status} (Expected: 200)`);
  if (updateRes.status !== 200) {
    throw new Error('Failed to update component: ' + JSON.stringify(updateRes.body));
  }

  // Test 8: Cross-Tenant Protection (Client Admin trying to create component for unowned hotel)
  const crossTenantToken = jwt.sign(
    { hotelAdminId: 'owner_alpha_1790948169368', role: 'clientadmin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const crossTenantRes = await makeRequest('POST', '/api/display-components', {
    Authorization: `Bearer ${crossTenantToken}`,
  }, {
    hotelPropertyId: '1000000001', // Owned by 'admin', NOT 'owner_alpha'
    name: 'Malicious Cross-Tenant Component',
    category: 'cafes',
  });
  console.log(`Test 8 [Cross-tenant Injection Attempt]: HTTP ${crossTenantRes.status} (Expected: 403 Forbidden)`);
  if (crossTenantRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${crossTenantRes.status}`);
  }

  // Test 9: Authorized Clean Up / Delete Component
  const deleteRes = await makeRequest('DELETE', `/api/display-components/${createdId}`, {
    Authorization: `Bearer ${clientAdminToken}`,
  });
  console.log(`Test 9 [Authorized Admin Delete Component]: HTTP ${deleteRes.status} (Expected: 200)`);
  if (deleteRes.status !== 200) {
    throw new Error('Failed to delete component: ' + JSON.stringify(deleteRes.body));
  }

  console.log('=== ALL 9 BACKEND SECURITY & ACCESS CONTROL TESTS PASSED PERFECTLY ===\n');
}

runSecurityAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
