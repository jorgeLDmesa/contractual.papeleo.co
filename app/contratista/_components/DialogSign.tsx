"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
// Import actions from actionClient.ts
import { 
  UserDocument, 
  loadUserData, 
  updateUserData as updateUserDataAction, 
  handleContractSigning, 
  hasDataChanges 
} from "../actions/actionClient"
// Import local handlePreviewMemberDocument function
import { handlePreviewMemberDocument } from "../actions/actionClient"

interface ContractDialogProps {
  contract_draft_url: string
  children: React.ReactNode
  user_id: string
  contractMemberId: string
  onSignSuccess?: () => void
}

export default function ContractDialog({ contract_draft_url, children, user_id, contractMemberId, onSignSuccess }: ContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSignOption, setShowSignOption] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // User data management
  const [userData, setUserData] = useState<UserDocument>({
    NOMBRE: "",
    TELEFONO: "",
    DIRECCIÓN: "",
    IDENTIFICACIÓN: ""
  })
  const [originalData, setOriginalData] = useState<UserDocument | null>(null)
  const [userSignature, setUserSignature] = useState<string | null>(null)
  const [dataConfirmed, setDataConfirmed] = useState(false)
  const [formData, setFormData] = useState<UserDocument>({
    NOMBRE: "",
    TELEFONO: "",
    DIRECCIÓN: "",
    IDENTIFICACIÓN: ""
  })
  const [hasChanges, setHasChanges] = useState(false)
  
  // Check for changes when formData changes
  useEffect(() => {
    setHasChanges(hasDataChanges(formData, originalData));
  }, [formData, originalData])

  // Load user data
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const result = await loadUserData(user_id);
      
      if (result.userData) {
        setUserData(result.userData);
        setFormData(result.userData);
        setOriginalData(result.userData);
        setUserSignature(result.userSignature);
        
        if (result.isDataComplete) {
          setDataConfirmed(true);
        }
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data
  const updateUserData = async () => {
    setIsSaving(true);
    try {
      const result = await updateUserDataAction(user_id, formData);
      
      if (result.success) {
        // Update local data
        setUserData(formData);
        setOriginalData(formData);
        setHasChanges(false);
        
        if (result.isDataComplete) {
          setDataConfirmed(true);
        }
      }
    } catch (error) {
      console.error("Error in updateUserData:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDocument = async () => {
    if (contract_draft_url) {
      // Check for two different cases:
      // 1. URL starts with https://papeleo.co/docgen/ (template-generated)
      // 2. URL starts with http or https but is not a template URL (could be a full signed URL)
      // 3. Anything else is likely a relative path in the bucket
      const templateRegex = /^https:\/\/papeleo\.co\/docgen\//;
      
      // Process URL to remove any appended contractMemberId if it's present
      // This helps avoid the common error when contractMemberId is appended to the path
      let urlToUse = contract_draft_url;
      
      // Remove the contractMemberId from the URL if it appears to be appended
      if (!urlToUse.startsWith("http") && urlToUse.includes(contractMemberId)) {
        const parts = urlToUse.split('/');
        // If the last segment matches the contractMemberId, remove it
        if (parts[parts.length - 1] === contractMemberId) {
          urlToUse = parts.slice(0, -1).join('/');
          console.log("Removing appended contractMemberId from path:", urlToUse);
        }
      }
      
      if (templateRegex.test(urlToUse)) {
        // Case 1: Template-generated documents open directly
        window.open(urlToUse, "_blank");
      } else if (urlToUse.startsWith("http")) {
        // Case 2: Other HTTP URLs, use the preview handler which will create a signed URL
        try {
          await handlePreviewMemberDocument(urlToUse);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Error al previsualizar el documento');
        }
      } else {
        // Case 3: It's likely a relative path in the storage bucket
        console.log("Handling relative path in storage bucket:", urlToUse);
        try {
          await handlePreviewMemberDocument(urlToUse);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Error al previsualizar el documento');
        }
      }

      // Load user data when showing sign option
      fetchUserData();
      setTimeout(() => setShowSignOption(true), 500);
    }
  };

  const handleSign = async () => {
    if (acceptedTerms && dataConfirmed) {
      setIsSigning(true);

      try {
        // Use the handleContractSigning function from actionClient.ts with contractMemberId
        const result = await handleContractSigning(
          contractMemberId,
          user_id,
          contract_draft_url,
          userData,
          userSignature
        );
        
        setIsSigning(false);
        
        if (result.success) {
          toast.success(result.message);
          setIsOpen(false);
          
          // Call the onSignSuccess callback if provided
          if (onSignSuccess) {
            onSignSuccess();
          }
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Error in handleSign:", error);
        toast.error("Ocurrió un error inesperado durante el proceso de firma");
        setIsSigning(false);
      }
    } else if (!dataConfirmed) {
      toast.error("Debe confirmar sus datos personales antes de firmar");
    }
  };

  // Handle form input changes
  const handleInputChange = (key: keyof UserDocument, value: string) => {
    setFormData((prev: UserDocument) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contrato de Servicios</DialogTitle>
          <DialogDescription>
            Por favor, revise y firme el contrato para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <Button onClick={handleViewDocument}>Ver Contrato</Button>
          
          {showSignOption && !dataConfirmed && (
            <Card className="p-4 mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {formData.NOMBRE ? "Confirme sus datos personales" : "Complete sus datos personales"}
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    value={formData.NOMBRE}
                    onChange={(e) => handleInputChange("NOMBRE", e.target.value)}
                    placeholder="Ingrese su nombre completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="identificacion">Número de identificación</Label>
                  <Input
                    id="identificacion"
                    value={formData.IDENTIFICACIÓN}
                    onChange={(e) => handleInputChange("IDENTIFICACIÓN", e.target.value)}
                    placeholder="Ingrese su número de identificación"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.DIRECCIÓN}
                    onChange={(e) => handleInputChange("DIRECCIÓN", e.target.value)}
                    placeholder="Ingrese su dirección"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.TELEFONO}
                    onChange={(e) => handleInputChange("TELEFONO", e.target.value)}
                    placeholder="Ingrese su teléfono"
                  />
                </div>
                
                <Button 
                  onClick={updateUserData} 
                  disabled={isSaving || !hasChanges}
                  className="w-full mt-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : "Guardar Datos"}
                </Button>
              </div>
            </Card>
          )}
          
          {showSignOption && dataConfirmed && ( 
            <>
              <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                <p className="text-sm text-muted-foreground">
                  Resumen del contrato: Este contrato establece los términos y condiciones de nuestros servicios. 
                  Al firmar, usted acepta cumplir con todas las cláusulas detalladas en el documento completo que ha revisado.
                </p>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setAcceptedTerms(checked);
                    }
                  }}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Confirmo que he leído y entendido los términos del contrato
                </label>
              </div>
              <Button onClick={handleSign} disabled={!acceptedTerms || isSigning}>
                {isSigning ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Verificando antecedentes, tomará unos segundos...
                  </>
                ) : "FIRMAR"}
              </Button>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <p>
                  Al hacer clic en FIRMAR, usted está aceptando legalmente los términos y condiciones establecidos en este contrato.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 