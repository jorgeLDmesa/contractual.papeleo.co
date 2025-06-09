"use client"
import { useState, createContext, useContext } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, Calendar, Hash } from "lucide-react";

// Interface for document details
interface DocumentDetails {
  id: string;
  name: string;
  url?: string | null;
  type: string;
  month?: string;
  template_id?: number | null;
}

// Create a context for the document details sheet
type DocumentDetailsContextType = {
  openDetails: (document: DocumentDetails) => void;
  isOpen: boolean;
};

const DocumentDetailsContext = createContext<DocumentDetailsContextType>({
  openDetails: () => {},
  isOpen: false,
});

// Export hook for using the context
export const useDocumentDetails = () => useContext(DocumentDetailsContext);

export default function MemberDocumentDetails() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetails | null>(null);

  const openDetails = (document: DocumentDetails) => {
    setSelectedDocument(document);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedDocument(null);
  };

  return (
    <>
      <DocumentDetailsContext.Provider value={{ openDetails, isOpen }}>
        <Sheet open={isOpen} onOpenChange={handleClose}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-xl">Detalles del documento</SheetTitle>
                  <SheetDescription>
                    Información completa del documento seleccionado
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            
            <div className="space-y-6">
              {selectedDocument ? (
                <>
                  {/* Document name */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Nombre del documento</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedDocument.name}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Estado</h3>
                    <div>
                      {selectedDocument.url ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                          <Clock className="w-4 h-4 mr-2" />
                          Pendiente de subir
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Additional information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Información adicional</h3>
                    <div className="space-y-3">
                      
                      {/* Type */}
                      <div className="flex items-center gap-3 py-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Tipo:</span>
                          <span className="ml-2 text-gray-900">{selectedDocument.type}</span>
                        </div>
                      </div>

                      {/* Month */}
                      {selectedDocument.month && (
                        <div className="flex items-center gap-3 py-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <span className="text-sm font-medium text-gray-600">Mes:</span>
                            <span className="ml-2 text-gray-900">{selectedDocument.month}</span>
                          </div>
                        </div>
                      )}

                      {/* Template indicator */}
                      {selectedDocument.template_id && (
                        <div className="flex items-center gap-3 py-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <span className="text-sm font-medium text-gray-600">Plantilla:</span>
                            <Badge variant="outline" className="ml-2 text-blue-700 border-blue-300">
                              Disponible
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File information if uploaded */}
                  {selectedDocument.url && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Archivo subido</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Documento validado y almacenado
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                              El archivo ha sido procesado correctamente y está disponible para revisión.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Help text for pending documents */}
                  {!selectedDocument.url && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">¿Cómo subir este documento?</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="space-y-2 text-sm text-blue-800">
                          <p>• Haz clic en el botón &ldquo;Subir&rdquo; en la tarjeta del documento</p>
                          <p>• Selecciona un archivo en formato PDF, DOC o DOCX</p>
                          <p>• El archivo se procesará automáticamente</p>
                          {selectedDocument.template_id && (
                            <p>• También puedes usar la plantilla disponible</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500">No hay documento seleccionado</p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </DocumentDetailsContext.Provider>
    </>
  );
} 