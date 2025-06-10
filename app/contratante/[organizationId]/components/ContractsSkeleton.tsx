import { Skeleton } from "@/components/ui/skeleton"

export function ContractsSkeleton() {
  return (
    <ul className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <li key={i} className="flex items-center justify-between">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-6 w-[80px] rounded-full" />
        </li>
      ))}
    </ul>
  )
}

