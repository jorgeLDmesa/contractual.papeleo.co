'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Check, Star, Phone } from "lucide-react"
import Link from "next/link"

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "Básico",
      description: "Perfecto para pequeñas empresas que inician con gestión contractual",
      monthlyPrice: 49,
      annualPrice: 490,
      features: [
        "Hasta 10 contratos por mes",
        "Creación de contratos con IA",
        "Firma digital básica",
        "Validación de documentos",
        "Soporte por email"
      ],
      popular: false,
      cta: "Comenzar Básico"
    },
    {
      name: "Profesional",
      description: "Ideal para empresas en crecimiento con necesidades avanzadas",
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        "Hasta 50 contratos por mes",
        "Validación de antecedentes judiciales",
        "Gestión completa del ciclo contractual",
        "Alertas inteligentes",
        "Invitación de contratistas",
        "Dashboard de seguimiento",
        "Soporte prioritario"
      ],
      popular: true,
      cta: "Comenzar Profesional"
    },
    {
      name: "Empresarial",
      description: "Para grandes organizaciones con volúmenes altos de contratos",
      monthlyPrice: 199,
      annualPrice: 1990,
      features: [
        "Contratos ilimitados",
        "Todas las funciones incluidas",
        "API personalizada",
        "Integraciones avanzadas",
        "Reportes y analytics",
        "Gestión de equipos",
        "Soporte 24/7",
        "Onboarding personalizado"
      ],
      popular: false,
      cta: "Comenzar Empresarial"
    },
    {
      name: "Personalizado",
      description: "Solución a medida para necesidades específicas de tu organización",
      monthlyPrice: null,
      annualPrice: null,
      features: [
        "Desarrollo personalizado",
        "Integraciones específicas",
        "Soporte dedicado",
        "SLA garantizado",
        "Capacitación especializada",
        "Consultoría estratégica"
      ],
      popular: false,
      cta: "Contactar Ventas",
      isContact: true
    }
  ]

  return (
    <section id="precios" className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Planes y <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Precios</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Elige el plan perfecto para automatizar tu gestión contractual
          </p>
          
          {/* Toggle anual/mensual */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${!isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Mensual
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Anual
            </span>
            {isAnnual && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                Ahorra 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border ${
                plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                  : 'border-gray-200/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                {plan.isContact ? (
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-800">Personalizado</div>
                    <div className="text-gray-500">Cotización a medida</div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-800">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </div>
                    <div className="text-gray-500">
                      {isAnnual ? '/año' : '/mes'}
                    </div>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : plan.isContact
                    ? 'bg-gray-800 hover:bg-gray-900 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {plan.isContact ? (
                  <Link href="#contacto" className="flex items-center justify-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {plan.cta}
                  </Link>
                ) : (
                  <Link href="#contacto">{plan.cta}</Link>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            ¿Necesitas más información? Todos los planes incluyen prueba gratuita de 14 días.
          </p>
          <Button asChild variant="outline" size="lg">
            <Link href="#contacto">Solicitar Demostración Gratuita</Link>
          </Button>
        </div>
      </div>
    </section>
  )
} 