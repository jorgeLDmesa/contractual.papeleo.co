// @/app/[id]/contractual/organizations/[organizationId]/[projectId]/components/documents/DocumentCard.tsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDocument } from "./ViewDocumentsModal";
import { toast } from "sonner";
import { createDocumentSignedUrl } from "@/app/contratista/_components/etapa-contractual/actions/actionsClient";
import { useState } from "react";

export default function DocumentCard({ 
  requiredDocument 
}: { 
  requiredDocument: ProjectDocument 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDocument = () => {
    if (requiredDocument.url) {
      // Verificamos si la URL coincide con el patrón generado por la plantilla.
      // Asumimos que la URL tiene el formato "https://papeleo.co/docgen/{documentId}"
      const regex = /^https:\/\/papeleo\.co\/docgen\/[\w-]+$/;
      if (regex.test(requiredDocument.url)) {
        // Si es exactamente la URL generada por la plantilla, abrimos la URL base en una nueva pestaña.
        window.open(requiredDocument.url, "_blank");
      } else {
        // Sino, usamos la lógica actual (por ejemplo, generar una URL firmada, etc).
        handlePreviewDocument();
      }
    }
  };

  const handlePreviewDocument = async () => {
    if (!requiredDocument.url) return;
    
    setIsLoading(true);
    try {
      const result = await createDocumentSignedUrl(requiredDocument.url);
      
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

  // Determinar si el documento está cargado basado en el tipo
  const isDocumentLoaded = requiredDocument.type === "contractual" 
    ? !!requiredDocument.url                  // Para contractuales, verificar URL
    : !!requiredDocument.contractualDocumentId && !!requiredDocument.url; // Para precontractuales, verificar ID y URL

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{requiredDocument.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-gray-500">Tipo: {requiredDocument.type}</p>
        <div className="text-sm text-gray-500">
          Estado: <Badge
            variant={isDocumentLoaded ? "secondary" : "destructive"}
          >
            {isDocumentLoaded ? "Cargado" : "Pendiente"}
          </Badge>
        </div>
      </CardContent>
      <CardContent>
      <Button
          disabled={!isDocumentLoaded}
          className={isDocumentLoaded ? "cursor-pointer" : ""}
          onClick={handleViewDocument}
        >
          Ver Documento
        </Button>
      </CardContent>
    </Card>
  )
}