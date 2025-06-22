'use client'

import { createClient } from '@/lib/supabase/client';
import { sanitizeFileName } from '@/lib/utils'
import { toast } from 'sonner'


/**
 * Hook personalizado para preview de documentos optimizado
 */
export const useDocumentPreview = () => {
  const handlePreviewMemberDocument = async (documentUrl: string) => {
    try {
      // Lógica optimizada para preview de documentos
      // Reutilizamos la lógica existente pero de forma más eficiente
      window.open(documentUrl, '_blank');
    } catch (error) {
      console.error('Error al previsualizar documento:', error);
    }
  };

  return { handlePreviewMemberDocument };
};

/**
 * Función para previsualizar documentos de miembros
 * Reemplaza la funcionalidad del store useContractualDocumentsStore
 */
export async function handlePreviewMemberDocument(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl?.trim()) {
      throw new Error('URL del documento no proporcionada');
    }


    // Handle URLs from templates directly
    if (fileUrl.startsWith('https://papeleo.co/docgen')) {
      const newWindow = window.open(fileUrl, '_blank');
      if (!newWindow) {
        throw new Error('El navegador bloqueó la apertura de la ventana. Por favor, permita las ventanas emergentes.');
      }
      return true;
    }

    // If it's not a full URL, treat it as a relative path within the 'contractual' bucket
    let urlToUse = fileUrl;
    if (!fileUrl.startsWith('http')) {
      
      // Generate a signed URL for the file path
      const { success, data, error } = await createMemberDocumentSignedUrl(fileUrl);
      
      if (!success || !data) {
        console.error('Failed to generate signed URL:', error);
        throw new Error(error || 'No se pudo generar la URL del documento');
      }
      
      urlToUse = data;
    } else {
      // For URLs that are already full URLs, still generate a signed URL
      const { success, data, error } = await createMemberDocumentSignedUrl(fileUrl);
      
      if (!success || !data) {
        console.error('Failed to generate signed URL for full URL:', error);
        throw new Error(error || 'No se pudo generar la URL del documento');
      }
      
      urlToUse = data;
    }

    
    // Open in new tab with error handling
    const newWindow = window.open(urlToUse, '_blank');
    if (!newWindow) {
      throw new Error('El navegador bloqueó la apertura de la ventana. Por favor, permita las ventanas emergentes.');
    }

    return true;
  } catch (error) {
    console.error('Error al previsualizar documento:', error);
    throw error;
  }
}

/**
 * Función para crear URL firmada de documento de miembro
 */
