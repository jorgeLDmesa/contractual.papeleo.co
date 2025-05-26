import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function CTASection() {
  return (
    <section className="relative z-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-16 rounded-xl my-12 max-w-6xl mx-auto sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Automatiza tu gestión contractual hoy</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Únete a las empresas que ya transformaron su gestión contractual con inteligencia artificial y automatización avanzada
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white text-blue-600 hover:bg-blue-50 group">
          <a href="#contacto" className="flex items-center">
            Comenzar prueba gratuita
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </Button>
      </div>
    </section>
  )
} 