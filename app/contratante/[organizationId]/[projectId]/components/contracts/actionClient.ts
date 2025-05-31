import { createClient } from "@/lib/supabase/client";
// Type for document suggestions
export type DocumentSuggestion = {
  name: string;
  count: number;
};

/**
 * Get document name suggestions based on user input
 * @param search The search term typed by the user
 * @param type The document type ('precontractual' or 'contractual')
 * @returns Array of unique document name suggestions sorted by frequency (maximum 5)
 */
export async function getDocumentSuggestions(
  search: string,
  type: 'precontractual' | 'contractual'
): Promise<DocumentSuggestion[]> {
  if (!search || search.length < 2) return [];

  try {
    console.log(`Buscando documentos de tipo: ${type} con texto: "${search}"`);
    
    // Crear una nueva instancia del cliente para cada consulta
    const supabase = createClient();
    
    // Simplificar la consulta para reducir posibilidades de error
    let query = supabase
      .from('required_documents')
      .select('name');
      
    // Si el tipo es contractual, usamos una lógica diferente ya que parece estar fallando
    if (type === 'contractual') {
      // Intentar con diferentes formas de consulta para contractual
      try {
        // Opción 1: consultar sin filtro de tipo y luego filtrar los resultados manualmente
        const { data, error } = await supabase
          .from('required_documents')
          .select('name, type')
          .ilike('name', `%${search}%`)
          .is('deleted_at', null);
          
        if (!error && data && data.length > 0) {
          // Filtrar manualmente los resultados
          const filteredData = data.filter(item => 
            item.type && 
            (item.type.toLowerCase() === 'contractual' || 
             item.type.toLowerCase() === 'contract' || 
             item.type.toLowerCase().includes('contract'))
          );
          
          // Si encontramos resultados, procesarlos
          if (filteredData.length > 0) {
            console.log(`Documentos contractuales encontrados: ${filteredData.length}`);
            
            // Contar ocurrencias de nombres únicos
            const nameCount: Record<string, number> = {};
            filteredData.forEach(item => {
              nameCount[item.name] = (nameCount[item.name] || 0) + 1;
            });
            
            // Ordenar y limitar
            return Object.entries(nameCount)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
              .slice(0, 5);
          }
        }
        
        // Si llegamos aquí, la primera opción falló
        console.log("La opción 1 para contractual falló, intentando opción alternativa");
      } catch (err) {
        console.error("Error en la opción 1 para contractual:", err);
      }
      
      // Volver a un enfoque más simple como fallback
      return [];
    } else {
      // Para precontractual usamos la consulta normal que sabemos que funciona
      query = query
        .eq('type', 'precontractual')
        .ilike('name', `%${search}%`)
        .is('deleted_at', null);
        
      const { data, error } = await query;
      
      if (error) {
        console.error("Error en consulta precontractual:", error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      console.log(`Documentos precontractuales encontrados: ${data.length}`);
      
      // Contar ocurrencias
      const nameCount: Record<string, number> = {};
      data.forEach(item => {
        nameCount[item.name] = (nameCount[item.name] || 0) + 1;
      });
      
      // Ordenar y limitar
      return Object.entries(nameCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 5);
    }
  } catch (generalError) {
    console.error("Error general en getDocumentSuggestions:", generalError);
    return [];
  }
  
  // Si todas las opciones fallan, devolver array vacío
  return [];
}

/**
 * Sube un archivo directamente al storage de Supabase desde el cliente
 * y retorna la URL pública del archivo
 * @param file El archivo a subir (PDF, DOCX, etc.)
 * @param projectId ID del proyecto
 * @param contractName Nombre del contrato para organizar los archivos
 * @returns Un objeto con la URL del archivo subido o error
 */
export async function uploadContractDraftFile(
  file: File,
  projectId: string,
  contractName: string
): Promise<{ url: string | null; filePath: string | null; error: string | null }> {
  try {
    if (!file) {
      return { url: null, filePath: null, error: 'No se ha proporcionado ningún archivo' };
    }
    
    const supabase = createClient();
    
    // Sanitizar nombres de archivos (igual que en el servidor)
    const sanitizeFileName = (fileName: string) => fileName
      .trim()
      .toLowerCase()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '-');
    
    const sanitizedContractName = sanitizeFileName(contractName);
    const sanitizedFileName = sanitizeFileName(file.name);
    const filePath = `drafts/${projectId}/${sanitizedContractName}/${sanitizedFileName}`;
    
    // Subir el archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contractual")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
      
    if (uploadError) {
      console.error('Error al subir archivo a Supabase:', uploadError);
      return { url: null, filePath: null, error: uploadError.message };
    }
    
    if (uploadData?.path) {
      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from("contractual")
        .getPublicUrl(uploadData.path);
        
      console.log('Archivo subido correctamente:', publicUrl);
      return { url: publicUrl, filePath, error: null };
    }
    
    return { url: null, filePath, error: null };
  } catch (err) {
    console.error('Error inesperado al subir archivo:', err);
    return { 
      url: null, 
      filePath: null,
      error: err instanceof Error ? err.message : 'Error desconocido al subir el archivo' 
    };
  }
}

/**
 * Reemplaza un archivo de contrato existente eliminando primero el archivo antiguo
 * y luego subiendo el nuevo archivo
 * @param file El nuevo archivo a subir
 * @param oldFilePath La ruta del archivo antiguo que se eliminará
 * @param projectId ID del proyecto
 * @param contractName Nombre del contrato
 * @returns Un objeto con la URL del archivo subido o error
 */
export async function replaceContractDraftFile(
  file: File,
  oldFilePath: string,
  projectId: string,
  contractName: string
): Promise<{ url: string | null; filePath: string | null; error: string | null }> {
  try {
    if (!file) {
      return { url: null, filePath: null, error: 'No se ha proporcionado ningún archivo' };
    }

    const supabase = createClient();

    // Solo intentamos eliminar si la ruta no es una URL de docgen
    const docgenRegex = /^https:\/\/papeleo\.co\/docgen\/[\w-]+$/;
    if (oldFilePath && !docgenRegex.test(oldFilePath)) {
      try {
        // Si la ruta es una URL completa, extraemos solo la parte del path
        let storagePath = oldFilePath;
        
        // Intentamos eliminar el archivo antiguo
        const { error: deleteError } = await supabase.storage
          .from("contractual")
          .remove([storagePath]);
          
        if (deleteError) {
          console.warn('No se pudo eliminar el archivo antiguo:', deleteError);
          // Continuamos con la subida aunque no se haya podido eliminar
        } else {
          console.log('Archivo antiguo eliminado correctamente:', storagePath);
        }
      } catch (deleteErr) {
        console.warn('Error al intentar eliminar el archivo antiguo:', deleteErr);
        // Continuamos con la subida aunque haya habido un error
      }
    }
    
    // Subimos el nuevo archivo utilizando la función existente
    return await uploadContractDraftFile(file, projectId, contractName);
  } catch (err) {
    console.error('Error inesperado al reemplazar archivo:', err);
    return { 
      url: null, 
      filePath: null,
      error: err instanceof Error ? err.message : 'Error desconocido al reemplazar el archivo' 
    };
  }
}

/**
 * Fetches contract templates from the database
 * @returns Array of contract templates
 */
export async function fetchContractTemplates() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('category', 'CONTRATO');
  
  if (error) {
    console.error("Error al obtener las plantillas:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Gets the current logged in user
 * @returns The user object or null if not logged in
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
  
  return user;
}

/**
 * Creates a document from a template
 * @param templateId ID of the template
 * @param userId ID of the user creating the document
 * @param title Title for the new document
 * @param sections Document sections with content
 * @returns The created document data or null if there was an error
 */
export async function createDocumentFromTemplate(
  templateId: number,
  userId: string,
  title: string,
  sections: Record<string, { content: string, type: string }>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .insert({
      template_id: templateId,
      user_id: userId,
      title: title,
      sections: sections,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error al crear el documento desde la plantilla:", error);
    return null;
  }
  
  return data;
}

/**
 * Fetches documents associated with a contract
 * @param contractId The contract ID to fetch documents for
 * @returns Array of required documents
 */
export async function fetchContractDocuments(contractId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('required_documents')
      .select('*')
      .eq('contract_id', contractId)
      .is('deleted_at', null)
      .order('name', { ascending: true });
    
    if (error) {
      console.error("Error fetching contract documents:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching contract documents:", error);
    return [];
  }
}

/**
 * Updates a document name
 * @param documentId The document ID to update
 * @param newName The new name for the document
 * @returns Success status and updated document or error
 */
export async function updateDocumentName(documentId: string, newName: string) {
  try {
    if (!documentId || !newName.trim()) {
      return { success: false, error: 'ID de documento o nombre inválido' };
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('required_documents')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar el documento' 
    };
  }
}

/**
 * Deletes a document
 * @param documentId The document ID to delete (soft delete)
 * @returns Success status or error
 */
export async function deleteDocument(documentId: string) {
  try {
    if (!documentId) {
      return { success: false, error: 'ID de documento inválido' };
    }
    
    const supabase = createClient();
    const { error } = await supabase
      .from('required_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar el documento' 
    };
  }
}

/**
 * Adds a new document to a contract
 * @param contractId The contract ID to add the document to
 * @param documentName The name of the new document
 * @param documentType The type of document ('precontractual' or 'contractual')
 * @param dueDate Optional due date for the document
 * @param templateId Optional template ID for the document
 * @returns Success status and created document or error
 */
export async function addDocument(
  contractId: string, 
  documentName: string, 
  documentType: 'precontractual' | 'contractual',
  dueDate?: string,
  templateId?: number
) {
  try {
    if (!contractId || !documentName.trim() || !documentType) {
      return { 
        success: false, 
        error: 'ID de contrato, nombre de documento o tipo de documento inválido' 
      };
    }
    
    const supabase = createClient();
    const { data, error } = await supabase
      .from('required_documents')
      .insert({
        contract_id: contractId,
        name: documentName,
        type: documentType,
        due_date: dueDate,
        template_id: templateId
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al añadir el documento' 
    };
  }
} 