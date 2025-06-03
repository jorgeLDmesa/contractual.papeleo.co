"use client"
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Eye, RefreshCw, FileText, Download } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createDocumentSignedUrl, replacePrecontractualDocument } from "./actions/actionsClient";
import { useDocumentDetails } from "./MemberDocumentDetails";

// Define a better type
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

interface ActionMenuProps {
  memberDocument: PrecontractualDocument;
  contractMemberId: string;
}

export default function ActionMenu({ memberDocument, contractMemberId }: ActionMenuProps) {
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const documentDetails = useDocumentDetails();

  const handleReplaceFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const fileInput = event.target;

    if (!file) {
      toast.error('No se ha seleccionado ningún archivo');
      return;
    }

    setIsLoading(true);
    try {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error('Tipo de archivo no permitido');
      }

      // Create and populate form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contractualDocumentId', memberDocument.contractual_document_id || '');
      formData.append('memberId', contractMemberId);
      formData.append('contractId', 'dialog'); // Since we don't have contractId in this context
      formData.append('requiredDocumentId', memberDocument.required_document_id || memberDocument.id);

      // Check if we have contractual_document_id
      if (!memberDocument.contractual_document_id) {
        throw new Error('ID del documento contractual no encontrado');
      }

      // Execute replacement
      const result = await replacePrecontractualDocument(formData, memberDocument.name);
      
      if (!result.success) {
        // If it's an AI validation failure, show the message without throwing an error
        console.log('Replace failed:', result.error);
        toast.error(result.error || 'Error al reemplazar el documento', {
          duration: 6000
        });
        return; // Exit without throwing error
      }
      
      // Notify about the change
      window.dispatchEvent(new Event('precontractual-document-change'));
      
      toast.success('Documento reemplazado y verificado');
    } catch (error) {
      // Log error and show toast if needed
      console.error('Error replacing file:', error);
      toast.error(error instanceof Error ? error.message : 'Error al reemplazar el archivo', {
        duration: 6000
      });
    } finally {
      setIsLoading(false);
      // Always clear the input
      fileInput.value = '';
    }
  };

  const handlePreviewDocument = async () => {
    if (!memberDocument.url) return;
    
    setIsLoading(true);
    try {
      const result = await createDocumentSignedUrl(memberDocument.url);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error al generar URL de previsualización');
      }
      
      // Open in new tab
      const newWindow = window.open(result.data, '_blank');
      if (!newWindow) {
        throw new Error('El navegador bloqueó la apertura de la ventana. Por favor, permita las ventanas emergentes.');
      }
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error(error instanceof Error ? error.message : 'Error al previsualizar el documento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayDetails = () => {
    documentDetails.openDetails(memberDocument);
  };

  return (
    <>
      <input
        type="file"
        ref={replaceFileInputRef}
        onChange={handleReplaceFile}
        className="hidden"
        accept=".pdf,.doc,.docx"
      />
      {
        isLoading ? (
          <Button size="sm" disabled className="bg-gray-100 text-gray-600">
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Procesando...
          </Button>
        ) : (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handlePreviewDocument}
                disabled={!memberDocument.url}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver documento
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDisplayDetails}
                className="cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => replaceFileInputRef.current?.click()}
                disabled={!memberDocument.url}
                className="cursor-pointer text-orange-600 focus:text-orange-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reemplazar archivo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    </>
  );
} 