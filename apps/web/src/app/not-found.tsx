import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
      <p className="text-muted-foreground mb-6">The portal you are looking for does not exist or is currently unpublished.</p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}
