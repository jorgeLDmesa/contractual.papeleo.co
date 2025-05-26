'use server';

import { createClient } from '@/lib/supabase/server';
import { getURL } from '@/lib/helpers';
import { getErrorRedirect, getStatusRedirect } from '@/lib/helpers';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

function isValidEmail(email: string) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}


export async function redirectToPath(path: string) {
  return redirect(path);
}

export async function SignOut(formData: FormData) {
  const pathName = String(formData.get('pathName')).trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return getErrorRedirect(
      pathName,
      'Hmm... Algo salió mal.',
      'No pudiste ser desconectado.'
    );
  }

  return '/login';
}

export async function signUp(formData: FormData) {
  const callbackURL = getURL('/auth/callback');

  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  const username = String(formData.get('username')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signup',
      'Dirección de correo electrónico inválida.',
      'Por favor, intenta de nuevo.'
    );
    return redirectPath; // Asegura un retorno temprano si el email es inválido
  }

  const supabase = await createClient();

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackURL,
      data: {
        username: username,
      }
    }
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signup',
      'El registro falló.',
      error.message
    );
  } else if (data.session) {
    redirectPath = getStatusRedirect('/', '¡Éxito!', 'Has iniciado sesión.');
  } else if (
    data.user &&
    data.user.identities &&
    data.user.identities.length === 0
  ) {
    redirectPath = getErrorRedirect(
      '/signup',
      'El registro falló.',
      'Ya existe una cuenta asociada a esta dirección de correo electrónico. Intenta restablecer tu contraseña.'
    );
  } else if (data.user) {
    redirectPath = getStatusRedirect(
      '/',
      '¡Éxito!',
      'Por favor, revisa tu correo electrónico para el enlace de confirmación. Puedes cerrar esta pestaña.'
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signup',
      'Hmm... Algo salió mal.',
      'No se pudo completar el registro.'
    );
  }

  return redirectPath;
}

export async function signInWithPassword(formData: FormData) {
  const cookieStore = await cookies();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/',
      'Error de inicio de sesión.',
      error.message
    );
  } else if (data.user) {
    cookieStore.set('preferredSignInView', 'password_signin', { path: '/' });
    redirectPath = getStatusRedirect(`/${data.user.id}/my-documents`, '¡Éxito!', 'Has iniciado sesión.');
  } else {
    redirectPath = getErrorRedirect(
      '/login',
      'Hmm... Algo salió mal.',
      'No pudiste ser autenticado.'
    );
  }

  return redirectPath;
}

export async function requestPasswordUpdate(formData: FormData) {
  const callbackURL = getURL('/change-password');

  // Get form data
  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/change-password',
      'Dirección de correo electrónico inválida.',
      'Por favor, intenta de nuevo.'
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackURL
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/change-password',
      error.message,
      'Por favor, intenta de nuevo.'
    );
  } else if (data) {
    redirectPath = getStatusRedirect(
      '/change-password',
      '¡Éxito!',
      'Por favor, revisa tu correo electrónico para el enlace de restablecimiento de contraseña. Puedes cerrar esta pestaña.',
      true
    );
  } else {
    redirectPath = getErrorRedirect(
      '/change-password',
      'Hmm... Algo salió mal.',
      'No se pudo enviar el correo electrónico de restablecimiento de contraseña.'
    );
  }

  return redirectPath;
}

export async function signInWithPasswordInvitation(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();

  try {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      cookieStore.set('preferredSignInView', 'password_signin', { path: '/' });
      return { success: true, user: data.user };
    }

    return { success: false, error: 'Authentication failed' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}


