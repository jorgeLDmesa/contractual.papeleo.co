"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, Loader2, FileSignature, Trash2 } from "lucide-react"
import { toast } from "sonner"
import SignatureUploader from "./SignatureUploader"
import { deleteProjectSignature } from "../../actions/actionClient"
import { getProjectSignature, removeProjectSignature } from "../../actions/actionServer"

interface SignatureData {
  created_at: string
  signature_url: string
}

interface ProjectSignatureCardProps {
  initialSignatureData: SignatureData | null
  organizationId: string
  projectId: string
}

export default function ProjectSignatureCard({ 
  initialSignatureData,
  organizationId,
  projectId
}: ProjectSignatureCardProps) {
  const [signatureData, setSignatureData] = useState<SignatureData | null>(initialSignatureData)
  const [signatureExists, setSignatureExists] = useState<boolean>(false)
  const [isCheckingSignature, setIsCheckingSignature] = useState(true)
  const [signature, setSignature] = useState<string | null>(null)
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Check if signature exists when component mounts
  useEffect(() => {
    async function checkSignatureExists() {
      setIsCheckingSignature(true)
      try {
        // Get signature from database
        const signatureUrl = await getProjectSignature(projectId)
        
        if (signatureUrl) {
          setSignatureExists(true)
          setSignatureData({
            created_at: new Date().toISOString(), // We don't have exact creation date
            signature_url: signatureUrl
          })
        } else {
          setSignatureExists(false)
          setSignatureData(null)
        }
      } catch (error) {
        console.error("Error checking signature:", error)
        setSignatureExists(false)
        setSignatureData(null)
      } finally {
        setIsCheckingSignature(false)
      }
    }
    
    checkSignatureExists()
  }, [projectId])

  // Function to get the signature URL
  const getSignatureUrl = (): string | null => {
    if (!signatureData) return null
    return signatureData.signature_url
  }

  // Function to handle viewing the signature
  const handleViewSignature = () => {
    const url = getSignatureUrl()
    if (url) {
      // Open the signature in a new tab
      window.open(url, '_blank')
    } else {
      toast.error("No se pudo obtener la URL de la firma")
    }
  }

  // Function called when a signature is uploaded
  const onSignatureUploaded = (newData: SignatureData) => {
    setSignatureData(newData)
    setSignatureExists(true)
    setOpenSignatureDialog(false)
    toast.success("La firma se ha guardado correctamente")
  }

  // Function to delete the signature
  const handleDeleteSignature = async () => {
    if (!signatureExists || isDeleting) return
    
    setIsDeleting(true)
    try {
      // Delete from storage
      await deleteProjectSignature(projectId)
      
      // Remove from database
      await removeProjectSignature(projectId)
      
      // Update state
      setSignatureExists(false)
      setSignatureData(null)
      
      toast.success("La firma se ha eliminado correctamente")
    } catch (error) {
      console.error("Error deleting signature:", error)
      toast.error("No se pudo eliminar la firma")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Firma del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCheckingSignature ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : signatureExists ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Firma registrada</p>
                  <p className="text-xs text-muted-foreground">
                    {signatureData?.created_at ? new Date(signatureData.created_at).toLocaleDateString() : 'Fecha desconocida'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleViewSignature}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSignature}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <Dialog open={openSignatureDialog} onOpenChange={setOpenSignatureDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Actualizar firma
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Actualizar firma</DialogTitle>
                </DialogHeader>
                <SignatureUploader
                  signature={signature}
                  setSignature={setSignature}
                  organizationId={organizationId}
                  projectId={projectId}
                  onSignatureUploaded={onSignatureUploaded}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border border-dashed rounded-md bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No hay firma registrada para este proyecto
              </p>
              <p className="text-xs text-muted-foreground">
                Agrega una firma para utilizar en los documentos del proyecto
              </p>
            </div>
            
            <Dialog open={openSignatureDialog} onOpenChange={setOpenSignatureDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  Agregar firma
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar firma</DialogTitle>
                </DialogHeader>
                <SignatureUploader
                  signature={signature}
                  setSignature={setSignature}
                  organizationId={organizationId}
                  projectId={projectId}
                  onSignatureUploaded={onSignatureUploaded}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 