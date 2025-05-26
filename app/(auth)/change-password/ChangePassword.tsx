'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { ShaderGradient, ShaderGradientCanvas } from 'shadergradient'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

export default function ChangePassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidResetFlow, setIsValidResetFlow] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario viene de un magic link de restablecimiento
    const checkSession = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        // Verificar si hay un hash en la URL (indica magic link)
        const hasHashParams = window.location.hash && 
                             (window.location.hash.includes('access_token') || 
                              window.location.hash.includes('type=recovery'))
        
        // Obtener la sesión actual
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setUserEmail(session.user.email || '')
          // Si tiene sesión y hay parámetros de hash, es un flujo válido de restablecimiento
          if (hasHashParams) {
            setIsValidResetFlow(true)
          } else {
            // El usuario ya está autenticado pero no viene de un flujo de restablecimiento
            setIsValidResetFlow(true) // Permitimos de todas formas cambiar contraseña si ya está autenticado
          }
        } else if (hasHashParams) {
          // Intentar procesar el hash de la URL (magic link)
          const { data, error } = await supabase.auth.getUser()
          if (error) {
            setError('El enlace de restablecimiento no es válido o ha expirado.')
            setIsValidResetFlow(false)
          } else if (data.user) {
            setUserEmail(data.user.email || '')
            setIsValidResetFlow(true)
          }
        } else {
          // No hay sesión ni hash, redirigir al login
          toast.error("Acceso no autorizado",{
            description: "Debes iniciar sesión o usar un enlace válido de restablecimiento"
          })
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } catch (err) {
        setError('Error al verificar la sesión')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSession()
  }, [router])

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const handleOpenDialog = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password) {
      setError('Por favor, ingresa una nueva contraseña')
      return
    }
    setError('')
    setShowDialog(true)
  }

  const handleChangePassword = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        setError(error.message)
        setShowDialog(false)
      } else {
        setSuccess(true)
        toast.success("Contraseña actualizada",{
          description: "Tu contraseña ha sido actualizada correctamente"
        })
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
    } catch (err) {
      setError('Error al cambiar la contraseña')
      setShowDialog(false)
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* ShaderGradient Background */}
      {/* <div className="fixed inset-0 z-0">
        <ShaderGradientCanvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <ShaderGradient
            animate="on"
            grain="on"
            cameraZoom={1}
            cDistance={6}
            color1="#f8fafc"
            color2="#e2e8f0"
            color3="#cbd5e1"
          />
        </ShaderGradientCanvas>
      </div> */}

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cambia tu contraseña
          </h2>
          {userEmail && isValidResetFlow && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Establecer nueva contraseña para: {userEmail}
            </p>
          )}
          {success && (
            <p className="mt-2 text-center text-sm text-green-600">
              Contraseña actualizada correctamente. Redirigiendo...
            </p>
          )}
          {error && (
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        
        {isValidResetFlow ? (
          <form className="mt-8 space-y-6" onSubmit={handleOpenDialog} noValidate>
            <div className="rounded-md shadow-sm">
              <div className="relative">
                <Label htmlFor="password" className="sr-only">
                  Nueva Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="Nueva Contraseña"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Actualizando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center mt-6">
            <p className="text-red-600 mb-4">No se puede cambiar la contraseña. El enlace no es válido o ha expirado.</p>
            <Button 
              onClick={() => router.push('/login')}
              className="inline-flex items-center"
            >
              Volver al inicio de sesión
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio de contraseña</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cambiar tu contraseña?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleChangePassword} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Actualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 