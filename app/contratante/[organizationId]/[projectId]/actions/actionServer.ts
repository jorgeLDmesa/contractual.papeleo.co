"use server"

import { createClient } from "@/lib/supabase/server"
import { Resend } from 'resend'
import { 
  DbContractualProject, 
  DbContract, 
  DbUser,
  ContractualProject,
  Contract,
  Invitation,
  ProjectDocument,
  User
} from "../types"
import { google } from 'googleapis'

const resend = new Resend(process.env.RESEND_API_KEY)

// Interface for invitation database response
interface InvitationDbResponse {
  id: string;
  status: string;
  invited_at: string;
  accepted_at?: string;
  user: DbUser | DbUser[];
  contracts: {
    name: string;
    project_id: string;
  } | {
    name: string;
    project_id: string;
  }[];
}

// ========================================
// PROJECT OPERATIONS
// ========================================

/**
 * Fetches a project by its ID
 * @param projectId The ID of the project
 * @returns The project data
 */
export async function fetchProjectById(projectId: string): Promise<ContractualProject> {
  try {
    
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
    }


    const supabase = await createClient()
    
    
    const { data, error } = await supabase
      .from('contractual_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch project by ID: ${error.message}`)
    }
    

    if (!data) {
      throw new Error('Project not found')
    }

    const typedData = data as DbContractualProject

    const result = {
      id: typedData.id,
      name: typedData.name,
      organizationId: typedData.organization_id,
      createdAt: typedData.created_at,
      updatedAt: typedData.updated_at,
      deletedAt: typedData.deleted_at,
      signature: typedData.signature,
      contratanteData: typedData.contratante_data
    }
    
    return result
    
  } catch (error) {
    throw error
  }
}

/**
 * Gets the contratante data from the contractual_projects table
 * @param projectId The ID of the project
 * @returns The contratante_data JSON or null if it doesn't exist
 */
export async function getContratanteData(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contractual_projects")
    .select("contratante_data")
    .eq("id", projectId)
    .single()

  if (error) {
    throw new Error("Error fetching contratante data")
  }

  return data?.contratante_data || null
}

// ========================================
// PROJECT SIGNATURE OPERATIONS
// ========================================

/**
 * Checks if a project has a signature and retrieves it
 * @param projectId The ID of the project
 * @returns The signature URL if it exists, or null if it doesn't
 */
export async function getProjectSignature(projectId: string): Promise<string | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("contractual_projects")
    .select("signature")
    .eq("id", projectId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data?.signature || null
}

/**
 * Updates the project signature URL in the database
 * @param projectId The ID of the project
 * @param signatureUrl The URL of the uploaded signature
 */
export async function updateProjectSignature(projectId: string, signatureUrl: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("contractual_projects")
    .update({ signature: signatureUrl })
    .eq("id", projectId)
  
  if (error) {
    throw error
  }
  
  return true
}

/**
 * Removes the project signature from the database
 * @param projectId The ID of the project
 */
export async function removeProjectSignature(projectId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("contractual_projects")
    .update({ signature: null })
    .eq("id", projectId)
  
  if (error) {
    throw error
  }
  
  return true
}

// ========================================
// CONTRACT OPERATIONS
// ========================================

/**
 * Fetches contracts by project ID
 * @param projectId The ID of the project
 * @returns Array of contracts
 */
export async function fetchContractsByProjectId(projectId: string): Promise<Contract[]> {
  try {
    
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    const supabase = await createClient()
    
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)

    if (error) {
      throw new Error(`Failed to fetch contracts: ${error.message}`)
    }


    if (!data) {
      return []
    }

    const result = data.map((contract: DbContract) => ({
      id: contract.id,
      name: contract.name,
      projectId: contract.project_id,
      contractDraftUrl: contract.contract_draft_url,
      status: contract.status,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      deletedAt: contract.deleted_at
    }))
    
    return result
    
  } catch (error) {
    throw error
  }
}

