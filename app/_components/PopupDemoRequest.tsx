import { useState, useEffect } from "react"
import { sendContactEmail } from "./actions/contactActions"

export default function PopupDemoRequest() {
  const [show, setShow] = useState(false)
  const [closed, setClosed] = useState(false)
  const [form, setForm] = useState({ company: "", email: "" })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (closed) return
    const onScroll = () => {
      if (window.scrollY > 800) setShow(true)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [closed])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('company', form.company)
      formData.append('email', form.email)
      await sendContactEmail(formData)
      setSent(true)
      setTimeout(() => setShow(false), 2000)
    } catch {
      setError('Error al enviar el mensaje. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!show || closed) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xs w-full bg-white border border-blue-200 rounded-xl shadow-2xl p-6 animate-fade-in flex flex-col gap-3 md:max-w-sm">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-xl font-bold"
        onClick={() => setClosed(true)}
        aria-label="Cerrar"
      >
        ×
      </button>
      <h3 className="text-lg font-bold text-blue-700 mb-1">¿Quieres una demostración?</h3>
      <p className="text-gray-600 text-sm mb-2">Déjanos tu correo y el nombre de tu empresa. Te contactaremos para una demo personalizada.</p>
      {sent ? (
        <div className="text-green-600 font-semibold py-4 text-center">¡Gracias! Te contactaremos pronto.</div>
      ) : (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            name="company"
            placeholder="Nombre de la empresa"
            value={form.company}
            onChange={handleChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isSubmitting}
          />
          {error && <div className="text-red-600 text-xs mb-1">{error}</div>}
          <button
            type="submit"
            className="mt-2 bg-blue-700 text-white rounded-md py-2 font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar demo'}
          </button>
        </form>
      )}
    </div>
  )
} 