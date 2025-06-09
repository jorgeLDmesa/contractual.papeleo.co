'use client'
import { useEffect, useState } from 'react'
import { CreateInvitationModal } from './components/invitations/CreateInvitationModal'
import InvitationCard from './components/invitations/InvitationCard'
import { SearchInvitations } from './components/invitations/SearchInvitations'
import { fetchInvitationsByProjectId, fetchProjectById } from './actions/actionServer'
import InvitationsSkeleton from './components/invitations/InvitationsSkeleton'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { Invitation, ContractualProject } from './types'

export default function Invitations({ projectId }: { projectId: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [selectedProject, setSelectedProject] = useState<ContractualProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(21)
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [projectData, invitationsData] = await Promise.all([
          fetchProjectById(projectId),
          fetchInvitationsByProjectId(projectId)
        ])
        setSelectedProject(projectData)
        setInvitations(invitationsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [projectId])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(21)
  }, [searchTerm, fromDate])

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + 21)
  }

  const getFilteredInvitations = () => {
    let filtered = invitations
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invitation =>
        invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.contractName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply date filter
    if (fromDate) {
      filtered = filtered.filter(invitation => {
        const invitationDate = new Date(invitation.invitedAt)
        return invitationDate >= fromDate
      })
    }

    return filtered
  }

  const filteredInvitations = getFilteredInvitations()
  const visibleInvitations = filteredInvitations.slice(0, visibleCount)
  const hasMoreInvitations = filteredInvitations.length > visibleCount

  const clearDateFilter = () => {
    setFromDate(undefined)
  }

  const refreshInvitations = async () => {
    try {
      const invitationsData = await fetchInvitationsByProjectId(projectId)
      setInvitations(invitationsData)
    } catch (error) {
      console.error('Error refreshing invitations:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Invitaciones</h2>
      {
        !isLoading &&
        <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
          <div className="flex flex-wrap gap-3 items-center">
            <SearchInvitations searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full md:w-auto justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? (
                    <span>Desde: {format(fromDate, "PPP", { locale: es })}</span>
                  ) : (
                    <span>Filtrar por fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            
            {fromDate && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearDateFilter}
                title="Borrar filtro de fecha"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <CreateInvitationModal 
            selectedProject={selectedProject}
            onInvitationCreated={refreshInvitations}
          />
        </div>
      }

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {
          isLoading
            ? <InvitationsSkeleton />
            : filteredInvitations.length === 0
              ?
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-lg">
                  No se encontraron invitaciones. {fromDate ? 'Intenta con otro filtro de fecha o ' : ''}
                  Haz clic en &ldquo;Invitar Usuario&rdquo; para comenzar.
                </p>
              </div>
              :
              visibleInvitations.map(invitation => (
                <InvitationCard 
                  key={invitation.id} 
                  invitation={invitation} 
                  onInvitationDeleted={refreshInvitations}
                />
              ))
        }
      </div>
      
      {hasMoreInvitations && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline"
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            onClick={handleLoadMore}
          >
            Ver más
          </Button>
        </div>
      )}
    </div>
  )
}
