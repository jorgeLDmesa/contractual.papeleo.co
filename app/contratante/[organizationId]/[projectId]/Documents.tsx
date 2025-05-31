'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DocumentsTable from './components/documents/DocumentsTable'
import { SearchDocuments } from './components/documents/SearchDocuments'
import { fetchProjectDocumentsByProjectId } from './actions/actionServer'
import { TableDocumentsSkeleton } from './components/documents/TableDocumentsSkeleton'

export default function Documents({ projectId }: { projectId: string }) {
  const [projectDocuments, setProjectDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true)
        const documentsData = await fetchProjectDocumentsByProjectId(projectId)
        setProjectDocuments(documentsData)
      } catch (error) {
        console.error('Error loading documents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [projectId])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Estado de Documentos de Contratistas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <SearchDocuments searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        {
          isLoading
            ? <TableDocumentsSkeleton />
            : <DocumentsTable 
                projectDocuments={projectDocuments}
                searchTerm={searchTerm}
              />
        }
      </CardContent>
    </Card>
  )
}

