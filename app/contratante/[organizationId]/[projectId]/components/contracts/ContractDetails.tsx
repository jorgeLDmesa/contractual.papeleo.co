import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Contract } from "../../types"

interface ContractDetailsProps {
  isOpen: boolean
  selectedContract: Contract | null
  onClose: () => void
}

export function ContractDetails({ isOpen, selectedContract, onClose }: ContractDetailsProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{selectedContract?.name}</SheetTitle>
          <SheetDescription>Detalles del contrato</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {selectedContract && (
            <>
              {/* Las fechas de inicio y fin han sido eliminadas */}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
