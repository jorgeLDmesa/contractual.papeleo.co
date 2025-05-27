import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const PrecontractualSkeleton = () => {
  return (
    <>{[...Array(6)].map((_, i) => (
      <Card key={i} className="group relative overflow-hidden bg-white border-gray-200">
        {/* Status indicator line skeleton */}
        <div className="absolute top-0 left-0 right-0 h-1">
          <Skeleton className="h-full w-full" />
        </div>
        
        <CardContent className="p-6">
          {/* Header with icon and title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gray-100">
              <Skeleton className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-32 mb-3" /> {/* Title */}
              <Skeleton className="h-5 w-20 mb-2" /> {/* Badge */}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-8 w-16" /> {/* Button */}
          </div>
        </CardContent>
      </Card>
    ))}</>
  )
}

export default PrecontractualSkeleton 