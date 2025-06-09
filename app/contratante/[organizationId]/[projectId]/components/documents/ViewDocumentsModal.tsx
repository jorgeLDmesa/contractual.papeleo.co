// @/contractual/organizations/[organizationId]/[projectId]/components/documents/ViewDocumentsModal.tsx
import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";


import DocumentCard from "./DocumentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import { ContractualDocumentsByMonth, getAllContractualDocuments, createContractualExtraDocument } from "./actionServer";
import { PlusCircle, CalendarIcon } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogFooter, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, addYears, isBefore, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { 
  uploadExtensionAndCreateRecord, 
  getContractMemberExtensions, 
  getContractMemberDates,
  createDocumentSignedUrl
} from "./actionClient";
import { toast } from "sonner";

export type ProjectDocumentGroupedByDueDate = {
  username: string;
  email: string;
  contractId: string;
  contractMemberId: string; // Usado para obtener documentos contractuales
  requiredDocuments: ProjectDocumentGroupForDueDate[];
  contractName?: string;
  statusJuridico?: {
    status?: boolean;
    novedades?: string[];
    code?: string;
  } | null;
  ending?: {
    url: string;
    status: string;
  }
};

export type ProjectDocumentGroupForDueDate = {
  dueDate: string;
  docs: ProjectDocument[];
};

export type ProjectDocument = {
  id: string;
  name: string;
  type: string;
  dueDate: string;
  contractualDocumentId?: string;
  url?: string;
};

// Tipo para extensiones de contrato
type ContractExtension = {
  id: number;
  created_at: string;
  contract_member_id: string;
  extension_start_date: string;
  extension_end_date: string;
  extension_url: string;
};

// Extension card to display contract extensions
const ExtensionCard = ({ extension }: { extension: ContractExtension }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDocument = async () => {
    if (!extension.extension_url) return;
    
    setIsLoading(true);
    try {
      const result = await createDocumentSignedUrl(extension.extension_url);
      
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Extensión de Contrato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-sm text-gray-500">
          Fecha inicio: {format(new Date(extension.extension_start_date), "dd/MM/yyyy")}
        </div>
        <div className="text-sm text-gray-500">
          Fecha fin: {format(new Date(extension.extension_end_date), "dd/MM/yyyy")}
        </div>
      </CardContent>
      <CardContent>
        <Button
          onClick={handleViewDocument}
          className="cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Ver Documento"}
        </Button>
      </CardContent>
    </Card>
  );
};

