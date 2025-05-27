"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUp, Check, Loader2, Eye, MoreHorizontal } from "lucide-react"
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

  return (
    <Card className={`${memberDocument.url ? "bg-green-50 border-green-200" : "bg-white"} transition-all duration-300 hover:shadow-md`}>
      <CardContent className="p-4 flex justify-between items-start gap-4 min-h-[80px]">
        <div className="flex flex-col space-y-1 min-w-0 flex-1">
          <h3 className="font-semibold truncate text-gray-900">{memberDocument.name}</h3>
          {memberDocument.month && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full w-fit">
              {memberDocument.month}
            </span>
          )}
          {memberDocument.url ? (
            <span className="text-green-600 flex items-center whitespace-nowrap font-medium">
              <Check className="w-4 h-4 mr-1 flex-shrink-0" /> Subido
            </span>
          ) : (
            <span className="text-red-600 whitespace-nowrap font-medium">Pendiente</span>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Input for file upload */}
          <input
            type="file"
            ref={uploadFileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx"
          />
          
          {isUploading ? (
            <Button variant="outline" size="icon" disabled>
              <Loader2 className="animate-spin h-4 w-4" />
            </Button>
          ) : !memberDocument.url ? (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => uploadFileInputRef.current?.click()}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <FileUp className="h-4 w-4" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
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
      </CardContent>
    </Card>
  )
} 