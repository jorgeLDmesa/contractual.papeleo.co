"use client"

import { createClient } from '@/lib/supabase/client'
import { sanitizeFileName } from '@/lib/utils'

/**
 * Uploads a precontractual document
 * Uses the contractual_document_id from the database to update the URL
 */
export async function uploadPrecontractualDocument(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient()
    const file = formData.get('file') as File | null
    const memberId = formData.get('memberId') as string
    const contractId = formData.get('contractId') as string
    const contractualDocumentId = formData.get('contractualDocumentId') as string

    console.log('Upload parameters:', {
      contractualDocumentId,
      memberId,
      contractId,
      fileName: file?.name
    });

    if (!file) {
      throw new Error('File not provided')
    }
    
    if (!contractualDocumentId) {
      throw new Error('Document ID not provided')
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
export async function replacePrecontractualDocument(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
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
      fileName: file?.name
    });

    if (!file) {
      throw new Error('File not provided')
    }

    if (!contractualDocumentId) {
      throw new Error('Document ID not provided')
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