/**
 * Creates a new contract
 * @param formData The form data containing contract information
 * @returns The created contract
 */
export async function createContract(formData: FormData): Promise<Contract> {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const projectId = formData.get('projectId') as string
  const contractDraftUrl = formData.get('contractDraftUrl') as string
  
  const { data, error } = await supabase
    .from('contracts')
    .insert([{
      name,
      project_id: projectId,
      contract_draft_url: contractDraftUrl,
      status: 'draft'
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create contract: ${error.message}`)
  }

  const typedData = data as DbContract

  return {
    id: typedData.id,
    name: typedData.name,
    projectId: typedData.project_id,
    contractDraftUrl: typedData.contract_draft_url,
    status: typedData.status,
    createdAt: typedData.created_at,
    updatedAt: typedData.updated_at,
    deletedAt: typedData.deleted_at
  }
}

/**
 * Deletes a contract
 * @param contractId The ID of the contract to delete
 */
export async function deleteContract(contractId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('contracts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contractId)

  if (error) {
    throw new Error(`Failed to delete contract: ${error.message}`)
  }

  return true
}

/**
 * Updates a contract name
 * @param contractId The ID of the contract
 * @param newName The new name for the contract
 */
export async function updateContractName(contractId: string, newName: string): Promise<Contract> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contracts')
    .update({ name: newName })
    .eq('id', contractId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update contract name: ${error.message}`)
  }

  const typedData = data as DbContract

  return {
    id: typedData.id,
    name: typedData.name,
    projectId: typedData.project_id,
    contractDraftUrl: typedData.contract_draft_url,
    status: typedData.status,
    createdAt: typedData.created_at,
    updatedAt: typedData.updated_at,
    deletedAt: typedData.deleted_at
  }
}

/**
 * Updates a contract draft URL
 * @param contractId The ID of the contract
 * @param newDraftUrl The new draft URL for the contract
 */
export async function updateContractDraftUrl(contractId: string, newDraftUrl: string): Promise<Contract> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contracts')
    .update({ contract_draft_url: newDraftUrl })
    .eq('id', contractId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update contract draft URL: ${error.message}`)
  }

  const typedData = data as DbContract

  return {
    id: typedData.id,
    name: typedData.name,
    projectId: typedData.project_id,
    contractDraftUrl: typedData.contract_draft_url,
    status: typedData.status,
    createdAt: typedData.created_at,
    updatedAt: typedData.updated_at,
    deletedAt: typedData.deleted_at
  }
}

// ========================================
// INVITATION OPERATIONS
// ========================================

/**
 * Fetches invitations by project ID
 * @param projectId The ID of the project
 * @returns Array of invitations
 */
export async function fetchInvitationsByProjectId(projectId: string): Promise<Invitation[]> {
  try {
    
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    const supabase = await createClient()

    // First, get all contracts for this project
    const { data: projectContracts, error: contractsError } = await supabase
      .from("contracts")
      .select("id")
      .eq("project_id", projectId)
      .is("deleted_at", null)

    if (contractsError) {
      throw new Error(`Failed to fetch project contracts: ${contractsError.message}`)
    }

    if (!projectContracts || projectContracts.length === 0) {
      return []
    }

    const contractIds = projectContracts.map(c => c.id)

    // Now get contract members for these contracts
    const { data, error } = await supabase
      .from("contract_members")
      .select(`
        id,
        status,
        invited_at,
        accepted_at,
        contract_id,
        user:users(id, username, email),
        contracts(name, project_id)
      `)
      .in("contract_id", contractIds)

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`)
    }

    if (!data) {
      return []
    }

    const result = data.map((invitation: InvitationDbResponse) => {
      const userObj = Array.isArray(invitation.user) ? invitation.user[0] : invitation.user;
      const contractsObj = Array.isArray(invitation.contracts) ? invitation.contracts[0] : invitation.contracts;

      return {
        id: invitation.id,
        contractName: contractsObj?.name ?? '',
        email: userObj?.email ?? '',
        status: invitation.status,
        invitedAt: invitation.invited_at,
        acceptedAt: invitation.accepted_at
      };
    });
    
    return result
    
  } catch (error) {
    throw error
  }
}