async function createMemberDocumentSignedUrl(fileUrl: string): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    if (!fileUrl?.trim()) {
      return {
        success: false,
        error: 'URL del archivo no proporcionada'
      };
    }

    // If it's a template URL, return as is
    if (fileUrl.startsWith('https://papeleo.co/docgen')) {
      return {
        success: true,
        data: fileUrl
      };
    }

    const supabase = createClient();
    const EXPIRY_TIME = 60; // 60 seconds

    // Check if the fileUrl is already a full URL or a relative path
    let storagePath = fileUrl;
    
    // If it's a full URL, extract just the path portion after the bucket name
    if (fileUrl.includes('storage/v1/object/public/contractual/')) {
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split('/');
      const relevantPathIndex = pathParts.findIndex(part => part === 'contractual');
      if (relevantPathIndex !== -1) {
        storagePath = pathParts.slice(relevantPathIndex + 1).join('/');
      }
    }
    
    
    // Generate versions of the path that are likely to actually exist in storage
    const pathsToTry = [storagePath];
    const pathParts = storagePath.split('/');
    
    // The issue here is that sometimes we append contractMemberId to the path
    // but the actual file doesn't have that segment. Remove segments one by one, 
    // starting from the end, to try to find the actual file
    if (pathParts.length > 2) {
      // Try without the last segment (which might be contractMemberId)
      pathsToTry.push(pathParts.slice(0, -1).join('/'));
      
      // If file has no extension, try with common extensions
      if (!pathParts[pathParts.length - 1].includes('.')) {
        // Add .pdf extension to the original path
        pathsToTry.push(`${storagePath}.pdf`);
        
        // Also try the path without last segment but with .pdf
        pathsToTry.push(`${pathParts.slice(0, -1).join('/')}.pdf`);
      }
    }
    
    // Check if we have very deeply nested paths (4+ segments) and try simplifications
    if (pathParts.length > 4) {
      // Try top 3 segments + last segment (skip middle segments)
      const simplifiedPath = [...pathParts.slice(0, 3), pathParts[pathParts.length - 1]].join('/');
      pathsToTry.push(simplifiedPath);
      
      // Try top 3 segments as a fallback
      pathsToTry.push(pathParts.slice(0, 3).join('/'));
    }
    
    // Try fixing common typos (like 'tets_pdf' -> 'test_pdf') 
    const pathWithFixedTypos = storagePath
      .replace('tets_pdf', 'test_pdf')  // Common typo
      .replace(/([^.]+)$/, '$1.pdf');  // Add .pdf if missing
      
    if (pathWithFixedTypos !== storagePath) {
      pathsToTry.push(pathWithFixedTypos);
    }
    
    // List parent folder to help with debugging
    try {
      if (pathParts.length > 1) {
        const parentFolder = pathParts.slice(0, -1).join('/');  
        
        const { data: folderContents } = await supabase.storage
          .from('contractual')
          .list(parentFolder);
          
        
        // If we found contents, add paths based on actual files in the folder
        if (folderContents && folderContents.length > 0) {
          const lastSegment = pathParts[pathParts.length - 1];
          
          // Look for files that start with similar content to our last segment
          folderContents.forEach(item => {
            // Add any PDF files in this folder
            if (item.name.endsWith('.pdf')) {
              pathsToTry.push(`${parentFolder}/${item.name}`);
            }
            
            // If we find files with similar names, prioritize them
            if (item.name.toLowerCase().includes(lastSegment.toLowerCase().substring(0, 5))) {
              pathsToTry.push(`${parentFolder}/${item.name}`);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Error listing folder contents:', error);
    }
    
    
    // Try each path variation until we find one that works
    let signedUrl = null;
    let lastError: Error | null = null;
    
    for (const path of pathsToTry) {
      try {
        const { data, error } = await supabase.storage
          .from('contractual')
          .createSignedUrl(path, EXPIRY_TIME);
          
        if (!error && data?.signedUrl) {
          signedUrl = data.signedUrl;
          break;
        } else {
          console.warn(`Failed with path ${path}:`, error?.message);
          lastError = error;
        }
      } catch (err) {
        console.warn(`Exception with path ${path}:`, err);
        lastError = err as Error;
      }
    }
    
    if (signedUrl) {
      return {
        success: true,
        data: signedUrl
      };
    }

    // If we get here, none of the paths worked
    return {
      success: false,
      error: `Error al generar URL firmada: ${lastError && typeof lastError === 'object' && 'message' in lastError ? lastError.message : 'Object not found'}`
    };
    
  } catch (err) {
    console.error('Unexpected error in createMemberDocumentSignedUrl:', err);
    return {
      success: false,
      error: `Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`
    };
  }
}

/**
 * Función optimizada para obtener status de contrato en client-side
 */
export async function getContractStatusClient(contractMemberId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('get_contract_status', {
      p_contract_member_id: contractMemberId
    });
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener status:', error);
    return { success: false, error: 'Error al obtener status' };
  }
}

/**
 * Función para manejar visualización de documentos firmados
 */
export function handleDocumentView(contractDraftUrl: string, contractMemberId?: string, sidebar = false) {
  try {
    const regex = /^https:\/\/papeleo\.co\/docgen\/[\w-]+$/;
    
    if (regex.test(contractDraftUrl)) {
      const url = contractMemberId 
        ? `${contractDraftUrl}/${contractMemberId}`
        : `${contractDraftUrl}${sidebar ? '' : '?sidebar=false'}`;
      
      window.open(url, "_blank");
    } else {
      // Para otros tipos de documentos, usar preview
      window.open(contractDraftUrl, "_blank");
    }
  } catch (error) {
    console.error('Error al abrir documento:', error);
  }
}

/**
 * Utilidad para debounce en búsquedas y selecciones
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Cache simple para datos de contratos
 */
class ContractCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: unknown) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const contractCache = new ContractCache(); 


/**
 * Uploads a resignation letter and updates the contract member's ending status
 */
export async function uploadResignationLetter(formData: FormData): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const supabase = createClient()
    const file = formData.get('file') as File | null
    const memberId = formData.get('memberId') as string
    const terminationType = formData.get('terminationType') as string // New parameter to differentiate termination types

    if (!file) {
      throw new Error('Archivo no proporcionado')
    }
    
    if (!memberId) {
      throw new Error('ID de miembro no proporcionado')
    }

    const sanitizedFileName = sanitizeFileName(file.name)
    // Store in the renuncia folder with the member ID as subfolder
    const path = `renuncia/${memberId}/${sanitizedFileName}`

    // Upload file to storage
    const { error: storageError } = await supabase.storage
      .from('contractual')
      .upload(path, file, {
        upsert: true
      })

    if (storageError) {
      throw new Error(`Error al subir el archivo: ${storageError.message}`)
    }

    // Create public URL for the file
    const { data: urlData } = await supabase.storage
      .from('contractual')
      .getPublicUrl(path)

    const fileUrl = urlData?.publicUrl || ''

    // Determine the status based on the terminationType
    const status = terminationType === 'comun' ? 'comun' : 'solicitud'

    // Update the contract_members table with the resignation letter info
    const { data, error: updateError } = await supabase
      .from('contract_members')
      .update({
        ending: {
          url: fileUrl,
          status: status
        }
      })
      .eq('id', memberId)
      .select('*')
      .single()

    if (updateError) {
      throw new Error(`Error al actualizar el estado: ${updateError.message}`)
    }

    return {
      success: true,
      data: {
        ...data,
        ending: {
          url: fileUrl,
          status: status
        }
      }
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message
    }
  }
}


