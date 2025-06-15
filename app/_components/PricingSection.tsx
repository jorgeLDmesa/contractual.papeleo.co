"use client"

import { useState, useEffect } from "react"
import { Check, X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

export type PlanFeature = {
  name: string;
  included: boolean;
};

export type Plan = {
  name: string;
  pricePerStage: number | null;
  recommended?: boolean;
  features: PlanFeature[];
};

export type StageRange = {
  min: number;
  max: number;
  planIndex: number;
  pricePerStage: number | null;
};

export default function PricingSection() {
  const [contractStages, setContractStages] = useState(50)
  const [selectedPlan, setSelectedPlan] = useState(0)

  // Definir los rangos de etapas contractuales y sus planes correspondientes
  const stageRanges: StageRange[] = [
    { min: 50, max: 149, planIndex: 0, pricePerStage: 40 },
    { min: 150, max: 399, planIndex: 1, pricePerStage: 33 },
    { min: 400, max: 999, planIndex: 2, pricePerStage: 25 },
    { min: 1000, max: Number.POSITIVE_INFINITY, planIndex: 3, pricePerStage: null },
  ]

  // Opciones de etapas contractuales para el slider
  const stageOptions: number[] = [50, 150, 400, 1000]

  // Planes de precios
  const plans: Plan[] = [
    {
      name: "Básico",
      pricePerStage: 40,
      features: [
        { name: "Creación de contratos con IA", included: true },
        { name: "Invitación por email", included: true },
        { name: "Verificación básica de documentos", included: true },
        { name: "Firma digital", included: true },
        { name: "Soporte por tickets", included: true },
        { name: "Verificación de antecedentes", included: false },
        { name: "Seguimiento avanzado", included: false },
      ],
    },
    {
      name: "Profesional",
      pricePerStage: 33,
      recommended: true,
      features: [
        { name: "Creación de contratos con IA", included: true },
        { name: "Invitación por email y WhatsApp", included: true },
        { name: "Verificación avanzada de documentos", included: true },
        { name: "Firma digital", included: true },
        { name: "Soporte por tickets", included: true },
        { name: "Verificación de antecedentes", included: true },
        { name: "Seguimiento avanzado", included: false },
      ],
    },
    {
      name: "Empresarial",
      pricePerStage: 25,
      features: [
        { name: "Creación de contratos con IA", included: true },
        { name: "Invitación por email y WhatsApp", included: true },
        { name: "Verificación avanzada de documentos", included: true },
        { name: "Firma digital", included: true },
        { name: "Soporte prioritario", included: true },
        { name: "Verificación de antecedentes", included: true },
        { name: "Seguimiento avanzado", included: true },
      ],
    },
    {
      name: "Personalizado",
      pricePerStage: null,
      features: [
        { name: "Todas las características", included: true },
        { name: "Integraciones personalizadas", included: true },
        { name: "API dedicada", included: true },
        { name: "Soporte 24/7", included: true },
        { name: "Consultoría especializada", included: true },
        { name: "Implementación a medida", included: true },
        { name: "SLA garantizado", included: true },
      ],
    },
  ]

  // Actualizar el plan seleccionado basado en el número de etapas
  useEffect(() => {
    const range = stageRanges.find((r) => contractStages >= r.min && contractStages <= r.max)
    if (range) {
      setSelectedPlan(range.planIndex)
    }
  }, [contractStages])

  // Calcular el precio basado en el plan y número de etapas
  const calculatePrice = (planIndex: number) => {
    const range = stageRanges.find((r) => r.planIndex === planIndex)
    if (!range || range.pricePerStage === null) return null
    return contractStages * range.pricePerStage
  }

  // Manejar cambio en el slider
  const handleStageChange = (value: number[]) => {
    setContractStages(value[0])
  }

  return (
    <section id="precios" className="py-24 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Precios transparentes
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Comienza gratis y escala a medida que creces. Elige el plan que mejor se adapte a tus necesidades.
        </p>
      </div>

      <div className="mb-16 max-w-3xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-blue-50 p-1 rounded-full shadow-inner">
            <button className="px-6 py-2 text-sm font-medium rounded-full transition-all bg-white shadow-sm text-blue-600">
              Etapas Contractuales
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 cursor-pointer text-blue-500 underline decoration-dotted">¿Qué es esto?</span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  Una etapa contractual es cada paso o fase que gestionas en tus contratos, como creación, firma, seguimiento, etc. ¡Solo cuenta las que automatizarás!
                </TooltipContent>
              </Tooltip>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <Slider
            value={[contractStages]}
            min={50}
            max={1000}
            step={10}
            onValueChange={handleStageChange}
            className="my-6 slider-large-thumb"
          />

          <div className="flex justify-between mt-4 text-sm font-medium">
            {stageOptions.map((stage, index) => (
              <div key={stage} className="flex flex-col items-center">
                <span
                  className={cn(
                    "px-1 transition-colors whitespace-nowrap",
                    contractStages >= stage
                      ? "bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 font-medium"
                      : "text-gray-500",
                  )}
                >
                  {stage}
                  {index === stageOptions.length - 1 ? "+" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <div className="text-sm text-gray-500">Etapas seleccionadas</div>
            <div className="text-2xl font-bold text-blue-600">{contractStages}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Plan recomendado</div>
            <div className="text-xl font-bold">{plans[selectedPlan].name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-700 font-semibold">Precio anual estimado</div>
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {calculatePrice(selectedPlan) !== null
                ? `$${Math.round(calculatePrice(selectedPlan)! * 12).toLocaleString()}/año`
                : "Personalizado"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 md:gap-y-12 lg:gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={cn(
              "rounded-xl transition-all duration-300",
              selectedPlan === index ? "transform scale-105 z-10" : "hover:transform hover:scale-102 hover:z-10",
              selectedPlan === index
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl border-0"
                : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md",
              "w-full",
              "sm:w-full",
              "md:w-full",
              "lg:w-auto",
              "mb-6 md:mb-0"
            )}
          >
            <div className="p-6 pb-0">
              {plan.recommended && (
                <div className="mb-4">
                  <span
                    className={cn(
                      "text-xs font-medium px-3 py-1 rounded-full",
                      selectedPlan === index ? "bg-blue-600/50 text-white" : "bg-blue-100 text-blue-600",
                    )}
                  >
                    Recomendado
                  </span>
                </div>
              )}

              <h3 className={cn("text-xl font-bold", selectedPlan !== index && "text-gray-900")}>{plan.name}</h3>

              <div className="mt-4 mb-6">
                {plan.pricePerStage !== null ? (
                  <div className="flex items-baseline">
                    <span className={cn("text-3xl font-bold", selectedPlan !== index && "text-gray-900")}>
                      ${plan.pricePerStage}
                    </span>
                    <span className={cn("text-sm ml-2", selectedPlan === index ? "text-blue-100" : "text-gray-500")}>
                      / etapa
                    </span>
                  </div>
                ) : (
                  <div className={cn("text-3xl font-bold", selectedPlan !== index && "text-gray-900")}>
                    Personalizado
                  </div>
                )}

                <p className={cn("mt-1 text-sm", selectedPlan === index ? "text-blue-100" : "text-gray-500")}>
                  {plan.pricePerStage !== null
                    ? (() => {
                        const range = stageRanges.find((r) => r.planIndex === index);
                        if (!range) return null;
                        const min = range.min;
                        const max = index === plans.length - 2 ? range.max : range.max - 1;
                        return `Ideal para ${min}-${max} etapas`;
                      })()
                    : "Un plan basado en tus necesidades específicas"}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center">
                    {feature.included ? (
                      <Check
                        className={cn("h-5 w-5 mr-2", selectedPlan === index ? "text-blue-200" : "text-blue-600")}
                      />
                    ) : (
                      <X className="h-5 w-5 mr-2 text-gray-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        selectedPlan === index
                          ? feature.included
                            ? "text-white"
                            : "text-blue-200/60"
                          : feature.included
                            ? "text-gray-700"
                            : "text-gray-400",
                      )}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  className={cn(
                    "w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                    selectedPlan === index
                      ? "bg-white text-blue-900 hover:bg-blue-100 border border-blue-200 shadow-md"
                      : "bg-blue-700 text-white hover:bg-blue-800 border border-blue-700 shadow-md",
                  )}
                >
                  {plan.pricePerStage !== null ? "Comenzar ahora" : "Contactar ventas"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
