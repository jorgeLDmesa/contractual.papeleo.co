import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2 } from 'lucide-react'
import { toast } from "sonner"
import { createProject } from '../actions/actionServer'
import { ContractualProject } from '../types'

interface CreateProjectModalProps {
  organizationId: string
  onSuccess: (newProject: ContractualProject) => void
}

export function CreateProjectModal({ organizationId, onSuccess }: CreateProjectModalProps) {
  const [newProjectName, setNewProjectName] = useState('')
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!newProjectName.trim()) return

    setIsLoading(true)
    try {
      const newProject = await createProject(newProjectName, organizationId)
      
      toast.success(`El proyecto "${newProject.name}" ha sido creado exitosamente.`)
      
      onSuccess(newProject)
      setNewProjectName('')
      setOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el proyecto'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isLoading && setOpen(newOpen)}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Crear Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del nuevo proyecto
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Nombre del proyecto"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={handleCreate} disabled={isLoading || !newProjectName.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
