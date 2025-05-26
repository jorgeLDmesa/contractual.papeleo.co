import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ForgotPassword from './ForgotPassword';

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return redirect('/');
  }

  return (
    <ForgotPassword disableButton={false} />
  );
}
