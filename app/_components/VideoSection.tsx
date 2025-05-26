export default function VideoSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="aspect-video bg-white rounded-xl shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
          <video
            src="https://expertos-tematicos-papeleo.s3.us-east-2.amazonaws.com/Presentacio%CC%81n+papeleo.mp4"
            width="100%"
            height="100%"
            controls
            autoPlay
            muted
            loop
          />
        </div>
      </div>
    </div>
  )
} 