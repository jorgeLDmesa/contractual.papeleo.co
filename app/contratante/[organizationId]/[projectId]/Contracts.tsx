'use client'

import { useState, useEffect } from "react"
import { fetchContractsByProjectId } from "./actions/actionServer"
import { CreateContractModal } from "./components/contracts/CreateContractModal"
import { ContractCard } from "./components/contracts/ContractCard"
import { SearchContracts } from "./components/contracts/SearchContracts"
import ContractsSkeleton from "./components/contracts/ContractsSkeleton"
import { Contract } from "./types"

export default function Contracts({ projectId }: { projectId: string }) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(21)

  useEffect(() => {
    const loadContracts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log('Contracts component: Loading contracts for projectId:', projectId)
        
        if (!projectId) {
          throw new Error('Project ID is required')
        }
        
        const contractsData = await fetchContractsByProjectId(projectId)
        console.log('Contracts component: Contracts loaded:', contractsData)
        setContracts(contractsData)
      } catch (error) {
        console.error('Contracts component: Error loading contracts:', error)
        setError(error instanceof Error ? error.message : 'Error loading contracts')
      } finally {
        setIsLoading(false)
      }
    }

    loadContracts()
  }, [projectId])

  const getFilteredContracts = () => {
    if (!searchTerm) return contracts
    return contracts.filter(contract =>
      contract.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredContracts = getFilteredContracts()
  const visibleContracts = filteredContracts.slice(0, visibleCount)
  const hasMoreContracts = visibleCount < filteredContracts.length
  
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + 21)
  }

  const refreshContracts = async () => {
    try {
      setError(null)
      const contractsData = await fetchContractsByProjectId(projectId)
      setContracts(contractsData)
    } catch (error) {
      console.error('Error refreshing contracts:', error)
      setError(error instanceof Error ? error.message : 'Error refreshing contracts')
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Contratos</h2>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-2">Error al cargar contratos</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Contratos</h2>
      {
        !isLoading &&
        <div className="flex justify-between items-center">
          <SearchContracts searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <CreateContractModal projectId={projectId} onContractCreated={refreshContracts} />
        </div>
      }

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {
          isLoading
            ? <ContractsSkeleton />
            : filteredContracts.length === 0 ?
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-lg">
                  No se encontraron contratos. Haz clic en &ldquo;Nuevo Contrato&rdquo; para comenzar.
                </p>
              </div>
              :
              visibleContracts.map(contract => (
                <ContractCard 
                  key={contract.id} 
                  contract={contract} 
                  onContractUpdated={refreshContracts}
                  onContractDeleted={refreshContracts}
                />
              ))
        }
      </div>
      
      {hasMoreContracts && !isLoading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Ver más
          </button>
        </div>
      )}
    </div>
  )
}
