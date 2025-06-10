"use client"

import { createClient } from "@/lib/supabase/client"
import { getContratanteData } from "./actionServer"

/**
 * Uploads a signature file to the "organization_logos" folder in the "images" bucket
 * @param projectId The ID of the project to associate with the signature
 * @param file The signature file to upload
 * @returns The URL of the uploaded signature
 */
export async function uploadProjectSignature(projectId: string, file: File) {
  const supabase = createClient()
  
  const bucketName = "images"
  const folderPath = "signatures/projects"  // Use the same folder as logo uploads

  // Extraer la extensión del archivo
  const fileExt = file.name.split(".").pop();
  // Nombrar el archivo usando el projectId y la extensión original
  const fileName = `${projectId}.${fileExt}`;
  const filePath = `${folderPath}/${fileName}`;

  // Intentar eliminar el archivo anterior (si existe) para evitar conflictos
  try {
    await supabase.storage.from(bucketName).remove([filePath]);
  } catch (removeError) {
    console.error("Error removing previous signature (continuamos):", removeError);
  }

  // Subir el nuevo archivo sin upsert, ya que eliminamos el anterior
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });
  
  if (uploadError) {
    console.error("Error uploading signature:", uploadError);
    throw uploadError;
  }

  // Obtener la URL pública del archivo subido
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;
  
  return publicUrl;
}

/**
 * Gets the public URL of a project's signature
 * @param projectId The ID of the project
 * @param fileExt The file extension (defaults to png)
 * @returns The public URL of the signature
 */
export function getProjectSignatureUrl(projectId: string, fileExt = "png") {
  const supabase = createClient()
  const bucketName = "images"
  const folderPath = "signatures/projects"
  const filePath = `${folderPath}/${projectId}.${fileExt}`
  
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

/**
 * Deletes a project's signature from storage
 * @param projectId The ID of the project
 * @param fileExt The file extension (defaults to png)
 */
export async function deleteProjectSignature(projectId: string, fileExt = "png") {
  const supabase = createClient()
  const bucketName = "images"
  const folderPath = "signatures/projects"
  const filePath = `${folderPath}/${projectId}.${fileExt}`
  
  try {
    const { error: removeError } = await supabase.storage
      .from(bucketName)
      .remove([filePath])
    
    if (removeError) {
      console.error("Error deleting signature file:", removeError);
      throw removeError;
    }
    
    return true
  } catch (error) {
    console.error("Error in deleteProjectSignature:", error);
    throw error;
  }
}

/**
 * Uploads a signature from a data URL to storage
 * @param projectId The ID of the project
 * @param dataURL The data URL of the signature
 * @returns The public URL of the uploaded signature
 */
export async function uploadSignatureFromDataURL(projectId: string, dataURL: string) {
  try {
    // Convert data URL to blob
    const response = await fetch(dataURL)
    const blob = await response.blob()
    
    // Create a file from the blob with a more descriptive name
    const timestamp = new Date().getTime()
    const file = new File([blob], `signature_${timestamp}.png`, { type: 'image/png' })
    
    // Upload the file
    const publicUrl = await uploadProjectSignature(projectId, file)
    
    return publicUrl
  } catch (error) {
    console.error("Error uploading signature from data URL:", error)
    throw error
  }
}

/**
 * Fetches the contratante data for a project
 * @param projectId The ID of the project
 * @returns The contratante data JSON or null
 */
export async function fetchContratanteData(projectId: string) {
  try {
    const data = await getContratanteData(projectId)
    return data
  } catch (error) {
    console.error("Error fetching contratante data:", error)
    return null
  }
}

/**
 * Updates the contratante data for a project
 * @param projectId The ID of the project
 * @param contratanteData The contratante data JSON to save
 * @returns Result with success status
 */
export async function saveContratanteData(projectId: string, contratanteData: Record<string, string>) {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from("contractual_projects")
      .update({ contratante_data: contratanteData })
      .eq("id", projectId)
    
    if (error) {
      console.error("Error updating contratante data:", error)
      return { success: false, error }
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error saving contratante data:", error)
    return { success: false, error }
  }
}

/**
 * Checks if a user exists by email
 * @param email The email to check
 * @returns User data if exists, null otherwise
 */
export async function checkUserExists(email: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    return null
  }

  return data
}

