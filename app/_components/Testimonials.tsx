import { TestimonialsSection } from "@/components/blocks/testimonials-with-marquee"


const testimonials = [
  {
    author: {
      name: "María Elena Vargas",
      handle: "@mariavargas_legal",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "Contractual.papeleo.co revolucionó nuestra gestión legal. Reducimos el tiempo de creación de contratos de 3 días a 30 minutos. La validación automática de antecedentes nos ha evitado múltiples problemas legales.",
    href: "https://linkedin.com/in/mariavargas"
  },
  {
    author: {
      name: "Carlos Mendoza",
      handle: "@carlosmendoza_rh",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "Como Director de RRHH, gestiono más de 200 contratos mensuales. Esta plataforma automatizó todo el proceso: desde la invitación de contratistas hasta la firma digital. Ahorro 15 horas semanales.",
    href: "https://linkedin.com/in/carlosmendoza"
  },
  {
    author: {
      name: "Ana Sofía Restrepo",
      handle: "@anarestrepo_ceo",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "La validación automática de documentos y antecedentes judiciales nos da total tranquilidad. En 6 meses hemos procesado más de 500 contratos sin errores. El ROI fue inmediato."
  }
]

export function TestimonialsSectionDemo() {
  return (
    <TestimonialsSection
      title="Empresas que ya transformaron su gestión contractual"
      description="Únete a cientos de empresas que automatizaron sus procesos contractuales y redujeron tiempos hasta en un 90%"
      testimonials={testimonials}
    />
  )
}