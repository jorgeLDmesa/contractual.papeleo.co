"use client"

import { useState } from "react"
import { Check, FileText, Mail, Shield, FileSignature, FileSearch, Clock } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      title: "Ahorra tiempo con IA",
      description:
        "Genera contratos personalizados en minutos y reduce el trabajo manual gracias a nuestra inteligencia artificial avanzada.",
      icon: <FileText className="h-6 w-6" />,
      image: "/creacion.png?height=500&width=500",
      alt: "Creación de contratos con IA",
    },
    {
      title: "Invita y gestiona fácilmente",
      description:
        "Envía invitaciones automáticas por email y WhatsApp, y haz seguimiento en tiempo real a todas las partes involucradas.",
      icon: <Mail className="h-6 w-6" />,
      image: "/invitacion.png?height=500&width=500",
      alt: "Invitación por email y WhatsApp",
    },
    {
      title: "Verifica documentos sin esfuerzo",
      description:
        "Sube y valida documentos automáticamente con IA, asegurando autenticidad y cumplimiento en cada etapa.",
      icon: <FileSearch className="h-6 w-6" />,
      image: "/verificacion-documento.png?height=600&width=500",
      alt: "Verificación de documentos con IA",
    },
    {
      title: "Seguridad jurídica garantizada",
      description:
        "Consulta antecedentes en entidades oficiales y protege tus contrataciones con validaciones automáticas.",
      icon: <Shield className="h-6 w-6" />,
      image: "/antecedentes.png?height=600&width=500",
      alt: "Verificación de antecedentes jurídicos",
    },
    {
      title: "Firma digital segura",
      description:
        "Firma contratos con validez legal y verificación de identidad, cumpliendo con los más altos estándares.",
      icon: <FileSignature className="h-6 w-6" />,
      image: "/etapas.png?height=600&width=500",
      alt: "Firma digital segura",
    },
    {
      title: "Seguimiento y gestión documental",
      description:
        "Monitoreo del contrato, solicitud de documentos y gestión de renovaciones o renuncias desde una interfaz centralizada.",
      icon: <Clock className="h-6 w-6" />,
      image: "/estados-documentales.png?height=600&width=500",
      alt: "Seguimiento y gestión documental",
    },
  ]

  return (
    <section className="py-24 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto bg-gradient-to-b from-white to-blue-50/30">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
          Automatización completa de la etapa contractual
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Simplifica todo el proceso contractual desde la creación hasta el seguimiento con nuestra plataforma integral
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-4 items-start p-4 rounded-xl transition-all duration-300 cursor-pointer",
                  activeFeature === index
                    ? "bg-white shadow-lg border-l-4 border-blue-600 transform translate-x-2"
                    : "hover:bg-white/80 hover:shadow-md",
                )}
                onClick={() => setActiveFeature(index)}
              >
                <div
                  className={cn(
                    "rounded-full p-3 transition-all duration-300 flex-shrink-0",
                    activeFeature === index ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600",
                  )}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-semibold text-lg mb-1 transition-colors duration-300",
                      activeFeature === index ? "text-blue-600" : "text-gray-800",
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl blur-md opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <div className="aspect-[4/3] relative">
                <Image
                  src={features[activeFeature].image || "/placeholder.svg"}
                  fill
                  alt={features[activeFeature].alt}
                  className="object-cover transition-all duration-500"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 to-white/0 p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Check className="h-5 w-5" />
                  <span>{features[activeFeature].title}</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
              <span className="text-xs font-bold">Contractual</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
