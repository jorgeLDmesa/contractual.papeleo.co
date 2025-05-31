import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const ContractualSkeleton = () => {
  return (
    <>{[...Array(6)].map((_, i) => (
      <Card key={i} className="group relative overflow-hidden bg-white border-gray-200 min-w-[280px] max-w-[320px] w-full">
        {/* Status indicator line skeleton */}
        <div className="absolute top-0 left-0 right-0 h-1">
          <Skeleton className="h-full w-full" />
        </div>
        
        <CardContent className="p-4">
          {/* Header with icon and title */}
          <div className="flex items-start gap-4 mb-3">
            <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
              <Skeleton className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-32 mb-1" /> {/* Title */}
              
              {/* Status badge and month indicator in same row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <Skeleton className="h-5 w-20" /> {/* Badge */}
                <Skeleton className="h-3 w-12" /> {/* Month */}
              </div>
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

export default ContractualSkeleton 