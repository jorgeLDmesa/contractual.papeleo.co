"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ContractualCard } from './ContractualCard'
import { ExtraDocumentCard } from './ExtraDocumentCard'
import ContractualSkeleton from './ContractualSkeleton'
import SearchContractual from './SearchContractual'
import MemberDocumentDetails from './MemberDocumentDetails'
import { getAllDocuments, type DocumentGroup, type ContractualDocument } from './actions/actionServer'
import { FileText, FolderOpen } from "lucide-react"

// Consolidated state interface
interface DialogState {
  isLoading: boolean;
  documentGroups: DocumentGroup[];
  searchTerm: string;
  hasNotifiedCompletion: boolean;
}

interface ContractualDialogProps {
  contractMemberId: string;
  contractName?: string;
  children: React.ReactNode;
  onPhaseComplete?: () => void;
}

export default function ContractualDialog({ 
  contractMemberId, 
  contractName,
  children,
  onPhaseComplete 
}: ContractualDialogProps) {
  const [open, setOpen] = useState(false)
  
  // Consolidated state
  const [state, setState] = useState<DialogState>({
    isLoading: false,
    documentGroups: [],
    searchTerm: '',
    hasNotifiedCompletion: false
  })

  // Ref to track initial completion state for this session
  const initialCompletionRef = useRef<boolean | null>(null)

  // Memoized statistics - only recalculated when documentGroups change
  const statistics = useMemo(() => {
    const totalDocuments = state.documentGroups.reduce((acc, group) => acc + group.docs.length, 0)
    const uploadedDocuments = state.documentGroups.reduce((acc, group) => 
      acc + group.docs.filter((doc: ContractualDocument) => doc.url).length, 0
    )
    const pendingDocuments = totalDocuments - uploadedDocuments
    const allDocumentsUploaded = totalDocuments > 0 && uploadedDocuments === totalDocuments
    const completionPercentage = totalDocuments > 0 ? Math.round((uploadedDocuments / totalDocuments) * 100) : 0

    return {
      totalDocuments,
      uploadedDocuments,
      pendingDocuments,
      allDocumentsUploaded,
      completionPercentage
    }
  }, [state.documentGroups])

  // Optimized filtered document groups
  const filteredDocumentGroups = useMemo(() => {
    if (!state.searchTerm.trim()) return state.documentGroups
    
    const searchTermLower = state.searchTerm.toLowerCase()
    return state.documentGroups.map(group => ({
      month: group.month,
      docs: group.docs.filter((doc: ContractualDocument) => 
        doc.name.toLowerCase().includes(searchTermLower)
      )
    })).filter(group => group.docs.length > 0)
  }, [state.documentGroups, state.searchTerm])

  // Load documents function with proper error handling
  const loadDocuments = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const result = await getAllDocuments(contractMemberId)
      
      if (result.success && result.data) {
        const documentGroups = result.data
        const totalDocs = documentGroups.reduce((acc, group) => acc + group.docs.length, 0)
        const uploadedDocs = documentGroups.reduce((acc, group) => 
          acc + group.docs.filter((doc: ContractualDocument) => doc.url).length, 0
        )
        const isCurrentlyComplete = totalDocs > 0 && uploadedDocs === totalDocs

        // Set initial completion state only once per dialog session
        if (initialCompletionRef.current === null) {
          initialCompletionRef.current = isCurrentlyComplete
        }

        setState(prev => ({
          ...prev,
          documentGroups,
          isLoading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          documentGroups: [],
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setState(prev => ({
        ...prev,
        documentGroups: [],
        isLoading: false
      }))
    }
  }, [contractMemberId])

  // Combined effect for dialog opening and document change events
  useEffect(() => {
    if (!open) return

    // Set global contractMemberId for child components
    (window as { __contractMemberId?: string }).__contractMemberId = contractMemberId

    // Load documents immediately
    loadDocuments()

    // Listen for document changes
    const handleDocumentChange = () => {
      loadDocuments()
    }
    
    window.addEventListener('contractual-document-change', handleDocumentChange)
    
    return () => {
      window.removeEventListener('contractual-document-change', handleDocumentChange)
      delete (window as { __contractMemberId?: string }).__contractMemberId
    }
  }, [open, contractMemberId, loadDocuments])

  // Simplified completion notification logic
  useEffect(() => {
    const shouldNotify = 
      open && 
      statistics.allDocumentsUploaded && 
      initialCompletionRef.current === false && 
      !state.hasNotifiedCompletion && 
      onPhaseComplete

    if (shouldNotify) {
      const timeout = setTimeout(() => {
        onPhaseComplete()
        setState(prev => ({ ...prev, hasNotifiedCompletion: true }))
      }, 800)

      return () => clearTimeout(timeout)
    }
  }, [
    open,
    statistics.allDocumentsUploaded,
    state.hasNotifiedCompletion,
    onPhaseComplete
  ])

  // Optimized handlers with useCallback
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset all state when dialog closes
      setState({
        isLoading: false,
        documentGroups: [],
        searchTerm: '',
        hasNotifiedCompletion: false
      })
      initialCompletionRef.current = null
    }
  }, [])

  const handleSearch = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }))
  }, [])

  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, searchTerm: '' }))
  }, [])

  const handleDocumentUpdated = useCallback(() => {
    // Simply reload documents - let the completion logic handle notification
    loadDocuments()
  }, [loadDocuments])

  const hasContractualDocuments = filteredDocumentGroups.length > 0

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="w-[50vw] sm:max-w-none max-h-[85vh] overflow-y-auto">
          {/* Header Section */}
          <DialogHeader className="bg-white border-b border-gray-200 p-6 pb-6 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                <FolderOpen className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Documentos Contractuales
              </DialogTitle>
              {statistics.allDocumentsUploaded && (
                <Badge className="bg-green-100 text-green-800 border-green-300 ml-auto">
                  ✓ Fase Completa
                </Badge>
              )}
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
                <span className="text-sm text-gray-700">Total: {statistics.totalDocuments}</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm text-green-700">Subidos: {statistics.uploadedDocuments}</span>
              </div>
              <div className="flex items-center gap-2 bg-red-100 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <span className="text-sm text-red-700">Pendientes: {statistics.pendingDocuments}</span>
              </div>
            </div>

            {statistics.allDocumentsUploaded && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    ¡Excelente! Todos los documentos han sido subidos. 
                    Puedes continuar viendo o reemplazando documentos si es necesario.
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Search Bar */}
          <div className="bg-white border-b border-gray-200 p-4 md:p-6 flex-shrink-0">
            <SearchContractual onSearch={handleSearch} />
            
            {state.searchTerm && (
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
              {state.isLoading ? (
                <div className="space-y-6">
                  <ContractualSkeleton />
                </div>
              ) : !hasContractualDocuments ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  {state.searchTerm ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No se encontraron documentos
                      </h3>
                      <p className="text-gray-500 mb-4 max-w-sm">
                        No hay documentos que coincidan con &ldquo;{state.searchTerm}&rdquo;. 
                        Intenta con otros términos de búsqueda.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={clearSearch}
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
                      {state.searchTerm ? 'Resultados de búsqueda' : 'Documentos por mes'}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {filteredDocumentGroups.reduce((acc, group) => acc + group.docs.length, 0)} documento{filteredDocumentGroups.reduce((acc, group) => acc + group.docs.length, 0) !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Document Groups */}
                  <div className="space-y-6">
                    {filteredDocumentGroups.map((docGroup, index) => (
                      <div key={`${docGroup.month}-${index}`} className="bg-white border rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {docGroup.month === 'Sin mes asignado'
                            ? 'Sin mes asignado'
                            : docGroup.month.charAt(0).toUpperCase() + docGroup.month.slice(1)
                          }
                        </h3>
                        <Separator className="my-1" />
                        <div className="flex flex-wrap gap-4 justify-start items-start">
                          {docGroup.docs.map((doc: ContractualDocument) => {
                            // Display regular contractual document
                            if (doc.type !== 'contractual-extra') {
                              return (
                                <ContractualCard 
                                  key={`${doc.id}-${doc.month || 'no-month'}`} 
                                  memberDocument={doc} 
                                />
                              );
                            }
                            // Display extra document
                            else {
                              return (
                                <ExtraDocumentCard 
                                  key={`extra-${doc.id}`}
                                  document={{
                                    id: doc.id,
                                    name: doc.name,
                                    type: doc.type,
                                    url: doc.url,
                                    month: doc.month || undefined
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
          {statistics.totalDocuments > 0 && (
            <div className="bg-white border-t border-gray-200 p-4 md:p-6 flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Progreso: {statistics.uploadedDocuments} de {statistics.totalDocuments} documentos completados
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        statistics.allDocumentsUploaded ? 'bg-green-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${statistics.completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className={`font-medium ${statistics.allDocumentsUploaded ? 'text-green-700' : 'text-gray-900'}`}>
                    {statistics.completionPercentage}%
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