"use client"

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchContractualProps {
  onSearch: (term: string) => void
}

export default function SearchContractual({ onSearch }: SearchContractualProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  return (
    <div className="relative flex-grow max-w-md">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Buscar documentos..."
        className="pl-10 pr-10"
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
      />
      {searchTerm && (
        <Button
          variant="ghost"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0"
          onClick={() => handleSearchChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 