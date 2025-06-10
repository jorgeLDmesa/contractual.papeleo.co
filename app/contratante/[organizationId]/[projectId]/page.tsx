'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Documents from './Documents'
import Contracts from './Contracts'
import Invitations from './Invitations'
import Information from './Information'
import { fetchProjectById } from './actions/actionServer'
import { ContractualProject } from './types'
import Navbar from '@/app/_components/Navbar'
// import ShaderGradientBackground from "@/components/ui/ShaderGradientBackground"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [selectedProject, setSelectedProject] = useState<ContractualProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        
        if (!projectId) {
          throw new Error('Project ID is missing')
        }

        // Only fetch project data here - let individual components handle their own data
        const project = await fetchProjectById(projectId)
        setSelectedProject(project)
        
      } catch (error) {
        console.error('ProjectPage: Error loading data:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [projectId])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <Navbar/>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Cargando proyecto...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <Navbar/>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-2">Error al cargar el proyecto</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* <ShaderGradientBackground /> */}
      <Navbar/>
      <h1 className="text-3xl font-bold">
        {selectedProject?.name || 'Proyecto sin nombre'}
      </h1>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contracts">CONTRATOS</TabsTrigger>
          <TabsTrigger value="invitations">INVITACIONES</TabsTrigger>
          <TabsTrigger value="documents">DOCUMENTOS</TabsTrigger>
          <TabsTrigger value="information">INFORMACIÓN</TabsTrigger>
        </TabsList>

        <div className="mt-6 min-h-[600px]">
          <TabsContent value="contracts" className="mt-0">
            <Contracts projectId={projectId} />
          </TabsContent>

          <TabsContent value="invitations" className="mt-0">
            <Invitations projectId={projectId} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <Documents projectId={projectId} />
          </TabsContent>

          <TabsContent value="information" className="mt-0">
            <Information  />
          </TabsContent>
        </div>

      </Tabs>
    </div>
  )
}

