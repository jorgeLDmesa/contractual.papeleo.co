// Tipo JSON para las columnas JSONB
export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Interfaz para la tabla 'companies'
export interface Companies {
  id: number
  name: string
  email_domain: string
}

// Interfaz para la tabla 'users'
export interface Users {
  id: string
  username: string
  email: string
  user_type: 'normal' | 'empresa'
  company_id: number | null
  created_at: string // Timestamp en formato ISO
  updated_at: string // Timestamp en formato ISO
}

// Interfaz para la tabla 'templates'
export interface Templates {
  id: number
  name: string
  description: string | null
  price: number
  sections: Json
  category: string | null
  privacy: boolean
  created_at: string // Timestamp en formato ISO
  updated_at: string // Timestamp en formato ISO
}

// Interfaz para la tabla 'documents'
export interface Documents {
  id: number
  template_id: number
  user_id: string
  title: string
  sections: Json
  last_saved: string // Timestamp en formato ISO
  created_at: string // Timestamp en formato ISO
}

// Interfaz general para la base de datos
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Companies
        Insert: Omit<Companies, 'id'> // Para inserciones, omitir el ID ya que es autogenerado
        Update: Partial<Omit<Companies, 'id'>>
      }
      users: {
        Row: Users
        Insert: Omit<Users, 'created_at' | 'updated_at'> // 'id' viene de auth, 'created_at' y 'updated_at' tienen valor por defecto
        Update: Partial<Omit<Users, 'created_at' | 'updated_at'>>
      }
      templates: {
        Row: Templates
        Insert: Omit<Templates, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Templates, 'id' | 'created_at' | 'updated_at'>>
      }
      documents: {
        Row: Documents
        Insert: Omit<Documents, 'id' | 'last_saved' | 'created_at'>
        Update: Partial<Omit<Documents, 'id' | 'last_saved' | 'created_at'>>
      }
    }
  }
}