// Define interfaces
export interface UserDocument {
  NOMBRE: string;
  TELEFONO: string;
  DIRECCIÓN: string;
  IDENTIFICACIÓN: string;
}

export interface ContractSigningResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Loads user data including document information and signature
 * @param user_id The ID of the user
 * @returns User document data and signature
 */
export const loadUserData = async (user_id: string) => {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("users")
      .select("document_id, signature")
      .eq("id", user_id)
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      const documentData = data.document_id as UserDocument;
      const isDataComplete = Boolean(
        documentData.NOMBRE && 
        documentData.TELEFONO && 
        documentData.DIRECCIÓN && 
        documentData.IDENTIFICACIÓN
      );
      
      return {
        userData: documentData,
        userSignature: data.signature,
        isDataComplete
      };
    }
    
    return {
      userData: null,
      userSignature: null,
      isDataComplete: false
    };
  } catch (error) {
    console.error("Error loading user data:", error);
    toast.error("No se pudo cargar la información del usuario");
    throw error;
  }
};

/**
 * Updates user document information
 * @param user_id The ID of the user
 * @param formData Updated user document data
 * @returns Boolean indicating success
 */
export const updateUserData = async (user_id: string, formData: UserDocument) => {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("users")
      .update({ document_id: formData })
      .eq("id", user_id);

    if (error) {
      throw error;
    }

    // Check if all fields are complete
    const isDataComplete = Boolean(
      formData.NOMBRE && 
      formData.TELEFONO && 
      formData.DIRECCIÓN && 
      formData.IDENTIFICACIÓN
    );
    
    toast.success("Información actualizada correctamente");
    
    return { success: true, isDataComplete };
  } catch (error) {
    console.error("Error updating user data:", error);
    toast.error("No se pudo actualizar la información del usuario");
    throw error;
  }
};

/**
 * Updates contract with user data and signature
 * @param contractMemberId The unique ID of the contract member relationship
 * @param userData User document data
 * @param userSignature User's signature URL
 * @returns Boolean indicating success
 */
export const updateContractWithUserData = async (
  contractMemberId: string,
  userData: UserDocument,
  userSignature: string | null
) => {
  const supabase = createClient();
  try {
    // First get current contract data using contractMemberId
    const { data: contractData, error: contractError } = await supabase
      .from("contract_members")
      .select("contract")
      .eq("id", contractMemberId)
      .single();

    if (contractError) {
      console.error("Error fetching contract data:", contractError);
      
      // Check for 406 error specifically
      if (contractError.code === "406") {
        toast.error("El servidor no pudo procesar el formato de la solicitud. Contacte al administrador.");
      }
      
      throw contractError;
    }

    if (!contractData?.contract) {
      return { success: false, message: "No hay contrato para actualizar" };
    }

    const updatedContract = { ...contractData.contract };

    // Update signatures section if we have a signature
    if (userSignature && updatedContract["2. FIRMAS"]) {
      const content = updatedContract["2. FIRMAS"].content;
      const updatedContent = content.replace(
        "<hr style='width: 150px;'>", 
        `<img src='${userSignature}' style='max-width:150px'><br>`
      );
      updatedContract["2. FIRMAS"].content = updatedContent;
    }

    // Update general section with user data
    if (updatedContract["0. GENERALIDADES"]) {
      let content = updatedContract["0. GENERALIDADES"].content;
      
      // Replace contractor information with user data
      content = content.replace(
        /<tr><td><b>NOMBRE DEL CONTRATISTA<\/b><\/td><td><span style='color:red;'>.*?<\/span><\/td><\/tr> <tr><td><b>IDENTIFICACIÓN CONTRATISTA<\/b><\/td><td><span style='color:red;'>.*?<\/span><\/td><\/tr> <tr> <td><b>DIRECCIÓN DEL CONTRATISTA<\/b><\/td> <td><span style='color:red;'>.*?<\/span><\/td> <\/tr> <tr> <td><b>TELÉFONO CONTRATISTA<\/b><\/td> <td><span style='color:red;'>.*?<\/span><\/td> <\/tr>/g,
        `<tr><td><b>NOMBRE DEL CONTRATISTA</b></td><td>${userData.NOMBRE}</td></tr> <tr><td><b>IDENTIFICACIÓN CONTRATISTA</b></td><td>${userData.IDENTIFICACIÓN}</td></tr> <tr> <td><b>DIRECCIÓN DEL CONTRATISTA</b></td> <td>${userData.DIRECCIÓN}</td> </tr> <tr> <td><b>TELÉFONO CONTRATISTA</b></td> <td>${userData.TELEFONO}</td> </tr>`
      );
      
      updatedContract["0. GENERALIDADES"].content = content;
    }

    // Update the contract in database using contractMemberId
    const { error: updateError } = await supabase
      .from("contract_members")
      .update({ contract: updatedContract })
      .eq("id", contractMemberId);

    if (updateError) {
      throw updateError;
    }

    return { success: true, message: "Contrato actualizado correctamente" };
  } catch (error) {
    console.error("Error updating contract with user data:", error);
    toast.error("No se pudo actualizar el contrato con la información del usuario");
    throw error;
  }
};

