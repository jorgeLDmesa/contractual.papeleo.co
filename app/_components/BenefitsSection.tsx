export default function BenefitsSection() {
  return (
    <section id="beneficios" className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-br from-gray-100 to-blue-50 rounded-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Resultados comprobados para tu empresa</h2>
      <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
        Métricas reales y beneficios tangibles que obtienen nuestros clientes B2B
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Contratos listos en segundos */}
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mb-1">Contratos listos en segundos</div>
          <p className="text-gray-600">Automatiza la creación y firma de contratos en tiempo récord.</p>
        </div>
        {/* Ahorro de dinero */}
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4" /></svg>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mb-1">Ahorra dinero</div>
          <p className="text-gray-600">Reduce costos operativos y administrativos de forma significativa.</p>
        </div>
        {/* Reducción de errores */}
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mb-1">-90% errores humanos</div>
          <p className="text-gray-600">Automatización y validación en cada paso del proceso contractual.</p>
        </div>
        {/* Cumplimiento legal */}
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mb-1">Cumplimiento legal total</div>
          <p className="text-gray-600">Firma digital certificada y trazabilidad completa de cada contrato.</p>
        </div>
        {/* Satisfacción de usuarios */}
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-2.764 5.528A2 2 0 0116 20H8a2 2 0 01-1.789-1.578l-2.764-5.528A2 2 0 014.236 10H9m5 0V6a3 3 0 10-6 0v4" /></svg>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mb-1">+95% usuarios satisfechos</div>
          <p className="text-gray-600">Implementación rápida y soporte especializado para tu equipo.</p>
        </div>
        {/* Escalabilidad */}
        <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 001 1h3m-7 4v4a1 1 0 001 1h3m-7-5v4a1 1 0 001 1h3" /></svg>
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mb-1">Escala sin límites</div>
          <p className="text-gray-600">Gestiona desde 10 hasta 10,000 contratos mensuales sin aumentar tu equipo.</p>
        </div>
      </div>
    </section>
  )
} 