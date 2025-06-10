import { createClient } from '@/lib/supabase/client';

export interface Permission {
  user_id: string;
  module_id: number;
  conceptos_project_id: string | null;
  contractual_project_id: string | null;
  repo_project_id: string | null;
}

export async function checkOrganizationOwnership(userId: string, organizationId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();
  
  return !!data;
}

export async function getUserModulePermissions(userId: string, moduleId: number): Promise<Permission[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_module_projects')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId);
  
  if (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
  
  return data || [];
}

// Esta función imprime con más detalle los permisos para ayudar en debugging
export async function logUserPermissionsForModuleType(
  userId: string, 
  moduleId: number,
  projectType: 'conceptos' | 'contractual' | 'repo'
): Promise<void> {
  const supabase = createClient();
  
  
  const { data, error } = await supabase
    .from('user_module_projects')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error obteniendo permisos:', error);
    return;
  }
  
  console.log(`Total de permisos encontrados: ${data?.length || 0}`);
  
  // Filtramos para el módulo específico
  const modulePermissions = data?.filter(p => p.module_id === moduleId) || [];
  console.log(`Permisos para el módulo ${moduleId}: ${modulePermissions.length}`);
  
  // Imprimimos detalle de cada permiso
  modulePermissions.forEach((permission, index) => {
    console.log(`Permiso ${index + 1}:`);
    console.log(`- module_id: ${permission.module_id}`);
    console.log(`- conceptos_project_id: ${permission.conceptos_project_id}`);
    console.log(`- contractual_project_id: ${permission.contractual_project_id}`);
    console.log(`- repo_project_id: ${permission.repo_project_id}`);
  });
  
  // Verificar si tiene acceso completo
  const hasFullAccess = modulePermissions.some(p => {
    if (projectType === 'conceptos') return p.conceptos_project_id === null;
    if (projectType === 'contractual') return p.contractual_project_id === null;
    if (projectType === 'repo') return p.repo_project_id === null;
    return false;
  });
  
  console.log(`¿Tiene acceso completo para ${projectType}?: ${hasFullAccess}`);
  
  // Listar proyectos permitidos
  const allowedProjectIds = modulePermissions
    .map(p => {
      if (projectType === 'conceptos') return p.conceptos_project_id;
      if (projectType === 'contractual') return p.contractual_project_id;
      if (projectType === 'repo') return p.repo_project_id;
      return null;
    })
    .filter(id => id !== null && id !== undefined) as string[];
  
  console.log(`Proyectos permitidos: ${allowedProjectIds.join(', ') || 'Ninguno'}`);
}

export async function getUserProjectPermissionsByModule(
  userId: string, 
  organizationId: string, 
  moduleId: number,
  projectType: 'conceptos' | 'contractual' | 'repo'
): Promise<{
  isOwner: boolean;
  hasFullAccess: boolean;
  allowedProjectIds: string[];
}> {
  const supabase = createClient();
  
  // Verificar si el usuario es propietario de la organización
  const isOwner = await checkOrganizationOwnership(userId, organizationId);
  
  // Para debugging: registrar los permisos detallados
  await logUserPermissionsForModuleType(userId, moduleId, projectType);
  
  // Si es propietario, tiene acceso completo
  if (isOwner) {
    return {
      isOwner: true,
      hasFullAccess: true,
      allowedProjectIds: []
    };
  }
  
  // Obtener permisos de usuario para este módulo
  const { data: permissions, error } = await supabase
    .from('user_module_projects')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId);
  
  if (error) {
    console.error('Error fetching user permissions:', error);
    return {
      isOwner: false,
      hasFullAccess: false,
      allowedProjectIds: []
    };
  }
  
  let hasFullAccess = false;
  const allowedProjectIds: string[] = [];
  
  // Verificar permisos según el tipo de proyecto
  permissions?.forEach(permission => {
    if (projectType === 'conceptos' && permission.conceptos_project_id === null) {
      hasFullAccess = true;
    } else if (projectType === 'conceptos' && permission.conceptos_project_id) {
      allowedProjectIds.push(permission.conceptos_project_id);
    }
    
    if (projectType === 'contractual' && permission.contractual_project_id === null) {
      hasFullAccess = true;
    } else if (projectType === 'contractual' && permission.contractual_project_id) {
      allowedProjectIds.push(permission.contractual_project_id);
    }
    
    if (projectType === 'repo' && permission.repo_project_id === null) {
      hasFullAccess = true;
    } else if (projectType === 'repo' && permission.repo_project_id) {
      allowedProjectIds.push(permission.repo_project_id);
    }
  });
  
  return {
    isOwner,
    hasFullAccess,
    allowedProjectIds
  };
} 