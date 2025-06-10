"use client"

import { useEffect, useMemo, useState } from 'react'
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
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<PrecontractualDocument[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Track completion state to avoid firing on initial load
  const [initialCompletionState, setInitialCompletionState] = useState<boolean | null>(null)
  const [hasNotifiedThisSession, setHasNotifiedThisSession] = useState(false)

  // Listen for document upload/replace events
  useEffect(() => {
    if (!open) return;
    
    const handleDocumentChange = () => {
      setRefreshKey(prevKey => prevKey + 1)
    }
    
    window.addEventListener('precontractual-document-change', handleDocumentChange)
    
    return () => {
      window.removeEventListener('precontractual-document-change', handleDocumentChange)
    }
  }, [open])

  // Fetch documents when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchDocuments = async () => {
      setIsLoading(true)
      try {
        const result = await getPrecontractualDocuments(contractMemberId)
        if (result.success && result.data) {
          setDocuments(result.data)
          
          // Set initial completion state only when documents are first loaded
          if (initialCompletionState === null) {
            const totalDocs = result.data.length
            const uploadedDocs = result.data.filter((doc: PrecontractualDocument) => doc.url).length
            const isComplete = totalDocs > 0 && uploadedDocs === totalDocs
            setInitialCompletionState(isComplete)
          }
        } else {
          console.error('Error fetching documents:', result.error)
          setDocuments([])
          setInitialCompletionState(false)
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
        setDocuments([])
        setInitialCompletionState(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDocuments()
  }, [contractMemberId, refreshKey, open, initialCompletionState])

  // Filter documents by search term
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents
    
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [documents, searchTerm])

  // Statistics
  const totalDocuments = documents.length
  const uploadedDocuments = documents.filter(doc => doc.url).length
  const pendingDocuments = totalDocuments - uploadedDocuments
  const allDocumentsUploaded = totalDocuments > 0 && uploadedDocuments === totalDocuments

  // IMPROVED: Only notify when there's an actual state change during this session
  useEffect(() => {
    // Only proceed if:
    // 1. Dialog is open
    // 2. We have initial state set
    // 3. Documents are now complete 
    // 4. They weren't complete initially (this is the key change)
    // 5. We haven't notified in this session yet
    // 6. We have the callback
    if (
      open && 
      initialCompletionState !== null && 
      allDocumentsUploaded && 
      !initialCompletionState && 
      !hasNotifiedThisSession && 
      onPhaseComplete
    ) {
      
      const timeout = setTimeout(() => {
        onPhaseComplete();
        window.dispatchEvent(new CustomEvent('precontractual-phase-complete', {
          detail: { contractMemberId }
        }));
        setHasNotifiedThisSession(true);
      }, 800);

      return () => clearTimeout(timeout);
    }
  }, [
    open, 
    allDocumentsUploaded, 
    initialCompletionState, 
    hasNotifiedThisSession, 
    onPhaseComplete, 
    contractMemberId
  ]);

  // Reset states when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchTerm('')
      setRefreshKey(0)
      // Reset session tracking when dialog closes
      setInitialCompletionState(null)
      setHasNotifiedThisSession(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

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
              {allDocumentsUploaded && (
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

            {allDocumentsUploaded && (
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
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-200"
                  onClick={() => handleSearchChange('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                {filteredDocuments.length === 0 
                  ? "No se encontraron documentos que coincidan con tu búsqueda" 
                  : `Mostrando ${filteredDocuments.length} de ${totalDocuments} documentos`
                }
              </div>
            )}
          </div>

          {/* Documents Grid - Scrollable Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 md:p-6">
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <PrecontractualSkeleton />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  {searchTerm ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No se encontraron documentos
                      </h3>
                      <p className="text-gray-500 mb-4 max-w-sm">
                        No hay documentos que coincidan con &ldquo;{searchTerm}&rdquo;. 
                        Intenta con otros términos de búsqueda.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => handleSearchChange('')}
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
                      {searchTerm ? 'Resultados de búsqueda' : 'Documentos requeridos'}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div className="flex flex-wrap gap-6 justify-start">
                    {filteredDocuments.map(doc => (
                      <div key={`${doc.id}-${refreshKey}`} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[280px]">
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
          {totalDocuments > 0 && (
            <div className="bg-white border-t border-gray-200 p-4 md:p-6 flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Progreso: {uploadedDocuments} de {totalDocuments} documentos completados
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        allDocumentsUploaded ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${totalDocuments > 0 ? (uploadedDocuments / totalDocuments) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className={`font-medium ${allDocumentsUploaded ? 'text-green-700' : 'text-gray-900'}`}>
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