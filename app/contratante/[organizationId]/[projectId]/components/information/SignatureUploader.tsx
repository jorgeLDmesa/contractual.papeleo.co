"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import SignaturePad from "react-signature-canvas"
import { uploadSignatureFromDataURL, uploadProjectSignature } from "../../actions/actionClient"
import { updateProjectSignature } from "../../actions/actionServer"

interface SignatureUploaderProps {
  signature: string | null
  setSignature: (signature: string | null) => void
  organizationId: string
  projectId: string
  onSignatureUploaded: (data: { created_at: string; signature_url: string }) => void
}

export default function SignatureUploader({
  signature,
  setSignature,
  organizationId,
  projectId,
  onSignatureUploaded
}: SignatureUploaderProps) {
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearSignature = () => {
    if (signaturePad) {
      signaturePad.clear()
      setSignature(null)
    }
  }

  const handleSaveSignature = async () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      toast.error("Por favor dibuja tu firma antes de guardar")
      return
    }

    // Obtener la imagen como PNG
    const dataURL = signaturePad.toDataURL("image/png")
    setSignature(dataURL)

    await uploadDrawnSignature(dataURL)
  }

  const uploadDrawnSignature = async (dataURL: string) => {
    setIsUploading(true)
    try {
      // Use our new action method to upload the signature
      const publicUrl = await uploadSignatureFromDataURL(projectId, dataURL)
      
      // Update the signature in the database
      await updateProjectSignature(projectId, publicUrl)
      
      // Notify that the signature was uploaded
      onSignatureUploaded({
        created_at: new Date().toISOString(),
        signature_url: publicUrl
      })
      
      toast.success("Tu firma ha sido guardada correctamente")
      
    } catch (error) {
      console.error("Error al guardar la firma:", error)
      toast.error("No se pudo guardar tu firma. Inténtalo de nuevo.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error("Por favor sube una imagen JPG, PNG o GIF")
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB")
      return
    }
    
    setIsUploading(true)
    try {
      // Use our new action method to upload the file
      const publicUrl = await uploadProjectSignature(projectId, file)
      
      // Update the signature in the database
      await updateProjectSignature(projectId, publicUrl)
      
      // Notify that the signature was uploaded
      onSignatureUploaded({
        created_at: new Date().toISOString(),
        signature_url: publicUrl
      })
      
      toast.success("Tu firma ha sido subida correctamente")
      
    } catch (error) {
      console.error("Error al subir la firma:", error)
      toast.error("No se pudo subir tu firma. Inténtalo de nuevo.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 flex-1 text-center ${activeTab === 'draw' ? 'bg-primary/10 font-medium' : ''}`}
            onClick={() => setActiveTab('draw')}
          >
            Dibujar firma
          </button>
          <button
            className={`px-4 py-2 flex-1 text-center ${activeTab === 'upload' ? 'bg-primary/10 font-medium' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Subir imagen
          </button>
        </div>
        
        {activeTab === 'draw' && (
          <div className="p-4">
            <div className="border rounded-md mb-3 bg-white">
              <SignaturePad
                ref={(ref) => setSignaturePad(ref)}
                canvasProps={{
                  className: "w-full h-48 cursor-crosshair"
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearSignature}
                disabled={isUploading}
              >
                Limpiar
              </Button>
              
              <Button
                onClick={handleSaveSignature}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar firma"
                )}
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'upload' && (
          <div className="p-4">
            <div className="border border-dashed rounded-md p-6 mb-3 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6" />
                    <span>Haz clic para seleccionar una imagen</span>
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground mt-2">
                Formatos: JPG, PNG, GIF (máx. 5MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 