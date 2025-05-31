"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchContratanteData, saveContratanteData } from "../../actions/actionClient"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { isEqual } from "lodash"

interface ContratanteDataCardProps {
  organizationId: string
  projectId: string
}

export default function ContratanteDataCard({ organizationId, projectId }: ContratanteDataCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [originalData, setOriginalData] = useState<Record<string, string> | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({
    "NIT DEL CONTRATANTE": "",
    "NOMBRE DEL CONTRATANTE": "",
    "DIRECCIÓN DEL CONTRATANTE": "",
    "NOMBRE REPRESENTANTE LEGAL": "",
    "IDENTIFICACIÓN REPRESENTANTE LEGAL": ""
  })
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchContratanteData(projectId)
        if (data) {
          setFormData(data)
          setOriginalData(data)
        }
      } catch (error) {
        console.error("Error loading contratante data:", error)
        toast.error("No se pudieron cargar los datos del contratante")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [projectId])

  // Check for changes whenever formData changes
  useEffect(() => {
    if (originalData) {
      setHasChanges(!isEqual(formData, originalData))
    }
  }, [formData, originalData])

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      
      // Save the data without revalidating the path
      const result = await saveContratanteData(projectId, formData)
      
      if (result.success) {
        // Update the original data to match the current data after successful save
        setOriginalData(formData)
        setHasChanges(false)
        
        toast.success("Datos del contratante actualizados correctamente")
      } else {
        throw new Error("Error al guardar los datos")
      }
    } catch (error) {
      console.error("Error saving contratante data:", error)
      toast.error("No se pudieron guardar los datos del contratante")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del Contratante</CardTitle>
        <CardDescription>
          Información del contratante para el contrato
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key}</Label>
                <Input
                  id={key}
                  value={value}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={`Ingrese ${key.toLowerCase()}`}
                />
              </div>
            ))}
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Datos"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
} 