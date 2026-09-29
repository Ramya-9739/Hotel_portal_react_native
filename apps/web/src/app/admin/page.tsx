import { AdminDashboardClient } from './client-page';

export default async function AdminDashboardPage() {
  // In a real app, verify Cognito token here.
  // For local dev, we hit the mock admin endpoint
  
  // Organization ID from seed data (Taj)
  const MOCK_ORG_ID = '11111111-1111-1111-1111-111111111111';
  
  try {
    const res = await fetch(`http://127.0.0.1:3001/admin/properties`, {
      headers: {
        'x-mock-org-id': MOCK_ORG_ID,
        'x-mock-role': 'client_admin'
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch properties');
    }
    
    const data = await res.json();
    return <AdminDashboardClient initialProperties={data.properties} />;
  } catch (error) {
    console.error(error);
    return <div className="p-8 text-red-500">Failed to load admin dashboard. Ensure API is running.</div>;
  }
}
