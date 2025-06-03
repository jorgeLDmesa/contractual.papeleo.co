'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Error al cargar las organizaciones
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Ha ocurrido un problema al cargar tus organizaciones. Por favor, intenta nuevamente.
        </p>
        <div className="space-y-4">
          <button 
            onClick={reset}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Intentar nuevamente</span>
          </button>
          <div className="text-sm text-gray-500">
            <p>Si el problema persiste, contacta al soporte técnico.</p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 