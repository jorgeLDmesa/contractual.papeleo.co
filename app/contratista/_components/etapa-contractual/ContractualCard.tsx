"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUp, Check, Loader2, Eye, MoreHorizontal, File, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { ContractualDocument } from "./actions/actionServer"
import { uploadContractualDocument, createDocumentSignedUrl } from "./actions/actionsClient"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDocumentDetails } from "./MemberDocumentDetails"

interface ContractualCardProps {
  memberDocument: ContractualDocument;
}

export function ContractualCard({ memberDocument }: ContractualCardProps) {
  const uploadFileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isViewingDocument, setIsViewingDocument] = useState(false)
  const { openDetails } = useDocumentDetails()

  // Necesitamos obtener el contractMemberId del contexto o props padre
  // Por ahora usaremos una solución temporal
  const getContractMemberId = () => {
    // Esto debería venir del contexto del diálogo
    const event = new CustomEvent('get-contract-member-id');
    window.dispatchEvent(event);
    return (window as any).__contractMemberId || '';
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const contractMemberId = getContractMemberId();
    if (!contractMemberId) {
      toast.error("No se pudo obtener el ID del contrato");
      return;
    }

    setIsUploading(true)
    try {
      // Use the same logic as the original: required_document_id || id
      const documentToUpload = {
        ...memberDocument,
        required_document_id: memberDocument.required_document_id || memberDocument.id
      }

      const result = await uploadContractualDocument(file, contractMemberId, documentToUpload)
      
      if (!result.success) {
        throw new Error(result.error || "Error uploading document")
      }
      
      // Trigger refresh
      window.dispatchEvent(new Event('contractual-document-change'))
      
      toast.success("Documento subido");
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error(error instanceof Error ? error.message : "Error al subir el documento");
    } finally {
      setIsUploading(false)
      // Reset the input
      event.target.value = ""
    }
  }

  const handleViewDocument = async () => {
    if (!memberDocument.url) return;
    
    setIsViewingDocument(true);
    try {
      // For external URLs (like templates), open directly
      if (memberDocument.url.startsWith('https://papeleo.co/docgen')) {
        window.open(memberDocument.url, '_blank');
        return;
      }

      // For storage files, create signed URL
      const result = await createDocumentSignedUrl(memberDocument.url);
      
      if (result.success && result.data) {
        window.open(result.data, '_blank');
      } else {
        throw new Error(result.error || 'Error al generar URL del documento');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error(error instanceof Error ? error.message : "Error al abrir el documento");
    } finally {
      setIsViewingDocument(false);
    }
  }

  const handleShowDetails = () => {
    openDetails(memberDocument)
  }

  const handleReplaceDocument = () => {
    uploadFileInputRef.current?.click()
  }

  // Check if this is an extra document from contractual_extra_documents table
  const isExtra = memberDocument.type === 'contractual-extra'
  const isUploaded = !!memberDocument.url

  return (
    <Card className={`
      group relative overflow-hidden transition-all duration-200 hover:shadow-lg min-w-[280px] max-w-[320px] w-full
      ${isUploaded 
        ? isExtra
          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300'
          : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
        : 'bg-white border-gray-200 hover:border-gray-300'
      }
    `}>
      {/* Status indicator line */}
      <div className={`
        absolute top-0 left-0 right-0 h-1 
        ${isUploaded 
          ? isExtra
            ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
            : 'bg-gradient-to-r from-green-500 to-emerald-500' 
          : 'bg-gradient-to-r from-orange-500 to-red-500'
        }
      `} />
      
      <CardContent className="p-4">
        {/* Header with icon and title */}
        <div className="flex items-start gap-4 mb-3">
          <div className={`
            p-2 rounded-lg transition-colors flex-shrink-0
            ${isUploaded 
              ? isExtra
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            <File className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 leading-tight text-sm">
              {memberDocument.name}
            </h3>
            
            {/* Status badge and month indicator in same row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isUploaded ? (
                  isExtra ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Extra
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completado
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </div>
              
              {/* Month indicator moved to the right */}
              {memberDocument.month && (
                <div className="text-xs text-gray-500">
                  Mes: {memberDocument.month}
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
          
          {isUploading ? (
            <Button size="sm" disabled className="bg-blue-100 text-blue-800">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Subiendo...
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
                <DropdownMenuItem onClick={handleViewDocument} disabled={isViewingDocument}>
                  {isViewingDocument ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Progress indicator for uploaded documents */}
        {isUploaded && (
          <div className={`mt-3 pt-3 border-t ${isExtra ? 'border-amber-200' : 'border-green-200'}`}>
            <div className={`flex items-center gap-2 text-xs ${isExtra ? 'text-amber-700' : 'text-green-700'}`}>
              <CheckCircle className="w-3 h-3" />
              <span>{isExtra ? 'Documento extra almacenado' : 'Documento validado y almacenado'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 