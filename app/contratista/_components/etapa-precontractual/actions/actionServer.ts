"use server"

import { createClient } from '@/lib/supabase/server'

// ========================================
// TYPES DEFINITIONS
// ========================================

export async function getPrecontractualDocuments(contractMemberId: string) {
  try {
    const supabase = await createClient()
    
    // First, get the contract_id from contract_members
    const { data: memberData, error: memberError } = await supabase
      .from('contract_members')
      .select('contract_id')
      .eq('id', contractMemberId)
      .single()
    
    if (memberError || !memberData) {
      console.error('Error fetching contract member:', memberError)
      throw new Error('Contract member not found')
    }
    
    // Get required documents of type "precontractual" for this contract
    const { data: requiredDocs, error: requiredError } = await supabase
      .from('required_documents')
      .select('*')
      .eq('contract_id', memberData.contract_id)
      .eq('type', 'precontractual')
      .is('deleted_at', null)
      .order('name', { ascending: true })
    
    if (requiredError) {
      console.error('Error fetching required documents:', requiredError)
      throw new Error(requiredError.message)
    }
    
    if (!requiredDocs || requiredDocs.length === 0) {
      return {
        success: true,
        data: []
      }
    }
    
    // Get the contractual_documents that have been uploaded for this member
    const { data: contractualDocs, error: contractualError } = await supabase
      .from('contractual_documents')
      .select('*')
      .eq('contract_member_id', contractMemberId)
      .in('required_document_id', requiredDocs.map(doc => doc.id))
    
    if (contractualError) {
      console.error('Error fetching contractual documents:', contractualError)
      // Don't throw error here, just log it - we can still show required docs without uploaded ones
    }
    
    // Map required documents with their uploaded counterparts
    const documentsWithUploads = requiredDocs.map(requiredDoc => {
      const uploadedDoc = contractualDocs?.find(
        contractualDoc => contractualDoc.required_document_id === requiredDoc.id
      )
      
      return {
        id: requiredDoc.id,
        name: requiredDoc.name,
        url: uploadedDoc?.url || null,
        type: 'precontractual',
        month: uploadedDoc?.month || null,
        template_id: requiredDoc.template_id || null,
        required_document_id: requiredDoc.id,
        contractual_document_id: uploadedDoc?.id || null
      }
    })
    
    console.log('Precontractual documents fetched successfully:', documentsWithUploads);
    
    return {
      success: true,
      data: documentsWithUploads
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