import { notFound } from 'next/navigation';
import { GuestPortalClient } from './client-page';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const res = await fetch(`http://127.0.0.1:3001/public/properties/${slug}`, {
    next: { revalidate: 60 } // Cache for 60 seconds
  });
  
  if (!res.ok) {
    return {
      title: 'Not Found'
    };
  }
  
  const data = await res.json();
  
  return {
    title: data.property.name,
    description: data.property.tagline
  };
}

export default async function GuestPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  // Fetch property data from the API
  const res = await fetch(`http://127.0.0.1:3001/public/properties/${slug}`, {
    next: { revalidate: 60 } // Cache for 60 seconds
  });
  
  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    // Handle other errors gracefully
    throw new Error('Failed to load property');
  }
  
  const data = await res.json();

  return (
    <GuestPortalClient 
      property={data.property} 
      brand={data.brand}
      places={data.places} 
    />
  );
}
