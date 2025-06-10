// import ShaderGradientBackground from '@/components/ui/ShaderGradientBackground';

interface LoadingSpinnerProps {
  message?: string;
  fullHeight?: boolean;
}

export default function LoadingSpinner({ 
  message = "Cargando...", 
  fullHeight = true 
}: LoadingSpinnerProps) {
  const containerClass = fullHeight 
    ? "flex items-center justify-center min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-4rem)] p-4"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      {/* <ShaderGradientBackground /> */}
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div className="text-gray-500">{message}</div>
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  message?: string;
}

export function InlineLoading({ message = "Cargando..." }: InlineLoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      {message}
    </div>
  );
} 