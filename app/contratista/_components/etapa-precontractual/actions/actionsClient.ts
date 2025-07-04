"use client"

import { createClient } from '@/lib/supabase/client'
import { sanitizeFileName } from '@/lib/utils'

// Interface for document response
interface DocumentResponse {
  id: string;
  contract_member_id: string;
  required_document_id: string;
  url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Verifies a document using AI before upload
 */
async function verifyDocument(file: File, documentName: string): Promise<{ success: boolean; isValid?: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentName', documentName);

    const response = await fetch('/api/verify-document', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error verifying document');
    }

    return {
      success: result.success,
      isValid: result.isValid
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown verification error'
    };
  }
}

/**
 * Uploads a precontractual document
 * Uses the contractual_document_id from the database to update the URL
 */
export async function uploadPrecontractualDocument(formData: FormData, documentName?: string): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> {
  try {
    const supabase = createClient()
    const file = formData.get('file') as File | null
    const memberId = formData.get('memberId') as string
    const contractualDocumentId = formData.get('contractualDocumentId') as string
    const requiredDocumentId = formData.get('requiredDocumentId') as string

    if (!file) {
      throw new Error('File not provided')
    }
    
    // Verify document if documentName is provided
    if (documentName) {
      const verification = await verifyDocument(file, documentName);
      
      if (!verification.success) {
        throw new Error(verification.error || 'Error verifying document');
      }
      
      if (!verification.isValid) {
        return {
          success: false,
          error: '❌ La IA detectó que este documento no es el correcto'
        };
      }
    }

    let finalContractualDocumentId = contractualDocumentId;

    // If we don't have a contractual_document_id, create one
    if (!contractualDocumentId || contractualDocumentId === 'null') {
      if (!requiredDocumentId) {
        throw new Error('Required document ID not provided');
      }
      
      const { data: newDoc, error: createError } = await supabase
        .from('contractual_documents')
        .insert({
          contract_member_id: memberId,
          required_document_id: requiredDocumentId,
          url: '', // Will be updated after upload
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating document record: ${createError.message}`);
      }

      finalContractualDocumentId = newDoc.id;
    }

    const sanitizedFileName = sanitizeFileName(file.name)
    // Store in the precontractual folder
    const path = `precontractualdocuments/${memberId}/${sanitizedFileName}`

    // 1. Upload file to storage bucket
    const { error: storageError } = await supabase.storage
      .from('contractual')
      .upload(path, file, {
        upsert: true
      })

    if (storageError) {
      throw new Error(`Error uploading file: ${storageError.message}`)
    }

    // 2. Get the public URL for the file
    const { data: urlData } = await supabase.storage
      .from('contractual')
      .getPublicUrl(path)

    const fileUrl = urlData?.publicUrl || ''

    // 3. Update the document URL in the database using contractual_document_id
    const { data, error: updateError } = await supabase
      .from('contractual_documents')
      .update({
        url: fileUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', finalContractualDocumentId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    return {
      success: true,
      data: {
        ...data,
        url: fileUrl
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
 * Replaces an existing precontractual document
 * Uses the contractual_document_id from the database to update the URL
 */
export async function replacePrecontractualDocument(formData: FormData, documentName?: string): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> {
  try {
    const supabase = createClient()
    const file = formData.get('file') as File | null
    const contractualDocumentId = formData.get('contractualDocumentId') as string
    const memberId = formData.get('memberId') as string

    if (!file) {
      throw new Error('File not provided')
    }

    if (!contractualDocumentId) {
      throw new Error('Document ID not provided')
    }

    // Verify document if documentName is provided
    if (documentName) {
      const verification = await verifyDocument(file, documentName);
      
      if (!verification.success) {
        throw new Error(verification.error || 'Error verifying document');
      }
      
      if (!verification.isValid) {
        return {
          success: false,
          error: '❌ La IA detectó que este documento no es el correcto'
        };
      }
    }

    const sanitizedFileName = sanitizeFileName(file.name)
    const path = `precontractualdocuments/${memberId}/${sanitizedFileName}`

    // 1. Upload replacement file to storage bucket
    const { error: storageError } = await supabase.storage
      .from('contractual')
      .upload(path, file, {
        upsert: true
      })

    if (storageError) {
      throw new Error(`Error uploading file: ${storageError.message}`)
    }

    // 2. Get the public URL for the file
    const { data: urlData } = await supabase.storage
      .from('contractual')
      .getPublicUrl(path)

    const fileUrl = urlData?.publicUrl || ''

    // 3. Update the document URL in the database using contractual_document_id
    const { data, error: updateError } = await supabase
      .from('contractual_documents')
      .update({
        url: fileUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractualDocumentId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    return {
      success: true,
      data: {
        ...data,
        url: fileUrl
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
 * Creates a signed URL for viewing a document
 */
export async function createDocumentSignedUrl(fileUrl: string): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    if (!fileUrl?.trim()) {
      throw new Error('URL del documento no proporcionada')
    }
    
    // For external URLs (like templates), return as is
    if (fileUrl.startsWith('https://papeleo.co/docgen')) {
      return { success: true, data: fileUrl }
    }

    const supabase = createClient()
    
    // Extract the path from the URL - we need just the path relative to the bucket
    const urlObj = new URL(fileUrl)
    const pathParts = urlObj.pathname.split('/')
    // Remove the first part which is usually /storage/v1/object/public/bucketname
    const relevantPathIndex = pathParts.findIndex(part => part === 'contractual')
    const storagePath = pathParts.slice(relevantPathIndex + 1).join('/')
    
    if (!storagePath) {
      throw new Error('No se pudo extraer la ruta del documento')
    }

    // Create signed URL valid for 1 hour
    const { data, error } = await supabase.storage
      .from('contractual')
      .createSignedUrl(storagePath, 3600)

    if (error) {
      throw new Error(`Error al crear URL firmada: ${error.message}`)
    }

    if (!data?.signedUrl) {
      throw new Error('No se recibió URL firmada')
    }

    return {
      success: true,
      data: data.signedUrl
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message
    }
  }
} 