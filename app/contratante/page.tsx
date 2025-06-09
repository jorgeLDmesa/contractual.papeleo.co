import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrganizationCard from './OrganizationCard';
import { Metadata } from 'next';
import { Navbar1 } from '@/components/blocks/navbar';

export const metadata: Metadata = {
  title: 'Mis Organizaciones - Contractual',
  description: 'Gestiona y visualiza todas tus organizaciones en Contractual',
};

export default async function ContratantePage() {
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Obtener organizaciones del usuario con optimización
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('id, name, logo_url, pseudoname, contracts_limit, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching organizations:', error);
    // No lanzamos el error aquí para evitar romper la página completamente
    // En su lugar, mostramos un estado de error manejado
  }

  const hasOrganizations = organizations && organizations.length > 0;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar1 />
      
      <main className="flex-grow pt-12">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Organizaciones
            </h1>
            <p className="text-gray-600">
              Gestiona y visualiza todas tus organizaciones
            </p>
            {hasOrganizations && (
              <div className="mt-4 text-sm text-gray-500">
                {organizations.length} {organizations.length === 1 ? 'organización encontrada' : 'organizaciones encontradas'}
              </div>
            )}
          </div>

          {error ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-yellow-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Error al cargar organizaciones
              </h3>
              <p className="text-gray-600 mb-6">
                Ha ocurrido un problema al cargar tus organizaciones. Por favor, actualiza la página.
              </p>
            </div>
          ) : hasOrganizations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {organizations.map((organization) => (
                <OrganizationCard 
                  key={organization.id} 
                  organization={organization} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes organizaciones
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primera organización para comenzar a gestionar contratos
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Crear Organización
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
