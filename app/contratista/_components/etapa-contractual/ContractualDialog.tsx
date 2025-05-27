"use client"

import { useEffect, useMemo, useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { FileQuestion, FolderOpen, Search, X, PlusCircle } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ContractualCard } from './ContractualCard'
import { ExtraDocumentCard } from './ExtraDocumentCard'
import ContractualSkeleton from './ContractualSkeleton'
import SearchContractual from './SearchContractual'
import MemberDocumentDetails from './MemberDocumentDetails'
import { getAllDocuments, type DocumentGroup, type ContractualDocument } from './actions/actionServer'

interface ContractualDialogProps {
  contractMemberId: string;
  contractName?: string;
  children: React.ReactNode;
}

export default function ContractualDialog({ 
  contractMemberId, 
  contractName,
  children 
}: ContractualDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Set contractMemberId globally when dialog opens
  useEffect(() => {
    if (open) {
      (window as any).__contractMemberId = contractMemberId;
    } else {
      delete (window as any).__contractMemberId;
    }
  }, [open, contractMemberId])

  // Listen for document upload/replace events
  useEffect(() => {
    if (!open) return;
    
    const handleDocumentChange = () => {
      setRefreshKey(prevKey => prevKey + 1)
    }
    
    window.addEventListener('contractual-document-change', handleDocumentChange)
    
    return () => {
      window.removeEventListener('contractual-document-change', handleDocumentChange)
    }
  }, [open])

  // Fetch documents when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchDocuments = async () => {
      setIsLoading(true)
      try {
        // Use getAllDocuments to fetch both regular and extra documents
        const result = await getAllDocuments(contractMemberId)
        if (result.success && result.data) {
          setDocumentGroups(result.data)
        } else {
          console.error('Error fetching documents:', result.error)
          setDocumentGroups([])
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
        setDocumentGroups([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDocuments()
  }, [contractMemberId, refreshKey, open])

  // Filter documents by search term
  const filteredDocumentGroups = useMemo(() => {
    if (!searchTerm) return documentGroups
    
    return documentGroups.map(group => ({
      month: group.month,
      docs: group.docs.filter((doc: ContractualDocument) => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.docs.length > 0)
  }, [documentGroups, searchTerm])

  // Statistics
  const totalDocuments = documentGroups.reduce((acc, group) => acc + group.docs.length, 0)
  const uploadedDocuments = documentGroups.reduce((acc, group) => 
    acc + group.docs.filter((doc: ContractualDocument) => doc.url).length, 0
  )
  const pendingDocuments = totalDocuments - uploadedDocuments
  const hasContractualDocuments = filteredDocumentGroups.length > 0

  // Reset states when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchTerm('')
      setRefreshKey(0)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleDocumentUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
          {/* Header Section */}
          <DialogHeader className="bg-white border-b border-gray-200 p-6 pb-6 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                <FolderOpen className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Documentos Contractuales
              </DialogTitle>
            </div>
            
            {contractName && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-600 text-sm">Contrato:</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  {contractName}
                </Badge>
              </div>
            )}

            {/* Statistics */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                <span className="text-sm text-gray-700">Total: {totalDocuments}</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm text-green-700">Subidos: {uploadedDocuments}</span>
              </div>
              <div className="flex items-center gap-2 bg-red-100 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-red-700">Pendientes: {pendingDocuments}</span>
              </div>
            </div>
          </DialogHeader>

          {/* Search Bar */}
          <div className="bg-white border-b border-gray-200 p-4 md:p-6 flex-shrink-0">
            <SearchContractual onSearch={handleSearch} />
            
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                {filteredDocumentGroups.length === 0 
                  ? "No se encontraron documentos que coincidan con tu búsqueda" 
                  : `Mostrando ${filteredDocumentGroups.reduce((acc, group) => acc + group.docs.length, 0)} documentos`
                }
              </div>
            )}
          </div>

          {/* Documents Grid - Scrollable Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 md:p-6">
              {isLoading ? (
                <div className="space-y-6">
                  <ContractualSkeleton />
                </div>
              ) : !hasContractualDocuments ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <FileQuestion className="h-10 w-10 text-gray-400" />
                  </div>
                  {searchTerm ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No se encontraron documentos
                      </h3>
                      <p className="text-gray-500 mb-4 max-w-sm">
                        No hay documentos que coincidan con "{searchTerm}". 
                        Intenta con otros términos de búsqueda.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => handleSearch('')}
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                      >
                        Limpiar búsqueda
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay documentos contractuales
                      </h3>
                      <p className="text-gray-500 max-w-sm">
                        Este contrato no tiene documentos contractuales definidos.
                        Contacta al administrador si esto es un error.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {searchTerm ? 'Resultados de búsqueda' : 'Documentos por mes'}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {filteredDocumentGroups.reduce((acc, group) => acc + group.docs.length, 0)} documento{filteredDocumentGroups.reduce((acc, group) => acc + group.docs.length, 0) !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Document Groups */}
                  <div className="space-y-6">
                    {filteredDocumentGroups.map((docGroup, index) => (
                      <div key={`${docGroup.month}-${index}`} className="bg-white border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {docGroup.month === 'Sin mes asignado'
                            ? 'Sin mes asignado'
                            : docGroup.month.charAt(0).toUpperCase() + docGroup.month.slice(1)
                          }
                        </h3>
                        <Separator className="my-1" />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {docGroup.docs.map((doc: ContractualDocument) => {
                            // Display regular contractual document
                            if (doc.type !== 'contractual-extra') {
                              return (
                                <ContractualCard 
                                  key={`${doc.id}-${doc.month || 'no-month'}-${refreshKey}`} 
                                  memberDocument={doc} 
                                />
                              );
                            }
                            // Display extra document
                            else {
                              return (
                                <ExtraDocumentCard 
                                  key={`extra-${doc.id}-${refreshKey}`}
                                  document={{
                                    id: doc.id,
                                    name: doc.name,
                                    type: doc.type,
                                    url: doc.url
                                  }}
                                  contractMemberId={contractMemberId}
                                  onDocumentUpdated={handleDocumentUpdated}
                                />
                              );
                            }
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer with progress indicator */}
          {totalDocuments > 0 && (
            <div className="bg-white border-t border-gray-200 p-4 md:p-6 flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Progreso: {uploadedDocuments} de {totalDocuments} documentos completados
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalDocuments > 0 ? (uploadedDocuments / totalDocuments) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="font-medium text-gray-900">
                    {totalDocuments > 0 ? Math.round((uploadedDocuments / totalDocuments) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <MemberDocumentDetails />
    </>
  )
} 