"use server"

import { createClient } from "@/lib/supabase/server"
import { Resend } from 'resend'
import { 
  DbContractualProject, 
  DbContract, 
  DbContractMember, 
  DbUser,
  ContractualProject,
  Contract,
  Invitation,
  ProjectDocument,
  User
} from "../types"

const resend = new Resend(process.env.RESEND_API_KEY)

// ========================================
// PROJECT OPERATIONS
// ========================================

/**
 * Fetches a project by its ID
 * @param projectId The ID of the project
 * @returns The project data
 */
export async function fetchProjectById(projectId: string): Promise<ContractualProject> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contractual_projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) {
    console.error("Error fetching project:", error.message)
    throw new Error(`Failed to fetch project by ID: ${error.message}`)
  }

  const typedData = data as DbContractualProject

  return {
    id: typedData.id,
    name: typedData.name,
    organizationId: typedData.organization_id,
    createdAt: typedData.created_at,
    updatedAt: typedData.updated_at,
    deletedAt: typedData.deleted_at,
    signature: typedData.signature,
    contratanteData: typedData.contratante_data
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
    console.error("Error fetching contratante data:", error)
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
    console.error("Error fetching project signature:", error.message)
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
    console.error("Error updating project signature:", error.message)
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
    console.error("Error removing project signature:", error.message)
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
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (error) {
    console.error("Error fetching contracts:", error.message)
    throw new Error(`Failed to fetch contracts: ${error.message}`)
  }

  return data.map((contract: DbContract) => ({
    id: contract.id,
    name: contract.name,
    projectId: contract.project_id,
    contractDraftUrl: contract.contract_draft_url,
    status: contract.status,
    createdAt: contract.created_at,
    updatedAt: contract.updated_at,
    deletedAt: contract.deleted_at
  }))
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
    console.error("Error creating contract:", error.message)
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
    console.error("Error deleting contract:", error.message)
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
    console.error("Error updating contract name:", error.message)
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
    console.error("Error updating contract draft URL:", error.message)
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
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contract_members')
    .select(`
      id,
      status,
      invited_at,
      accepted_at,
      user:users(email),
      contracts!inner(
        name,
        project_id
      )
    `)
    .eq('contracts.project_id', projectId)

  if (error) {
    console.error("Error fetching invitations:", error.message)
    throw new Error('Failed to fetch invitations by project')
  }

  if (!data) {
    return []
  }

  return data.map((invitation: any) => {
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
  selectedProject: any,
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
      contracts(name, project_id)
    `)
    .single()

  if (error) {
    console.error("Error sending invitation:", error.message)
    throw new Error(`Failed to send invitation: ${error.message}`)
  }

  const userObj = Array.isArray(data.user) ? data.user[0] : data.user;
  const contractsObj = Array.isArray(data.contracts) ? data.contracts[0] : data.contracts;

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
  } catch (emailError) {
    console.error("Error sending email:", emailError)
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
    console.error("Error deleting invitation:", error.message)
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

  const { data, error } = await supabase
    .from("contracts")
    .select(`
      id,
      project_id,
      name,
      contract_members(
        id,
        status,
        contract_url,
        status_juridico,
        ending,
        user:users(id, username, email),
        contractual_documents(id, required_document_id, url)
      ),
      required_documents(id, name, type, due_date)
    `)
    .eq("project_id", projectId)

  if (error) {
    console.error("Error fetching project documents:", error.message)
    throw new Error(`Failed to fetch project documents: ${error.message}`)
  }

  if (!data) {
    return []
  }

  const mappedData = data.flatMap((contract: any) => {
    const members = Array.isArray(contract.contract_members)
      ? contract.contract_members
      : [contract.contract_members];

    return members.map((member: any) => {
      const userData = Array.isArray(member.user)
        ? member.user[0]
        : member.user;

      const contractualDocs = Array.isArray(member.contractual_documents)
        ? member.contractual_documents
        : [member.contractual_documents];

      const requiredDocs = Array.isArray(contract.required_documents)
        ? contract.required_documents
        : [contract.required_documents];

      return {
        contractId: contract.id,
        projectId: contract.project_id,
        contractName: contract.name,
        contractMemberId: member.id,
        username: userData?.username ?? "",
        email: userData?.email ?? "",
        contractUrl: member.contract_url,
        status: member.status,
        statusJuridico: member.status_juridico,
        ending: member.ending,
        requiredDocuments: requiredDocs.map((reqDoc: any) => {
          const matchedDoc = contractualDocs.find(
            (cdoc: any) => cdoc.required_document_id === reqDoc.id
          );
          return {
            id: reqDoc.id,
            name: reqDoc.name,
            type: reqDoc.type,
            dueDate: reqDoc.due_date,
            contractualDocumentId: matchedDoc?.id,
            contractualRequiredDocumentId: matchedDoc?.required_document_id,
            url: matchedDoc?.url,
          };
        }),
      };
    });
  });

  return mappedData
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
    console.error("Error fetching users:", error.message)
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return (data || []).map((user: DbUser) => ({
    id: user.id,
    username: user.username,
    email: user.email
  }))
} 