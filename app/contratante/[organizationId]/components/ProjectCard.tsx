import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActionMenu } from './ActionMenu'
import { ContractualProject } from '../types'

interface ProjectCardProps {
  project: ContractualProject
  organizationId: string
  canEdit?: boolean
  onProjectUpdated?: (updatedProject: ContractualProject) => void
  onProjectDeleted?: (deletedProjectId: string) => void
}

export function ProjectCard({ 
  project, 
  organizationId, 
  canEdit = true, 
  onProjectUpdated, 
  onProjectDeleted 
}: ProjectCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex justify-between items-center">
          <Link href={`/contratante/${organizationId}/${project.id}`} className="flex-1 hover:underline">
            <span>{project.name}</span>
          </Link>
          {canEdit && onProjectUpdated && onProjectDeleted && (
            <ActionMenu 
              project={project} 
              onProjectUpdated={onProjectUpdated}
              onProjectDeleted={onProjectDeleted}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          Creado el {format(project.createdAt, 'PP', { locale: es })}
        </p>
      </CardContent>
    </Card>
  )
}
