"use client"

import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import ProjectSignatureCard from "./components/information/ProjectSignatureCard"
import ContratanteDataCard from "./components/information/ContratanteDataCard"

export default function Information() {
  const params = useParams()
  const organizationId = params.organizationId as string
  const projectId = params.projectId as string
  
  // Aquí podrías agregar lógica para obtener datos iniciales de firma si los necesitas
  // O pasar null como initialSignatureData si no hay datos iniciales
  const initialSignatureData = null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Información del Proyecto</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6 col-span-1">
          <ProjectSignatureCard 
            initialSignatureData={initialSignatureData}
            organizationId={organizationId}
            projectId={projectId}
          />
        </div>
        
        <div className="space-y-6 col-span-1">
          <ContratanteDataCard
            organizationId={organizationId}
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  )
}
