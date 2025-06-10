'use client'
import { useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { User } from '../../types'

interface EmailSearchBarProps {
  users: User[]
  selectedUser: User | null
  onUserSelect: (user: User | null) => void
}

export function EmailSearchBar({ users, selectedUser, onUserSelect }: EmailSearchBarProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(user: User) {
    onUserSelect(user)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-label="Seleccionar usuario"
        className={cn(
          "w-full justify-between min-h-[2.5rem] h-auto whitespace-normal text-left",
          selectedUser && "text-black font-medium"
        )}
        onClick={() => setOpen(!open)}
      >
        <div className="flex-grow mr-2">
          {selectedUser ? `${selectedUser.email} - ${selectedUser.username}` : "Seleccionar usuario..."}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedUser && <Check className="h-4 w-4 text-green-500" />}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </Button>
      {open && (
        <div className="absolute w-full z-50 top-[calc(100%+4px)]">
          <Command className="w-full border shadow-md rounded-lg bg-white">
            <CommandInput placeholder="Buscar usuario..." />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup heading="Usuarios">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelect(user)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {user.email ? user.email : "Sin email"} - {user.username}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}

