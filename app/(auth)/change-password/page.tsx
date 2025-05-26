import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ChangePassword from './ChangePassword';

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  // Get user for potential future use, but not needed for this component
  await supabase.auth.getUser();

  // No redirigimos aquí, dejamos que el componente del cliente maneje la verificación
  // para permitir el flujo de magic links

  return (
    <ChangePassword />
  );
} 