// Add document card component
const AddDocumentCard = ({ month, contractMemberId, onDocumentAdded }: { 
  month: string; 
  contractMemberId: string;
  onDocumentAdded: () => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDocument = async () => {
    if (!documentName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const result = await createContractualExtraDocument(
        contractMemberId,
        documentName.trim(),
        month
      );
      
      if (result.success) {
        setDocumentName("");
        setIsDialogOpen(false);
        onDocumentAdded();
      } else {
        console.error("Error creating document:", result.error);
      }
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center min-h-[200px]" onClick={() => setIsDialogOpen(true)}>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
          <PlusCircle className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">Agregar Documento</p>
        </CardContent>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Agregar nuevo documento</AlertDialogTitle>
          <div className="py-4">
            <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del documento
            </label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Ingrese el nombre del documento"
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddDocument} disabled={!documentName.trim() || isSubmitting}>
              {isSubmitting ? "Agregando..." : "Agregar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Add extension component
const AddExtensionCard = ({ contractMemberId, onExtensionAdded }: {
  contractMemberId: string;
  onExtensionAdded: () => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contractDates, setContractDates] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  } | null>(null);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  // Cargar fechas del contrato al abrir el diálogo
  useEffect(() => {
    if (isDialogOpen && contractMemberId) {
      const loadContractDates = async () => {
        setIsLoadingDates(true);
        try {
          const result = await getContractMemberDates(contractMemberId);
          if (result.success && result.data) {
            setContractDates(result.data);
            // Si hay fecha de fin del contrato, establecer la fecha de inicio como esa
            if (result.data.endDate) {
              setStartDate(new Date(result.data.endDate));
            }
          } else {
            setError("No se pudieron cargar las fechas del contrato");
          }
        } catch (error) {
          console.error("Error al cargar fechas del contrato:", error);
          setError("Error al cargar fechas del contrato");
        } finally {
          setIsLoadingDates(false);
        }
      };

      loadContractDates();
    }
  }, [isDialogOpen, contractMemberId]);

  // Calcular el límite máximo de la fecha de fin (1 año desde start_date del contrato)
  const maxEndDate = contractDates?.startDate 
    ? addYears(new Date(contractDates.startDate), 1) 
    : undefined;

  const handleAddExtension = async () => {
    // Validar existencia de fechas
    if (!startDate || !endDate) {
      setError("Por favor seleccione ambas fechas");
      return;
    }

    // Validar que la fecha de inicio no sea menor que la fecha de fin del contrato
    if (contractDates?.endDate && isBefore(startDate, contractDates.endDate)) {
      setError("La fecha de inicio no puede ser anterior a la fecha de fin del contrato");
      return;
    }

    // Validar que la fecha de fin no sea posterior a 1 año desde start_date del contrato
    if (contractDates?.startDate && maxEndDate && isAfter(endDate, maxEndDate)) {
      setError("La fecha de fin no puede superar un año desde la fecha de inicio del contrato");
      return;
    }

    // Validar que la fecha de inicio no sea posterior a la fecha de fin
    if (isAfter(startDate, endDate)) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin");
      return;
    }

    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setError("Por favor seleccione un archivo");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    
    try {
      const dateRange: DateRange = {
        from: startDate,
        to: endDate
      };

      const result = await uploadExtensionAndCreateRecord(
        fileInput.files[0],
        contractMemberId,
        dateRange
      );
      
      if (result.success) {
        setIsDialogOpen(false);
        onExtensionAdded();
      } else {
        setError(result.error || "Error al crear la extensión");
      }
    } catch (error) {
      console.error("Error al crear extensión:", error);
      setError("Error inesperado al crear la extensión");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deshabilitar fechas anteriores a la fecha de fin del contrato para el calendar de inicio
  const disableStartDate = (date: Date) => {
    if (!contractDates?.endDate) return false;
    return isBefore(date, contractDates.endDate);
  };

  // Deshabilitar fechas posteriores a 1 año desde start_date para el calendar de fin
  const disableEndDate = (date: Date) => {
    if (!maxEndDate) return false;
    return isAfter(date, maxEndDate);
  };

  return (
    <>
      <Card className="cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center min-h-[200px]" onClick={() => setIsDialogOpen(true)}>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
          <CalendarIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">Agregar Extensión</p>
        </CardContent>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogTitle>Agregar extensión de contrato</AlertDialogTitle>
          
          {isLoadingDates ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">Cargando datos del contrato...</p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {contractDates?.endDate && (
                <div className="text-sm bg-blue-50 p-3 rounded-md border border-blue-200">
                  <p>
                    <span className="font-medium">Fecha fin de contrato:</span> {format(contractDates.endDate, "dd MMMM, yyyy", { locale: es })}
                  </p>
                  {contractDates.startDate && maxEndDate && (
                    <p className="mt-1">
                      <span className="font-medium">Fecha máxima permitida:</span> {format(maxEndDate, "dd MMMM, yyyy", { locale: es })}
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio de extensión
                  </label>
                  <div className="border rounded-md p-2">
                    {startDate && (
                      <p className="text-sm font-medium mb-2">
                        {format(startDate, "dd MMMM, yyyy", { locale: es })}
                      </p>
                    )}
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={es}
                      className="rounded-md border"
                      disabled={disableStartDate}
                      fromDate={contractDates?.endDate || undefined}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de fin de extensión
                  </label>
                  <div className="border rounded-md p-2">
                    {endDate && (
                      <p className="text-sm font-medium mb-2">
                        {format(endDate, "dd MMMM, yyyy", { locale: es })}
                      </p>
                    )}
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={es}
                      className="rounded-md border"
                      disabled={disableEndDate}
                      toDate={maxEndDate}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="extensionDocument" className="block text-sm font-medium text-gray-700 mb-1">
                  Documento de extensión
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="extensionDocument"
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx"
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceptados: PDF, DOC, DOCX
                </p>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting || isLoadingDates}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddExtension}
              disabled={isSubmitting || isLoadingDates || !startDate || !endDate}
            >
              {isSubmitting ? "Agregando..." : "Agregar Extensión"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function ViewDocumentsModal({
  projectDocument,
}: {
  projectDocument: ProjectDocumentGroupedByDueDate;
}) {
  // Estado para almacenar todos los documentos contractuales por mes
  const [allDocumentsByMonth, setAllDocumentsByMonth] = useState<ContractualDocumentsByMonth[]>([]);
  // Estado para indicar si los documentos contractuales están cargando
  const [isLoadingContractualDocs, setIsLoadingContractualDocs] = useState(false);
  // Estado para controlar si el diálogo está abierto
  const [isOpen, setIsOpen] = useState(false);
  // Estado para forzar refrescos
  const [refreshKey, setRefreshKey] = useState(0);
  // Estado para almacenar extensiones de contrato
  const [extensions, setExtensions] = useState<ContractExtension[]>([]);
  // Estado para indicar si las extensiones están cargando
  const [isLoadingExtensions, setIsLoadingExtensions] = useState(false);

  // Función para cargar los documentos contractuales cuando se abre el diálogo
  const loadContractualDocuments = async () => {
    if (!projectDocument.contractMemberId) return;
    
    setIsLoadingContractualDocs(true);
    try {
      // Cargar todos los documentos en una sola llamada para mejorar rendimiento
      const data = await getAllContractualDocuments(projectDocument.contractMemberId);
      setAllDocumentsByMonth(data);
    } catch (error) {
      console.error("Error al cargar documentos contractuales:", error);
    } finally {
      setIsLoadingContractualDocs(false);
    }
  };

  // Función para cargar extensiones de contrato
  const loadExtensions = async () => {
    if (!projectDocument.contractMemberId) return;
    
    setIsLoadingExtensions(true);
    try {
      const result = await getContractMemberExtensions(projectDocument.contractMemberId);
      if (result.success) {
        setExtensions(result.extensions);
      } else {
        console.error("Error al cargar extensiones:", result.error);
      }
    } catch (error) {
      console.error("Error al cargar extensiones:", error);
    } finally {
      setIsLoadingExtensions(false);
    }
  };

  // Handler para cuando se agrega un nuevo documento
  const handleDocumentAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handler para cuando se agrega una nueva extensión
  const handleExtensionAdded = () => {
    // Actualizar la clave de refresco para forzar la recarga de datos
    setRefreshKey(prev => prev + 1);
    
    // También se podría mostrar un mensaje de toast o notificación
    toast.success("Extensión agregada correctamente");
  };

  // Cargar los documentos cuando se abre el diálogo o se actualiza el refreshKey
  useEffect(() => {
    if (isOpen) {
      loadContractualDocuments();
      loadExtensions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectDocument.contractMemberId, refreshKey]);

  /**
   * DOCUMENTOS PRECONTRACTUALES - mantenerlos igual
   */
  const precontractualDocs = projectDocument.requiredDocuments
    .flatMap((group) => group.docs?.filter((doc) => doc.type === "precontractual") || []);

  // Only use months that have documents, not empty ones
  const allMonths = Array.from(new Set([
    ...allDocumentsByMonth.map(group => group.month)
  ])).sort((a, b) => {
    const monthOrder: Record<string, number> = {
      'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
      'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
      'Sin mes asignado': 13
    };
    return (monthOrder[a.toLowerCase()] || 99) - (monthOrder[b.toLowerCase()] || 99);
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={projectDocument.requiredDocuments.length === 0}>
          Ver Documentos
        </Button>
      </DialogTrigger>
      <DialogContent
        /** 
         * Make the modal wider and taller, and enable scrolling 
         * (both vertical & horizontal if needed).
         */
        className="w-[50vw] sm:max-w-none max-h-[85vh] overflow-y-auto"
      >
        <AlertDialogHeader>
          <DialogTitle>Documentos de {projectDocument.username}</DialogTitle>
          <DialogDescription>
            Aquí puedes ver los documentos subidos.
          </DialogDescription>
        </AlertDialogHeader>

        {/* --- PRECONTRACTUAL DOCUMENTS --- */}
        {precontractualDocs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Documentos Precontractuales
            </h2>
            <Separator className="mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {precontractualDocs.map((doc) => (
                <DocumentCard key={doc.id} requiredDocument={doc} />
              ))}
            </div>
          </section>
        )}

        {/* --- CONTRACTUAL DOCUMENTS GROUPED BY MONTH --- */}
        {isLoadingContractualDocs ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando documentos contractuales...</p>
          </div>
        ) : (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Documentos Contractuales
            </h2>
            <Separator className="mb-4" />
            {allMonths.map((month) => {
              // Find the documents for this month
              const docsForMonth = allDocumentsByMonth.find(group => 
                group.month.toLowerCase() === month.toLowerCase()
              )?.documents || [];
              
              // Only show months with documents
              if (docsForMonth.length === 0 && month !== "Sin mes asignado") {
                return null;
              }

              return (
                <div key={month} className="border rounded-md p-4 mb-6 bg-white">
                  <h3 className="text-md font-medium text-gray-700 mb-2">
                    {month === "Sin mes asignado" 
                      ? "Sin mes asignado" 
                      : month.charAt(0).toUpperCase() + month.slice(1)}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* All documents for this month */}
                    {docsForMonth.map((doc) => (
                      <DocumentCard 
                        key={doc.contractualDocumentId} 
                        requiredDocument={{
                          id: doc.id,
                          name: doc.name,
                          type: doc.type,
                          dueDate: "", // No es relevante para los contractuales
                          contractualDocumentId: doc.contractualDocumentId,
                          url: doc.url
                        }} 
                      />
                    ))}
                    
                    {/* Add document card - only in months that have existing documents */}
                    {projectDocument.contractMemberId && (
                      <AddDocumentCard 
                        month={month} 
                        contractMemberId={projectDocument.contractMemberId}
                        onDocumentAdded={handleDocumentAdded}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* --- CONTRACT EXTENSIONS SECTION --- */}
        {projectDocument.contractMemberId && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Extensiones de Contrato
            </h2>
            <Separator className="mb-4" />
            
            {isLoadingExtensions ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando extensiones...</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* List all extensions */}
                {extensions.map((extension) => (
                  <ExtensionCard key={extension.id} extension={extension} />
                ))}
                
                {/* Add extension card */}
                <AddExtensionCard 
                  contractMemberId={projectDocument.contractMemberId}
                  onExtensionAdded={handleExtensionAdded}
                />
              </div>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
