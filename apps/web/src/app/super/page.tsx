import { SuperAdminClient } from './client-page';

export default async function SuperAdminDashboardPage() {
  try {
    const res = await fetch(`http://127.0.0.1:3001/super/clients`, {
      headers: {
        'x-mock-role': 'super_admin'
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch platform data');
    }
    
    const data = await res.json();
    return <SuperAdminClient initialData={data} />;
  } catch (error) {
    console.error(error);
    return <div className="p-8 text-red-500">Failed to load platform data. Ensure API is running.</div>;
  }
}
