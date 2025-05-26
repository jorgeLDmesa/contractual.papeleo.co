'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check } from "lucide-react"

export default function Hero() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="animate-fade-in">
        <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Automatiza tu gestión contractual
        </span>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-800 mb-6 leading-tight tracking-tight">
          Gestión Contractual<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Automatizada con IA
          </span>
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          Desde la creación del contrato hasta la gestión completa del ciclo contractual. Todo automatizado con inteligencia artificial.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="#contacto" className="flex items-center justify-center">
              Comenzar prueba gratuita
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            <Link href="#contacto" className="flex items-center justify-center">
              Ver demostración
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span>Contratos con IA</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span>Validación automática</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span>Gestión de documentos</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span>Antecedentes judiciales</span>
        </div>
      </div>
    </div>
  )
} 