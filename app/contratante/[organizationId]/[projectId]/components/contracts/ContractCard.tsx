import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActionMenu } from "./ActionMenu"
import { Contract } from "../../types"
import { CalendarIcon, ClockIcon } from "lucide-react"

interface ContractCardProps {
  contract: Contract
  onContractUpdated?: () => void
  onContractDeleted?: () => void
}

export function ContractCard({ contract, onContractUpdated, onContractDeleted }: ContractCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-4 relative">
        <div className="absolute top-4 right-4 z-10">
          <ActionMenu 
            contract={contract} 
            onContractUpdated={onContractUpdated}
            onContractDeleted={onContractDeleted}
          />
        </div>
        <div className="pr-8">
          <CardTitle className="text-xl font-semibold text-gray-900 line-clamp-2">
            {contract.name}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Información de fechas */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50/70 rounded-lg p-3">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              <div>
                <span className="font-medium text-gray-700">Fecha de creación:</span>
                <span className="ml-2">{formatDate(contract.createdAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50/70 rounded-lg p-3">
              <ClockIcon className="w-4 h-4 text-green-500" />
              <div>
                <span className="font-medium text-gray-700">Última actualización:</span>
                <span className="ml-2">{formatDate(contract.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-end text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>En línea</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
