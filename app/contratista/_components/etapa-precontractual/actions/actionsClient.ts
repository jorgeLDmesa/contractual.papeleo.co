"use client"

import { createClient } from '@/lib/supabase/client'
import { sanitizeFileName } from '@/lib/utils'

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
    
    console.log('Gemini verification result:', result);
    
    if (!response.ok) {
      throw new Error(result.error || 'Error verifying document');
    }

    return {
      success: result.success,
      isValid: result.isValid
    };
  } catch (error) {
    console.error('Error verifying document:', error);
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
export async function uploadPrecontractualDocument(formData: FormData, documentName?: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient()
    const file = formData.get('file') as File | null
    const memberId = formData.get('memberId') as string
    const contractId = formData.get('contractId') as string
    const contractualDocumentId = formData.get('contractualDocumentId') as string
    const requiredDocumentId = formData.get('requiredDocumentId') as string

    console.log('Upload parameters:', {
      contractualDocumentId,
      memberId,
      contractId,
      fileName: file?.name,
      documentName,
      requiredDocumentId
    });

    if (!file) {
      throw new Error('File not provided')
    }
    
    // Verify document if documentName is provided
    if (documentName) {
      console.log('Verifying document with AI...');
      const verification = await verifyDocument(file, documentName);
      
      if (!verification.success) {
        throw new Error(verification.error || 'Error verifying document');
      }
      
      if (!verification.isValid) {
        console.log('🤖 AI validation result: Document does not match expected type');
        return {
          success: false,
          error: '❌ La IA detectó que este documento no es el correcto'
        };
      }
      
      console.log('Document verified successfully');
    }

    let finalContractualDocumentId = contractualDocumentId;

    // If we don't have a contractual_document_id, create one
    if (!contractualDocumentId || contractualDocumentId === 'null') {
      if (!requiredDocumentId) {
        throw new Error('Required document ID not provided');
      }
      
      console.log('Creating new contractual_documents record...');
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
        console.error('Error creating contractual document:', createError);
        throw new Error(`Error creating document record: ${createError.message}`);
      }

      finalContractualDocumentId = newDoc.id;
      console.log('Created new contractual document with ID:', finalContractualDocumentId);
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
      console.error('Storage upload error:', storageError);
      throw new Error(`Error uploading file: ${storageError.message}`)
    }

    // 2. Get the public URL for the file
    const { data: urlData } = await supabase.storage
      .from('contractual')
      .getPublicUrl(path)

    const fileUrl = urlData?.publicUrl || ''
    console.log('File uploaded, URL:', fileUrl);

    // 3. Update the document URL in the database using contractual_document_id
    console.log('Updating document with ID:', finalContractualDocumentId);
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
      console.error('Database update error:', updateError);
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    console.log('Document updated successfully:', data);
    return {
      success: true,
      data: {
        ...data,
        url: fileUrl
      }
    }
  } catch (err) {
    console.error('Error in uploadPrecontractualDocument:', err)
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
export async function replacePrecontractualDocument(formData: FormData, documentName?: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient()
    const file = formData.get('file') as File | null
    const contractualDocumentId = formData.get('contractualDocumentId') as string
    const memberId = formData.get('memberId') as string
    const contractId = formData.get('contractId') as string

    console.log('Replace parameters:', {
      contractualDocumentId,
      memberId,
      contractId,
      fileName: file?.name,
      documentName
    });

    if (!file) {
      throw new Error('File not provided')
    }

    if (!contractualDocumentId) {
      throw new Error('Document ID not provided')
    }

    // Verify document if documentName is provided
    if (documentName) {
      console.log('Verifying replacement document with AI...');
      const verification = await verifyDocument(file, documentName);
      
      if (!verification.success) {
        throw new Error(verification.error || 'Error verifying document');
      }
      
      if (!verification.isValid) {
        console.log('🤖 AI validation result: Replacement document does not match expected type');
        return {
          success: false,
          error: '❌ La IA detectó que este documento no es el correcto'
        };
      }
      
      console.log('Replacement document verified successfully');
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
      console.error('Storage upload error:', storageError);
      throw new Error(`Error uploading file: ${storageError.message}`)
    }

    // 2. Get the public URL for the file
    const { data: urlData } = await supabase.storage
      .from('contractual')
      .getPublicUrl(path)

    const fileUrl = urlData?.publicUrl || ''
    console.log('File replaced, new URL:', fileUrl);

    // 3. Update the document URL in the database using contractual_document_id
    console.log('Updating document with ID:', contractualDocumentId);
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
      console.error('Database update error:', updateError);
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    console.log('Document updated successfully:', data);
    return {
      success: true,
      data: {
        ...data,
        url: fileUrl
      }
    }
  } catch (err) {
    console.error('Error in replacePrecontractualDocument:', err)
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
      console.error('Error creating signed URL:', error)
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
    console.error('Error in createDocumentSignedUrl:', err)
    return {
      success: false,
      error: (err as Error).message
    }
  }
} 