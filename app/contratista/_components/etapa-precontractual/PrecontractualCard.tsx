"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUp, Check, Loader2, ExternalLink, File, CheckCircle, Clock } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import ActionMenu from "./ActionMenu"
import { useRef, useCallback, useState } from "react"
import { uploadPrecontractualDocument } from "./actions/actionsClient"
import { toast } from "sonner"

// Define PrecontractualDocument type
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

interface PrecontractualCardProps {
  memberDocument: PrecontractualDocument;
  contractMemberId: string;
}

export function PrecontractualCard({ memberDocument, contractMemberId }: PrecontractualCardProps) {
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      console.log('Document for upload:', memberDocument);
      
      // Check if we have contractual_document_id (all documents should have this from the SQL function)
      if (!memberDocument.contractual_document_id) {
        console.error('Missing contractual_document_id for document:', memberDocument);
        throw new Error("ID del documento no encontrado");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contractId', 'dialog'); // Since we don't have contractId in dialog context
      formData.append('memberId', contractMemberId);
      formData.append('contractualDocumentId', memberDocument.contractual_document_id);
      
      const result = await uploadPrecontractualDocument(formData);
      
      if (!result.success) {
        throw new Error(result.error || "Error uploading document");
      }
      
      // Dispatch an event to notify the page about the document change
      window.dispatchEvent(new Event('precontractual-document-change'));
      
      toast.success("Documento subido");
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : "Error al subir el documento");
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  }, [contractMemberId, memberDocument]);

  const handleCreateTemplate = useCallback(async () => {
    // Template handling will be implemented if needed
    console.log("Template creation functionality will be implemented if needed");
  }, []);

  const hasTemplate = memberDocument.template_id !== null && memberDocument.template_id !== undefined;
  const isUploaded = !!memberDocument.url;

  return (
    <Card className={`
      group relative overflow-hidden transition-all duration-200 hover:shadow-lg
      ${isUploaded 
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
        : 'bg-white border-gray-200 hover:border-gray-300'
      }
    `}>
      {/* Status indicator line */}
      <div className={`
        absolute top-0 left-0 right-0 h-1 
        ${isUploaded ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}
      `} />
      
      <CardContent className="p-6">
        {/* Header with icon and title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`
            p-3 rounded-xl transition-colors
            ${isUploaded 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            <File className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2 leading-tight">
              {memberDocument.name}
            </h3>
            
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
              {isUploaded ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Pendiente
                </Badge>
              )}
            </div>

            {/* Template indicator */}
            {hasTemplate && !isUploaded && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <ExternalLink className="w-3 h-3" />
                <span>Plantilla disponible</span>
              </div>
            )}

            {/* Month indicator */}
            {memberDocument.month && (
              <div className="text-xs text-gray-500 mt-1">
                Mes: {memberDocument.month}
              </div>
            )}
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
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => uploadFileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Subir
              </Button>
              {hasTemplate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateTemplate}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <ActionMenu 
              memberDocument={memberDocument} 
              contractMemberId={contractMemberId} 
            />
          )}
        </div>

        {/* Progress indicator for uploaded documents */}
        {isUploaded && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Documento validado y almacenado</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 