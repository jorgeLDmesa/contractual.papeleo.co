import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

const InvitationsSkeleton = () => {
  return (
    <>{[...Array(6)].map((_, i) => (
      <Card key={i} className="shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </CardFooter>
      </Card>
    ))}</>
  )
}

export default InvitationsSkeleton