"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUp, Check, Loader2, Eye, MoreHorizontal, Trash2, File, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { 
  uploadContractualExtraDocument,
  deleteContractualExtraDocument,
  createDocumentSignedUrl
} from "./actions/actionsClient"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDocumentDetails } from "./MemberDocumentDetails"

interface ExtraDocumentCardProps {
  document: {
    id: string;
    name: string;
    type: string;
    url?: string | null;
    month?: string;
  };
  contractMemberId: string;
  onDocumentUpdated: () => void;
}

export function ExtraDocumentCard({ document, contractMemberId, onDocumentUpdated }: ExtraDocumentCardProps) {
  const uploadFileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { openDetails } = useDocumentDetails()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const result = await uploadContractualExtraDocument(file, contractMemberId, document.id)
      
      if (!result.success) {
        throw new Error(result.error || "Error uploading document")
      }
      
      toast.success("Documento subido");
      
      onDocumentUpdated()
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error(error instanceof Error ? error.message : "Error al subir el documento");
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleViewDocument = async () => {
    if (document.url) {
      const result = await createDocumentSignedUrl(document.url);
      if (result.success && result.data) {
        window.open(result.data, '_blank');
      } else {
        throw new Error(result.error || 'Error al generar URL del documento');
      }
    }
  }

  const handleShowDetails = () => {
    openDetails(document)
  }

  const handleReplaceDocument = () => {
    uploadFileInputRef.current?.click()
  }

  const handleDeleteDocument = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento extra?')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteContractualExtraDocument(document.id)
      
      if (!result.success) {
        throw new Error(result.error || "Error deleting document")
      }
      
      toast.success("Documento eliminado");
      
      onDocumentUpdated()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error(error instanceof Error ? error.message : "Error al eliminar el documento");
    } finally {
      setIsDeleting(false)
    }
  }

  const isUploaded = !!document.url

  return (
    <Card className={`
      group relative overflow-hidden transition-all duration-200 hover:shadow-lg min-w-[280px] max-w-[320px] w-full
      ${isUploaded 
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300'
        : 'bg-white border-gray-200 hover:border-gray-300'
      }
    `}>
      {/* Status indicator line */}
      <div className={`
        absolute top-0 left-0 right-0 h-1 
        ${isUploaded 
          ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
          : 'bg-gradient-to-r from-orange-500 to-red-500'
        }
      `} />
      
      <CardContent className="p-4">
        {/* Header with icon and title */}
        <div className="flex items-start gap-4 mb-3">
          <div className={`
            p-2 rounded-lg transition-colors flex-shrink-0
            ${isUploaded 
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            <File className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 leading-tight text-sm">
              {document.name}
            </h3>
            
            {/* Status badge and month indicator in same row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isUploaded ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Extra
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </div>
              
              {/* Month indicator */}
              {document.month && (
                <div className="text-xs text-gray-500">
                  Mes: {document.month}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <input
            type="file"
            ref={uploadFileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx"
          />
          
          {isUploading || isDeleting ? (
            <Button size="sm" disabled className="bg-blue-100 text-blue-800">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              {isUploading ? 'Subiendo...' : 'Eliminando...'}
            </Button>
          ) : !isUploaded ? (
            <Button
              size="sm"
              onClick={() => uploadFileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Subir
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDocument}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver documento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReplaceDocument}>
                  <FileUp className="h-4 w-4 mr-2" />
                  Reemplazar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShowDetails}>
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteDocument} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Progress indicator for uploaded documents */}
        {isUploaded && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <CheckCircle className="w-3 h-3" />
              <span>Documento extra almacenado</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 