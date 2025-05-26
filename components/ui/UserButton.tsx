'use client';

import { SignOut } from '@/lib/auth-helpers/server';
import { handleRequest } from '@/lib/auth-helpers/client';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/lib/auth-helpers/settings'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createClient } from "@/lib/supabase/client";

interface UserButtonProps {
    user?: any;
  }

export default function UserButton({ user }: UserButtonProps) {
  const router = useRouter();
  const pathName = usePathname();
  const redirectMethod = getRedirectMethod();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignOut = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('pathName', pathName);
    await handleRequest(e, SignOut, redirectMethod === 'client' ? router : null);
  };

  const handleSupportSubmit = async () => {
    if (!description.trim()) {
      toast.error("Error",{
        description: "Por favor, describe tu problema"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('soporte')
        .insert([
          {
            description,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      toast.success("¡Éxito!",{
        description: "Tu mensaje ha sido enviado correctamente",
      });
      setDescription('');
      setIsSupportOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error",{
        description: "Hubo un problema al enviar tu mensaje"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <User
              size={32}
              className="overflow-hidden rounded-full"
              aria-label="Avatar"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {`Hola! ${user.user_metadata.username}`}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsSupportOpen(true)}>
            Soporte
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form onSubmit={handleSignOut} className="w-full">
              <input type="hidden" name="pathName" value={pathName} />
              <button type="submit" className="w-full text-left">
                Cerrar sesión
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soporte Técnico</DialogTitle>
            <DialogDescription>
              Por favor, describe tu problema de manera clara y concisa. Nuestro equipo te ayudará lo antes posible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu problema aquí..."
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSupportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSupportSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
