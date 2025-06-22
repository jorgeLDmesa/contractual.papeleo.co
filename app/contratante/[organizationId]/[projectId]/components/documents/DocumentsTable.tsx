import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ViewDocumentsModal, { ProjectDocumentGroupedByDueDate } from "./ViewDocumentsModal";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createMemberDocumentSignedUrl } from "@/app/contratista/actions/actionClient";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { uploadResignationLetter } from "@/app/contratista/actions/actionClient";
import { PenLine, CheckCircle2 } from "lucide-react";
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

interface DocumentsTableProps {
  projectDocuments: ProjectDocumentGroupedByDueDate[]
  searchTerm: string
}

const checkAllDocumentsUploaded = (requiredDocuments: ProjectDocumentGroupedByDueDate["requiredDocuments"]) => {
  if (!requiredDocuments || !Array.isArray(requiredDocuments)) {
    return false;
  }
  
  return requiredDocuments.every((group) =>
    group.docs && Array.isArray(group.docs) && group.docs.every((doc) => doc.url !== null)
  );
}

interface LegalStatusBadgeDisplayProps {
  projectDocument: ProjectDocumentGroupedByDueDate;
}

const LegalStatusBadgeDisplay: React.FC<LegalStatusBadgeDisplayProps> = ({ projectDocument }) => {
  const [isLoading, setIsLoading] = useState(false);
  const status = projectDocument.statusJuridico;

  const handleBackgroundDocClick = async (code: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://api.auco.ai/v1.5/ext/validate/background?code=${code}`, {
        headers: {
          'Authorization': process.env.NEXT_PUBLIC_AUCO_PUBLIC_KEY || ''
        }
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error fetching background document:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!status) {
    return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Pendiente</Badge>;
  }
  
  if (status.status === true) {
    const novedades = status.novedades || [];
    
    if (novedades.length > 0) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Badge variant="destructive" className="cursor-help">Rechazado</Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
              <div className="p-1 max-w-sm">
                {status.code && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-2 text-xs flex items-center gap-1"
                    onClick={() => status.code && handleBackgroundDocClick(status.code)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    Ver documento de antecedentes
                  </Button>
                )}
                <h4 className="font-semibold mb-1 text-red-700">Novedades:</h4>
                <ul className="text-sm list-disc pl-5">
                  {novedades.map((novedad: string, index: number) => (
                    <li key={index} className="text-gray-800">{novedad}</li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return <Badge variant="destructive">Rechazado</Badge>;
  }
  
  if (status.status === false) {
    return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">Aprobado</Badge>;
  }
  
  return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Pendiente</Badge>;
};

// New component for social security status badge
interface SocialSecurityStatusBadgeDisplayProps {
  projectDocument: ProjectDocumentGroupedByDueDate;
}

const SocialSecurityStatusBadgeDisplay: React.FC<SocialSecurityStatusBadgeDisplayProps> = ({ projectDocument }) => {
  const status = projectDocument.statusSeguridadSocial;
  
  if (!status) {
    return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Pendiente</Badge>;
  }
  
  if (status.status === true) {
    const novedades = status.novedades || [];
    
    if (novedades.length > 0) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Badge variant="destructive" className="cursor-help">Rechazado</Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
              <div className="p-1 max-w-sm">
                <h4 className="font-semibold mb-1 text-red-700">Novedades:</h4>
                <ul className="text-sm list-disc pl-5">
                  {novedades.map((novedad: string, index: number) => (
                    <li key={index} className="text-gray-800">{novedad}</li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return <Badge variant="destructive">Rechazado</Badge>;
  }
  
  if (status.status === false) {
    return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">Aprobado</Badge>;
  }
  
  return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Pendiente</Badge>;
};

// New component for the document status badge
interface DocumentStatusBadgeProps {
  projectDocument: ProjectDocumentGroupedByDueDate;
}

const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ projectDocument }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTerminationDialogOpen, setIsTerminationDialogOpen] = useState(false);
  const [isViewTerminationDocOpen, setIsViewTerminationDocOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Check if there's a termination request
  const hasTerminationRequest = projectDocument.ending?.status === "solicitud" || projectDocument.ending?.status === "comun";
  // Check if documents are all uploaded
  const allDocumentsUploaded = checkAllDocumentsUploaded(projectDocument.requiredDocuments);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleViewResignationDoc = async () => {
    if (projectDocument.ending?.url) {
      try {
        setIsLoading(true);
        const response = await createMemberDocumentSignedUrl(projectDocument.ending.url);
        if (response.success && response.data) {
          window.open(response.data, '_blank');
        } else {
          toast.error('No se pudo abrir el documento de terminación');
        }
      } catch {
        toast.error('Error al abrir el documento');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleUploadTermination = async () => {
    if (!file) {
      toast.error('Por favor seleccione un archivo');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('memberId', projectDocument.contractMemberId);
      formData.append('terminationType', 'comun'); // Special parameter to indicate common termination

      const response = await uploadResignationLetter(formData);
      
      if (response.success) {
        toast.success('Documento de terminación subido correctamente');
        setIsTerminationDialogOpen(false);
        // Force reload to update the UI
        window.location.reload();
      } else {
        toast.error(response.error || 'Error al subir el documento de terminación');
      }
    } catch {
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsUploading(false);
    }
  };
  
  // If there's a termination request, show the red badge with tooltip
  if (hasTerminationRequest) {
    const terminationType = projectDocument.ending?.status === "solicitud" ? "Renuncia" : "Administrativa";
    
    return (
      <TooltipProvider>
        <Tooltip delayDuration={50}>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Badge variant="destructive" className="cursor-help">Terminación</Badge>
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
            <div className="p-1 max-w-sm">
              <p className="text-sm text-black mb-2">Solicitud de terminación de contrato ({terminationType})</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-black flex items-center gap-1"
                onClick={handleViewResignationDoc}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                Ver documento
              </Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // If all documents are uploaded, show "Cargados" badge with termination button
  if (allDocumentsUploaded) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
          Cargados
        </Badge>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsTerminationDialogOpen(true)}
                className="ml-1 rounded-full hover:bg-red-100 hover:text-red-600 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Iniciar proceso de terminación de contrato</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={isTerminationDialogOpen} onOpenChange={setIsTerminationDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir documento de terminación</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p>Al subir este documento, se iniciará el proceso de terminación administrativa del contrato. Esta acción no es reversible.</p>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="termination-document">Documento de terminación</Label>
                <Input 
                  id="termination-document" 
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTerminationDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUploadTermination}
                  disabled={!file || isUploading}
                >
                  {isUploading ? 'Subiendo...' : 'Subir y solicitar'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // If documents are pending, show orange "Pendientes" badge with termination button
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
        Pendientes
      </Badge>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsTerminationDialogOpen(true)}
              className="ml-1 rounded-full hover:bg-red-100 hover:text-red-600 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Iniciar proceso de terminación de contrato</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isTerminationDialogOpen} onOpenChange={setIsTerminationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir documento de terminación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>Al subir este documento, se iniciará el proceso de terminación administrativa del contrato. Esta acción no es reversible.</p>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="termination-document">Documento de terminación</Label>
              <Input 
                id="termination-document" 
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTerminationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUploadTermination}
                disabled={!file || isUploading}
              >
                {isUploading ? 'Subiendo...' : 'Subir y solicitar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing termination documents when process already exists */}
      <Dialog open={isViewTerminationDocOpen} onOpenChange={setIsViewTerminationDocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Documento de terminación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {projectDocument.ending && (
              <>
                <p>Este contrato ya tiene un proceso de terminación {projectDocument.ending.status === "solicitud" ? "por renuncia" : "administrativo"} en curso.</p>
                
                <Button 
                  onClick={handleViewResignationDoc}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Ver documento de terminación
                </Button>
              </>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewTerminationDocOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Utilidad para abrir contratos (siempre usa signed URL para paths relativos o de storage)
async function openContractDocument(path: string, setLoading: (v: boolean) => void) {
  if (!path) return;
  // Si es una URL pública (http/https), abrir directo
  if (/^https?:\/\//.test(path) && !path.includes('localhost')) {
    window.open(path, '_blank', 'noopener');
    return;
  }
  // Si es una ruta local (ejemplo: /contratante/...), extrae solo el path relativo de storage
  let storagePath = path;
  // Si la ruta contiene /drafts/ o /contractual/, extrae desde ahí
  const draftsIdx = path.indexOf('drafts/');
  const contractualIdx = path.indexOf('contractual/');
  if (draftsIdx !== -1) {
    storagePath = path.slice(draftsIdx);
  } else if (contractualIdx !== -1) {
    storagePath = path.slice(contractualIdx + 'contractual/'.length);
  }
  // Log para depuración
  console.log('[openContractDocument] storagePath usado para signedUrl:', storagePath);
  setLoading(true);
  try {
    const result = await createMemberDocumentSignedUrl(storagePath);
    if (result.success && result.data) {
      window.open(result.data, '_blank', 'noopener');
    } else {
      toast.error(result.error || 'No se pudo abrir el documento');
    }
  } catch {
    toast.error('Error inesperado al abrir el documento');
  } finally {
    setLoading(false);
  }
}

function ContractNameLink({ url, contractName }: { url: string, contractName: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:underline disabled:opacity-50"
      onClick={() => openContractDocument(url, setLoading)}
      disabled={loading}
    >
      {loading ? 'Cargando...' : contractName}
    </button>
  );
}

export default function DocumentsTable({ projectDocuments, searchTerm }: DocumentsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [signingRow, setSigningRow] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // Estado local para los documentos (para actualizar contratante_signed sin recargar)
  const [localDocuments, setLocalDocuments] = useState<ProjectDocumentGroupedByDueDate[]>(projectDocuments);

  // Sincroniza localDocuments si cambian los props (ej. paginación, búsqueda)
  useEffect(() => {
    setLocalDocuments(projectDocuments);
  }, [projectDocuments]);

  // Obtener el user_id del usuario logueado al montar el componente
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id);
      } else {
        setUserId(null);
      }
    };
    getUserId();
  }, []);

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return localDocuments;
    return localDocuments.filter((doc) =>
      doc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.contractName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [localDocuments, searchTerm]);

  // Calculate pagination
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const tableData = filteredDocuments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Nueva función para firmar contrato como contratante
  const handleContratanteSign = async (contractMemberId: string) => {
    if (!userId) {
      toast.error("No se pudo obtener el usuario actual. Por favor, inicia sesión de nuevo.");
      return;
    }
    setIsSigning(true);
    try {
      const res = await fetch("/api/contract-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractMemberId, user_id: userId, role: "contratante" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Contrato firmado exitosamente");
        setLocalDocuments((prev) => prev.map(doc =>
          doc.contractMemberId === contractMemberId
            ? { ...doc, contratante_signed: true }
            : doc
        ));
      } else {
        toast.error(data.message || "Error al firmar el contrato");
      }
    } catch {
      toast.error("Error inesperado al firmar el contrato");
    } finally {
      setIsSigning(false);
      setSigningRow(null);
    }
  };

  return (
    <>
      {
        tableData.length === 0 ?
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500 text-lg">
              No se encontraron documentos. Haz clic en la pestaña &ldquo;INVITACIONES&rdquo; para comenzar.
            </p>
          </div>
          :
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Contratista</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Estado de Documentos</TableHead>
                  <TableHead>Estado Jurídico</TableHead>
                  <TableHead>Estado de Seguridad Social</TableHead>
                  <TableHead>Acciones</TableHead>
                  <TableHead>Firma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((projectDocument: ProjectDocumentGroupedByDueDate) => (
                  <TableRow key={projectDocument.contractMemberId}>
                    <TableCell className="font-medium">{projectDocument.username}</TableCell>
                    <TableCell className="font-medium">
                      {projectDocument.contractUrl || projectDocument.contractDraftUrl ? (
                        <ContractNameLink url={projectDocument.contractUrl || projectDocument.contractDraftUrl || ''} contractName={projectDocument.contractName || ''} />
                      ) : (
                        projectDocument.contractName
                      )}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge projectDocument={projectDocument} />
                    </TableCell>
                    <TableCell>
                      <LegalStatusBadgeDisplay projectDocument={projectDocument} />
                    </TableCell>
                    <TableCell>
                      <SocialSecurityStatusBadgeDisplay projectDocument={projectDocument} />
                    </TableCell>
                    <TableCell>
                      <ViewDocumentsModal projectDocument={projectDocument} />
                    </TableCell>
                    <TableCell>
                      {projectDocument.contratante_signed ? (
                        <CheckCircle2 className="text-green-500 w-5 h-5 mx-auto" />
                      ) : (
                        <>
                          <button
                            className="mx-auto flex items-center justify-center text-blue-600 hover:text-blue-800"
                            onClick={() => setSigningRow(projectDocument.contractMemberId)}
                            aria-label="Firmar contrato"
                          >
                            <PenLine className="w-5 h-5" />
                          </button>
                          <Dialog open={signingRow === projectDocument.contractMemberId} onOpenChange={open => { if (!open) setSigningRow(null); }}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>¿Firmar contrato como contratante?</DialogTitle>
                                <DialogDescription>
                                  Al aceptar, se firmará el contrato y se insertará su firma digital en el documento. Se asume que usted ya revisó los antecedentes jurídicos y está de acuerdo con el contenido del contrato.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="default"
                                  onClick={() => setSigningRow(null)}
                                  disabled={isSigning}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="default"
                                  className="flex items-center"
                                  onClick={() => handleContratanteSign(projectDocument.contractMemberId)}
                                  disabled={isSigning}
                                >
                                  {isSigning && signingRow === projectDocument.contractMemberId ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline-block align-middle" />
                                  ) : null}
                                  {isSigning && signingRow === projectDocument.contractMemberId ? "Firmando..." : "Firmar"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando 
                  <span className="font-medium mx-1">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                  </span> 
                  a 
                  <span className="font-medium mx-1">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span> 
                  de 
                  <span className="font-medium mx-1">{totalItems}</span> 
                  resultados
                </p>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
      }
    </>
  )
}