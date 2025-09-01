"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import SharedResultView from "@/components/ui/shared-result-view"

interface PageProps {
  params: {
    shareId: string
  }
}

function SharedResultContent({ shareId }: { shareId: string }) {
  const searchParams = useSearchParams()
  const accessLevel = searchParams.get('access') || 'view'
  const expiryTime = searchParams.get('expires') || Date.now().toString()

  return (
    <SharedResultView 
      shareId={shareId}
      accessLevel={accessLevel}
      expiryTime={expiryTime}
    />
  )
}

export default function SharedResultPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading shared result...</div>
      </div>
    }>
      <SharedResultContent shareId={params.shareId} />
    </Suspense>
  )
}