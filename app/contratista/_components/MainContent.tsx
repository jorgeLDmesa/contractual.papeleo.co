// import ShaderGradientBackground from '@/components/ui/ShaderGradientBackground';
import ContractTitle from './ContractTitle';
import DocumentCards from './DocumentCards';
import EmptyStates from './EmptyStates';
import type { 
  ContractInvite, 
  ContractStatus, 
  ContractData 
} from '../actions/actionServer';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface MainContentProps {
  selectedContract: string;
  contracts: ContractInvite[];
  currentContract: ContractData | null;
  contractStatus: ContractStatus | null;
  contractLoading: boolean;
  user: SupabaseUser | null;
  onSignSuccess: () => void;
  onPhaseComplete?: () => void;
}

export default function MainContent({
  selectedContract,
  contracts,
  currentContract,
  contractStatus,
  contractLoading,
  user,
  onSignSuccess,
  onPhaseComplete
}: MainContentProps) {
  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-4rem)]">
      {/* <ShaderGradientBackground /> */}
      <div className="max-w-7xl w-full space-y-6 md:space-y-8 mt-20 sm:mt-16">
        
        {/* Título del contrato */}
        <ContractTitle 
          currentContract={currentContract}
          contractLoading={contractLoading}
        />

        {/* Cards de documentos */}
        <DocumentCards
          selectedContract={selectedContract}
          contractStatus={contractStatus}
          contractLoading={contractLoading}
          currentContract={currentContract}
          user={user}
          onSignSuccess={onSignSuccess}
          onPhaseComplete={onPhaseComplete}
        />

        {/* Estados vacíos */}
        <EmptyStates 
          selectedContract={selectedContract}
          contracts={contracts}
        />
      </div>
    </div>
  );
} 