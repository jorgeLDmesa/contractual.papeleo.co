export interface ContractualProject {
  id: string
  name: string
  organizationId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
} 

export interface Organization {
  id: string;
  name: string;
  userId: string;
  contractsLimit: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Tipos para las respuestas de la base de datos (snake_case)
export interface DbContractualProject {
  id: string
  name: string
  organization_id: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface DbOrganization {
  id: string
  name: string
  user_id: string
  contracts_limit: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
}