'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProjectStageCount = {
  project_name: string
  contract_members_count: number
  color: string
}

export function ContractualStagesBar({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(true)
  const [totalContractualStages, setTotalContractualStages] = useState(0)
  const [limit, setLimit] = useState<number | null>(null)
  const [projectCounts, setProjectCounts] = useState<ProjectStageCount[]>([])

  useEffect(() => {
    // Color palette for the different projects in the bar
    const colors = [
      "bg-blue-200",
      "bg-violet-200",
      "bg-blue-300",
      "bg-purple-200",
      "bg-blue-100",
      "bg-violet-300",
      "bg-blue-400",
      "bg-purple-300",
      "bg-sky-200",
      "bg-fuchsia-200"
    ]

    const fetchData = async () => {
      try {
        const supabase = createClient()
        
        // Get the organization module limit
        const { data: moduleData, error: moduleError } = await supabase
          .from('organization_modules')
          .select('limits')
          .eq('organization_id', organizationId)
          .eq('module_id', 1)
          .single()
        
        if (moduleError) {
          console.error('Error fetching module data:', moduleError)
          return
        }
        
        setLimit(moduleData?.limits || null)
        
        // Get contract member counts by project
        const { data: projectData, error: projectError } = await supabase
          .from('contractual_projects')
          .select(`
            id,
            name,
            contracts:contracts(
              id,
              contract_members:contract_members(count)
            )
          `)
          .eq('organization_id', organizationId)
        
        if (projectError) {
          console.error('Error fetching project data:', projectError)
          return
        }
        
        // Process and format the data
        let totalCount = 0
        const formattedProjects: ProjectStageCount[] = []
        
        projectData?.forEach((project, index) => {
          const contractMembersCount = project.contracts.reduce((sum, contract) => {
            return sum + (contract.contract_members?.[0]?.count || 0)
          }, 0)
          
          if (contractMembersCount > 0) {
            formattedProjects.push({
              project_name: project.name,
              contract_members_count: contractMembersCount,
              color: colors[index % colors.length]
            })
            
            totalCount += contractMembersCount
          }
        })
        
        setTotalContractualStages(totalCount)
        setProjectCounts(formattedProjects)
      } catch (error) {
        console.error('Error in data fetching:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [organizationId])
  
  if (loading) {
    return (
      <div className="space-y-2 p-4 border rounded-lg bg-white shadow">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }
  
  // Calculate progress percentage
  const progressPercentage = limit ? Math.min(100, (totalContractualStages / limit) * 100) : 100
  
  return (
    <div className="space-y-2 p-4 border rounded-lg bg-white shadow">
      <h3 className="text-lg font-medium">Etapas Contractuales</h3>
      
      <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden flex">
        {projectCounts.map((project, index) => {
          // Calculate width percentage for this project
          const projectWidth = limit 
            ? (project.contract_members_count / limit) * 100
            : (project.contract_members_count / totalContractualStages) * 100
          
          return (
            <div 
              key={index}
              className={`h-full ${project.color} flex-shrink-0`}
              style={{ width: `${projectWidth}%` }}
              title={`${project.project_name}: ${project.contract_members_count} etapas`}
            />
          )
        })}
      </div>
      
      <div className="flex justify-between text-sm text-gray-600">
        <div>
          {totalContractualStages} etapas totales
        </div>
        {limit && (
          <div>
            Límite: {limit} etapas ({progressPercentage.toFixed(1)}%)
          </div>
        )}
      </div>
      
      <div className="space-y-1 mt-2">
        <h4 className="text-sm font-medium">Proyectos:</h4>
        <div className="grid grid-cols-2 gap-2">
          {projectCounts.map((project, index) => (
            <div key={index} className="flex items-center text-sm">
              <div className={`w-3 h-3 rounded-full ${project.color} mr-2`}></div>
              <span className="truncate">{project.project_name} ({project.contract_members_count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 