import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { updateProjectName } from '../actions/actionServer'
import { ContractualProject } from '../types'

interface RenameProjectProps {
  isOpen: boolean
  project: ContractualProject | null
  onClose: () => void
  onSuccess: (updatedProject: ContractualProject) => void
}

export function RenameProject({ isOpen, project, onClose, onSuccess }: RenameProjectProps) {
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (project && isOpen) {
      setNewName(project.name)
    }
  }, [project, isOpen])

  const handleRename = async () => {
    if (!project || !newName.trim()) return
    
    setIsLoading(true)
    try {
      const updatedProject = await updateProjectName(project.id, newName)
      
      toast.success("El nombre del proyecto ha sido actualizado exitosamente.")
      
      onSuccess(updatedProject)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el proyecto'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renombrar proyecto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
              autoFocus
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRename}
            disabled={isLoading || !newName.trim() || newName === project?.name}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 