import { useState } from "react"
import { Loader2 } from "lucide-react"
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
import { toast } from "sonner"
import { deleteContract } from "../../actions/actionServer"
import { Contract } from "../../types"

interface ConfirmDeleteProps {
  isOpen: boolean
  contractToDelete: Contract | null
  onClose: () => void
  onSuccess: (deletedContractId: string) => void
}

export function ConfirmDelete({ isOpen, contractToDelete, onClose, onSuccess }: ConfirmDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!contractToDelete) return

    setIsDeleting(true)
    try {
      await deleteContract(contractToDelete.id)
      
      toast.success(`El contrato "${contractToDelete.name}" ha sido eliminado exitosamente.`)
      
      onSuccess(contractToDelete.id)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el contrato'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el contrato &ldquo;{contractToDelete?.name}&rdquo;.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
