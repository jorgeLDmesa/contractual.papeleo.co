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
    const supabase = await createClient()
    
    // Simple: Get contractual_documents for this member with month not null
    const { data: contractualDocs, error: contractualError } = await supabase
      .from('contractual_documents')
      .select(`
        id,
        required_document_id,
        url,
        month,
        required_documents(id, name, template_id)
      `)
      .eq('contract_member_id', contractMemberId)
      .not('month', 'is', null)
      .is('deleted_at', null)
    
    if (contractualError) {
      console.error('Error fetching contractual documents:', contractualError)
      throw new Error(contractualError.message)
    }
    
    console.log('Contractual docs found:', contractualDocs?.length || 0, contractualDocs);

    const allDocuments: ContractualDocument[] = [];
    
    // Process each contractual document
    if (contractualDocs && contractualDocs.length > 0) {
      contractualDocs.forEach(doc => {
        const requiredDoc = Array.isArray(doc.required_documents) 
          ? doc.required_documents[0] 
          : doc.required_documents;
        
        allDocuments.push({
          id: doc.required_document_id,
          name: requiredDoc?.name || 'Documento sin nombre',
          url: doc.url,
          type: 'contractual',
          month: doc.month,
          template_id: requiredDoc?.template_id || null,
          required_document_id: doc.required_document_id,
          contractualDocumentId: doc.id
        });
      });
    }
    
    // Group documents by month
    const documentsByMonth: Record<string, ContractualDocument[]> = {}
    
    allDocuments.forEach((doc) => {
      const month = doc.month!; // We know it's not null
      if (!documentsByMonth[month]) {
        documentsByMonth[month] = []
      }
      documentsByMonth[month].push(doc)
    })
    
    // Convert to DocumentGroup array
    const documentGroups: DocumentGroup[] = Object.entries(documentsByMonth).map(([month, docs]) => ({
      month,
      docs
    }))
    
    console.log('Contractual documents grouped by month:', documentGroups);
    
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
    const supabase = await createClient()
    
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
    const supabase = await createClient();
    
    // Simple: Get contractual_extra_documents for this member with month not null
    const { data: extraDocs, error } = await supabase
      .from('contractual_extra_documents')
      .select('*')
      .eq('contract_member_id', contractMemberId)
      .not('month', 'is', null)
      .is('deleted_at', null);
    
    if (error) {
      console.error('Error fetching extra documents:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('Extra docs found:', extraDocs?.length || 0, extraDocs);
    
    // Group by month
    const groupedByMonth: { [key: string]: ContractualDocument[] } = {};
    
    extraDocs.forEach((doc: any) => {
      const month = doc.month; // We know it's not null
      
      if (!groupedByMonth[month]) {
        groupedByMonth[month] = [];
      }
      
      groupedByMonth[month].push({
        id: doc.id,
        name: doc.name,
        type: 'contractual-extra',
        url: doc.url,
        month: doc.month,
        template_id: null,
        required_document_id: '',
        contractualDocumentId: doc.id
      });
    });
    
    const result: DocumentGroup[] = Object.entries(groupedByMonth).map(([month, docs]) => ({
      month,
      docs
    }));
    
    console.log('Extra documents grouped by month:', result);
    
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
    
    // Merge all documents by month
    const documentsByMonth: { [key: string]: ContractualDocument[] } = {};
    
    // Add contractual documents
    contractualGroups.forEach(group => {
      if (!documentsByMonth[group.month]) {
        documentsByMonth[group.month] = [];
      }
      documentsByMonth[group.month].push(...group.docs);
    });
    
    // Add extra documents
    extraGroups.forEach(group => {
      if (!documentsByMonth[group.month]) {
        documentsByMonth[group.month] = [];
      }
      documentsByMonth[group.month].push(...group.docs);
    });
    
    // Sort months in logical order
    const monthOrder: Record<string, number> = {
      'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
      'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };
    
    // Convert to array and sort
    const result: DocumentGroup[] = Object.entries(documentsByMonth)
      .map(([month, docs]) => ({ month, docs }))
      .sort((a, b) => {
        const orderA = monthOrder[a.month] || 99;
        const orderB = monthOrder[b.month] || 99;
        return orderA - orderB;
      });
    
    console.log('Final result - months found:', result.map(r => r.month));
    
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