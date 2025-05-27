"use server"

import { createClient } from '@/lib/supabase/server'

// Define the document type returned by the RPC function
type ContractDocument = {
  name: string;
  url: string | null;
  month: string | null;
}

// Define the document type for the frontend
export type ContractualDocument = {
  id: string;
  name: string;
  url?: string | null;
  type: string;
  month?: string | null;
  template_id?: number | null;
  required_document_id?: string;
  contractualDocumentId?: string;
}

// Define the document group type
export type DocumentGroup = {
  month: string;
  docs: ContractualDocument[];
}

/**
 * Fetches contractual documents and organizes them by month
 */
export async function getContractualDocuments(contractMemberId: string) {
  try {
    const supabase = createClient()
    
    // Call the get_contract_documents function with type "contractual"
    const { data, error } = await supabase
      .rpc('get_contract_documents', {
        p_contract_member_id: contractMemberId,
        p_type: 'contractual'
      })
    
    if (error) {
      console.error('Error fetching contractual documents:', error)
      throw new Error(error.message)
    }
    
    // Group documents by month
    const documentsByMonth: Record<string, ContractualDocument[]> = {}
    
    data.forEach((doc: any) => {
      const month = doc.month || 'Sin mes asignado'
      if (!documentsByMonth[month]) {
        documentsByMonth[month] = []
      }
      
      // Ensure we always have a valid required_document_id
      const requiredDocumentId = doc.required_document_id || doc.id || doc.document_id;
      
      documentsByMonth[month].push({
        id: requiredDocumentId, // Using required_document_id as identifier
        name: doc.name,
        url: doc.url,
        type: 'contractual',
        month: doc.month || 'Sin mes asignado',
        contractualDocumentId: doc.contractual_document_id, // Use the actual contractual_document_id
        required_document_id: requiredDocumentId // Use the actual required_document_id
      })
    })
    
    // Sort months in a logical order (January to December, with "Sin mes asignado" at the end)
    const monthOrder: Record<string, number> = {
      'enero': 1,
      'febrero': 2,
      'marzo': 3,
      'abril': 4,
      'mayo': 5,
      'junio': 6,
      'julio': 7, 
      'agosto': 8,
      'septiembre': 9,
      'octubre': 10,
      'noviembre': 11,
      'diciembre': 12,
      'Sin mes asignado': 13
    }
    
    // Convert to array of DocumentGroup and sort
    const documentGroups: DocumentGroup[] = Object.entries(documentsByMonth).map(([month, docs]) => ({
      month,
      docs
    }))
    
    documentGroups.sort((a, b) => {
      const orderA = monthOrder[a.month] || 99
      const orderB = monthOrder[b.month] || 99
      return orderA - orderB
    })
    
    return {
      success: true,
      data: documentGroups
    }
  } catch (error) {
    console.error('Error in getContractualDocuments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error fetching contractual documents',
      data: []
    }
  }
} 

export async function getContractIdFromMember(contractMemberId: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('contract_members')
      .select('contract_id')
      .eq('id', contractMemberId)
      .single()
    
    if (error) {
      console.error('Error fetching contract_id:', error)
      return { success: false, error: error.message }
    }
    
    if (!data) {
      return { success: false, error: 'Contract member not found' }
    }
    
    return { success: true, data: data.contract_id }
  } catch (error) {
    console.error('Error in getContractIdFromMember:', error)
    return { success: false, error: 'Failed to get contract ID' }
  }
} 

// Function to get contractual extra documents
export async function getContractualExtraDocuments(contractMemberId: string): Promise<{
  success: boolean;
  data?: DocumentGroup[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    // Fetch extra documents from the new table
    const { data: extraDocs, error } = await supabase
      .from('contractual_extra_documents')
      .select('*')
      .eq('contract_member_id', contractMemberId)
      .is('deleted_at', null);
    
    if (error) {
      console.error('Error fetching extra documents:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Group by month
    const groupedByMonth: { [key: string]: any[] } = {};
    
    extraDocs.forEach((doc: any) => {
      const month = doc.month || 'Sin mes asignado';
      
      if (!groupedByMonth[month]) {
        groupedByMonth[month] = [];
      }
      
      groupedByMonth[month].push({
        id: doc.id,
        name: doc.name,
        type: 'contractual-extra',
        url: doc.url,
        month: doc.month,
        contract_member_id: doc.contract_member_id
      });
    });
    
    const result: DocumentGroup[] = Object.entries(groupedByMonth).map(([month, docs]) => ({
      month,
      docs
    }));
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error fetching contractual extra documents:', error);
    return {
      success: false,
      error: 'Error fetching contractual extra documents'
    };
  }
}

/**
 * Fetches all documents (both contractual and extra) and organizes them by month
 */
export async function getAllDocuments(contractMemberId: string): Promise<{
  success: boolean;
  data?: DocumentGroup[];
  error?: string;
}> {
  try {
    // Get both contractual and extra documents
    const [contractualResult, extraResult] = await Promise.all([
      getContractualDocuments(contractMemberId),
      getContractualExtraDocuments(contractMemberId)
    ]);
    
    if (!contractualResult.success) {
      return contractualResult;
    }
    
    if (!extraResult.success) {
      return extraResult;
    }
    
    const contractualGroups = contractualResult.data || [];
    const extraGroups = extraResult.data || [];
    
    // Merge both types of documents by month
    const mergedGroups: { [key: string]: ContractualDocument[] } = {};
    
    // Add contractual documents
    contractualGroups.forEach(group => {
      if (!mergedGroups[group.month]) {
        mergedGroups[group.month] = [];
      }
      mergedGroups[group.month].push(...group.docs);
    });
    
    // Add extra documents
    extraGroups.forEach(group => {
      if (!mergedGroups[group.month]) {
        mergedGroups[group.month] = [];
      }
      mergedGroups[group.month].push(...group.docs);
    });
    
    // Sort months in a logical order
    const monthOrder: Record<string, number> = {
      'enero': 1,
      'febrero': 2,
      'marzo': 3,
      'abril': 4,
      'mayo': 5,
      'junio': 6,
      'julio': 7, 
      'agosto': 8,
      'septiembre': 9,
      'octubre': 10,
      'noviembre': 11,
      'diciembre': 12,
      'Sin mes asignado': 13
    };
    
    // Convert to array and sort
    const result: DocumentGroup[] = Object.entries(mergedGroups)
      .map(([month, docs]) => ({ month, docs }))
      .sort((a, b) => {
        const orderA = monthOrder[a.month] || 99;
        const orderB = monthOrder[b.month] || 99;
        return orderA - orderB;
      });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error in getAllDocuments:', error);
    return {
      success: false,
      error: 'Error fetching all documents'
    };
  }
} 