"use server"

import { createClient } from "@/lib/supabase/server";

// ========================================
// TYPES DEFINITIONS
// ========================================

// Tipo para los documentos requeridos
type RequiredDocument = {
  id: string;
  name: string;
  type: string;
}

// Tipo para los documentos contractuales
type ContractualDocument = {
  id: string;
  required_document_id: string;
  url?: string;
  month?: string;
}

// Tipos para respuestas de la base de datos
// Tipo para los documentos contractuales organizados por mes
export type ContractualDocumentsByMonth = {
  month: string;
  documents: {
    id: string;
    name: string;
    type: string;
    required_document_id: string;
    url?: string;
    contractualDocumentId: string;
  }[];
}

// Type for contractual extra documents
export type ContractualExtraDocument = {
  id: string;
  name: string;
  url?: string;
  month: string;
  contract_member_id: string;
  created_at: string;
};

// Type for legal status response
export type LegalStatusResponse = {
  success: boolean;
  legalStatus: string | null;
  error: string | null;
}

// ========================================
// CONTRACTUAL DOCUMENTS FUNCTIONS
// ========================================

/**
 * Obtiene los documentos contractuales agrupados por mes para un miembro específico
 * @param contractMemberId ID del miembro del contrato
 * @returns Array de documentos organizados por mes
 */
