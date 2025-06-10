"use client"

import { useState, useEffect } from "react"
import { fetchContractProgressByOrganization } from '../actions/actionServer'

interface Project {
  name: string
  contracts: number
  color: string
}

interface ContractProgressProps {
  totalContracts: number
  completedContracts: number
  projects: Project[]
}

// Loading component
function ContractProgressSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

// Main component with data fetching
export function ContractProgressWithData({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    totalContracts: number
    completedContracts: number
    projects: Project[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const contractData = await fetchContractProgressByOrganization(organizationId)
        setData(contractData)
        setError(null)
      } catch (err) {
        console.error('Error loading contract progress:', err)
        setError('Error al cargar el progreso de contratos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId])

  if (loading) {
    return <ContractProgressSkeleton />
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg">{error || 'Error al cargar los datos'}</p>
        </div>
      </div>
    )
  }

  return <ContractProgress {...data} />
}

export default function ContractProgress({
  totalContracts,
  completedContracts,
  projects,
}: ContractProgressProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)

  const percentage = totalContracts > 0 ? Math.round((completedContracts / totalContracts) * 100) : 0

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const getProjectWidth = (contracts: number) => {
    return completedContracts > 0 ? (contracts / completedContracts) * 100 : 0
  }

  if (totalContracts === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No hay contratos disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{completedContracts}</span>
          <span className="text-lg text-gray-500">de {totalContracts}</span>
          <span className="text-sm text-gray-400">contratos</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-gray-900">{percentage}%</div>
          <div className="text-xs text-gray-500">completado</div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative mb-4">
        {/* Background Bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          {/* Animated Progress Bar */}
          <div
            className="h-full bg-gray-200 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{
              width: isVisible ? `${percentage}%` : "0%",
            }}
          >
            {/* Project Segments */}
            <div className="absolute inset-0 flex">
              {projects.map((project, index) => {
                const width = getProjectWidth(project.contracts)

                return (
                  <div
                    key={project.name}
                    className={`h-full ${project.color} transition-all duration-300 hover:brightness-110 cursor-pointer relative`}
                    style={{
                      width: `${width}%`,
                      animationDelay: `${index * 200}ms`,
                    }}
                    onMouseEnter={() => setHoveredProject(project.name)}
                    onMouseLeave={() => setHoveredProject(null)}
                  >
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 w-6 animate-shine" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredProject && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-10 animate-fadeIn">
            {hoveredProject}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>

      {/* Project Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 text-sm">
        {projects.map((project) => (
          <div
            key={project.name}
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105 cursor-pointer"
            onMouseEnter={() => setHoveredProject(project.name)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            <div className={`w-3 h-3 rounded-full ${project.color} shadow-sm flex-shrink-0`} />
            <span className="text-gray-700 font-medium truncate">{project.name}</span>
            <span className="text-gray-500 flex-shrink-0">({project.contracts})</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -4px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
