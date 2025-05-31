import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteInvitation } from '../../actions/actionServer'
import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { Invitation } from '../../types'

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

interface InvitationCardProps {
  invitation: Invitation
  onInvitationDeleted?: () => void
}

const InvitationCard = ({ invitation, onInvitationDeleted }: InvitationCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteInvitation(invitation.id)
      toast.success('Invitación eliminada correctamente')
      onInvitationDeleted?.()
    } catch (error) {
      toast.error('No se pudo eliminar la invitación')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Card key={invitation.id}>
      <CardHeader>
        <CardTitle className='text-lg break-words'>{invitation.email}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-1'>
        <div className="text-sm text-gray-500">Contrato: {invitation.contractName}</div>
        <div className="text-sm text-gray-500">Documentos:
          {
            invitation.status === 'pending'
              ? <Badge variant="outline" className='text-destructive ml-1 border-red-700'>Pendientes</Badge>
              : <Badge className='ml-1 text-green-500 bg-green-100 border-green-200'>Completos</Badge>
          }
        </div>
        <div className="text-sm text-gray-500">Invitado el: {formatDate(invitation.invitedAt)}</div>
        <div className="text-sm text-gray-500">Invitacion:
          {
            invitation.acceptedAt
              ? <Badge className='ml-1 text-green-500 bg-green-100 border-green-200'>Aceptada</Badge>
              : <Badge variant="outline" className='text-destructive ml-1 border-red-700'>Pendiente</Badge>
          }
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive hover:bg-destructive/10 ml-auto" 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Eliminar
        </Button>
      </CardFooter>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la invitación para <strong>{invitation.email}</strong> y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default InvitationCard