/**
 * Sends a contract invitation
 * @param recipient The user to invite
 * @param selectedProject The project
 * @param contract The contract
 * @param value Optional value
 * @param startDate Optional start date
 * @param endDate Optional end date
 */
export async function sendContractInvitation(
  recipient: User,
  selectedProject: ContractualProject,
  contract: Contract,
  value?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Invitation> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contract_members')
    .insert([{
      user_id: recipient.id,
      contract_id: contract.id,
      status: 'pending',
      invited_at: new Date().toISOString(),
      value: value || null,
      start_date: startDate?.toISOString() || null,
      end_date: endDate?.toISOString() || null
    }])
    .select(`
      id,
      status,
      invited_at,
      accepted_at,
      user:users(email),
      contracts(name, project_id, contract_draft_url)
    `)
    .single()

  if (error) {
    throw new Error(`Failed to send invitation: ${error.message}`)
  }

  const userObj = Array.isArray(data.user) ? data.user[0] : data.user;
  const contractsObj = Array.isArray(data.contracts) ? data.contracts[0] : data.contracts;

  // Duplicar el documento de Google Docs si existe contract_draft_url
  if (contractsObj?.contract_draft_url && contractsObj.contract_draft_url.includes('docs.google.com/document/d/')) {
    try {
      // Extraer el documentId original
      const match = contractsObj.contract_draft_url.match(/\/d\/([\w-]+)/);
      const originalDocId = match ? match[1] : null;
      if (originalDocId) {
        // Autenticación Google
        const serviceAccountAuth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          },
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents',
          ],
        });
        const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });
        // Obtener el archivo original para saber la carpeta
        const fileMeta = await drive.files.get({ fileId: originalDocId, fields: 'parents, name' });
        const parents = fileMeta.data.parents || ['1KE706IBz1TZMLd6_q2WdMx7K8HIt6JyJ'];
        const originalName = fileMeta.data.name || 'Contrato';
        // Nuevo nombre
        const newName = `${originalName}_${data.id}`;
        // Duplicar el archivo
        const copyRes = await drive.files.copy({
          fileId: originalDocId,
          requestBody: {
            name: newName,
            parents,
          },
          fields: 'id',
        });
        const newDocId = copyRes.data.id;
        if (newDocId) {
          const newDocUrl = `https://docs.google.com/document/d/${newDocId}/edit`;
          // Actualizar contract_url en contract_members
          await supabase
            .from('contract_members')
            .update({ contract_url: newDocUrl })
            .eq('id', data.id);
        }
      }
    } catch (err) {
      console.error('Error duplicando documento de Google Docs para contract_member:', err);
    }
  }

  // Create contractual documents if start and end dates are provided
  if (startDate && endDate) {
    try {
      await createContractualDocuments(data.id, contract.id, startDate, endDate)
    } catch {
      // Don't throw here as the invitation was created successfully
      // We can add logging or other handling as needed
    }
  }

  // Send email invitation
  try {
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contratista`;
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: recipient.email,
      subject: `Invitación para el proyecto: ${selectedProject.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 2px; border-radius: 12px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-top: 0; text-align: center;">
                ¡Nueva Oportunidad de Colaboración!
              </h2>
              <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                Te han invitado a participar en el proyecto <strong>${selectedProject.name}</strong>
              </p>
              <p style="color: #475569; line-height: 1.6; font-size: 16px;">
                Este es el comienzo de una nueva colaboración profesional. Para revisar los detalles del contrato
                y comenzar el proceso, haz clic en el botón de abajo.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; 
                          text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 16px;
                          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                          transition: all 300ms;">
                  Ver detalles del contrato
                </a>
              </div>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  Si tienes alguna pregunta, no dudes en contactar
                  al equipo del proyecto.
                </p>
              </div>
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">
            Si no puedes acceder al botón, copia y pega este enlace en tu navegador:<br>
            <span style="color: #2563eb;">${inviteUrl}</span>
          </p>
        </div>
      `
    });
  } catch {
    // Don't throw here, as the invitation was created successfully
    // We can add logging or other handling as needed
  }

  return {
    id: data.id,
    contractName: contractsObj?.name ?? '',
    email: userObj?.email ?? '',
    status: data.status,
    invitedAt: data.invited_at,
    acceptedAt: data.accepted_at
  };
}

/**
 * Deletes an invitation (contract member)
 * @param invitationId The ID of the invitation to delete
 */
export async function deleteInvitation(invitationId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('contract_members')
    .delete()
    .eq('id', invitationId)

  if (error) {
    throw new Error(`Failed to delete invitation: ${error.message}`)
  }

  return true
}

// ========================================
// DOCUMENT OPERATIONS
// ========================================

/**
 * Fetches project documents by project ID
 * @param projectId The ID of the project
 * @returns Array of project documents
 */
export async function fetchProjectDocumentsByProjectId(projectId: string): Promise<ProjectDocument[]> {
  const supabase = await createClient()

  try {
    
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    // First, get all contracts for this project
    const { data: contracts, error: contractsError } = await supabase
      .from("contracts")
      .select("id, name, contract_draft_url")
      .eq("project_id", projectId)
      .is("deleted_at", null)

    if (contractsError) {
      throw new Error(`Failed to fetch contracts: ${contractsError.message}`)
    }

    if (!contracts || contracts.length === 0) {
      return []
    }

    const contractIds = contracts.map(c => c.id)

    // Get contract members for these contracts
    const { data: contractMembers, error: membersError } = await supabase
      .from("contract_members")
      .select(`
        id,
        status,
        contract_url,
        status_juridico,
        ending,
        contract_id,
        user_id,
        contratante_signed
      `)
      .in("contract_id", contractIds)

    if (membersError) {
      throw new Error(`Failed to fetch contract members: ${membersError.message}`)
    }

    // Get users for the contract members
    const userIds = contractMembers?.map(m => m.user_id) || []
    
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, email")
      .in("id", userIds)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // Get required documents for these contracts
    const { data: requiredDocs, error: requiredDocsError } = await supabase
      .from("required_documents")
      .select("id, name, type, due_date, contract_id")
      .in("contract_id", contractIds)
      .is("deleted_at", null)

    if (requiredDocsError) {
      throw new Error(`Failed to fetch required documents: ${requiredDocsError.message}`)
    }

    // Get contractual documents for the contract members
    const memberIds = contractMembers?.map(m => m.id) || []
    
    const { data: contractualDocs, error: contractualDocsError } = await supabase
      .from("contractual_documents")
      .select("id, required_document_id, url, contract_member_id")
      .in("contract_member_id", memberIds)

    if (contractualDocsError) {
      throw new Error(`Failed to fetch contractual documents: ${contractualDocsError.message}`)
    }

    // Now build the result by combining all the data
    const result: ProjectDocument[] = []

    contractMembers?.forEach(member => {
      const contract = contracts.find(c => c.id === member.contract_id)
      const user = users?.find(u => u.id === member.user_id)
      const memberRequiredDocs = requiredDocs?.filter(rd => rd.contract_id === member.contract_id) || []

      if (contract && user) {
        const projectDoc: ProjectDocument = {
          contractId: contract.id,
          projectId: projectId,
          contractName: contract.name,
          contractMemberId: member.id,
          username: user.username ?? "",
          email: user.email ?? "",
          contractUrl: member.contract_url,
          contractDraftUrl: contract.contract_draft_url,
          status: member.status,
          statusJuridico: member.status_juridico,
          ending: member.ending,
          requiredDocuments: memberRequiredDocs.map(reqDoc => {
            const matchedDoc = contractualDocs?.find(
              cdoc => cdoc.required_document_id === reqDoc.id && cdoc.contract_member_id === member.id
            )
            return {
              id: reqDoc.id,
              name: reqDoc.name,
              type: reqDoc.type,
              dueDate: reqDoc.due_date,
              contractualDocumentId: matchedDoc?.id,
              contractualRequiredDocumentId: matchedDoc?.required_document_id,
              url: matchedDoc?.url,
            }
          }),
          contratante_signed: member.contratante_signed ?? false,
        }
        result.push(projectDoc)
      }
    })

    return result

  } catch (error) {
    throw new Error(`Failed to fetch project documents: ${error}`)
  }
}

// ========================================
// REQUIRED DOCUMENTS OPERATIONS
// ========================================

/**
 * Fetches required documents for a specific contract
 * @param contractId The ID of the contract
 * @returns Array of required documents
 */
export async function fetchRequiredDocumentsByContractId(contractId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('required_documents')
    .select('id, name, type, due_date')
    .eq('contract_id', contractId)
    .is('deleted_at', null)

  if (error) {
    throw new Error(`Failed to fetch required documents: ${error.message}`)
  }

  return data || []
}

/**
 * Creates contractual documents for a contract member based on required documents
 * @param contractMemberId The ID of the contract member
 * @param contractId The ID of the contract
 * @param startDate The start date of the contract
 * @param endDate The end date of the contract
 */
export async function createContractualDocuments(
  contractMemberId: string,
  contractId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = await createClient()
  
  try {
    // Get required documents for this contract
    const requiredDocuments = await fetchRequiredDocumentsByContractId(contractId)
    
    if (requiredDocuments.length === 0) {
      return
    }

    // Calculate the number of months between start and end date
    // Example: Jan 2024 to Mar 2024 = 3 months (Jan, Feb, Mar)
    const monthsDiff = Math.abs(
      (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (endDate.getMonth() - startDate.getMonth())
    ) + 1 // +1 to include both start and end months

    const contractualDocumentsToCreate = []

    for (const requiredDoc of requiredDocuments) {
      if (requiredDoc.type === 'precontractual') {
        // For precontractual documents, create one document with month = null
        contractualDocumentsToCreate.push({
          contract_member_id: contractMemberId,
          required_document_id: requiredDoc.id,
          month: null,
          url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else if (requiredDoc.type === 'contractual') {
        // For contractual documents, create one document per month
        for (let i = 0; i < monthsDiff; i++) {
          const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
          const monthString = monthDate.toISOString().slice(0, 7) // YYYY-MM format
          
          contractualDocumentsToCreate.push({
            contract_member_id: contractMemberId,
            required_document_id: requiredDoc.id,
            month: monthString,
            url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
    }

    if (contractualDocumentsToCreate.length > 0) {
      const { error } = await supabase
        .from('contractual_documents')
        .insert(contractualDocumentsToCreate)

      if (error) {
        throw new Error(`Failed to create contractual documents: ${error.message}`)
      }
    }
  } catch (error) {
    throw error
  }
}

// ========================================
// USER OPERATIONS
// ========================================

/**
 * Fetches all users
 * @returns Array of users
 */
export async function fetchAllUsers(): Promise<User[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('username')

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return (data || []).map((user: DbUser) => ({
    id: user.id,
    username: user.username,
    email: user.email
  }))
}

/**
 * Inserta la firma del contratante a un lado de la del contratista en el Google Doc
 */
export async function signGoogleDocWithContratanteSignature(contractUrl: string, contratanteSignatureUrl: string) {
  try {
    // Solo si es un Google Doc
    const match = contractUrl.match(/\/d\/([\w-]+)/);
    const documentId = match ? match[1] : null;
    if (!documentId) {
      console.error('[signGoogleDocWithContratanteSignature] No se pudo extraer documentId de contractUrl:', contractUrl);
      return;
    }
    // Autenticación Google
    const serviceAccountAuth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
      ],
    });
    const docs = google.docs({ version: 'v1', auth: serviceAccountAuth });

    // Obtener el documento para saber el endIndex
    const docRes = await docs.documents.get({ documentId });
    const doc = docRes.data;
    // Buscar el último bloque de tipo PARAGRAPH que contenga la firma del contratista
    let lastFirmaContratistaIndex = null;
    for (const el of doc.body?.content || []) {
      if (el.paragraph && el.paragraph.elements) {
        for (const elem of el.paragraph.elements) {
          if (elem.textRun && elem.textRun.content?.includes('Firma contratista')) {
            lastFirmaContratistaIndex = el.endIndex;
          }
        }
      }
    }
    // Si no se encuentra, usar el final del documento
    const insertIndex = lastFirmaContratistaIndex || (doc.body?.content?.[doc.body.content.length - 1]?.endIndex || 1);
    // 1. Insertar salto de línea para separar
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: insertIndex - 1 },
              text: '\n',
            },
          },
        ],
      },
    });
    // 2. Insertar la imagen de la firma del contratante
    const docAfterLineRes = await docs.documents.get({ documentId });
    const docAfterLine = docAfterLineRes.data;
    const endIndexAfterLine = docAfterLine.body?.content?.[docAfterLine.body.content.length - 1]?.endIndex || 1;
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertInlineImage: {
              uri: contratanteSignatureUrl,
              location: { index: endIndexAfterLine - 1 },
              objectSize: {
                height: { magnitude: 60, unit: 'PT' },
                width: { magnitude: 150, unit: 'PT' },
              },
            },
          },
        ],
      },
    });
    // 3. Insertar la línea debajo de la firma del contratante
    const docAfterImageRes = await docs.documents.get({ documentId });
    const docAfterImage = docAfterImageRes.data;
    const endIndexAfterImage = docAfterImage.body?.content?.[docAfterImage.body.content.length - 1]?.endIndex || 1;
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: endIndexAfterImage - 1 },
              text: '\n________________________',
            },
          },
        ],
      },
    });
    // 4. Insertar el texto 'Firma contratante' debajo de la línea
    const docAfterLine2Res = await docs.documents.get({ documentId });
    const docAfterLine2 = docAfterLine2Res.data;
    const endIndexAfterLine2 = docAfterLine2.body?.content?.[docAfterLine2.body.content.length - 1]?.endIndex || 1;
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: endIndexAfterLine2 - 1 },
              text: '\nFirma contratante\n',
            },
          },
        ],
      },
    });
  } catch (err) {
    console.error('[signGoogleDocWithContratanteSignature] Error insertando firma del contratante en Google Doc:', err);
  }
}

/**
 * Firma el contrato como contratante: inserta la firma y actualiza el estado en la DB
 */
export async function handleContratanteSigning(contractMemberId: string, user_id: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();
  try {
    // 1. Obtener contract_url y contract_id del contract_member
    const { data: memberData, error: memberError } = await supabase
      .from('contract_members')
      .select('contract_url, contract_id')
      .eq('id', contractMemberId)
      .single();
    if (memberError || !memberData) {
      throw new Error('No se pudo obtener el contract_url del miembro');
    }
    // 2. Obtener la firma del contratante desde users usando el user_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('signature')
      .eq('id', user_id)
      .single();
    if (userError || !userData?.signature) {
      throw new Error('No se encontró la firma del contratante (usuario actual)');
    }
    // 3. Insertar la firma del contratante en el Google Doc
    await signGoogleDocWithContratanteSignature(memberData.contract_url, userData.signature);
    // 4. Actualizar contratante_signed a true
    const { error: updateError } = await supabase
      .from('contract_members')
      .update({ contratante_signed: true })
      .eq('id', contractMemberId);
    if (updateError) {
      throw new Error('No se pudo actualizar el estado de firma del contratante');
    }
    return { success: true, message: 'Contrato firmado exitosamente por el contratante' };
  } catch (err) {
    console.error('[handleContratanteSigning] Error:', err);
    return { success: false, message: 'Error al firmar el contrato como contratante' };
  }
} 