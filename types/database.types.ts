/**
 * Hand-written baseline types for Phase 1 tables.
 *
 * Once the schema stabilizes, replace/extend this file with the
 * output of:
 *   npx supabase gen types typescript --project-id <ref> > types/database.types.ts
 *
 * Keeping it hand-written for now avoids checking in a huge
 * generated file before Phase 2 (catalog/inventory) tables exist.
 */

export type UserRoleEnum = 'super_admin' | 'admin' | 'staff' | 'salesman' | 'retailer';
export type RetailerStatusEnum = 'pending_approval' | 'active' | 'suspended';
export type NotificationChannelEnum = 'whatsapp' | 'sms' | 'push' | 'in_app';
export type NotificationStatusEnum = 'queued' | 'sent' | 'delivered' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRoleEnum;
          full_name: string;
          phone: string;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRoleEnum;
          full_name: string;
          phone: string;
          avatar_url?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      areas: {
        Row: {
          id: string;
          name: string;
          district: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          district?: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['areas']['Insert']>;
        Relationships: [];
      };
      retailers: {
        Row: {
          id: string;
          shop_name: string;
          gstin: string | null;
          area_id: string;
          address: string | null;
          credit_limit: number;
          outstanding_balance: number;
          status: RetailerStatusEnum;
          approved_by: string | null;
          approved_at: string | null;
          assigned_salesman_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          shop_name: string;
          gstin?: string | null;
          area_id: string;
          address?: string | null;
          credit_limit?: number;
          status?: RetailerStatusEnum;
        };
        Update: Partial<Database['public']['Tables']['retailers']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'retailers_area_id_fkey';
            columns: ['area_id'];
            isOneToOne: false;
            referencedRelation: 'areas';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          title: string;
          body: string;
          link_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          title: string;
          body: string;
          link_url?: string | null;
          is_read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          recipient_id: string | null;
          channel: NotificationChannelEnum;
          status: NotificationStatusEnum;
          provider_message_id: string | null;
          payload: Record<string, unknown> | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id?: string | null;
          channel: NotificationChannelEnum;
          status?: NotificationStatusEnum;
          provider_message_id?: string | null;
          payload?: Record<string, unknown> | null;
          error?: string | null;
        };
        Update: Partial<Database['public']['Tables']['notification_logs']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRoleEnum;
      retailer_status: RetailerStatusEnum;
      notification_channel: NotificationChannelEnum;
      notification_status: NotificationStatusEnum;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
      }
