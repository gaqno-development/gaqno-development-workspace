export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          avatar_url: string | null
          role: 'admin' | 'manager' | 'user'
          department: string | null
          permissions: string[]
          tenant_id: string | null
          is_root_admin: boolean
          feature_permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          department?: string | null
          permissions?: string[]
          tenant_id?: string | null
          is_root_admin?: boolean
          feature_permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          department?: string | null
          permissions?: string[]
          tenant_id?: string | null
          is_root_admin?: boolean
          feature_permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      feature_roles: {
        Row: {
          id: string
          feature_key: string
          role_key: string
          role_name: string
          description: string | null
          is_global: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature_key: string
          role_key: string
          role_name: string
          description?: string | null
          is_global?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          feature_key?: string
          role_key?: string
          role_name?: string
          description?: string | null
          is_global?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_feature_permissions: {
        Row: {
          id: string
          user_id: string
          profile_id: string | null
          tenant_id: string | null
          feature_key: string
          role_key: string
          granted_by: string | null
          granted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id?: string | null
          tenant_id?: string | null
          feature_key: string
          role_key: string
          granted_by?: string | null
          granted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string | null
          tenant_id?: string | null
          feature_key?: string
          role_key?: string
          granted_by?: string | null
          granted_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      whitelabel_configs: {
        Row: {
          id: string
          tenant_id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          company_name: string
          favicon_url: string | null
          custom_css: string | null
          font_family: string | null
          app_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          company_name: string
          favicon_url?: string | null
          custom_css?: string | null
          font_family?: string | null
          app_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          company_name?: string
          favicon_url?: string | null
          custom_css?: string | null
          font_family?: string | null
          app_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

