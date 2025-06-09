import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Trash2, Plus } from "lucide-react";
import { 
  fetchContractDocuments, 
  updateDocumentName, 
  deleteDocument, 
  addDocument,
  getDocumentSuggestions
} from "./actionClient";
import { Contract } from "../../types";

interface EditContractDocumentsProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
}

type Document = {
  id: string;
  contract_id: string;
  name: string;
  type: string;
  due_date?: string;
  template_id?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export function EditContractDocuments({ isOpen, onClose, contract }: EditContractDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'precontractual' | 'contractual'>('precontractual');
  
  // States for adding new document
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<'precontractual' | 'contractual'>('precontractual');
  const [suggestions, setSuggestions] = useState<{name: string; count: number}[]>([]);
  
  // States for editing document
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editDocumentName, setEditDocumentName] = useState('');

  useEffect(() => {
    if (isOpen && contract) {
      loadDocuments();
    }
  }, [isOpen, contract]);

  useEffect(() => {
    if (newDocumentName.length >= 2) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [newDocumentName, documentType]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchContractDocuments(contract.id);
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Ocurrió un error al cargar los documentos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const suggestions = await getDocumentSuggestions(newDocumentName, documentType);
      setSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim()) {
      toast.error("El nombre del documento es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const { success, data, error } = await addDocument(
        contract.id, 
        newDocumentName, 
        documentType,
        undefined // Pass undefined instead of null for due date
      );

      if (!success || !data) {
        throw new Error(error || "Error al añadir el documento");
      }

      setDocuments(prev => [...prev, data]);
      setNewDocumentName('');
      setIsAddingDocument(false);
      
      toast.success("Documento añadido correctamente");
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Ocurrió un error al añadir el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("¿Estás seguro que deseas eliminar este documento?")) {
      return;
    }

    setIsLoading(true);
    try {
      const { success, error } = await deleteDocument(documentId);

      if (!success) {
        throw new Error(error || "Error al eliminar el documento");
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast.success("Documento eliminado correctamente");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Ocurrió un error al eliminar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingDocument = (document: Document) => {
    setEditingDocumentId(document.id);
    setEditDocumentName(document.name);
  };

  const cancelEditing = () => {
    setEditingDocumentId(null);
    setEditDocumentName('');
  };

  const handleUpdateDocumentName = async () => {
    if (!editingDocumentId || !editDocumentName.trim()) {
      toast.error("El nombre del documento es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const { success, data, error } = await updateDocumentName(editingDocumentId, editDocumentName);

      if (!success || !data) {
        throw new Error(error || "Error al actualizar el documento");
      }

      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocumentId ? { ...doc, name: editDocumentName } : doc
      ));
      
      cancelEditing();
      
      toast.success("Documento actualizado correctamente");
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Ocurrió un error al actualizar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => doc.type === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Documentos del contrato: {contract.name}</DialogTitle>
        </DialogHeader>

        <Tabs 
          defaultValue="precontractual" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'precontractual' | 'contractual')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="precontractual">Precontractuales</TabsTrigger>
            <TabsTrigger value="contractual">Contractuales</TabsTrigger>
          </TabsList>
          
          <TabsContent value="precontractual" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Documentos Precontractuales</h3>
              <Button 
                size="sm" 
                onClick={() => {
                  setIsAddingDocument(true);
                  setDocumentType('precontractual');
                }}
                disabled={isAddingDocument || isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Documento
              </Button>
            </div>
            
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay documentos precontractuales
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          {editingDocumentId === doc.id ? (
                            <div className="flex space-x-2">
                              <Input 
                                value={editDocumentName} 
                                onChange={(e) => setEditDocumentName(e.target.value)}
                                size={30}
                              />
                              <Button 
                                size="sm" 
                                onClick={handleUpdateDocumentName} 
                                disabled={isLoading}
                              >
                                Guardar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={cancelEditing} 
                                disabled={isLoading}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            doc.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingDocumentId !== doc.id && (
                            <div className="flex space-x-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => startEditingDocument(doc)} 
                                disabled={isLoading || editingDocumentId !== null}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDeleteDocument(doc.id)} 
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="contractual" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Documentos Contractuales</h3>
              <Button 
                size="sm" 
                onClick={() => {
                  setIsAddingDocument(true);
                  setDocumentType('contractual');
                }}
                disabled={isAddingDocument || isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Documento
              </Button>
            </div>
            
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay documentos contractuales
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          {editingDocumentId === doc.id ? (
                            <div className="flex space-x-2">
                              <Input 
                                value={editDocumentName} 
                                onChange={(e) => setEditDocumentName(e.target.value)}
                                size={30}
                              />
                              <Button 
                                size="sm" 
                                onClick={handleUpdateDocumentName} 
                                disabled={isLoading}
                              >
                                Guardar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={cancelEditing} 
                                disabled={isLoading}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            doc.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingDocumentId !== doc.id && (
                            <div className="flex space-x-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => startEditingDocument(doc)} 
                                disabled={isLoading || editingDocumentId !== null}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDeleteDocument(doc.id)} 
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {isAddingDocument && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="text-sm font-medium mb-3">Añadir nuevo documento {documentType}</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documentName" className="text-right">
                  Nombre
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="documentName"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    placeholder="Nombre del documento"
                    required
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-accent cursor-pointer"
                          onClick={() => {
                            setNewDocumentName(suggestion.name);
                            setSuggestions([]);
                          }}
                        >
                          {suggestion.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingDocument(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddDocument}
                  disabled={isLoading || !newDocumentName.trim()}
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 