// Tipos para las respuestas de la base de datos (snake_case)

// Interface for contratante data
export interface ContratanteData {
  nombre?: string
  nit?: string
  direccion?: string
  telefono?: string
  email?: string
  representante_legal?: string
  // Allow additional string properties
  [key: string]: string | undefined
}

export interface DbContractualProject {
  id: string
  name: string
  organization_id: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  signature?: string | null
  contratante_data?: ContratanteData | null
}

export interface DbContract {
  id: string
  name: string
  project_id: string
  contract_draft_url?: string | null
  status: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface DbContractMember {
  id: string
  user_id: string
  contract_id: string
  status: string
  invited_at: string
  accepted_at?: string | null
  value?: string | null
  start_date?: string | null
  end_date?: string | null
  contract_url?: string | null
  status_juridico?: string | null
  ending?: string | null
  user?: DbUser | DbUser[]
  contracts?: DbContract | DbContract[]
  contractual_documents?: DbContractualDocument | DbContractualDocument[]
}

export interface DbUser {
  id: string
  username: string
  email: string
}

export interface DbContractualDocument {
  id: string
  required_document_id: string
  url?: string | null
}

export interface DbRequiredDocument {
  id: string
  name: string
  type: string
  due_date?: string | null
}

// Tipos transformados para el frontend (camelCase)
export interface ContractualProject {
  id: string
  name: string
  organizationId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  signature?: string | null
  contratanteData?: ContratanteData | null
}

export interface Contract {
  id: string
  name: string
  projectId: string
  contractDraftUrl?: string | null
  status: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface Invitation {
  id: string
  contractName: string
  email: string
  status: string
  invitedAt: string
  acceptedAt?: string | null
}

export interface ProjectDocument {
  contractId: string
  projectId: string
  contractName: string
  contractMemberId: string
  username: string
  email: string
  contractUrl?: string | null
  status: string
  statusJuridico?: string | null
  ending?: string | null
  requiredDocuments: RequiredDocumentWithStatus[]
}

export interface RequiredDocumentWithStatus {
  id: string
  name: string
  type: string
  dueDate?: string | null
  contractualDocumentId?: string
  contractualRequiredDocumentId?: string
  url?: string | null
}

export interface User {
  id: string
  username: string
  email: string
} 