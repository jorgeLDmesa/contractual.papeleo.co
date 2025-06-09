"use client"

import { createClient } from '@/lib/supabase/client'
import { sanitizeFileName } from '@/lib/utils'
import { ContractualDocument } from './actionServer'

/**
 * Uploads a contractual document
 */
export async function uploadContractualDocument(
  file: File, 
  contractMemberId: string, 
  memberDocument: ContractualDocument
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const supabase = createClient()

    if (!file) {
      throw new Error('File not provided')
    }
    
    if (!contractMemberId) {
      throw new Error('Contract Member ID not provided')
    }

    // Only validate required_document_id if we don't have a contractualDocumentId
    let requiredDocumentId: string | undefined;
    
    if (!memberDocument.contractualDocumentId) {
      requiredDocumentId = memberDocument.required_document_id || memberDocument.id;
      if (!requiredDocumentId) {
        console.error('Member document data:', memberDocument);
        throw new Error('Required Document ID not provided - invalid document data')
      }
    }

    const sanitizedFileName = sanitizeFileName(file.name)
    // Store in the contractual folder
    const path = `contractualdocuments/${contractMemberId}/${sanitizedFileName}`

    // Upload file to storage
    const { error: storageError } = await supabase.storage
      .from('contractual')
      .upload(path, file, {
        upsert: true
      })

    if (storageError) {
      throw new Error(`Error uploading file: ${storageError.message}`)
    }

    // Create public URL for the file
    const { data: urlData } = await supabase.storage
      .from('contractual')
      .getPublicUrl(path)

    const fileUrl = urlData?.publicUrl || ''

    let dbData

    // If we have a contractualDocumentId, update it
    if (memberDocument.contractualDocumentId) {
      const { data, error: updateError } = await supabase
        .from('contractual_documents')
        .update({
          url: fileUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberDocument.contractualDocumentId)
        .select("*")
        .single()

      if (updateError) {
        throw new Error(`Error updating document: ${updateError.message}`)
      }
      
      dbData = data
    } else {
      // Check if there's already a document for this member, required document and month
      let existingDoc = null
      
      if (memberDocument.month) {
        const { data: existingData } = await supabase
          .from('contractual_documents')
          .select('*')
          .eq('contract_member_id', contractMemberId)
          .eq('required_document_id', requiredDocumentId!)
          .eq('month', memberDocument.month)
          .maybeSingle()
          
        existingDoc = existingData
      } else {
        // If no month, just search by member and required document
        const { data: existingData } = await supabase
          .from('contractual_documents')
          .select('*')
          .eq('contract_member_id', contractMemberId)
          .eq('required_document_id', requiredDocumentId!)
          .maybeSingle()
          
        existingDoc = existingData
      }
      
      if (existingDoc) {
        // Update existing document
        const { data, error: updateError } = await supabase
          .from('contractual_documents')
          .update({
            url: fileUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDoc.id)
          .select("*")
          .single()

        if (updateError) {
          throw new Error(`Error updating document: ${updateError.message}`)
        }
        
        dbData = data
      } else {
        // Create new document
        const { data, error: insertError } = await supabase
          .from('contractual_documents')
          .insert({
            contract_member_id: contractMemberId,
            required_document_id: requiredDocumentId!,
            url: fileUrl,
            month: memberDocument.month || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select("*")
          .single()

        if (insertError) {
          throw new Error(`Error inserting document: ${insertError.message}`)
        }
        
        dbData = data
      }
    }

    return {
      success: true,
      data: {
        ...dbData,
        url: fileUrl,
        required_document_id: requiredDocumentId || dbData.required_document_id,
        id: dbData.id,
        type: 'contractual',
        month: memberDocument.month || null
      }
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message
    }
  }
}

/**
 * Uploads an extra contractual document
 */
export async function uploadContractualExtraDocument(
  file: File, 
  contractMemberId: string, 
  documentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = createClient();
    
    // Generate a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `extra/${contractMemberId}/${documentId}_${Date.now()}.${fileExtension}`;
    
    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('contractual')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('contractual')
      .getPublicUrl(fileName);

    // Update the document record
    const { error: updateError } = await supabase
      .from('contractual_extra_documents')
      .update({
        url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: 'Error uploading file' };
  }
}

/**
 * Deletes an extra contractual document
 */
export async function deleteContractualExtraDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('contractual_extra_documents')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: 'Error deleting document' };
  }
}

/**
 * Creates a signed URL for document preview
 */
export async function createDocumentSignedUrl(fileUrl: string): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    // Extract path from the full URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'contractual');
    
    if (bucketIndex === -1) {
      throw new Error('Invalid file URL format');
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    const { data, error } = await supabase.storage
      .from('contractual')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      success: true,
      data: data.signedUrl
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message
    };
  }
} 