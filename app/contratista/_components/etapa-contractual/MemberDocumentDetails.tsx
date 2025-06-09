"use client"
import { useState, createContext, useContext } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Detalles del documento</SheetTitle>
              <SheetDescription>
                Aquí puedes ver los detalles del documento
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {selectedDocument ? (
                <>
                  <p><strong>Documento:</strong> {selectedDocument.name}</p>
                  <p><strong>Estado:</strong> {selectedDocument.url ? 'Subido' : 'Pendiente'}</p>
                  {selectedDocument.month && (
                    <p><strong>Mes:</strong> {selectedDocument.month}</p>
                  )}
                </>
              ) : (
                <p>No hay documento seleccionado</p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </DocumentDetailsContext.Provider>
    </>
  );
} 