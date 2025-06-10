"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { sendContactEmail } from "./actions/contactActions"

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    const formData = new FormData(e.currentTarget)
    
    try {
      await sendContactEmail(formData)
      setSubmitStatus('success')
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Error sending contact email:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contacto" className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="bg-white rounded-xl p-8 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Contáctanos</h2>
            <p className="text-lg text-gray-600 mb-6">
              ¿Listo para automatizar tu gestión contractual? Déjanos tus datos y te mostraremos cómo contractual.papeleo.co puede transformar tu empresa.
            </p>
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-700">jorge@papeleo.co</span>
            </div>
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-gray-700">+57 318 224 3673</span>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">¿Por qué elegir contractual.papeleo.co?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Prueba gratuita de 10 contratos</li>
                <li>• Implementación en menos de 24 horas</li>
                <li>• Soporte especializado incluido</li>
                <li>• ROI visible desde el primer mes de uso</li>
              </ul>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            {submitStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">¡Mensaje enviado exitosamente! Te contactaremos pronto.</p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">Error al enviar el mensaje. Por favor intenta de nuevo.</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la empresa *
              </label>
              <input
                type="text"
                id="company"
                name="company"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu empresa"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="contracts" className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cuántos contratos gestionas al mes?
              </label>
              <select
                id="contracts"
                name="contracts"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una opción</option>
                <option value="1-10">1-10 contratos</option>
                <option value="11-50">11-50 contratos</option>
                <option value="51-100">51-100 contratos</option>
                <option value="100+">Más de 100 contratos</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                ¿Qué necesitas automatizar?
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Cuéntanos sobre tus procesos contractuales actuales..."
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="demo"
                  className="form-checkbox h-5 w-5 text-blue-600" 
                />
                <span className="ml-2 text-gray-700">Quiero una demostración personalizada</span>
              </label>
            </div>
            
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Solicitar Demostración'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
} 