import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateFilterProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
}

export function DateFilter({ date, onDateChange }: DateFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {date ? format(date, 'PP', { locale: es }) : 'Filtrar por fecha'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
