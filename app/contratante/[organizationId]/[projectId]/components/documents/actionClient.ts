import { createClient } from "@/lib/supabase/client";
import { DateRange } from "react-day-picker";
import { format, addMonths, differenceInMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Crea una URL firmada temporal para un documento
 * @param documentUrl URL pública del documento
 * @param expiresIn Tiempo de expiración en segundos (por defecto 60 minutos)
 * @returns URL firmada o error
 */
export async function createDocumentSignedUrl(documentUrl: string, expiresIn = 3600) {
  try {
    if (!documentUrl) {
      return { success: false, data: null, error: 'URL de documento no proporcionada' };
    }

    // Extraer la ruta relativa del archivo de la URL pública
    const supabase = createClient();
    const storageUrl = supabase.storage.from('contractual').getPublicUrl('').data.publicUrl;
    
    // Si la URL no contiene la URL base del bucket, devolver error
    if (!documentUrl.includes(storageUrl)) {
      return { 
        success: false, 
        data: null, 
        error: 'La URL proporcionada no es una URL válida del bucket de Storage' 
      };
    }

    // Extraer la ruta relativa
    const filePath = documentUrl.replace(storageUrl, '');
    
    // Crear URL firmada
    const { data, error } = await supabase.storage
      .from('contractual')
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      console.error('Error al crear URL firmada:', error);
      return { success: false, data: null, error: error.message };
    }
    
    return { success: true, data: data.signedUrl, error: null };
  } catch (err) {
    console.error('Error inesperado al crear URL firmada:', err);
    return { 
      success: false, 
      data: null, 
      error: err instanceof Error ? err.message : 'Error desconocido al crear URL firmada' 
    };
  }
}

/**
 * Obtiene los documentos contractuales existentes de un miembro de contrato
 * @param contractMemberId ID del miembro de contrato
 * @returns Array de documentos contractuales existentes
 */
