import { Suspense } from "react"
import SharedResultView from "@/components/ui/shared-result-view"

interface PageProps {
  params: {
    shareId: string
  }
}

// Generate static params for export
export function generateStaticParams() {
  // For static export, we'll generate a few common paths
  return [
    { shareId: 'example' },
  ]
}

export default function SharedResultPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading shared result...</div>
      </div>
    }>
      <SharedResultView 
        shareId={params.shareId}
        accessLevel="view"  // Default access level for static export
        expiryTime={Date.now().toString()}  // Default expiry time
      />
    </Suspense>
  )
}