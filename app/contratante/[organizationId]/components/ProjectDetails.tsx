'use client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ContractualProject } from '../types'

interface ProjectDetailsProps {
  isOpen: boolean
  project: ContractualProject | null
  onClose: () => void
}

export function ProjectDetails({ isOpen, project, onClose }: ProjectDetailsProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{project?.name}</SheetTitle>
          <SheetDescription>
            Detalles del proyecto
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          {project && (
            <>
              <p>Fecha de creación: {format(new Date(project.createdAt), 'PP', { locale: es })}</p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
