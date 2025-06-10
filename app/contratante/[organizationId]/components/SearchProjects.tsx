import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchProjectProps {
  value: string
  onChange: (value: string) => void
}

export function SearchProjects({ value, onChange }: SearchProjectProps) {
  return (
    <div className="relative flex-grow max-w-md">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Buscar proyectos..."
        className="pl-10 pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <Button
          variant="ghost"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
