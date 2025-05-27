'use server'

import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';

export interface ContractInvite {
  id: string;
  user_id: string;
  contract_id: string;
  status: string;
  ending?: { url: string; status: string };
  contracts?: {
    name: string;
    contract_draft_url?: string;
  };
}

export interface ContractStatus {
  precontractual: boolean;
  signed: boolean;
  contractual: boolean;
}

export interface ContractData {
  id: string;
  name: string;
  contractDraftUrl?: string;
}

export interface UserContractData {
  user: any;
  contracts: ContractInvite[];
  signature: string | null;
}

/**
 * Obtiene todos los datos iniciales del usuario de forma paralela
 */
export async function getUserContractData(): Promise<{
  success: boolean;
  data?: UserContractData;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const user = await getUser(supabase);

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [contractsResult, signatureResult] = await Promise.all([
      // Obtener contratos del usuario
      supabase
        .from('contract_members')
        .select(`
          *,
          contracts:contract_id (
            name, 
            contract_draft_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending'),
      
      // Obtener firma del usuario
      supabase
        .from('users')
        .select('signature')
        .eq('id', user.id)
        .maybeSingle()
    ]);

    if (contractsResult.error) {
      console.error('Error al obtener contratos:', contractsResult.error);
      return { success: false, error: 'Error al obtener contratos' };
    }

    if (signatureResult.error) {
      console.error('Error al obtener firma:', signatureResult.error);
      return { success: false, error: 'Error al obtener firma' };
    }

    return {
      success: true,
      data: {
        user,
        contracts: contractsResult.data || [],
        signature: signatureResult.data?.signature || null
      }
    };
  } catch (error) {
    console.error('Error en getUserContractData:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtiene los datos completos de un contrato incluyendo su estado
 */
export async function getContractFullData(contractMemberId: string): Promise<{
  success: boolean;
  data?: {
    contractId: string;
    contractData: ContractData | null;
    status: ContractStatus | null;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Ejecutar consultas en paralelo
    const [memberResult, statusResult] = await Promise.all([
      // Obtener contract_id y datos del contrato
      supabase
        .from('contract_members')
        .select(`
          contract_id,
          contracts:contract_id (
            id,
            name,
            contract_draft_url
          )
        `)
        .eq('id', contractMemberId)
        .single(),
      
      // Obtener status del contrato
      supabase.rpc('get_contract_status', {
        p_contract_member_id: contractMemberId
      })
    ]);

    if (memberResult.error) {
      console.error('Error al obtener datos del contrato:', memberResult.error);
      return { success: false, error: 'Error al obtener datos del contrato' };
    }

    if (statusResult.error) {
      console.error('Error al obtener status del contrato:', statusResult.error);
      return { success: false, error: 'Error al obtener status del contrato' };
    }

    const contractData = memberResult.data?.contracts ? {
      id: (memberResult.data.contracts as any).id,
      name: (memberResult.data.contracts as any).name,
      contractDraftUrl: (memberResult.data.contracts as any).contract_draft_url
    } : null;

    return {
      success: true,
      data: {
        contractId: memberResult.data.contract_id,
        contractData,
        status: statusResult.data
      }
    };
  } catch (error) {
    console.error('Error en getContractFullData:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Refresca el status de un contrato específico
 */
export async function refreshContractStatus(contractMemberId: string): Promise<{
  success: boolean;
  data?: ContractStatus;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_contract_status', {
      p_contract_member_id: contractMemberId
    });
    
    if (error) {
      console.error('Error al actualizar status:', error);
      return { success: false, error: 'Error al actualizar status' };
    }
    
    // Revalidar la página para actualizar cache
    revalidatePath('/landing/contratista');
    
    return { success: true, data };
  } catch (error) {
    console.error('Error en refreshContractStatus:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 