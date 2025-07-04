'use client'
import { useState, useEffect, useMemo, use, useCallback } from 'react'
import { ProjectCard } from './components/ProjectCard'
import { CreateProjectModal } from './components/CreateProjectModal'
import { SearchProjects } from './components/SearchProjects'
import { ProjectsSkeleton } from './components/ProjectsSkeleton'
// import { ShaderGradient, ShaderGradientCanvas } from 'shadergradient'
import { getUserProjectPermissionsByModule } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ContractProgressWithData } from './components/ContractProgress'
import { fetchProjectsByOrganizationId, fetchOrganizationById } from './actions/actionServer'
import { ContractualProject, Organization } from './types'
import { Navbar1 } from '@/components/blocks/navbar'

// Tipos para mejor tipado
interface PermissionsState {
  isOwner: boolean
  hasFullAccess: boolean
  allowedProjectIds: string[]
  isLoading: boolean
}

interface LoadingState {
  projects: boolean
  organization: boolean
  permissions: boolean
}

const CONTRACTUAL_MODULE_ID = 1

export default function ProjectsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = use(params)
  
  // Estado consolidado para proyectos y organización
  const [projects, setProjects] = useState<ContractualProject[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estado consolidado para loading
  const [loading, setLoading] = useState<LoadingState>({
    projects: true,
    organization: true,
    permissions: true
  })
  
  // Estado consolidado para permisos (sin valores iniciales optimistas)
  const [permissions, setPermissions] = useState<PermissionsState>({
    isOwner: false,
    hasFullAccess: false,
    allowedProjectIds: [],
    isLoading: true
  })

  // Función para cargar todos los datos en paralelo
  const loadAllData = useCallback(async () => {
    try {
      setLoading({
        projects: true,
        organization: true,
        permissions: true
      })

      // Obtener usuario actual primero
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Ejecutar todas las llamadas en paralelo
      const [projectsData, organizationData, permissionsData] = await Promise.allSettled([
        fetchProjectsByOrganizationId(organizationId),
        fetchOrganizationById(organizationId),
        user ? getUserProjectPermissionsByModule(
          user.id,
          organizationId,
          CONTRACTUAL_MODULE_ID,
          'contractual'
        ) : Promise.resolve({ isOwner: false, hasFullAccess: false, allowedProjectIds: [] })
      ])

      // Manejar resultados de proyectos
      if (projectsData.status === 'fulfilled') {
        setProjects(projectsData.value)
      } else {
        console.error('Error loading projects:', projectsData.reason)
        toast.error("Error al cargar los proyectos")
      }

      // Manejar resultados de organización
      if (organizationData.status === 'fulfilled') {
        setCurrentOrganization(organizationData.value)
      } else {
        console.error('Error loading organization:', organizationData.reason)
        toast.error("Error al cargar la organización")
      }

      // Manejar resultados de permisos
      if (permissionsData.status === 'fulfilled') {
        setPermissions({
          ...permissionsData.value,
          isLoading: false
        })
      } else {
        console.error('Error loading permissions:', permissionsData.reason)
        setPermissions(prev => ({ ...prev, isLoading: false }))
      }

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading({
        projects: false,
        organization: false,
        permissions: false
      })
    }
  }, [organizationId])

  // Efecto único para cargar todos los datos
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Filtrar proyectos optimizado - memoización mejorada
  const filteredProjects = useMemo(() => {
    if (permissions.isLoading) return []
    
    const searchTermLower = searchTerm.toLowerCase()
    const hasPermissionToView = (project: ContractualProject) => 
      permissions.isOwner || 
      permissions.hasFullAccess || 
      permissions.allowedProjectIds.includes(project.id)

    return projects
      .filter(hasPermissionToView)
      .filter(project => searchTermLower === '' || project.name.toLowerCase().includes(searchTermLower))
  }, [projects, permissions, searchTerm])

  // Handlers optimizados con useCallback
  const handleProjectCreated = useCallback((newProject: ContractualProject) => {
    setProjects(prev => [newProject, ...prev])
  }, [])

  const handleProjectUpdated = useCallback((updatedProject: ContractualProject) => {
    setProjects(prev => prev.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ))
  }, [])

  const handleProjectDeleted = useCallback((deletedProjectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== deletedProjectId))
  }, [])

  // Estado de carga general
  const isLoading = loading.projects || loading.organization || loading.permissions
  const showSkeleton = isLoading && projects.length === 0

  // Verificar si puede crear proyectos
  const canCreateProjects = permissions.isOwner || permissions.hasFullAccess

  return (
    <div>
      {/* <div className="fixed inset-0 z-[-1]">
        <ShaderGradientCanvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <ShaderGradient
            animate="on"
            grain="on"
            cameraZoom={1}
            cDistance={6}
            color1="#f8fafc"
            color2="#e2e8f0"
            color3="#cbd5e1"
          />
        </ShaderGradientCanvas>
      </div> */}
      <div className="container mx-auto p-4 space-y-6">
        <Navbar1 />
        <h1 className="text-3xl font-bold text-center mb-8">
          {currentOrganization?.name || 'Cargando...'}
        </h1>

        <ContractProgressWithData organizationId={organizationId} />

        <div className="flex justify-between items-center gap-4 flex-wrap">
          <SearchProjects
            value={searchTerm}
            onChange={setSearchTerm}
          />
          {canCreateProjects && 
            <CreateProjectModal 
              organizationId={organizationId} 
              onSuccess={handleProjectCreated}
            />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showSkeleton ? (
            <ProjectsSkeleton />
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-lg">
                {!isLoading && (canCreateProjects
                  ? "No se encontraron proyectos. Haz clic en \"Crear Proyecto\" para comenzar."
                  : "No tienes acceso a ningún proyecto en este módulo.")}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                organizationId={organizationId}
                canEdit={permissions.isOwner || permissions.hasFullAccess || permissions.allowedProjectIds.includes(project.id)}
                onProjectUpdated={handleProjectUpdated}
                onProjectDeleted={handleProjectDeleted}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
