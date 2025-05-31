'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Documents from './Documents'
import Contracts from './Contracts'
import Invitations from './Invitations'
import Information from './Information'
import { fetchProjectById, fetchContractsByProjectId } from './actions/actionServer'
import Navbar from '@/app/_components/Navbar'
// import ShaderGradientBackground from "@/components/ui/ShaderGradientBackground"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (projectId) {
        try {
          setIsLoading(true)
          const [project] = await Promise.all([
            fetchProjectById(projectId),
            fetchContractsByProjectId(projectId)
          ])
          setSelectedProject(project)
        } catch (error) {
          console.error('Error loading data:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadData()
  }, [projectId])

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* <ShaderGradientBackground /> */}
      <Navbar/>
      <h1 className="text-3xl font-bold">
        {selectedProject?.name || 'Cargando...'}
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

