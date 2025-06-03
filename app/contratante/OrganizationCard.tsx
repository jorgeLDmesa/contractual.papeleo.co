'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Organizations } from '@/lib/supabase/types';
import { CalendarDays, Building2, FileText, ArrowRight } from 'lucide-react';

interface OrganizationCardProps {
  organization: Pick<Organizations, 'id' | 'name' | 'logo_url' | 'pseudoname' | 'contracts_limit' | 'created_at'>;
}

export default function OrganizationCard({ organization }: OrganizationCardProps) {
  const router = useRouter();

  // Extraer iniciales del nombre para el avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Manejar click en la card
  const handleCardClick = () => {
    router.push(`/contratante/${organization.id}`);
  };

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-gray-200 hover:border-blue-300 relative overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Gradiente de fondo sutil en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-300" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-12 w-12 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300 shadow-sm">
              <AvatarImage 
                src={organization.logo_url || ''} 
                alt={`Logo de ${organization.name}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                {getInitials(organization.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors duration-300">
                {organization.name}
              </h3>
              {organization.pseudoname && (
                <p className="text-sm text-gray-500 truncate group-hover:text-gray-600 transition-colors">
                  {organization.pseudoname}
                </p>
              )}
            </div>
          </div>
          
          {/* Flecha que aparece en hover */}
          <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <ArrowRight className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
            <FileText className="h-4 w-4" />
            <span>Contratos</span>
          </div>
          {organization.contracts_limit ? (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100 transition-colors">
              Límite: {organization.contracts_limit}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500 group-hover:text-gray-600 group-hover:border-gray-300 transition-colors">
              Sin límite
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
          <CalendarDays className="h-4 w-4" />
          <span>Creada: {formatDate(organization.created_at)}</span>
        </div>

        <div className="pt-2 border-t border-gray-100 group-hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
              <Building2 className="h-4 w-4" />
              <span>ID:</span>
            </div>
            <code className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
              {organization.id.slice(0, 8)}...
            </code>
          </div>
        </div>

        {/* Indicador de hover sutil */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </CardContent>
    </Card>
  );
} 