/**
 * Process contract document and replace specific values in the document
 * @param userId The ID of the user being invited
 * @param contractId The ID of the contract
 * @param value The value entered in the invitation modal
 * @param endDate The end date selected in the modal
 * @param projectId The ID of the project
 * @returns Boolean indicating success
 */
export async function processContractDocument(
  userId: string,
  contractId: string,
  value: string,
  endDate?: Date,
  projectId?: string
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Fetch the contract to get the contract_draft_url
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('contract_draft_url')
      .eq('id', contractId)
      .single();
    
    if (contractError || !contract?.contract_draft_url) {
      console.error('Error fetching contract or no draft URL:', contractError);
      return false;
    }
    
    // Check if the contract_draft_url starts with "https://papeleo.co/docgen"
    if (!contract.contract_draft_url.startsWith('https://papeleo.co/docgen')) {
      // No processing needed for non-matching URLs
      return true;
    }
    
    // Extract the document ID from the URL
    const documentId = contract.contract_draft_url.split('/').pop();
    if (!documentId) {
      console.error('Failed to extract document ID from URL:', contract.contract_draft_url);
      return false;
    }
    
    // Fetch the document from the documents table
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('sections')
      .eq('id', documentId)
      .single();
    
    if (documentError || !document?.sections) {
      console.error('Error fetching document or no sections:', documentError);
      return false;
    }
    
    // Fetch the user's information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('document_id, email')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return false;
    }
    
    // Process the document sections
    let sections = { ...document.sections };
    
    // Replace placeholders in all sections
    Object.keys(sections).forEach(sectionKey => {
      if (sections[sectionKey] && sections[sectionKey].content) {
        let content = sections[sectionKey].content;
        
        // Replace value placeholder
        if (value) {
          content = content.replace(/\$\{value\}/g, value);
        }
        
        // Replace end date placeholder
        if (endDate) {
          const formattedDate = endDate.toLocaleDateString('es-ES');
          content = content.replace(/\$\{endDate\}/g, formattedDate);
        }
        
        // Replace user email placeholder
        content = content.replace(/\$\{userEmail\}/g, user.email);
        
        sections[sectionKey].content = content;
      }
    });
    
    // Process signatures section if project ID is provided
    if (projectId && sections["2. FIRMAS"]) {
      // Fetch project signature from contractual_projects table
      const { data: project, error: projectError } = await supabase
        .from('contractual_projects')
        .select('signature')
        .eq('id', projectId)
        .single();
      
      if (!projectError && project?.signature) {
        // Replace the last <hr> tag with the signature image
        let firmasContent = sections["2. FIRMAS"].content;
        
        // Only proceed if firmasContent exists and is a string
        if (firmasContent && typeof firmasContent === 'string') {
          // Find the last occurrence of the hr tag
          const lastHrIndex = firmasContent.lastIndexOf("<hr style='width: 150px;'>");
          
          if (lastHrIndex !== -1) {
            // Replace only the last occurrence
            const beforeHr = firmasContent.substring(0, lastHrIndex);
            const afterHr = firmasContent.substring(lastHrIndex + "<hr style='width: 150px;'>".length);
            
            firmasContent = beforeHr + 
              `<img src='${project.signature}' style='max-width:150px'><br>` + 
              afterHr;
            
            // Update the sections object
            sections = {
              ...sections,
              "2. FIRMAS": {
                ...sections["2. FIRMAS"],
                content: firmasContent
              }
            };
          }
        } else {
          console.warn("Cannot process signature - firmasContent is not available in the document");
        }
      }
    }
    
    // Fetch the contract member entry
    const { data: contractMember, error: memberError } = await supabase
      .from('contract_members')
      .select('id')
      .eq('user_id', userId)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (memberError || !contractMember) {
      console.error('Error fetching contract member:', memberError);
      return false;
    }
    
    // Update the contract member with the processed sections
    const { error: updateError } = await supabase
      .from('contract_members')
      .update({
        contract: sections
      })
      .eq('id', contractMember.id);
    
    if (updateError) {
      console.error('Error updating contract member:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error processing contract document:', error);
    return false;
  }
} 