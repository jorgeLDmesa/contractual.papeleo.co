"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUp, Check, Loader2, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { 
  uploadContractualExtraDocument,
  deleteContractualExtraDocument
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

  const handleViewDocument = () => {
    if (document.url) {
      window.open(document.url, '_blank')
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

  return (
    <Card className={`${document.url ? "bg-blue-50 border-blue-200" : "bg-white"} transition-all duration-300 hover:shadow-md border-dashed`}>
      <CardContent className="p-4 flex justify-between items-start gap-4 min-h-[80px]">
        <div className="flex flex-col space-y-1 min-w-0 flex-1">
          <h3 className="font-semibold truncate text-gray-900">{document.name}</h3>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full w-fit">
            Extra
          </span>
          {document.url ? (
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
          
          {isUploading || isDeleting ? (
            <Button variant="outline" size="icon" disabled>
              <Loader2 className="animate-spin h-4 w-4" />
            </Button>
          ) : !document.url ? (
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
      </CardContent>
    </Card>
  )
} 