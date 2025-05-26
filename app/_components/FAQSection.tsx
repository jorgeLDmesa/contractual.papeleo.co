'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-4 border-b border-gray-200 pb-4 last:border-b-0 last:mb-0 last:pb-0">
      <button
        className="flex justify-between items-center w-full text-left transition-colors hover:text-blue-600"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">{question}</h3>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && <p className="mt-2 text-gray-600">{answer}</p>}
    </div>
  )
}

export default function FAQSection() {
  return (
    <section id="faq" className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Preguntas Frecuentes</h2>
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <FAQItem 
          question="¿Cómo funciona la creación automática de contratos?" 
          answer="Nuestra inteligencia artificial analiza tus necesidades específicas y genera contratos personalizados en segundos. Solo necesitas proporcionar la información básica y el sistema crea un documento completo y legalmente válido adaptado a tu situación."
        />
        <FAQItem 
          question="¿Qué incluye la validación de antecedentes judiciales?" 
          answer="Al momento de la firma del contrato, nuestro sistema verifica automáticamente los antecedentes judiciales del contratista en bases de datos oficiales. Si se detecta alguna alerta, notificamos inmediatamente al administrador para que pueda tomar las decisiones apropiadas."
        />
        <FAQItem 
          question="¿Cómo se gestiona el ciclo completo del contrato?" 
          answer="Desde la creación hasta la finalización, gestionamos todo el proceso: invitación de contratistas, solicitud de documentos precontractuales, firma digital, seguimiento durante la vigencia, y gestión de documentos adicionales como cartas de renuncia o finalizaciones."
        />
        <FAQItem 
          question="¿Qué tipos de documentos se pueden solicitar durante el contrato?" 
          answer="Durante la vigencia del contrato, tanto el contratista como el empleador pueden gestionar diversos documentos: cartas de renuncia, documentos de finalización, informes de avance, certificaciones adicionales, y cualquier otro documento necesario para el cumplimiento contractual."
        />
        <FAQItem 
          question="¿Es legalmente válida la firma digital?" 
          answer="Sí, nuestro proceso de firma digital cumple con todos los estándares legales y normativos. Proporcionamos trazabilidad completa del proceso de firma y certificados que garantizan la validez legal del documento firmado."
        />
        <FAQItem 
          question="¿Cómo funcionan las alertas inteligentes?" 
          answer="El sistema monitorea continuamente el estado de los contratos y documentos. Recibes notificaciones automáticas sobre vencimientos, documentos faltantes, alertas en antecedentes, cambios de estado, y cualquier situación que requiera tu atención."
        />
        <FAQItem 
          question="¿Puedo invitar a múltiples contratistas?" 
          answer="Sí, puedes invitar a tantos contratistas como necesites para cada contrato. El sistema gestiona automáticamente las invitaciones, el seguimiento de respuestas, y la recopilación de documentos de cada participante."
        />
        <FAQItem 
          question="¿Qué sucede si un contratista tiene antecedentes judiciales?" 
          answer="Si se detectan antecedentes judiciales durante la validación, el sistema te notifica inmediatamente con los detalles específicos. Tú decides si proceder o no con el contrato basándote en esta información y las políticas de tu organización."
        />
      </div>
    </section>
  )
} 