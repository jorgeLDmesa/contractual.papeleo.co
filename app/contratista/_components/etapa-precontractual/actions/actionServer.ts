"use server"

import { createClient } from '@/lib/supabase/server'

// Define the document type returned by the RPC function
type ContractDocument = {
  contractual_document_id: string;  // This field comes from the SQL function
  name: string;
  url: string | null;
  month: string | null;
}

export async function getPrecontractualDocuments(contractMemberId: string) {
  try {
    const supabase = createClient()
    
    // Call the get_contract_documents function with type "precontractual"
    const { data, error } = await supabase
      .rpc('get_contract_documents', {
        p_contract_member_id: contractMemberId,
        p_type: 'precontractual'
      })
    
    if (error) {
      console.error('Error fetching precontractual documents:', error)
      throw new Error(error.message)
    }
    
    console.log('Data from get_contract_documents:', data);
    
    // Format the response to match the expected structure
    return {
      success: true,
      data: data.map((doc: ContractDocument) => ({
        id: doc.name, // Using name as ID for display purposes
        name: doc.name,
        url: doc.url || null,
        type: 'precontractual',
        month: doc.month || null,
        contractual_document_id: doc.contractual_document_id // Map the contractual_document_id directly
      }))
    }
  } catch (error) {
    console.error('Error in getPrecontractualDocuments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error fetching precontractual documents',
      data: []
    }
  }
}

/**
 * Gets the contract_id from a contract_member record
 */
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