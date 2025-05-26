import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from 'react'
import { createClient } from "@/lib/supabase/client"
import UserButton from "@/components/ui/UserButton"

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="relative z-50 w-full backdrop-blur-sm bg-white/80 fixed top-0 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              contractual.papeleo.co
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link href="#proceso" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Proceso</Link>
            <Link href="#caracteristicas" className="text-gray-600 hover:text-blue-600 transition-colors">Características</Link>
            <Link href="#beneficios" className="text-gray-600 hover:text-blue-600 transition-colors">Beneficios</Link>
            <Link href="#precios" className="text-gray-600 hover:text-blue-600 transition-colors">Precios</Link>
            <Link href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</Link>
            <Link href="#contacto" className="text-gray-600 hover:text-blue-600 transition-colors">Contacto</Link>
          </nav>
          <div className="flex space-x-4">
            {user ? (
              <UserButton user={user} />
            ) : (
              <>
                <Button asChild variant="outline" className="hidden md:inline-flex">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/contractual">Comenzar Ahora</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 