export async function getExistingContractualDocuments(contractMemberId: string) {
  try {
    if (!contractMemberId) {
      return { success: false, documents: [], error: 'ID de miembro inválido' };
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contractual_documents')
      .select(`
        id, 
        contract_member_id, 
        required_document_id, 
        url, 
        month, 
        required_documents(id, name, type)
      `)
      .eq('contract_member_id', contractMemberId)
      .is('deleted_at', null)
      .order('month', { ascending: true });
    
    if (error) {
      console.error('Error al obtener documentos contractuales:', error);
      return { success: false, documents: [], error: error.message };
    }
    
    return { 
      success: true, 
      documents: data || [],
      error: null
    };
  } catch (err) {
    console.error('Error inesperado al obtener documentos contractuales:', err);
    return { 
      success: false, 
      documents: [], 
      error: err instanceof Error ? err.message : 'Error desconocido al obtener documentos' 
    };
  }
}

/**
 * Obtener los documentos requeridos del tipo contractual para un contrato
 * @param contractId ID del contrato
 * @returns Array de documentos requeridos
 */
export async function getRequiredContractualDocuments(contractId: string) {
  try {
    if (!contractId) {
      return { success: false, documents: [], error: 'ID de contrato inválido' };
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('required_documents')
      .select('*')
      .eq('contract_id', contractId)
      .eq('type', 'contractual')
      .is('deleted_at', null)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error al obtener documentos requeridos:', error);
      return { success: false, documents: [], error: error.message };
    }
    
    return { 
      success: true, 
      documents: data || [],
      error: null
    };
  } catch (err) {
    console.error('Error inesperado al obtener documentos requeridos:', err);
    return { 
      success: false, 
      documents: [], 
      error: err instanceof Error ? err.message : 'Error desconocido al obtener documentos' 
    };
  }
}

/**
 * Crea documentos contractuales para los meses de la extensión
 * @param contractMemberId ID del miembro de contrato
 * @param contractId ID del contrato
 * @param dateRange Rango de fechas de la extensión
 * @returns Estado de éxito y detalles
 */
export async function createContractualDocumentsForExtension(
  contractMemberId: string,
  contractId: string,
  dateRange: DateRange
) {
  try {
    if (!contractMemberId || !contractId || !dateRange.from || !dateRange.to) {
      return { 
        success: false, 
        error: 'Faltan datos requeridos para crear documentos contractuales' 
      };
    }
    
    // 1. Obtener documentos requeridos de tipo contractual para este contrato
    const requiredDocsResult = await getRequiredContractualDocuments(contractId);
    if (!requiredDocsResult.success) {
      return { 
        success: false, 
        error: 'Error al obtener documentos requeridos: ' + requiredDocsResult.error 
      };
    }
    
    const requiredDocs = requiredDocsResult.documents;
    if (requiredDocs.length === 0) {
      return { 
        success: true, 
        message: 'No hay documentos contractuales requeridos para este contrato'
      };
    }
    
    // 2. Obtener documentos contractuales existentes para este miembro
    const existingDocsResult = await getExistingContractualDocuments(contractMemberId);
    if (!existingDocsResult.success) {
      return { 
        success: false, 
        error: 'Error al obtener documentos existentes: ' + existingDocsResult.error 
      };
    }
    
    // 3. Determinar qué meses necesitan documentos
    const existingMonths = new Set(existingDocsResult.documents.map(doc => doc.month));
    
    // Calcular meses a crear
    const startMonth = startOfMonth(dateRange.from);
    const endMonth = startOfMonth(dateRange.to);
    const monthsToCreate = [];
    
    // Agregar todos los meses en el rango de la extensión
    let currentMonth = startMonth;
    while (currentMonth <= endMonth) {
      const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });
      
      // Solo agregar si el mes no existe ya
      if (!existingMonths.has(monthName)) {
        monthsToCreate.push(monthName);
      }
      
      // Avanzar al siguiente mes
      currentMonth = addMonths(currentMonth, 1);
    }
    
    if (monthsToCreate.length === 0) {
      return { 
        success: true, 
        message: 'No hay nuevos meses para crear documentos contractuales'
      };
    }
    
    // 4. Crear documentos contractuales para cada documento requerido en cada mes
    const supabase = createClient();
    const docsToInsert = [];
    
    for (const month of monthsToCreate) {
      for (const requiredDoc of requiredDocs) {
        docsToInsert.push({
          contract_member_id: contractMemberId,
          required_document_id: requiredDoc.id,
          month: month,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Insertar todos los documentos de una vez
    const { error } = await supabase
      .from('contractual_documents')
      .insert(docsToInsert);
    
    if (error) {
      console.error('Error al crear documentos contractuales:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      message: `Se crearon ${docsToInsert.length} documentos contractuales para ${monthsToCreate.length} meses`
    };
  } catch (err) {
    console.error('Error inesperado al crear documentos contractuales:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error desconocido al crear documentos' 
    };
  }
}

/**
 * Obtiene los datos de un miembro de contrato para validación de fechas
 * @param contractMemberId ID del miembro de contrato
 * @returns Datos del contrato incluyendo start_date y end_date
 */
export async function getContractMemberDates(contractMemberId: string) {
  try {
    if (!contractMemberId) {
      return { 
        success: false, 
        error: 'ID de miembro inválido',
        data: null
      };
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contract_members')
      .select('start_date, end_date')
      .eq('id', contractMemberId)
      .single();
    
    if (error) {
      console.error('Error al obtener datos del contrato:', error);
      return { 
        success: false, 
        error: error.message,
        data: null 
      };
    }
    
    return { 
      success: true, 
      error: null,
      data: {
        startDate: data.start_date ? new Date(data.start_date) : null,
        endDate: data.end_date ? new Date(data.end_date) : null
      }
    };
  } catch (err) {
    console.error('Error inesperado al obtener datos del contrato:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error desconocido al obtener datos del contrato',
      data: null
    };
  }
}

/**
 * Uploads an extension file to Supabase Storage and creates a record in the contract_members_extension table
 * @param file The file to upload (PDF, DOCX, etc.)
 * @param contractMemberId The contract member ID
 * @param dateRange The extension date range
 * @returns Success status with URL or error message
 */
export async function uploadExtensionAndCreateRecord(
  file: File,
  contractMemberId: string,
  dateRange: DateRange
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!file || !contractMemberId || !dateRange.from || !dateRange.to) {
      return { 
        success: false, 
        error: 'Faltan datos requeridos: archivo, ID de miembro o rango de fechas' 
      };
    }
    
    const supabase = createClient();
    
    // Obtener el contractId del miembro
    const { data: memberData, error: memberError } = await supabase
      .from('contract_members')
      .select('contract_id')
      .eq('id', contractMemberId)
      .single();
    
    if (memberError) {
      console.error('Error al obtener datos del miembro:', memberError);
      return { success: false, error: memberError.message };
    }
    
    const contractId = memberData.contract_id;
    
    // Sanitize file name
    const sanitizeFileName = (fileName: string) => fileName
      .trim()
      .toLowerCase()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-');
    
    const sanitizedFileName = sanitizeFileName(file.name);
    const filePath = `extension/${contractMemberId}/${sanitizedFileName}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contractual")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
      
    if (uploadError) {
      console.error('Error al subir archivo de extensión:', uploadError);
      return { success: false, error: uploadError.message };
    }
    
    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from("contractual")
      .getPublicUrl(uploadData.path);
    
    // Create a record in the contract_members_extension table
    const { error: insertError } = await supabase
      .from('contract_members_extension')
      .insert({
        contract_member_id: contractMemberId,
        extension_start_date: dateRange.from.toISOString().split('T')[0],
        extension_end_date: dateRange.to.toISOString().split('T')[0],
        extension_url: publicUrl
      });
    
    if (insertError) {
      console.error('Error al crear registro de extensión:', insertError);
      return { success: false, error: insertError.message };
    }
    
    // Crear documentos contractuales para los meses de la extensión
    const docsResult = await createContractualDocumentsForExtension(
      contractMemberId,
      contractId,
      dateRange
    );
    
    if (!docsResult.success) {
      console.warn('Se creó la extensión pero hubo problemas creando los documentos:', docsResult.error);
    }
    
    return { success: true, url: publicUrl };
  } catch (err) {
    console.error('Error inesperado al procesar extensión:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error desconocido al procesar la extensión' 
    };
  }
}

/**
 * Fetches all extensions for a contract member
 * @param contractMemberId The contract member ID
 * @returns Array of extension records
 */
export async function getContractMemberExtensions(contractMemberId: string) {
  try {
    if (!contractMemberId) {
      return { success: false, extensions: [], error: 'ID de miembro inválido' };
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contract_members_extension')
      .select('*')
      .eq('contract_member_id', contractMemberId)
      .order('extension_start_date', { ascending: false });
    
    if (error) {
      console.error('Error al obtener extensiones:', error);
      return { success: false, extensions: [], error: error.message };
    }
    
    return { success: true, extensions: data || [] };
  } catch (err) {
    console.error('Error inesperado al obtener extensiones:', err);
    return { 
      success: false, 
      extensions: [], 
      error: err instanceof Error ? err.message : 'Error desconocido al obtener extensiones' 
    };
  }
}

/**
 * Obtiene el estado jurídico de un miembro de contrato
 * @param contractMemberId ID del miembro de contrato
 * @returns Estado jurídico del miembro
 */
export async function getLegalStatus(contractMemberId: string) {
  try {
    if (!contractMemberId) {
      return { success: false, legalStatus: null, error: 'ID de miembro inválido' };
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contract_members')
      .select('status_juridico')
      .eq('id', contractMemberId)
      .single();
    
    if (error) {
      console.error('Error al obtener estado jurídico:', error);
      return { success: false, legalStatus: null, error: error.message };
    }
    
    return { 
      success: true, 
      legalStatus: data?.status_juridico,
      error: null
    };
  } catch (err) {
    console.error('Error inesperado al obtener estado jurídico:', err);
    return { 
      success: false, 
      legalStatus: null, 
      error: err instanceof Error ? err.message : 'Error desconocido al obtener estado jurídico' 
    };
  }
} 