'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
// import { ShaderGradient, ShaderGradientCanvas } from 'shadergradient'
import { requestPasswordUpdate } from '@/lib/auth-helpers/server'
import { toast } from "sonner"

interface ForgotPasswordProps {
  allowEmail: boolean;
  redirectMethod: 'client' | 'server';
  disableButton?: boolean;
}

export default function ForgotPassword({ allowEmail, redirectMethod, disableButton }: ForgotPasswordProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    setUserEmail(email)
    
    try {
      const redirectUrl = await requestPasswordUpdate(formData)
      
      // Verificar si la URL contiene algún indicador de error
      if (redirectUrl.includes('error') || redirectUrl.includes('hmm')) {
        // Si hay un error, extraer el mensaje de error de la URL de redirección
        const errorMatch = redirectUrl.match(/message=([^&]+)/)
        if (errorMatch && errorMatch[1]) {
          setError(decodeURIComponent(errorMatch[1]))
        } else {
          setError('Ocurrió un error al enviar el email')
        }
      } else {
        // Si no hay indicador de error, consideramos que fue exitoso
        setEmailSent(true)
        toast.success("Email enviado",{
          description: "Por favor, revisa tu correo electrónico para el enlace de recuperación",
        })
      }
    } catch (err) {
      setError('Error al procesar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
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
        {!emailSent ? (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Recuperar Contraseña
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Introduce tu email para recuperar tu contraseña
              </p>
              {error && (
                <p className="mt-2 text-center text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <Label htmlFor="email-address" className="sr-only">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Correo electrónico"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting || disableButton}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Email'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
                ¡Email enviado!
              </h2>
              <p className="mt-4 text-center text-md text-gray-600">
                Hemos enviado un enlace de recuperación a <strong>{userEmail}</strong>
              </p>
              <p className="mt-2 text-center text-sm text-gray-600">
                Por favor, revisa tu bandeja de entrada y sigue las instrucciones del correo electrónico.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="w-full"
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {!emailSent && (
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Volver al inicio de sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}