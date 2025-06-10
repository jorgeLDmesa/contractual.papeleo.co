import { Skeleton } from "@/components/ui/skeleton"

export function OrganizationsSkeleton() {
  return (
    <ul className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <li key={i} className="flex items-center space-x-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </li>
      ))}
    </ul>
  )
}

