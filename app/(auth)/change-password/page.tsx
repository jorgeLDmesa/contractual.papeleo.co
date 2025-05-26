import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ChangePassword from './ChangePassword';

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No redirigimos aquí, dejamos que el componente del cliente maneje la verificación
  // para permitir el flujo de magic links

  return (
    <ChangePassword />
  );
} 