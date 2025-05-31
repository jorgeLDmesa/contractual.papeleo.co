import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { EditContractName } from "./EditContractName"
import { EditContractDocuments } from "./EditContractDocuments"
import { ReplaceContractModal } from "./ReplaceContractModal"
import { deleteContract } from "../../actions/actionServer"
import { Contract } from "../../types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ActionMenuProps {
  contract: Contract
  onContractUpdated?: () => void
  onContractDeleted?: () => void
}

export function ActionMenu({ contract, onContractUpdated, onContractDeleted }: ActionMenuProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEditDocumentsOpen, setIsEditDocumentsOpen] = useState(false)
  const [isReplaceContractOpen, setIsReplaceContractOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleViewDocument = () => {
    if (contract.contractDraftUrl) {
      // Verificamos si la URL coincide con el patrón generado por la plantilla.
      // Asumimos que la URL tiene el formato "https://papeleo.co/docgen/{documentId}"
      const regex = /^https:\/\/papeleo\.co\/docgen\/[\w-]+$/;
      if (regex.test(contract.contractDraftUrl)) {
        // Si es exactamente la URL generada por la plantilla, abrimos la URL base en una nueva pestaña.
        window.open(contract.contractDraftUrl, "_blank");
      } else {
        // Sino, usamos la lógica actual (por ejemplo, generar una URL firmada, etc).
        // For now, just open the URL directly
        window.open(contract.contractDraftUrl, "_blank");
      }
    }
  };

  // Check if contract has a URL that doesn't match the docgen pattern
  const canReplaceContract = () => {
    if (!contract.contractDraftUrl) return false;
    const regex = /^https:\/\/papeleo\.co\/docgen\/[\w-]+$/;
    return !regex.test(contract.contractDraftUrl);
  };

  const handleDeleteContract = async () => {
    setIsDeleting(true)
    try {
      await deleteContract(contract.id)
      toast.success("Contrato eliminado correctamente")
      setIsDeleteModalOpen(false)
      onContractDeleted?.()
    } catch (error) {
      toast.error("Error al eliminar el contrato")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleContractUpdated = (updatedContract: Contract) => {
    onContractUpdated?.()
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditNameOpen(true)}>
            Editar nombre
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsEditDocumentsOpen(true)}>
            Editar documentos
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsDeleteModalOpen(true)}>
            Eliminar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleViewDocument}>
            Ver contrato
          </DropdownMenuItem>
          {canReplaceContract() && (
            <DropdownMenuItem onSelect={() => setIsReplaceContractOpen(true)}>
              Reemplazar contrato
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el contrato &ldquo;{contract.name}&rdquo;.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContract} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Contract Name Modal */}
      {isEditNameOpen && (
        <EditContractName 
          isOpen={isEditNameOpen} 
          onClose={() => setIsEditNameOpen(false)}
          contract={contract}
          onSuccess={handleContractUpdated}
        />
      )}

      {/* Edit Contract Documents Modal */}
      {isEditDocumentsOpen && (
        <EditContractDocuments
          isOpen={isEditDocumentsOpen}
          onClose={() => {
            setIsEditDocumentsOpen(false)
            onContractUpdated?.()
          }}
          contract={contract}
        />
      )}

      {/* Replace Contract Modal */}
      {isReplaceContractOpen && (
        <ReplaceContractModal
          isOpen={isReplaceContractOpen}
          onClose={() => setIsReplaceContractOpen(false)}
          contract={contract}
          onSuccess={handleContractUpdated}
        />
      )}
    </>
  )
}
