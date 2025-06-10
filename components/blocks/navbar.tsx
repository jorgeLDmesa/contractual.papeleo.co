"use client" 

import * as React from "react"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import UserButton from "@/components/ui/UserButton"
import { User } from '@supabase/supabase-js'
import Link from "next/link"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setIsLoaded(true)
    
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
  }, [supabase.auth])

  const toggleMenu = () => setIsOpen(!isOpen)

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { name: "Proceso", href: "#proceso" },
    { name: "Beneficios", href: "#beneficios" },
    { name: "Precios", href: "#precios" },
    { name: "FAQ", href: "#faq" }
  ]

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { name: "Contratante", href: "/contratante" },
    { name: "Contratista", href: "/contratista" }
  ]

  const navItems = user ? authenticatedNavItems : publicNavItems

  return (
    <div className="flex justify-center w-full py-6 px-4">
      <div className="flex items-center justify-between px-8 py-4 backdrop-blur-sm bg-white/90 rounded-full shadow-xl border border-gray-200/50 w-full max-w-6xl relative z-10">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <div 
            className={`flex items-center transition-all duration-300 hover:scale-105 ${
              isLoaded ? 'scale-100' : 'scale-75'
            }`}
            style={{
              animation: isLoaded ? 'logoEntrance 0.3s ease-out' : undefined
            }}
          >
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              contractual.papeleo.co
            </Link>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-12">
          {navItems.map((item, index) => (
            <div 
              key={item.name}
              className={`transition-all duration-300 hover:scale-105 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
              }`}
              style={{
                animation: isLoaded ? `navItemEntrance 0.3s ease-out ${index * 0.1}s both` : undefined
              }}
            >
              <Link 
                href={item.href} 
                className={`font-medium transition-colors duration-200 ${
                  user 
                    ? 'text-base text-gray-700 hover:text-blue-600 font-semibold' 
                    : 'text-sm text-gray-600 hover:text-blue-600'
                }`}
              >
                {item.name}
              </Link>
            </div>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div 
          className={`hidden md:flex items-center transition-all duration-300 ${
            user ? 'space-x-6' : 'space-x-3'
          } ${
            isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'
          }`}
          style={{
            animation: isLoaded ? 'ctaEntrance 0.3s ease-out 0.2s both' : undefined
          }}
        >
          {user ? (
            <div className="scale-110">
              <UserButton user={user} />
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-blue-600 transition-all duration-200"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex items-center transition-transform duration-150 active:scale-90" 
          onClick={toggleMenu}
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className={`fixed inset-0 backdrop-blur-md bg-white/95 z-50 pt-24 px-6 md:hidden transition-all duration-300 ${
            isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
          }`}
          style={{
            animation: 'slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <button
            className="absolute top-6 right-6 p-2 transition-all duration-150 active:scale-90"
            onClick={toggleMenu}
            style={{
              animation: 'fadeIn 0.2s ease-out 0.2s both'
            }}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex flex-col space-y-8">
            {/* Mobile Navigation Items */}
            {navItems.map((item, index) => (
              <div 
                key={item.name}
                style={{
                  animation: `slideInFromRight 0.3s ease-out ${(index * 0.1) + 0.1}s both`
                }}
              >
                <Link 
                  href={item.href} 
                  className={`font-medium transition-colors ${
                    user 
                      ? 'text-xl text-gray-700 hover:text-blue-600 font-semibold' 
                      : 'text-lg text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={toggleMenu}
                >
                  {item.name}
                </Link>
              </div>
            ))}

            {/* Mobile Auth Buttons */}
            <div 
              className={`flex flex-col ${user ? 'pt-10 space-y-6' : 'pt-8 space-y-4'}`}
              style={{
                animation: 'slideUpFromBottom 0.3s ease-out 0.6s both'
              }}
            >
              {user ? (
                <div className="scale-125 self-center">
                  <UserButton user={user} />
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-blue-600 transition-all duration-200"
                    onClick={toggleMenu}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center w-full px-6 py-4 text-base font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
                    onClick={toggleMenu}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes logoEntrance {
          from {
            transform: scale(0.8);
          }
          to {
            transform: scale(1);
          }
        }
        
        @keyframes navItemEntrance {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes ctaEntrance {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideUpFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}


export { Navbar1 }