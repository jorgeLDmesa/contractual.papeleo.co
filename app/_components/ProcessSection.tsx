'use client'

import { FileText, Users, Shield, CheckCircle, Clock, AlertTriangle } from "lucide-react"

export default function ProcessSection() {
  const steps = [
    {
      icon: FileText,
      title: "Creación con IA",
      description: "El contrato se genera automáticamente usando inteligencia artificial, adaptándose a tus necesidades específicas."
    },
    {
      icon: Users,
      title: "Invitación de Contratistas",
      description: "Invita fácilmente a contratistas y solicita todos los documentos precontractuales necesarios."
    },
    {
      icon: Shield,
      title: "Validación Automática",
      description: "Verificamos antecedentes judiciales y validamos que los documentos correspondan con lo solicitado."
    },
    {
      icon: CheckCircle,
      title: "Firma Digital",
      description: "Proceso de firma seguro y legalmente válido con notificaciones automáticas."
    },
    {
      icon: Clock,
      title: "Gestión Continua",
      description: "Durante la vigencia del contrato, gestiona documentos adicionales como cartas de renuncia o finalizaciones."
    },
    {
      icon: AlertTriangle,
      title: "Alertas Inteligentes",
      description: "Recibe notificaciones inmediatas sobre alertas en antecedentes o documentos faltantes."
    }
  ]

  return (
    <section id="proceso" className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Proceso <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Automatizado</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desde la creación hasta la gestión completa del ciclo contractual, todo automatizado con inteligencia artificial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 h-full">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <step.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Paso {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 