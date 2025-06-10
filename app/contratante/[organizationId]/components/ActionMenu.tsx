import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDelete } from './ConfirmDelete'
import { ProjectDetails } from './ProjectDetails'
import { RenameProject } from './RenameProject'
import { ContractualProject } from '../types'

interface ActionMenuProps {
  project: ContractualProject
  onProjectUpdated: (updatedProject: ContractualProject) => void
  onProjectDeleted: (deletedProjectId: string) => void
}

export function ActionMenu({ project, onProjectUpdated, onProjectDeleted }: ActionMenuProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const handleOpenDetailsModal = () => {
    setShowDetailsModal(true)
  }

  const handleOpenRenameModal = () => {
    setShowRenameModal(true)
  }

  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true)
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
          <DropdownMenuItem onSelect={handleOpenDeleteModal}>
            Eliminar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpenRenameModal}>
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpenDetailsModal}>
            Ver detalles
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ConfirmDelete 
        isOpen={showDeleteModal}
        project={project}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={onProjectDeleted}
      />
      
      <ProjectDetails 
        isOpen={showDetailsModal}
        project={project}
        onClose={() => setShowDetailsModal(false)}
      />
      
      <RenameProject 
        isOpen={showRenameModal}
        project={project}
        onClose={() => setShowRenameModal(false)}
        onSuccess={onProjectUpdated}
      />
    </>
  )
}
