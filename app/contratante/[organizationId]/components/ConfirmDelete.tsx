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
import { deleteProject } from '../actions/actionServer'
import { ContractualProject } from '../types'

interface ConfirmDeleteProps {
  isOpen: boolean
  project: ContractualProject | null
  onClose: () => void
  onSuccess: (deletedProjectId: string) => void
}

export function ConfirmDelete({ isOpen, project, onClose, onSuccess }: ConfirmDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!project) return

    setIsDeleting(true)
    try {
      await deleteProject(project.id)
      
      toast.success(`El proyecto "${project.name}" ha sido eliminado exitosamente.`)
      
      onSuccess(project.id)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el proyecto'
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
            Esta acción eliminará permanentemente el proyecto &ldquo;{project?.name}&rdquo;.
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
