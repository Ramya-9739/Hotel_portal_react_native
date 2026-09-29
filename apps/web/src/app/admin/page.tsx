import { AdminDashboardClient } from './client-page';

export const metadata = {
  title: "Admin · Around Me",
};

export default async function AdminDashboardPage() {
  const MOCK_ORG_ID = '11111111-1111-1111-1111-111111111111';

  try {
    const res = await fetch(`http://127.0.0.1:3001/admin/properties`, {
      headers: {
        'x-mock-org-id': MOCK_ORG_ID,
        'x-mock-role': 'client_admin'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      return <AdminDashboardClient initialProperties={data.properties} />;
    }
  } catch {
    // API not running — fall through to mock data
  }

  // Render with built-in mock data (no API required)
  return <AdminDashboardClient />;
}
