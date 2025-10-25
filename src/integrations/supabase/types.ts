
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      favorites: {
        Row: {
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
            user_id: string
            first_name: string
            last_name: string
            email: string
            phone_number: string | null
            role: 'Admin' | 'Owner' | 'Tenant'
            is_approved: boolean
            auth_user_id: string | null
            created_at: string
            updated_at: string
            avatar_url?: string | null
        }
        Insert: {
            user_id?: string
            first_name: string
            last_name: string
            email: string
            phone_number?: string | null
            role: 'Admin' | 'Owner' | 'Tenant'
            is_approved?: boolean
            auth_user_id?: string | null
            created_at?: string
            updated_at?: string
            avatar_url?: string | null
        }
        Update: {
            user_id?: string
            first_name?: string
            last_name?: string
            email?: string
            phone_number?: string | null
            role?: 'Admin' | 'Owner' | 'Tenant'
            is_approved?: boolean
            auth_user_id?: string | null
            created_at?: string
            updated_at?: string
            avatar_url?: string | null
        }
      }
      properties: {
        Row: {
          property_id: string
          owner_id: string
          address_line_1: string
          city: string
          state: string
          zip_code: string
          type: string | null
          is_approved: boolean
          status: 'Available' | 'Occupied'
          created_at: string
          updated_at: string
          images: string[] | null
          wifi_available: boolean | null
          timings: string | null
          custom_specs: any | null
          rating: number | null
          rating_count: number | null
          price_per_room: number | null
          amenities: any | null
        }
        Insert: {
          property_id?: string
          owner_id: string
          address_line_1: string
          city: string
          state: string
          zip_code: string
          type?: string | null
          is_approved?: boolean
          status?: 'Available' | 'Occupied'
          created_at?: string
          updated_at?: string
          images?: string[] | null
          wifi_available?: boolean | null
          timings?: string | null
          custom_specs?: any | null
          rating?: number | null
          rating_count?: number | null
          price_per_room?: number | null
          amenities?: any | null
        }
        Update: {
          property_id?: string
          owner_id?: string
          address_line_1?: string
          city?: string
          state?: string
          zip_code?: string
          type?: string | null
          is_approved?: boolean
          status?: 'Available' | 'Occupied'
          created_at?: string
          updated_at?: string
          images?: string[] | null
          wifi_available?: boolean | null
          timings?: string | null
          custom_specs?: any | null
          rating?: number | null
          rating_count?: number | null
          price_per_room?: number | null
          amenities?: any | null
        }
      }
      rooms: {
        Row: {
          room_id: string
          property_id: string
          room_number: string
          rent_price: number
          description: string | null
          status: 'Available' | 'Occupied'
          created_at: string
          updated_at: string
        }
        Insert: {
          room_id?: string
          property_id: string
          room_number: string
          rent_price: number
          description?: string | null
          status?: 'Available' | 'Occupied'
          created_at?: string
          updated_at?: string
        }
        Update: {
          room_id?: string
          property_id?: string
          room_number?: string
          rent_price?: number
          description?: string | null
          status?: 'Available' | 'Occupied'
          created_at?: string
          updated_at?: string
        }
      }
      beds: {
        Row: {
          bed_id: string
          room_id: string
          bed_name: string
          status: 'Available' | 'Occupied'
          created_at: string
          updated_at: string
        }
        Insert: {
          bed_id?: string
          room_id: string
          bed_name: string
          status?: 'Available' | 'Occupied'
          created_at?: string
          updated_at?: string
        }
        Update: {
          bed_id?: string
          room_id?: string
          bed_name?: string
          status?: 'Available' | 'Occupied'
          created_at?: string
          updated_at?: string
        }
      }
      leases: {
        Row: {
          lease_id: string
          tenant_id: string
          room_id: string | null
          bed_id: string | null
          start_date: string
          end_date: string
          monthly_rent: number
          security_deposit: number
          billing_cycle: 'Monthly' | 'Weekly'
          status: 'Pending' | 'Active' | 'Completed' | 'Cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          lease_id?: string
          tenant_id: string
          room_id?: string | null
          bed_id?: string | null
          start_date: string
          end_date: string
          monthly_rent: number
          security_deposit: number
          billing_cycle: 'Monthly' | 'Weekly'
          status?: 'Pending' | 'Active' | 'Completed' | 'Cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          lease_id?: string
          tenant_id?: string
          room_id?: string | null
          bed_id?: string | null
          start_date?: string
          end_date?: string
          monthly_rent?: number
          security_deposit?: number
          billing_cycle?: 'Monthly' | 'Weekly'
          status?: 'Pending' | 'Active' | 'Completed' | 'Cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      payment_methods: {
        Row: {
          method_id: string
          user_id: string
          method_type: 'UPI' | 'Card' | 'Bank'
          last_four_digits: string | null
          is_auto_pay: boolean
          token: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          method_id?: string
          user_id: string
          method_type: 'UPI' | 'Card' | 'Bank'
          last_four_digits?: string | null
          is_auto_pay?: boolean
          token?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          method_id?: string
          user_id?: string
          method_type?: 'UPI' | 'Card' | 'Bank'
          last_four_digits?: string | null
          is_auto_pay?: boolean
          token?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          transaction_id: string
          lease_id: string
          amount: number
          transaction_date: string
          status: 'Pending' | 'Success' | 'Failed'
          payment_gateway_ref: string | null
          payment_method_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          transaction_id?: string
          lease_id: string
          amount: number
          transaction_date?: string
          status?: 'Pending' | 'Success' | 'Failed'
          payment_gateway_ref?: string | null
          payment_method_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          transaction_id?: string
          lease_id?: string
          amount?: number
          transaction_date?: string
          status?: 'Pending' | 'Success' | 'Failed'
          payment_gateway_ref?: string | null
          payment_method_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payouts: {
        Row: {
          payout_id: string
          owner_id: string
          related_transaction_id: string | null
          gross_amount: number
          gateway_fee: number
          net_amount: number
          payout_date: string | null
          status: 'Queued' | 'Processing' | 'Completed' | 'Failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          payout_id?: string
          owner_id: string
          related_transaction_id?: string | null
          gross_amount: number
          gateway_fee: number
          net_amount: number
          payout_date?: string | null
          status?: 'Queued' | 'Processing' | 'Completed' | 'Failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          payout_id?: string
          owner_id?: string
          related_transaction_id?: string | null
          gross_amount?: number
          gateway_fee?: number
          net_amount?: number
          payout_date?: string | null
          status?: 'Queued' | 'Processing' | 'Completed' | 'Failed'
          created_at?: string
          updated_at?: string
        }
      }
      disputes: {
        Row: {
          dispute_id: string
          raised_by_user_id: string
          related_transaction_id: string | null
          title: string
          description: string
          status: 'Open' | 'In Review' | 'Resolved' | 'Rejected'
          resolved_by_admin_id: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          dispute_id?: string
          raised_by_user_id: string
          related_transaction_id?: string | null
          title: string
          description: string
          status?: 'Open' | 'In Review' | 'Resolved' | 'Rejected'
          resolved_by_admin_id?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          dispute_id?: string
          raised_by_user_id?: string
          related_transaction_id?: string | null
          title?: string
          description?: string
          status?: 'Open' | 'In Review' | 'Resolved' | 'Rejected'
          resolved_by_admin_id?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
