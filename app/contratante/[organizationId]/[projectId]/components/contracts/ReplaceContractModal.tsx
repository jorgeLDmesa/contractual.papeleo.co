"use client"

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { replaceContractDraftFile } from './actionClient'
import { updateContractDraftUrl } from '../../actions/actionServer'
import { Contract } from '../../types'

interface ReplaceContractModalProps {
  isOpen: boolean
  onClose: () => void
  contract: Contract
  onSuccess: (updatedContract: Contract) => void
}

export function ReplaceContractModal({ 
  isOpen, 
  onClose, 
  contract,
  onSuccess
}: ReplaceContractModalProps) {
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setDraftFile(file)
    setFileError(null)

    if (file && file.size > MAX_FILE_SIZE) {
      setFileError(`El archivo es demasiado grande. El límite es de ${MAX_FILE_SIZE/1024/1024}MB.`)
    }
  }

  const handleSubmit = async () => {
    if (!draftFile) {
      toast.error("Por favor, seleccione un archivo para reemplazar el contrato.")
      return
    }

    if (fileError) {
      toast.error(fileError)
      return
    }

    setIsLoading(true)

    try {
      // Utilizamos la nueva función que reemplaza el archivo antiguo por el nuevo
      const uploadResult = await replaceContractDraftFile(
        draftFile,
        contract.contractDraftUrl || '',
        contract.projectId,
        contract.name
      )

      if (uploadResult.error) {
        toast.error(`Error al subir el archivo: ${uploadResult.error}`)
        return
      }

      if (!uploadResult.filePath) {
        toast.error("No se pudo obtener la ruta del archivo subido.")
        return
      }

      // Update the contract with the new file path using server action
      const updatedContract = await updateContractDraftUrl(contract.id, uploadResult.filePath)

      toast.success("Se ha reemplazado el contrato correctamente.")

      onSuccess(updatedContract)
      onClose()
    } catch (error) {
      console.error("Error al reemplazar el contrato:", error)
      const errorMessage = error instanceof Error ? error.message : 'No se pudo reemplazar el contrato. Intente de nuevo más tarde.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reemplazar Contrato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm">
            ¿Está seguro que desea reemplazar el contrato actual? Esta acción no se puede deshacer.
          </p>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Nuevo Contrato</Label>
            <div className="col-span-3">
              <Input
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              {fileError && (
                <p className="text-sm text-red-500 mt-1">{fileError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Tamaño máximo: {MAX_FILE_SIZE/1024/1024}MB
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !draftFile || !!fileError}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reemplazando...
              </>
            ) : (
              'Reemplazar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 