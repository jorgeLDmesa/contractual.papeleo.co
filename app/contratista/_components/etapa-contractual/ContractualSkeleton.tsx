import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const ContractualSkeleton = () => {
  return (
    <>{[...Array(6)].map((_, i) => (
      <Card key={i} className="bg-white">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-9" /> {/* Upload button */}
            <Skeleton className="h-9 w-9" /> {/* More options button */}
          </div>
        </CardContent>
      </Card>
    ))}</>
  )
}

export default ContractualSkeleton 