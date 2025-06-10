import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchContractsProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function SearchContracts({ searchTerm, setSearchTerm }: SearchContractsProps) {
  return (
    <div className="relative flex-grow max-w-md">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Buscar contratos..."
        className="pl-10 pr-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <Button
          variant="ghost"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0"
          onClick={() => setSearchTerm('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
