"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { FileText, FolderOpen, Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PrecontractualCard } from './PrecontractualCard'
import PrecontractualSkeleton from './PrecontractualSkeleton'
import MemberDocumentDetails from './MemberDocumentDetails'
import { getPrecontractualDocuments } from './actions/actionServer'

// Define the document type
type PrecontractualDocument = {
  id: string;
  name: string;
  url?: string | null;
  type: string;
  month?: string | null;
  template_id?: number | null;
  required_document_id?: string;
  contractual_document_id?: string;
}

// Consolidated state interface
interface DialogState {
  isLoading: boolean;
  documents: PrecontractualDocument[];
  searchTerm: string;
  hasNotifiedCompletion: boolean;
  initialCompletionChecked: boolean;
}

interface PrecontractualDialogProps {
  contractMemberId: string;
  contractName?: string;
  children: React.ReactNode;
  onPhaseComplete?: () => void;
}

export default function PrecontractualDialog({ 
  contractMemberId, 
  contractName,
  children,
  onPhaseComplete
}: PrecontractualDialogProps) {
  const [open, setOpen] = useState(false)
  
  // Consolidated state
  const [state, setState] = useState<DialogState>({
    isLoading: false,
    documents: [],
    searchTerm: '',
    hasNotifiedCompletion: false,
    initialCompletionChecked: false
  })

  // Ref to track initial completion state
  const initiallyCompleteRef = useRef<boolean | null>(null)

  // Memoized statistics - only recalculated when documents change
  const statistics = useMemo(() => {
    const totalDocuments = state.documents.length
    const uploadedDocuments = state.documents.filter(doc => doc.url).length
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
  }, [state.documents])

  // Optimized filtered documents with debounced search
  const filteredDocuments = useMemo(() => {
    if (!state.searchTerm.trim()) return state.documents
    
    const searchTermLower = state.searchTerm.toLowerCase()
    return state.documents.filter(doc => 
      doc.name.toLowerCase().includes(searchTermLower)
    )
  }, [state.documents, state.searchTerm])

  // Load documents function with proper error handling
  const loadDocuments = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const result = await getPrecontractualDocuments(contractMemberId)
      
      if (result.success && result.data) {
        const documents = result.data
        const totalDocs = documents.length
        const uploadedDocs = documents.filter(doc => doc.url).length
        const isCurrentlyComplete = totalDocs > 0 && uploadedDocs === totalDocs
        
        // Set initial completion state only once
        if (initiallyCompleteRef.current === null) {
          initiallyCompleteRef.current = isCurrentlyComplete
        }
        
        setState(prev => ({
          ...prev,
          documents,
          isLoading: false,
          initialCompletionChecked: true
        }))
      } else {
        console.error('Error fetching documents:', result.error)
        setState(prev => ({
          ...prev,
          documents: [],
          isLoading: false,
          initialCompletionChecked: true
        }))
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setState(prev => ({
        ...prev,
        documents: [],
        isLoading: false,
        initialCompletionChecked: true
      }))
    }
  }, [contractMemberId])

  // Combined effect for dialog opening and document change events
  useEffect(() => {
    if (!open) return

    // Load documents immediately
    loadDocuments()

    // Listen for document changes
    const handleDocumentChange = () => {
      loadDocuments()
    }
    
    window.addEventListener('precontractual-document-change', handleDocumentChange)
    
    return () => {
      window.removeEventListener('precontractual-document-change', handleDocumentChange)
    }
  }, [open, loadDocuments])

  // Simplified completion notification logic
  useEffect(() => {
    const shouldNotify = 
      open && 
      state.initialCompletionChecked &&
      statistics.allDocumentsUploaded && 
      initiallyCompleteRef.current === false && 
      !state.hasNotifiedCompletion && 
      onPhaseComplete

    if (shouldNotify) {
      const timeout = setTimeout(() => {
        onPhaseComplete()
        window.dispatchEvent(new CustomEvent('precontractual-phase-complete', {
          detail: { contractMemberId }
        }))
        setState(prev => ({ ...prev, hasNotifiedCompletion: true }))
      }, 800)

      return () => clearTimeout(timeout)
    }
  }, [
    open, 
    state.initialCompletionChecked,
    statistics.allDocumentsUploaded, 
    state.hasNotifiedCompletion, 
    onPhaseComplete, 
    contractMemberId
  ])

  // Optimized handlers with useCallback
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset all state when dialog closes
      setState({
        isLoading: false,
        documents: [],
        searchTerm: '',
        hasNotifiedCompletion: false,
        initialCompletionChecked: false
      })
      initiallyCompleteRef.current = null
    }
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, searchTerm: value }))
  }, [])

  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, searchTerm: '' }))
  }, [])

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
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <FolderOpen className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Documentos Precontractuales
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
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
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
                    La siguiente fase (firma digital) ya está disponible.
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Search Bar */}
          <div className="bg-white border-b border-gray-200 p-4 md:p-6 flex-shrink-0">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar documentos..."
                className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={state.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {state.searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-200"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {state.searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                {filteredDocuments.length === 0 
                  ? "No se encontraron documentos que coincidan con tu búsqueda" 
                  : `Mostrando ${filteredDocuments.length} de ${statistics.totalDocuments} documentos`
                }
              </div>
            )}
          </div>

          {/* Documents Grid - Scrollable Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 md:p-6">
              {state.isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <PrecontractualSkeleton />
                </div>
              ) : filteredDocuments.length === 0 ? (
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
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Limpiar búsqueda
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay documentos precontractuales
                      </h3>
                      <p className="text-gray-500 max-w-sm">
                        Este contrato no tiene documentos precontractuales definidos.
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
                      {state.searchTerm ? 'Resultados de búsqueda' : 'Documentos requeridos'}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div className="flex flex-wrap gap-6 justify-start">
                    {filteredDocuments.map(doc => (
                      <div key={doc.id} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[280px]">
                        <PrecontractualCard 
                          memberDocument={doc} 
                          contractMemberId={contractMemberId} 
                        />
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
                        statistics.allDocumentsUploaded ? 'bg-green-500' : 'bg-blue-600'
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