/**
 * Checks if user has a signature file
 * @param user_id The ID of the user
 * @returns Boolean indicating if signature exists
 */
export const checkUserSignature = async (user_id: string) => {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('signature')
      .eq('id', user_id)
      .single();

    if (error) {
      throw error;
    }

    return {
      hasSignature: Boolean(data?.signature),
      signature: data?.signature
    };
  } catch (error) {
    console.error("Error checking signature:", error);
    toast.error("No se pudo verificar su firma");
    throw error;
  }
};

/**
 * Signs a contract after verification
 * @param contractMemberId The unique ID of the contract member relationship
 * @returns Response with success status and message
 */
export const signContract = async (
  contractMemberId: string,
  user_id: string
): Promise<ContractSigningResponse> => {
  const supabase = createClient();
  try {
    // Check if user has a signature first
    const signatureCheck = await checkUserSignature(user_id);
    
    if (!signatureCheck.hasSignature) {
      return {
        success: false,
        message: "Debe crear primero su firma en la sección contractual de papeleo.co"
      };
    }
    
    // Update contract signature status using contractMemberId
    const { error } = await supabase
      .from("contract_members")
      .update({ signed: true, created_at: new Date() })
      .eq("id", contractMemberId);

    if (error) {
      console.error("Error al firmar el contrato:", error);
      return {
        success: false,
        message: "Error al firmar el contrato"
      };
    }

    return {
      success: true,
      message: "Contrato firmado exitosamente"
    };
  } catch (error) {
    console.error("Error signing contract:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado durante el proceso de firma"
    };
  }
};

/**
 * Handles the complete contract signing process
 * @param contractMemberId The unique ID of the contract member relationship
 * @param user_id The ID of the user
 * @param contract_draft_url The URL of the contract draft
 * @param userData User document data
 * @param userSignature User's signature URL
 * @returns Response with success status and message
 */
export const handleContractSigning = async (
  contractMemberId: string,
  user_id: string,
  contract_draft_url: string,
  userData: UserDocument,
  userSignature: string | null
): Promise<ContractSigningResponse> => {
  try {
    // Llama a la server action (o endpoint) que ejecuta la lógica de firma y Google Docs en el backend
    const response = await fetch('/api/contract-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractMemberId,
        user_id,
        contract_draft_url,
        userData,
        userSignature
      })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in contract signing process:', error);
    return {
      success: false,
      message: 'Ocurrió un error inesperado durante el proceso de firma'
    };
  }
};

/**
 * Checks if user data is complete
 * @param userData User document data
 * @returns Boolean indicating if data is complete
 */
export const isUserDataComplete = (userData: UserDocument): boolean => {
  return Boolean(
    userData.NOMBRE && 
    userData.TELEFONO && 
    userData.DIRECCIÓN && 
    userData.IDENTIFICACIÓN
  );
};

/**
 * Custom deep equality function for UserDocument objects
 * @param obj1 First object to compare
 * @param obj2 Second object to compare
 * @returns Boolean indicating if objects are deeply equal
 */
const deepEqual = (obj1: unknown, obj2: unknown): boolean => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1 as Record<string, unknown>);
  const keys2 = Object.keys(obj2 as Record<string, unknown>);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])) return false;
  }
  
  return true;
};

/**
 * Checks if user data has changes
 * @param formData Current form data
 * @param originalData Original user data
 * @returns Boolean indicating if data has changes
 */
export const hasDataChanges = (
  formData: UserDocument,
  originalData: UserDocument | null
): boolean => {
  if (!originalData) return true;
  return !deepEqual(formData, originalData);
};

export { createMemberDocumentSignedUrl }; 