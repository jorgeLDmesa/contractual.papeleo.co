'use client'

import { Brain, Shield, FileCheck, Bell, Users, Clock, Search, Lock } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Inteligencia Artificial",
      description: "Creación automática de contratos personalizados usando IA avanzada que se adapta a tus necesidades específicas."
    },
    {
      icon: Shield,
      title: "Validación de Antecedentes",
      description: "Verificación automática de antecedentes judiciales del contratista al momento de la firma del contrato."
    },
    {
      icon: FileCheck,
      title: "Verificación de Documentos",
      description: "Validación automática que los documentos precontractuales entregados correspondan con lo solicitado."
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      description: "Notificaciones inmediatas al administrador en caso de detectar alertas en antecedentes o documentos."
    },
    {
      icon: Users,
      title: "Gestión de Contratistas",
      description: "Invita fácilmente a contratistas y gestiona todo el proceso de incorporación de manera centralizada."
    },
    {
      icon: Clock,
      title: "Ciclo Completo",
      description: "Gestión durante toda la vigencia del contrato, desde documentos precontractuales hasta la finalización."
    },
    {
      icon: Search,
      title: "Seguimiento en Tiempo Real",
      description: "Monitorea el estado de todos los contratos y documentos en tiempo real desde un panel centralizado."
    },
    {
      icon: Lock,
      title: "Firma Digital Segura",
      description: "Proceso de firma digital legalmente válido con máxima seguridad y trazabilidad completa."
    }
  ]

  return (
    <section id="caracteristicas" className="py-20 bg-gray-50/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Características <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Avanzadas</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tecnología de vanguardia para automatizar y optimizar cada aspecto de tu gestión contractual
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 h-full hover:border-blue-300">
                <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 