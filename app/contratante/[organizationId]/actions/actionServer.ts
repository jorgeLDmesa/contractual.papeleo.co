"use server"

import { createClient } from "@/lib/supabase/server"
import { DbContractualProject, DbOrganization } from "../types"

/**
 * Fetches all projects for an organization
 * @param organizationId The ID of the organization
 * @returns Array of projects
 */
export async function fetchProjectsByOrganizationId(organizationId: string) {
  if (!organizationId) throw new Error('Organization ID is required to fetch projects')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contractual_projects')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error.message)
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  // Transform snake_case to camelCase
  return data.map((project: DbContractualProject) => ({
    id: project.id,
    name: project.name,
    organizationId: project.organization_id,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    deletedAt: project.deleted_at
  }))
}

/**
 * Creates a new project
 * @param name The name of the project
 * @param organizationId The ID of the organization
 * @returns The created project
 */
export async function createProject(name: string, organizationId: string) {
  if (!name || !organizationId) {
    throw new Error('Name and organization ID are required to create a project')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contractual_projects')
    .insert([{
      name,
      organization_id: organizationId
    }])
    .select()
    .single()

  if (error) {
    console.error("Error creating project:", error.message)
    throw new Error(`Failed to create project: ${error.message}`)
  }

  const typedData = data as DbContractualProject

  return {
    id: typedData.id,
    name: typedData.name,
    organizationId: typedData.organization_id,
    createdAt: typedData.created_at,
    updatedAt: typedData.updated_at,
    deletedAt: typedData.deleted_at
  }
}

/**
 * Updates a project name
 * @param projectId The ID of the project
 * @param newName The new name for the project
 * @returns The updated project
 */
export async function updateProjectName(projectId: string, newName: string) {
  if (!projectId || !newName) {
    throw new Error('Project ID and new name are required to update a project')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contractual_projects')
    .update({ name: newName })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error("Error updating project name:", error.message)
    throw new Error(`Failed to update project name: ${error.message}`)
  }

  const typedData = data as DbContractualProject

  return {
    id: typedData.id,
    name: typedData.name,
    organizationId: typedData.organization_id,
    createdAt: typedData.created_at,
    updatedAt: typedData.updated_at,
    deletedAt: typedData.deleted_at
  }
}

/**
 * Deletes a project (soft delete)
 * @param projectId The ID of the project to delete
 * @returns Success status
 */
export async function deleteProject(projectId: string) {
  if (!projectId) {
    throw new Error('Project ID is required to delete a project')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contractual_projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', projectId)

  if (error) {
    console.error("Error deleting project:", error.message)
    throw new Error(`Failed to delete project: ${error.message}`)
  }

  return true
}

/**
 * Fetches a project by its ID
 * @param projectId The ID of the project
 * @returns The project data
 */
export async function fetchProjectById(projectId: string) {
  if (!projectId) {
    throw new Error('Project ID is required to fetch a project')
  }

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
    deletedAt: typedData.deleted_at
  }
} 

/**
 * Fetches an organization by its ID
 * @param organizationId The ID of the organization
 * @returns The organization data
 */
export async function fetchOrganizationById(organizationId: string) {
  if (!organizationId) {
    throw new Error('Organization ID is required to fetch an organization')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error("Error fetching organization:", error.message)
    throw new Error(`Failed to fetch organization by ID: ${error.message}`)
  }

  const typedData = data as DbOrganization

  return {
    id: typedData.id,
    name: typedData.name,
    userId: typedData.user_id,
    contractsLimit: typedData.contracts_limit,
    createdAt: typedData.created_at,
    updatedAt: typedData.updated_at,
    deletedAt: typedData.deleted_at
  }
} 