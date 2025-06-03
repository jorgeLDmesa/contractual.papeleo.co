'use client'
import { useState, useEffect, useMemo, use } from 'react'
import { ProjectCard } from './components/ProjectCard'
import { CreateProjectModal } from './components/CreateProjectModal'
import { SearchProjects } from './components/SearchProjects'
import { ProjectsSkeleton } from './components/ProjectsSkeleton'
import Navbar from '@/app/_components/Navbar'
// import { ShaderGradient, ShaderGradientCanvas } from 'shadergradient'
import { getUserProjectPermissionsByModule } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ContractProgressWithData } from './components/ContractProgress'
import { fetchProjectsByOrganizationId, fetchOrganizationById } from './actions/actionServer'
import { ContractualProject, Organization } from './types'
import { Navbar1 } from '@/components/blocks/navbar'


export default function ProjectsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = use(params)
  
  const [projects, setProjects] = useState<ContractualProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState<Date | undefined>()
  const [isOwner, setIsOwner] = useState(true) // Inicialmente optimista
  const [hasFullAccess, setHasFullAccess] = useState(true) // Inicialmente optimista
  const [allowedProjectIds, setAllowedProjectIds] = useState<string[]>([])
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  
  // Forzar ocultar skeleton después de un tiempo máximo (1 segundo)
  const [forceHideSkeleton, setForceHideSkeleton] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setForceHideSkeleton(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Cargar proyectos
  const loadProjects = async () => {
    try {
      setProjectsLoading(true)
      const projectsData = await fetchProjectsByOrganizationId(organizationId)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error("Error al cargar los proyectos")
    } finally {
      setProjectsLoading(false)
    }
  }

  // Cargar organización
  const loadOrganization = async () => {
    try {
      const organization = await fetchOrganizationById(organizationId)
      setCurrentOrganization(organization)
    } catch (error) {
      console.error('Error loading organization:', error)
      toast.error("Error al cargar la organización")
    }
  }

  // Iniciar la carga de proyectos una sola vez
  useEffect(() => {
    loadProjects()
  }, [organizationId])

  // Efecto para cargar permisos de usuario
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        // Obtener usuario actual
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Cargar permisos
          const CONTRACTUAL_MODULE_ID = 1;
          
          const permissions = await getUserProjectPermissionsByModule(
            user.id,
            organizationId,
            CONTRACTUAL_MODULE_ID,
            'contractual'
          );
          
          // Actualizar permisos
          setIsOwner(permissions.isOwner);
          setHasFullAccess(permissions.hasFullAccess);
          setAllowedProjectIds(permissions.allowedProjectIds);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setPermissionsLoaded(true);
      }
    };
    
    loadPermissions();
  }, [organizationId]);

  // Cargar organización
  useEffect(() => {
    loadOrganization();
  }, [organizationId]);

  // Handlers para los componentes
  const handleProjectCreated = (newProject: ContractualProject) => {
    setProjects(prev => [newProject, ...prev])
  }

  const handleProjectUpdated = (updatedProject: ContractualProject) => {
    setProjects(prev => prev.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ))
  }

  const handleProjectDeleted = (deletedProjectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== deletedProjectId))
  }

  // Filtrar proyectos según permisos y criterios de búsqueda
  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => 
        isOwner || hasFullAccess || allowedProjectIds.includes(project.id)
      )
      .filter(project => project.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(project => !filterDate || new Date(project.createdAt) >= filterDate);
  }, [projects, isOwner, hasFullAccess, allowedProjectIds, searchTerm, filterDate]);

  // Mostrar skeleton solo si:
  // 1. Estamos cargando proyectos, y
  // 2. No tenemos proyectos aún, y
  // 3. No hemos forzado ocultar el skeleton
  const showSkeleton = projectsLoading && projects.length === 0 && !forceHideSkeleton;

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
          {(isOwner || hasFullAccess) && 
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
                {isOwner || hasFullAccess 
                  ? "No se encontraron proyectos. Haz clic en \"Crear Proyecto\" para comenzar."
                  : "No tienes acceso a ningún proyecto en este módulo."}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                organizationId={organizationId}
                canEdit={isOwner || hasFullAccess || allowedProjectIds.includes(project.id)}
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
