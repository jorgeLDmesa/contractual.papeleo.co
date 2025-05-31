import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DialogDescription } from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Calendar } from "@/components/ui/calendar"
import { es } from 'date-fns/locale'
import { processContractDocument, checkUserExists } from '../../actions/actionClient'
import { fetchContractsByProjectId, fetchAllUsers, sendContractInvitation } from '../../actions/actionServer'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

interface CreateInvitationModalProps {
  selectedProject: any
  onInvitationCreated?: () => void
}

// Nota: No definimos las interfaces User y Contract aquí, usamos las globales
export function CreateInvitationModal({ selectedProject, onInvitationCreated }: CreateInvitationModalProps) {
  // Estado del modal
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados del formulario
  const [value, setValue] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  
  // Estado para el correo electrónico y su validación
  const [email, setEmail] = useState("")
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null)
  
  // Estados locales
  const [newInvitationContract, setNewInvitationContract] = useState<any>(null)
  const [projectContracts, setProjectContracts] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const [users, contracts] = await Promise.all([
          fetchAllUsers(),
          selectedProject ? fetchContractsByProjectId(selectedProject.id) : Promise.resolve([])
        ])
        setAllUsers(users)
        setProjectContracts(contracts)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [selectedProject])
  
  // Validar email cuando cambia
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setIsEmailValid(null)
      return
    }
    
    const checkEmail = async () => {
      setIsCheckingEmail(true)
      try {
        const user = await checkUserExists(email)
        setIsEmailValid(!!user)
        
        if (!user) {
          toast.error("El usuario no está registrado en la plataforma")
        }
      } catch (error) {
        console.error("Error checking email:", error)
        setIsEmailValid(false)
      } finally {
        setIsCheckingEmail(false)
      }
    }
    
    const timeoutId = setTimeout(checkEmail, 500)
    return () => clearTimeout(timeoutId)
  }, [email])

  // Manejar el envío del formulario
  const onSubmit = async () => {
    setIsLoading(true)
    try {
      // Validaciones
      if (!isEmailValid) throw new Error("Debe ingresar un correo electrónico válido de un usuario registrado")
      
      // Buscar el usuario por email
      const user = allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())
      if (!user) throw new Error("No se encontró el usuario con el correo proporcionado")
      
      if (!newInvitationContract) throw new Error("Debe seleccionar un contrato")
      if (!selectedProject) throw new Error("No hay proyecto seleccionado")
      if (!startDate) throw new Error("Debe seleccionar una fecha de inicio")
      if (!endDate) throw new Error("Debe seleccionar una fecha de terminación")
      
      // 1. Enviar invitación para crear miembro del contrato
      await sendContractInvitation(
        user, 
        selectedProject, 
        newInvitationContract, 
        value,
        startDate,
        endDate
      )
      
      // 2. Procesar documento del contrato si es necesario
      if (user.id && newInvitationContract.id && value) {
        const success = await processContractDocument(
          user.id,
          newInvitationContract.id,
          value,
          endDate,
          selectedProject.id
        )
        
        if (!success) {
          console.warn("Processed contract document with some issues");
        }
      }
      
      // 3. Actualizar documentos del proyecto
      await fetchContractsByProjectId(selectedProject.id)
      
      // 4. Limpiar el formulario
      setEmail("")
      setValue("")
      setStartDate(undefined)
      setEndDate(undefined)
      setIsEmailValid(null)
      
      // 5. Cerrar modal
      setOpen(false)
      
      // 6. Notificar éxito
      toast.success("La invitación ha sido enviada exitosamente")

      if (onInvitationCreated) {
        onInvitationCreated()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar la invitación")
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar el cambio de contrato seleccionado
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contract = projectContracts.find((contract) => contract.id === e.target.value)
    if (contract) {
      setNewInvitationContract(contract)
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Invitar Usuario
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[50vw] sm:max-w-none max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
            <DialogDescription>
              Complete el siguiente formulario para enviar una invitación a un usuario.
            </DialogDescription>
          </DialogHeader>
          
          {projectContracts.length === 0 ? (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded">
              <p>
                No hay contratos en este proyecto. Debe crear un contrato para poder enviar una invitación.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Correo del Usuario */}
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Ingrese la dirección de correo electrónico del usuario al que se asignará este contrato
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={isEmailValid === false ? "border-red-500" : ""}
                    required
                  />
                  {isEmailValid === false && (
                    <p className="text-sm text-red-500">Este usuario no está registrado</p>
                  )}
                  {isCheckingEmail && (
                    <p className="text-sm text-gray-500">Verificando correo electrónico...</p>
                  )}
                </div>
                
                {/* Contrato */}
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="inviteContract">Contrato</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Seleccione el contrato al que se vinculará el usuario
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <select
                    id="inviteContract"
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                  >
                    <option value="">Seleccione un contrato</option>
                    {projectContracts.map(contract => (
                      <option key={contract.id} value={contract.id}>{contract.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Valor */}
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="value">Valor</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Ingrese el valor del contrato para este usuario
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    id="value"
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="p-2 border rounded w-full"
                    placeholder="Ingrese el valor"
                  />
                </div>
                
                {/* Fechas del Contrato */}
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dates">Fechas del Contrato</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Seleccione las fechas de inicio y finalización del contrato
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Fecha de Inicio</p>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => setStartDate(date)}
                        initialFocus
                        locale={es}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Fecha de Terminación</p>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => setEndDate(date)}
                        initialFocus
                        locale={es}
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={onSubmit} 
                  disabled={isLoading || isCheckingEmail || isEmailValid === false}
                >
                  {isLoading ? "Enviando..." : "Enviar Invitación"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
