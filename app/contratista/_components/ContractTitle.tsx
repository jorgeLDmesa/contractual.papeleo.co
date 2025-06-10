import { InlineLoading } from './LoadingSpinner';
import type { ContractData } from '../actions/actionServer';

interface ContractTitleProps {
  currentContract: ContractData | null;
  contractLoading: boolean;
}

export default function ContractTitle({ 
  currentContract, 
  contractLoading 
}: ContractTitleProps) {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
        Documentos Contractuales
      </h1>
      
      {currentContract && (
        <h2 className="text-xl md:text-2xl text-gray-600">
          Contrato: {currentContract.name}
        </h2>
      )}

      {contractLoading && (
        <InlineLoading message="Cargando contrato..." />
      )}
    </div>
  );
} 