export async function getContractualDocumentsByMonth(contractMemberId: string): Promise<ContractualDocumentsByMonth[]> {
  try {
    const supabase = await createClient();
    
    // Paso 1: Obtener todos los documentos requeridos de tipo "contractual" para este contrato
    const { data: contractData, error: contractError } = await supabase
      .from("contract_members")
      .select(`
        contracts(
          required_documents(
            id,
            name,
            type
          )
        )
      `)
      .eq("id", contractMemberId)
      .single();
    
    if (contractError) {
      console.error("Error al obtener documentos requeridos:", contractError);
      return [];
    }
    
    // Verificar la estructura de los datos y extraer los documentos requeridos
    if (!contractData || !contractData.contracts) {
      console.error("No se encontraron contratos");
      return [];
    }
    
    // Extraer los documentos requeridos
    let requiredDocs: RequiredDocument[] = [];
    
    // Contratos puede ser un array o un objeto
    const contracts = Array.isArray(contractData.contracts)
      ? contractData.contracts
      : [contractData.contracts];
    
    // Para cada contrato, extraer los documentos requeridos
    for (const contract of contracts) {
      if (contract && contract.required_documents) {
        const docs = Array.isArray(contract.required_documents)
          ? contract.required_documents
          : [contract.required_documents];
        
        requiredDocs = [...requiredDocs, ...docs];
      }
    }
    
    // Filtrar solo documentos contractuales
    const contractualRequiredDocs = requiredDocs.filter(doc => doc.type === "contractual");
    
    if (contractualRequiredDocs.length === 0) {
      return [];
    }
    
    // Paso 2: Para cada documento requerido, obtener todos los documentos contractuales
    // Crear un mapa de required_document_id -> nombre del documento
    const requiredDocsMap = new Map<string, string>();
    contractualRequiredDocs.forEach(doc => {
      requiredDocsMap.set(doc.id, doc.name);
    });
    
    // Obtener todos los documentos contractuales para este miembro
    const { data: contractualDocs, error: contractualError } = await supabase
      .from("contractual_documents")
      .select("id, required_document_id, url, month")
      .eq("contract_member_id", contractMemberId)
      .is("deleted_at", null);
    
    if (contractualError) {
      console.error("Error al obtener documentos contractuales:", contractualError);
      return [];
    }
    
    if (!contractualDocs || contractualDocs.length === 0) {
      return [];
    }
    
    // Paso 3: Agrupar documentos por mes
    const docsByMonth = new Map<string, Array<{
      id: string;
      name: string;
      type: string;
      required_document_id: string;
      url?: string;
      contractualDocumentId: string;
    }>>();
    
    contractualDocs.forEach((doc: ContractualDocument) => {
      // Solo incluir si es un documento de tipo "contractual" (que está en la lista de required_docs)
      if (requiredDocsMap.has(doc.required_document_id)) {
        const month = doc.month || "Sin mes asignado";
        
        if (!docsByMonth.has(month)) {
          docsByMonth.set(month, []);
        }
        
        docsByMonth.get(month)?.push({
          id: doc.required_document_id, // ID del documento requerido
          name: requiredDocsMap.get(doc.required_document_id) || "Documento sin nombre",
          type: "contractual",
          required_document_id: doc.required_document_id,
          url: doc.url,
          contractualDocumentId: doc.id // ID del documento contractual
        });
      }
    });
    
    // Convertir el mapa a un array de objetos con { month, documents }
    const result: ContractualDocumentsByMonth[] = Array.from(docsByMonth.entries())
      .map(([month, documents]) => ({
        month,
        documents
      }));
    
    // Ordenar los meses
    const monthOrder = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio", 
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
      "sin mes asignado" // Siempre al final
    ];
    
    result.sort((a, b) => {
      const monthA = a.month.toLowerCase();
      const monthB = b.month.toLowerCase();
      const indexA = monthOrder.indexOf(monthA);
      const indexB = monthOrder.indexOf(monthB);
      
      // Si no se encuentra en la lista, ponerlo al final
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
    
    return result;
  } catch (error) {
    console.error("Error al obtener documentos contractuales por mes:", error);
    return [];
  }
}

// ========================================
// EXTRA DOCUMENTS FUNCTIONS
// ========================================

interface ExtraDocumentForMonth {
  id: string;
  name: string;
  type: string;
  required_document_id: string;
  contractualDocumentId: string;
  url?: string;
  month?: string;
}

/**
 * Obtiene documentos extra contractuales agrupados por mes
 * @param contractMemberId ID del miembro del contrato
 * @returns Array de documentos extra organizados por mes
 */
export async function getContractualExtraDocumentsByMonth(contractMemberId: string): Promise<ContractualDocumentsByMonth[]> {
  try {
    const supabase = await createClient();
    
    // Obtener documentos extra
    const { data: extraDocuments, error: extraError } = await supabase
      .from('contractual_extra_documents')
      .select('*')
      .eq('contract_member_id', contractMemberId)
      .is('deleted_at', null);

    if (extraError) {
      console.error('Error fetching extra documents:', extraError);
      return [];
    }

    // Organizar documentos extra por mes
    const extraDocsByMonth: Record<string, ExtraDocumentForMonth[]> = {};
    
    extraDocuments.forEach((doc: ContractualExtraDocument) => {
      const month = doc.month || 'Sin mes asignado';
      if (!extraDocsByMonth[month]) {
        extraDocsByMonth[month] = [];
      }
      
      extraDocsByMonth[month].push({
        id: doc.id,
        name: doc.name,
        type: 'contractual-extra',
        required_document_id: doc.id,
        contractualDocumentId: doc.id,
        url: doc.url || undefined,
        month: doc.month
      });
    });

    const result: ContractualDocumentsByMonth[] = Object.entries(extraDocsByMonth).map(([month, documents]) => ({
      month,
      documents
    }));

    return result;
  } catch (error) {
    console.error('Error fetching extra documents:', error);
    return [];
  }
}

/**
 * Crea un nuevo documento extra contractual
 * @param contractMemberId ID del miembro del contrato
 * @param name Nombre del documento
 * @param month Mes del documento
 * @returns Resultado de la operación
 */
export async function createContractualExtraDocument(
  contractMemberId: string,
  name: string,
  month: string
): Promise<{ success: boolean; document?: ContractualExtraDocument; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contractual_extra_documents')
      .insert({
        name,
        contract_member_id: contractMemberId,
        month
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, document: data };
  } catch (error) {
    console.error('Error creating extra document:', error);
    return { success: false, error: 'Failed to create document' };
  }
}

// ========================================
// COMBINED DOCUMENTS FUNCTIONS
// ========================================

/**
 * Obtiene todos los documentos contractuales (regulares y extra) combinados
 * @param contractMemberId ID del miembro del contrato
 * @returns Array de todos los documentos organizados por mes
 */
export async function getAllContractualDocuments(contractMemberId: string): Promise<ContractualDocumentsByMonth[]> {
  try {
    // Obtener documentos regulares contractuales
    const regularDocs = await getContractualDocumentsByMonth(contractMemberId);
    
    // Obtener documentos extra
    const extraDocs = await getContractualExtraDocumentsByMonth(contractMemberId);
    
    // Combinar documentos por mes
    const mergedDocsByMonth: Record<string, ContractualDocumentsByMonth> = {};
    
    // Procesar documentos regulares
    regularDocs.forEach(monthGroup => {
      if (!mergedDocsByMonth[monthGroup.month]) {
        mergedDocsByMonth[monthGroup.month] = {
          month: monthGroup.month,
          documents: []
        };
      }
      mergedDocsByMonth[monthGroup.month].documents = [
        ...mergedDocsByMonth[monthGroup.month].documents,
        ...monthGroup.documents
      ];
    });
    
    // Procesar documentos extra
    extraDocs.forEach(monthGroup => {
      if (!mergedDocsByMonth[monthGroup.month]) {
        mergedDocsByMonth[monthGroup.month] = {
          month: monthGroup.month,
          documents: []
        };
      }
      mergedDocsByMonth[monthGroup.month].documents = [
        ...mergedDocsByMonth[monthGroup.month].documents,
        ...monthGroup.documents
      ];
    });
    
    return Object.values(mergedDocsByMonth);
  } catch (error) {
    console.error('Error fetching all contractual documents:', error);
    return [];
  }
}

/**
 * Obtiene los documentos precontractuales (aquellos con month null)
 * @param contractMemberId ID del miembro del contrato
 * @returns Array de documentos precontractuales
 */
export async function getPrecontractualDocuments(contractMemberId: string): Promise<{
  id: string;
  name: string;
  type: string;
  required_document_id: string;
  url?: string;
  contractualDocumentId: string;
}[]> {
  try {
    const supabase = await createClient();
    
    // Paso 1: Obtener todos los documentos requeridos de tipo "precontractual" para este contrato
    const { data: contractData, error: contractError } = await supabase
      .from("contract_members")
      .select(`
        contracts(
          required_documents(
            id,
            name,
            type
          )
        )
      `)
      .eq("id", contractMemberId)
      .single();
    
    if (contractError) {
      console.error("Error al obtener documentos requeridos:", contractError);
      return [];
    }
    
    // Verificar la estructura de los datos y extraer los documentos requeridos
    if (!contractData || !contractData.contracts) {
      console.error("No se encontraron contratos");
      return [];
    }
    
    // Extraer los documentos requeridos
    let requiredDocs: RequiredDocument[] = [];
    
    // Contratos puede ser un array o un objeto
    const contracts = Array.isArray(contractData.contracts)
      ? contractData.contracts
      : [contractData.contracts];
    
    // Para cada contrato, extraer los documentos requeridos
    for (const contract of contracts) {
      if (contract && contract.required_documents) {
        const docs = Array.isArray(contract.required_documents)
          ? contract.required_documents
          : [contract.required_documents];
        
        requiredDocs = [...requiredDocs, ...docs];
      }
    }
    
    // Filtrar solo documentos precontractuales
    const precontractualRequiredDocs = requiredDocs.filter(doc => doc.type === "precontractual");
    
    if (precontractualRequiredDocs.length === 0) {
      return [];
    }
    
    // Paso 2: Para cada documento requerido precontractual, obtener los documentos contractuales con month null
    const requiredDocsMap = new Map<string, string>();
    precontractualRequiredDocs.forEach(doc => {
      requiredDocsMap.set(doc.id, doc.name);
    });
    
    // Obtener todos los documentos contractuales con month null para este miembro
    const { data: contractualDocs, error: contractualError } = await supabase
      .from("contractual_documents")
      .select("id, required_document_id, url, month")
      .eq("contract_member_id", contractMemberId)
      .is("month", null)
      .is("deleted_at", null);
    
    if (contractualError) {
      console.error("Error al obtener documentos precontractuales:", contractualError);
      return [];
    }
    
    if (!contractualDocs || contractualDocs.length === 0) {
      return [];
    }
    
    // Paso 3: Crear el array de documentos precontractuales
    const precontractualDocuments = contractualDocs
      .filter((doc: ContractualDocument) => requiredDocsMap.has(doc.required_document_id))
      .map((doc: ContractualDocument) => ({
        id: doc.required_document_id,
        name: requiredDocsMap.get(doc.required_document_id) || "Documento sin nombre",
        type: "precontractual",
        required_document_id: doc.required_document_id,
        url: doc.url,
        contractualDocumentId: doc.id
      }));
    
    return precontractualDocuments;
  } catch (error) {
    console.error('Error fetching precontractual documents:', error);
    return [];
  }
}

// ========================================
// LEGAL STATUS FUNCTIONS
// ========================================

/**
 * Obtiene el estado jurídico de un miembro de contrato
 * @param contractMemberId ID del miembro de contrato
 * @returns Estado jurídico del miembro
 */
export async function getLegalStatus(contractMemberId: string): Promise<LegalStatusResponse> {
  try {
    if (!contractMemberId) {
      return { success: false, legalStatus: null, error: 'ID de miembro inválido' };
    }
    
    const supabase = await createClient();
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