import { FileSignature, FileText, ClipboardList } from 'lucide-react';
import DocumentCard from './DocumentCard';
import ContractDialog from './DialogSign';
import { PrecontractualDialog } from './etapa-precontractual';
import { ContractualDialog } from './etapa-contractual';
import { toast } from 'sonner';
import { handleDocumentView } from '../actions/actionClient';
import type { ContractStatus, ContractData } from '../actions/actionServer';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface DocumentCardsProps {
  selectedContract: string;
  contractStatus: ContractStatus | null;
  contractLoading: boolean;
  currentContract: ContractData | null;
  user: SupabaseUser | null;
  onSignSuccess: () => void;
  onPhaseComplete?: () => void;
}

export default function DocumentCards({
  selectedContract,
  contractStatus,
  contractLoading,
  currentContract,
  user,
  onSignSuccess,
  onPhaseComplete
}: DocumentCardsProps) {

  // No renderizar si no hay contrato seleccionado o está cargando
  if (!selectedContract || !contractStatus || contractLoading) {
    return null;
  }

  // Estados computados
  const preContractReady = !!contractStatus.precontractual;
  const signedReady = !!contractStatus.signed;
  const isDigitalDisabled = !preContractReady;
  const isTrackingDisabled = !preContractReady || (preContractReady && !signedReady);

  // Handler para ver documento firmado
  const handleViewSignedDocument = () => {
    if (currentContract?.contractDraftUrl && selectedContract) {
      handleDocumentView(
        currentContract.contractDraftUrl, 
        selectedContract,
        false
      );
    }
  };

  // Handler para cuando se completa la fase precontractual
  const handlePrecontractualComplete = () => {
    toast("¡Fase precontractual completada!",{
      description: "Todos los documentos han sido subidos. Ahora puedes proceder con la firma digital.",
      duration: 4000,
    });
    
    // Llamar al callback del padre para refrescar el estado
    if (onPhaseComplete) {
      onPhaseComplete();
    }
  };

  // Handler para cuando se completa la fase contractual
  const handleContractualComplete = () => {
    toast("¡Documentos de seguimiento completados!",{
      description: "Todos los documentos de seguimiento han sido subidos correctamente.",
      duration: 4000,
    });
    
    // Llamar al callback del padre para refrescar el estado
    if (onPhaseComplete) {
      onPhaseComplete();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
      {/* First Card: Pre-Contrato - Ahora con Dialog y callback */}
      <PrecontractualDialog
        contractMemberId={selectedContract}
        contractName={currentContract?.name}
        onPhaseComplete={handlePrecontractualComplete}
      >
        <DocumentCard
          title="Documentos Pre-Contrato"
          description="Documentos necesarios para la firma del contrato"
          icon={<FileSignature className="h-8 w-8" />}
          color="text-blue-600"
          link="#" // Ya no necesitamos link porque es un dialog
          status={
            contractStatus.precontractual
              ? { text: "Completado", color: "default" }
              : { text: "Pendiente", color: "destructive" }
          }
        />
      </PrecontractualDialog>

      {/* Second Card: Contrato Digital */}
      {currentContract &&
        (isDigitalDisabled ? (
          <div
            onClick={(e) => {
              e.preventDefault();
              toast.error("Primero debes subir los precontractuales");
            }}
            className="opacity-50 cursor-not-allowed"
          >
            <DocumentCard
              title="Contrato Digital"
              description="Accede y firma tu contrato electrónicamente"
              icon={<FileText className="h-8 w-8" />}
              color="text-green-600"
              link={`#`}
              status={
                contractStatus.signed
                  ? { text: "Firmado", color: "default" }
                  : { text: "Pendiente", color: "destructive" }
              }
            />
          </div>
        ) : (
          contractStatus.signed ? (
            <div onClick={handleViewSignedDocument} className="cursor-pointer">
              <DocumentCard
                title="Contrato Digital"
                description="Accede y firma tu contrato electrónicamente"
                icon={<FileText className="h-8 w-8" />}
                color="text-green-600"
                link={`#`}
                status={{ text: "Firmado", color: "default" }}
              />
            </div>
          ) : (
            <ContractDialog
              contract_draft_url={currentContract.contractDraftUrl || ''}
              user_id={user?.id || ''}
              contractMemberId={selectedContract}
              onSignSuccess={onSignSuccess}
            >
              <DocumentCard
                title="Contrato Digital"
                description="Accede y firma tu contrato electrónicamente"
                icon={<FileText className="h-8 w-8" />}
                color="text-green-600"
                link={`#`}
                status={
                  contractStatus.signed
                    ? { text: "Firmado", color: "default" }
                    : { text: "Pendiente", color: "destructive" }
                }
              />
            </ContractDialog>
          )
        ))}

      {/* Third Card: Documentos de Seguimiento - Ahora con Dialog */}
      {isTrackingDisabled ? (
        <div
          onClick={(e) => {
            e.preventDefault();
            if (!preContractReady) {
              toast.error("Primero debes subir los precontractuales");
            } else if (!signedReady) {
              toast.error("Primero debes firmar el contrato");
            }
          }}
          className="opacity-50 cursor-not-allowed"
        >
          <DocumentCard
            title="Documentos de Seguimiento"
            description="Documentos requeridos durante el curso del contrato"
            icon={<ClipboardList className="h-8 w-8" />}
            color="text-purple-600"
            link={`#`}
            status={
              contractStatus.contractual
                ? { text: "Completado", color: "default" }
                : { text: "Pendiente", color: "destructive" }
            }
          />
        </div>
      ) : (
        <ContractualDialog
          contractMemberId={selectedContract}
          contractName={currentContract?.name}
          onPhaseComplete={handleContractualComplete}
        >
          <DocumentCard
            title="Documentos de Seguimiento"
            description="Documentos requeridos durante el curso del contrato"
            icon={<ClipboardList className="h-8 w-8" />}
            color="text-purple-600"
            link={`#`}
            status={
              contractStatus.contractual
                ? { text: "Completado", color: "default" }
                : { text: "Pendiente", color: "destructive" }
            }
          />
        </ContractualDialog>
      )}
    </div>
  );
} 