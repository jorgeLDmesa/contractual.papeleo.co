import { FileText } from 'lucide-react';
import type { ContractInvite } from '../actions/actionServer';

interface EmptyStatesProps {
  selectedContract: string;
  contracts: ContractInvite[];
}

export default function EmptyStates({ 
  selectedContract, 
  contracts 
}: EmptyStatesProps) {
  // Mensaje cuando no hay contrato seleccionado
  if (!selectedContract && contracts.length > 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Selecciona un contrato
        </h3>
        <p className="text-gray-500">
          Elige un contrato desde el menú superior para ver tus documentos
        </p>
      </div>
    );
  }

  // Mensaje cuando no hay contratos
  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No tienes contratos disponibles
        </h3>
        <p className="text-gray-500">
          Contacta con tu empleador para recibir invitaciones de contrato
        </p>
      </div>
    );
  }

  return null;
} 