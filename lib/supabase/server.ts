import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './types';
import { NextRequest } from 'next/server';
// Define a function to create a Supabase client for server-side operations
// The function takes a cookie store created with next/headers cookies as an argument
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    // Define a cookies object with methods for interacting with the cookie store and pass it to the client
    {
      cookies: {
        // The get method is used to retrieve a cookie by its name
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // The set method is used to set a cookie with a given name, value, and options
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Si el método set es llamado desde un Componente de Servidor, puede ocurrir un error
            // Esto se puede ignorar si hay middleware refrescando las sesiones de usuario
            console.warn('Error al establecer la cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Si el método remove es llamado desde un Componente de Servidor, puede ocurrir un error
            // Esto se puede ignorar si hay middleware refrescando las sesiones de usuario
            console.warn('Error al eliminar la cookie:', error);
          }
        }
      }
    }
  );
};

// ... existing imports ...

export const createClient2 = async (request?: NextRequest) => {
  // Use cookies from request if provided, otherwise use cookies() from next/headers
  const cookieStore = request?.cookies ?? await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.warn('Error al establecer la cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.warn('Error al eliminar la cookie:', error);
          }
        }
      }
    }
  );
};