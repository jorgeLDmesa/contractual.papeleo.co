// CreateContractModal.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { Loader2, Plus, Trash2, Brain } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DialogDescription } from '@radix-ui/react-dialog'
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { 
  getDocumentSuggestions, 
  DocumentSuggestion,
  getCurrentUser,
  uploadContractDraftFile,
  addDocument
} from './actionClient'
import { debounce } from 'lodash'
import { createContract } from '../../actions/actionServer'
import { Textarea } from "@/components/ui/textarea"
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave"

interface CreateContractModalProps {
  projectId: string
  onContractCreated?: () => void
}

export function CreateContractModal({ projectId, onContractCreated }: CreateContractModalProps) {
  // Estado local para el modal
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false)
  
  type DocumentOption = string | { name: string; template?: number };
  // Estado principal del contrato
// Actualiza el estado usando el nuevo tipo:
  const [newContract, setNewContract] = useState<{
    name: string;
    preContractualDocs: DocumentOption[];
    contractualDocs: DocumentOption[];
  }>({
    name: '',
    preContractualDocs: [],
    contractualDocs: [],
  });

  // Estados para agregar documentos manualmente
  const [newPreContractualDoc, setNewPreContractualDoc] = useState('')
  const [newContractualDoc, setNewContractualDoc] = useState('')

  // Estado para sugerencias de documentos
  const [preContractualSuggestions, setPreContractualSuggestions] = useState<DocumentSuggestion[]>([])
  const [contractualSuggestions, setContractualSuggestions] = useState<DocumentSuggestion[]>([])
  const [isLoadingPreSuggestions, setIsLoadingPreSuggestions] = useState(false)
  const [isLoadingContractualSuggestions, setIsLoadingContractualSuggestions] = useState(false)

  // Referencias para los contenedores de sugerencias
  const preContractualSuggestionsRef = useRef<HTMLDivElement>(null)
  const contractualSuggestionsRef = useRef<HTMLDivElement>(null)

  // Estado para archivo (opción "Subir Archivo")
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
  
  // Estados para la opción de usar IA
  const [draftOption, setDraftOption] = useState<"file" | "ai">("file")
  const [objetoContractual, setObjetoContractual] = useState<string>("")

  const router = useRouter()

  const openCreateModal = () => setIsOpen(true)
  const closeCreateModal = () => {
    if (isGeneratingWithAI) return // No permitir cerrar mientras se genera con IA
    setIsOpen(false)
    // Reset form
    setNewContract({
      name: '',
      preContractualDocs: [],
      contractualDocs: [],
    })
    setDraftFile(null)
    setFileError(null)
    setObjetoContractual("")
  }

  // Función para cargar sugerencias de documentos precontractuales
  const fetchPreContractualSuggestions = debounce(async (search: string) => {
    if (search.length < 2) {
      setPreContractualSuggestions([]);
      return;
    }
    
    setIsLoadingPreSuggestions(true);
    try {
      console.log("Solicitando sugerencias precontractuales para:", search);
      const suggestions = await getDocumentSuggestions(search, 'precontractual');
      console.log("Sugerencias precontractuales recibidas:", suggestions);
      setPreContractualSuggestions(suggestions);
    } catch (error) {
      console.error("Error al obtener sugerencias precontractuales:", error);
      // Mostrar un mensaje amigable al usuario (opcional)
      toast.warning("No se pudieron cargar sugerencias. Por favor, continúe escribiendo manualmente.");
    } finally {
      setIsLoadingPreSuggestions(false);
    }
  }, 300);

  // Función para cargar sugerencias de documentos contractuales
  const fetchContractualSuggestions = debounce(async (search: string) => {
    if (search.length < 2) {
      setContractualSuggestions([]);
      return;
    }
    
    setIsLoadingContractualSuggestions(true);
    try {
      console.log("Solicitando sugerencias contractuales para:", search);
      const suggestions = await getDocumentSuggestions(search, 'contractual');
      console.log("Sugerencias contractuales recibidas:", suggestions);
      setContractualSuggestions(suggestions);
    } catch (error) {
      console.error("Error al obtener sugerencias contractuales:", error);
      // Mostrar un mensaje amigable al usuario (opcional)
      toast.warning("No se pudieron cargar sugerencias. Por favor, continúe escribiendo manualmente.");
    } finally {
      setIsLoadingContractualSuggestions(false);
    }
  }, 300);

  // Event listener para cerrar las sugerencias al hacer clic fuera de ellas
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        preContractualSuggestionsRef.current && 
        !preContractualSuggestionsRef.current.contains(event.target as Node)
      ) {
        setPreContractualSuggestions([]);
      }
      
      if (
        contractualSuggestionsRef.current && 
        !contractualSuggestionsRef.current.contains(event.target as Node)
      ) {
        setContractualSuggestions([]);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Actualizar sugerencias al escribir en los inputs
  useEffect(() => {
    fetchPreContractualSuggestions(newPreContractualDoc);
  }, [newPreContractualDoc]);

  useEffect(() => {
    fetchContractualSuggestions(newContractualDoc);
  }, [newContractualDoc]);

  const handleSubmit = async () => {
    // Validación básica
    if (!newContract.name.trim()) {
      toast.error("Por favor, indique un nombre para el contrato.");
      return;
    }

    // Validar el tamaño del archivo si está presente
    if (draftOption === "file" && draftFile) {
      if (draftFile.size > MAX_FILE_SIZE) {
        setFileError(`El archivo es demasiado grande. El límite es de ${MAX_FILE_SIZE/1024/1024}MB.`);
        toast.error(`El archivo excede el límite de tamaño de ${MAX_FILE_SIZE/1024/1024}MB.`);
        return;
      }
    }

    // Validar objeto contractual para IA
    if (draftOption === "ai" && !objetoContractual.trim()) {
      toast.error("Por favor, redacte el objeto contractual para generar el contrato con IA.");
      return;
    }

    // Activar el estado de carga apropiado
    if (draftOption === "ai") {
      setIsGeneratingWithAI(true);
    } else {
      setIsLoading(true);
    }

    const formData = new FormData()
    formData.append('name', newContract.name)
    formData.append('projectId', projectId)

    if (newContract.preContractualDocs.length > 0) {
      formData.append('preContractualDocs', JSON.stringify(newContract.preContractualDocs))
    }
    if (newContract.contractualDocs.length > 0) {
      formData.append('contractualDocs', JSON.stringify(newContract.contractualDocs))
    }

    try {
      if (draftOption === "file") {
        if (draftFile) {
          // En lugar de adjuntar el archivo al FormData, lo subimos directamente a Supabase
          const uploadResult = await uploadContractDraftFile(
            draftFile, 
            projectId,
            newContract.name
          );
          
          if (uploadResult.error) {
            toast.error(`Error al subir el archivo: ${uploadResult.error}`);
            return;
          }
          
          // Adjuntamos la ruta del archivo directamente al campo contract_draft_url
          if (uploadResult.filePath) {
            formData.append('contractDraftUrl', uploadResult.filePath);
          }
        }
      } else if (draftOption === "ai") {
        // Generar contrato con IA usando el endpoint /api/ps-contract
        const response = await fetch('/api/ps-contract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            objetoParafraseado: objetoContractual
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al generar el contrato con IA');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Error al generar el contrato');
        }

        // Crear el link de Google Drive usando el documentId
        const driveUrl = `https://docs.google.com/document/d/${result.documentId}/edit`;
        formData.append('contractDraftUrl', driveUrl);
      }

      // Crear el contrato
      console.log('Estado antes de crear contrato:', {
        name: newContract.name,
        preContractualDocs: newContract.preContractualDocs,
        contractualDocs: newContract.contractualDocs
      })
      
      const createdContract = await createContract(formData)
      console.log('Contrato creado:', createdContract)

      // Crear los documentos requeridos después de crear el contrato exitosamente
      if (createdContract.id) {
        console.log('Iniciando creación de documentos. Precontractuales:', newContract.preContractualDocs.length, 'Contractuales:', newContract.contractualDocs.length)
        
        // Crear documentos precontractuales
        for (const doc of newContract.preContractualDocs) {
          const docName = typeof doc === 'string' ? doc : doc.name;
          const templateId = typeof doc === 'object' && doc.template ? doc.template : undefined;
          
          console.log('Creando documento precontractual:', docName, 'con template:', templateId)
          
          try {
            const result = await addDocument(createdContract.id, docName, 'precontractual', undefined, templateId);
            console.log('Resultado documento precontractual:', result)
            
            if (!result.success) {
              console.error('Error al crear documento precontractual:', result.error);
              toast.warning(`No se pudo crear el documento precontractual "${docName}": ${result.error}`);
            }
          } catch (docError) {
            console.error('Error al crear documento precontractual:', docError);
            toast.warning(`Error al crear documento precontractual "${docName}"`);
            // No interrumpimos el proceso si falla la creación de un documento
          }
        }

        // Crear documentos contractuales
        for (const doc of newContract.contractualDocs) {
          const docName = typeof doc === 'string' ? doc : doc.name;
          const templateId = typeof doc === 'object' && doc.template ? doc.template : undefined;
          
          console.log('Creando documento contractual:', docName, 'con template:', templateId)
          
          try {
            const result = await addDocument(createdContract.id, docName, 'contractual', undefined, templateId);
            console.log('Resultado documento contractual:', result)
            
            if (!result.success) {
              console.error('Error al crear documento contractual:', result.error);
              toast.warning(`No se pudo crear el documento contractual "${docName}": ${result.error}`);
            }
          } catch (docError) {
            console.error('Error al crear documento contractual:', docError);
            toast.warning(`Error al crear documento contractual "${docName}"`);
            // No interrumpimos el proceso si falla la creación de un documento
          }
        }
      } else {
        console.error('No se pudo obtener el ID del contrato creado:', createdContract)
      }

      // Resetear estados
      setNewContract({
        name: '',
        preContractualDocs: [],
        contractualDocs: [],
      })
      setDraftFile(null)
      setFileError(null)
      setObjetoContractual("")
      setDraftOption("file")
      setPreContractualSuggestions([])
      setContractualSuggestions([])

      // Cerrar modal
      setIsOpen(false)

      // Mostrar toast de éxito
      if (draftOption === "ai") {
        toast.success("🎉 ¡Contrato generado exitosamente con Inteligencia Artificial!", {
          description: "Su contrato ha sido creado y está listo para revisión.",
          duration: 5000,
        });
      } else {
        toast.success("✅ Contrato creado exitosamente");
      }

      // Llamar a la función onContractCreated si está definida
      onContractCreated?.()
    } catch (error) {
      console.error('Error al crear el contrato:', error);
      toast.error(error instanceof Error ? error.message : "No se pudo crear el contrato. Intente de nuevo más tarde.");
    } finally {
      setIsLoading(false);
      setIsGeneratingWithAI(false);
    }
  }

  const handleRemovePreContractualDoc = (index: number) => {
    setNewContract(prev => ({
      ...prev,
      preContractualDocs: prev.preContractualDocs.filter((_, i) => i !== index)
    }))
  }

  // Handler to remove a contractual document by index
  const handleRemoveContractualDoc = (index: number) => {
    setNewContract(prev => ({
      ...prev,
      contractualDocs: prev.contractualDocs.filter((_, i) => i !== index)
    }))
  }

  const handleAddPreContractualDoc = () => {
    if (newPreContractualDoc.trim()) {
      setNewContract(prev => ({
        ...prev,
        preContractualDocs: [...prev.preContractualDocs, newPreContractualDoc.trim()]
      }))
      setNewPreContractualDoc('')
      setPreContractualSuggestions([])
    }
  }

  const handleAddContractualDoc = () => {
    if (newContractualDoc.trim()) {
      setNewContract(prev => ({
        ...prev,
        contractualDocs: [...prev.contractualDocs, newContractualDoc.trim()]
      }))
      setNewContractualDoc('')
      setContractualSuggestions([])
    }
  }

  // Handler para seleccionar una sugerencia precontractual
  const handleSelectPreContractualSuggestion = (suggestion: string) => {
    setNewPreContractualDoc(suggestion)
    setPreContractualSuggestions([])
  }

  // Handler para seleccionar una sugerencia contractual
  const handleSelectContractualSuggestion = (suggestion: string) => {
    setNewContractualDoc(suggestion)
    setContractualSuggestions([])
  }

  return (
    <>
      <Button onClick={openCreateModal} className="flex items-center gap-2">
        <Plus className="h-4 w-4" /> Nuevo Contrato
      </Button>
      <Dialog open={isOpen} onOpenChange={closeCreateModal}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Contrato</DialogTitle>
            <DialogDescription>
              Complete los campos para crear un nuevo contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Nombre del contrato */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contractName" className="text-right">
                Nombre del Contrato
              </Label>
              <Input
                id="contractName"
                value={newContract.name}
                onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            {/* Opción para escoger entre subir archivo o usar IA */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Opción de Minuta</Label>
              <div className="col-span-3 flex gap-4">
                <Button
                  variant={draftOption === "file" ? "default" : "outline"}
                  onClick={() => setDraftOption("file")}
                >
                  Subir Archivo
                </Button>
                <Button
                  variant={draftOption === "ai" ? "default" : "outline"}
                  onClick={() => setDraftOption("ai")}
                  className="flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  Usar Inteligencia artificial
                </Button>
              </div>
            </div>

            {draftOption === "file" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Subir Minuta de Contrato</Label>
                <div className="col-span-3">
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setDraftFile(file)
                      setFileError(null) // Limpiar error previo al cambiar archivo
                    }}
                  />
                  {fileError && (
                    <p className="text-sm text-red-500 mt-1">{fileError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Tamaño máximo: {MAX_FILE_SIZE/1024/1024}MB
                  </p>
                </div>
              </div>
            )}

            {draftOption === "ai" && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">Objeto Contractual</Label>
                <div className="col-span-3">
                  <Textarea
                    value={objetoContractual}
                    onChange={(e) => setObjetoContractual(e.target.value)}
                    placeholder="Redacte aquí el objeto contractual que será procesado por la inteligencia artificial para generar el contrato completo..."
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La IA generará un contrato completo basado en este objeto contractual
                  </p>
                </div>
              </div>
            )}

            {/* Documentos Precontractuales */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Documentos Precontractuales</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2 relative">
                  <Input
                    value={newPreContractualDoc}
                    onChange={(e) => setNewPreContractualDoc(e.target.value)}
                    placeholder="Nombre del documento"
                  />
                  <Button onClick={handleAddPreContractualDoc}>Agregar</Button>
                  
                  {/* Dropdown de sugerencias para documentos precontractuales */}
                  {preContractualSuggestions.length > 0 ? (
                    <div 
                      ref={preContractualSuggestionsRef}
                      className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
                      style={{ width: 'calc(100% - 80px)' }}
                    >
                      {isLoadingPreSuggestions ? (
                        <div className="p-2 text-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          <span className="text-sm">Cargando sugerencias...</span>
                        </div>
                      ) : (
                        <ul>
                          {preContractualSuggestions.map((suggestion, index) => (
                            <li
                              key={index}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSelectPreContractualSuggestion(suggestion.name)}
                            >
                              {suggestion.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    isLoadingPreSuggestions && (
                      <div 
                        className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg p-2"
                        style={{ width: 'calc(100% - 80px)' }}
                      >
                        <div className="text-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          <span className="text-sm">Buscando sugerencias...</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <ul className="list-disc pl-5">
                  {newContract.preContractualDocs.map((doc, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span>{typeof doc === 'string' ? doc : doc.name}</span>
                      <Button variant="ghost" size="sm"  onClick={() => handleRemovePreContractualDoc(index)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Documentos Contractuales */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right">Documentos Contractuales</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2 relative">
                  <Input
                    value={newContractualDoc}
                    onChange={(e) => setNewContractualDoc(e.target.value)}
                    placeholder="Nombre del documento"
                  />
                  <Button onClick={handleAddContractualDoc}>Agregar</Button>
                  
                  {/* Dropdown de sugerencias para documentos contractuales */}
                  {contractualSuggestions.length > 0 ? (
                    <div 
                      ref={contractualSuggestionsRef}
                      className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
                      style={{ width: 'calc(100% - 80px)' }}
                    >
                      {isLoadingContractualSuggestions ? (
                        <div className="p-2 text-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          <span className="text-sm">Cargando sugerencias...</span>
                        </div>
                      ) : (
                        <ul>
                          {contractualSuggestions.map((suggestion, index) => (
                            <li
                              key={index}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSelectContractualSuggestion(suggestion.name)}
                            >
                              {suggestion.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    isLoadingContractualSuggestions && (
                      <div 
                        className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg p-2"
                        style={{ width: 'calc(100% - 80px)' }}
                      >
                        <div className="text-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          <span className="text-sm">Buscando sugerencias...</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <ul className="list-disc pl-5">
                  {newContract.contractualDocs.map((doc, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span>{typeof doc === 'string' ? doc : doc.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveContractualDoc(index)}>
                      <Trash2 className='h-4 w-4' />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {draftOption === "ai" ? "Generando contrato con IA..." : "Creando..."}
              </>
            ) : (
              'Crear Contrato'
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Overlay de loading para generación con IA */}
      {isGeneratingWithAI && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <TextShimmerWave 
              className="text-4xl font-bold text-white"
              duration={1.5}
              spread={0.8}
            >
              Generando Contrato con Inteligencia Artificial...
            </TextShimmerWave>
          </div>
        </div>
      )}
    </>
  )
}

