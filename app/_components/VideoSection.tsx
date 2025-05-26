export default function VideoSection() {
  return (
    <section className="py-20 bg-gray-50/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Ve <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">contractual.papeleo.co</span> en Acción
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre cómo nuestra plataforma automatiza completamente tu gestión contractual en menos de 5 minutos
          </p>
        </div>
        
        <div className="relative">
          <div className="aspect-video bg-white rounded-xl shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300 border border-gray-200">
            <video
              src="https://expertos-tematicos-papeleo.s3.us-east-2.amazonaws.com/Presentacio%CC%81n+papeleo.mp4"
              width="100%"
              height="100%"
              controls
              preload="metadata"
              className="w-full h-full object-cover"
              poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NzUiIHZpZXdCb3g9IjAgMCAxMjAwIDY3NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjc1IiBmaWxsPSIjRjlGQUZCIi8+CjxjaXJjbGUgY3g9IjYwMCIgY3k9IjMzNy41IiByPSI0MCIgZmlsbD0iIzM3ODNGRiIvPgo8cGF0aCBkPSJNNTg1IDMyMi41TDYxNSAzMzcuNUw1ODUgMzUyLjVWMzIyLjVaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
          
          {/* Indicadores de beneficios del video */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Demo en Vivo</h3>
              <p className="text-sm text-gray-600">Ve el proceso completo paso a paso</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">5 Minutos</h3>
              <p className="text-sm text-gray-600">Tiempo total de la demostración</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Casos Reales</h3>
              <p className="text-sm text-gray-600">Ejemplos de implementación real</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 