// CreateContractModal.tsx
"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import { 
  getDocumentSuggestions, 
  DocumentSuggestion,
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

  // Estados para el foco de los inputs
  const [isPreContractualInputFocused, setIsPreContractualInputFocused] = useState(false)
  const [isContractualInputFocused, setIsContractualInputFocused] = useState(false)

  // Estado para sugerencias de documentos
  const [preContractualSuggestions, setPreContractualSuggestions] = useState<DocumentSuggestion[]>([])
  const [contractualSuggestions, setContractualSuggestions] = useState<DocumentSuggestion[]>([])
  const [isLoadingPreSuggestions, setIsLoadingPreSuggestions] = useState(false)
  const [isLoadingContractualSuggestions, setIsLoadingContractualSuggestions] = useState(false)

  // Referencias para los contenedores de sugerencias
  const preContractualSuggestionsRef = useRef<HTMLDivElement>(null)
  const contractualSuggestionsRef = useRef<HTMLDivElement>(null)
  const preContractualInputRef = useRef<HTMLInputElement>(null)
  const contractualInputRef = useRef<HTMLInputElement>(null)

  // Estado para archivo (opción "Subir Archivo")
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
  
  // Estados para la opción de usar IA
  const [draftOption, setDraftOption] = useState<"file" | "ai">("file")
  const [objetoContractual, setObjetoContractual] = useState<string>("")

  // Función para limpiar estados
  const resetStates = useCallback(() => {
    setNewContract({
      name: '',
      preContractualDocs: [],
      contractualDocs: [],
    })
    setNewPreContractualDoc('')
    setNewContractualDoc('')
    setPreContractualSuggestions([])
    setContractualSuggestions([])
    setIsLoadingPreSuggestions(false)
    setIsLoadingContractualSuggestions(false)
    setIsPreContractualInputFocused(false)
    setIsContractualInputFocused(false)
    setDraftFile(null)
    setFileError(null)
    setObjetoContractual("")
    setDraftOption("file")
  }, [])

  const openCreateModal = () => setIsOpen(true)
  const closeCreateModal = () => {
    if (isGeneratingWithAI) return // No permitir cerrar mientras se genera con IA
    setIsOpen(false)
    resetStates()
  }

  // Funciones debounced memoizadas
  const fetchPreContractualSuggestions = useMemo(
    () => debounce(async (search: string) => {
      if (search.length < 2 || !isPreContractualInputFocused) {
        setPreContractualSuggestions([]);
        setIsLoadingPreSuggestions(false);
        return;
      }
      
      setIsLoadingPreSuggestions(true);
      try {
        const suggestions = await getDocumentSuggestions(search, 'precontractual');
        
        // Solo actualizar si el input sigue enfocado
        if (isPreContractualInputFocused) {
          setPreContractualSuggestions(suggestions);
        }
      } catch {
        if (isPreContractualInputFocused) {
          toast.warning("No se pudieron cargar sugerencias. Por favor, continúe escribiendo manualmente.");
        }
      } finally {
        setIsLoadingPreSuggestions(false);
      }
    }, 500), // Aumenté el debounce a 500ms
    [isPreContractualInputFocused]
  );

  const fetchContractualSuggestions = useMemo(
    () => debounce(async (search: string) => {
      if (search.length < 2 || !isContractualInputFocused) {
        setContractualSuggestions([]);
        setIsLoadingContractualSuggestions(false);
        return;
      }
      
      setIsLoadingContractualSuggestions(true);
      try {
        const suggestions = await getDocumentSuggestions(search, 'contractual');
        
        // Solo actualizar si el input sigue enfocado
        if (isContractualInputFocused) {
          setContractualSuggestions(suggestions);
        }
      } catch {
        if (isContractualInputFocused) {
          toast.warning("No se pudieron cargar sugerencias. Por favor, continúe escribiendo manualmente.");
        }
      } finally {
        setIsLoadingContractualSuggestions(false);
      }
    }, 500), // Aumenté el debounce a 500ms
    [isContractualInputFocused]
  );

  // Cleanup de las funciones debounced
  useEffect(() => {
    return () => {
      fetchPreContractualSuggestions.cancel();
      fetchContractualSuggestions.cancel();
    };
  }, [fetchPreContractualSuggestions, fetchContractualSuggestions]);

  // Event listener para cerrar las sugerencias al hacer clic fuera de ellas
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Manejar sugerencias precontractuales
      if (
        preContractualSuggestionsRef.current && 
        !preContractualSuggestionsRef.current.contains(target) &&
        preContractualInputRef.current &&
        !preContractualInputRef.current.contains(target)
      ) {
        setPreContractualSuggestions([]);
        setIsPreContractualInputFocused(false);
      }
      
      // Manejar sugerencias contractuales
      if (
        contractualSuggestionsRef.current && 
        !contractualSuggestionsRef.current.contains(target) &&
        contractualInputRef.current &&
        !contractualInputRef.current.contains(target)
      ) {
        setContractualSuggestions([]);
        setIsContractualInputFocused(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Solo buscar sugerencias cuando el input está enfocado y tiene contenido
  useEffect(() => {
    if (isPreContractualInputFocused && newPreContractualDoc.length >= 2) {
      fetchPreContractualSuggestions(newPreContractualDoc);
    } else if (!isPreContractualInputFocused) {
      setPreContractualSuggestions([]);
      setIsLoadingPreSuggestions(false);
    }
  }, [newPreContractualDoc, isPreContractualInputFocused, fetchPreContractualSuggestions]);

  useEffect(() => {
    if (isContractualInputFocused && newContractualDoc.length >= 2) {
      fetchContractualSuggestions(newContractualDoc);
    } else if (!isContractualInputFocused) {
      setContractualSuggestions([]);
      setIsLoadingContractualSuggestions(false);
    }
  }, [newContractualDoc, isContractualInputFocused, fetchContractualSuggestions]);

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
      const createdContract = await createContract(formData)

      // Crear los documentos requeridos después de crear el contrato exitosamente
      if (createdContract.id) {
        
        // Crear documentos precontractuales
        for (const doc of newContract.preContractualDocs) {
          const docName = typeof doc === 'string' ? doc : doc.name;
          const templateId = typeof doc === 'object' && doc.template ? doc.template : undefined;
          
          try {
            const result = await addDocument(createdContract.id, docName, 'precontractual', undefined, templateId);
            
            if (!result.success) {
              toast.warning(`No se pudo crear el documento precontractual "${docName}": ${result.error}`);
            }
          } catch {
            toast.warning(`Error al crear documento precontractual "${docName}"`);
            // No interrumpimos el proceso si falla la creación de un documento
          }
        }

        // Crear documentos contractuales
        for (const doc of newContract.contractualDocs) {
          const docName = typeof doc === 'string' ? doc : doc.name;
          const templateId = typeof doc === 'object' && doc.template ? doc.template : undefined;
          
          try {
            const result = await addDocument(createdContract.id, docName, 'contractual', undefined, templateId);
            
            if (!result.success) {
              toast.warning(`No se pudo crear el documento contractual "${docName}": ${result.error}`);
            }
          } catch {
            toast.warning(`Error al crear documento contractual "${docName}"`);
            // No interrumpimos el proceso si falla la creación de un documento
          }
        }
      }

      // Resetear estados
      resetStates()

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
      setIsPreContractualInputFocused(false)
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
      setIsContractualInputFocused(false)
    }
  }

  // Handler para seleccionar una sugerencia precontractual
  const handleSelectPreContractualSuggestion = (suggestion: string) => {
    setNewPreContractualDoc(suggestion)
    setPreContractualSuggestions([])
    setIsPreContractualInputFocused(false)
  }

  // Handler para seleccionar una sugerencia contractual
  const handleSelectContractualSuggestion = (suggestion: string) => {
    setNewContractualDoc(suggestion)
    setContractualSuggestions([])
    setIsContractualInputFocused(false)
  }

  // Handlers para el foco de inputs
  const handlePreContractualInputFocus = () => {
    setIsPreContractualInputFocused(true)
  }

  const handleContractualInputFocus = () => {
    setIsContractualInputFocused(true)
  }

  // Mostrar sugerencias solo si hay contenido, el input está enfocado y hay sugerencias
  const shouldShowPreContractualSuggestions = isPreContractualInputFocused && 
    (preContractualSuggestions.length > 0 || isLoadingPreSuggestions) && 
    newPreContractualDoc.length >= 2

  const shouldShowContractualSuggestions = isContractualInputFocused && 
    (contractualSuggestions.length > 0 || isLoadingContractualSuggestions) && 
    newContractualDoc.length >= 2

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
                    ref={preContractualInputRef}
                    value={newPreContractualDoc}
                    onChange={(e) => setNewPreContractualDoc(e.target.value)}
                    onFocus={handlePreContractualInputFocus}
                    placeholder="Nombre del documento"
                  />
                  <Button onClick={handleAddPreContractualDoc}>Agregar</Button>
                  
                  {/* Dropdown de sugerencias para documentos precontractuales */}
                  {shouldShowPreContractualSuggestions && (
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
                      ) : preContractualSuggestions.length > 0 ? (
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
                      ) : null}
                    </div>
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
                    ref={contractualInputRef}
                    value={newContractualDoc}
                    onChange={(e) => setNewContractualDoc(e.target.value)}
                    onFocus={handleContractualInputFocus}
                    placeholder="Nombre del documento"
                  />
                  <Button onClick={handleAddContractualDoc}>Agregar</Button>
                  
                  {/* Dropdown de sugerencias para documentos contractuales */}
                  {shouldShowContractualSuggestions && (
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
                      ) : contractualSuggestions.length > 0 ? (
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
                      ) : null}
                    </div>
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

