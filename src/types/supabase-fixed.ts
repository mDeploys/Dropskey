export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: unknown | null
          message: string
          message_sha: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip?: unknown | null
          message: string
          message_sha: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: unknown | null
          message?: string
          message_sha?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          assigned_user_id: string | null
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          is_applied: boolean | null
        }
        Insert: {
          assigned_user_id?: string | null
          code: string
          created_at?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_applied?: boolean | null
        }
        Update: {
          assigned_user_id?: string | null
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price_at_purchase: number
          product_id: number
          product_key: string | null
          product_name: string | null
          quantity: number
          sku: string | null
          unit_price: number | null
          line_total: number | null
        }
        Insert: {
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: number
          product_key?: string | null
          product_name?: string | null
          quantity: number
          sku?: string | null
          unit_price?: number | null
          line_total?: number | null
        }
        Update: {
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: number
          product_key?: string | null
          product_name?: string | null
          quantity?: number
          sku?: string | null
          unit_price?: number | null
          line_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amounts: Json | null
          created_at: string
          id: string
          payment_gateway: string | null
          payment_id: string | null
          promo_code: string | null
          promo_snapshot: Json | null
          status: string
          total: number
          user_id: string
        }
        Insert: {
          amounts?: Json | null
          created_at?: string
          id?: string
          payment_gateway?: string | null
          payment_id?: string | null
          promo_code?: string | null
          promo_snapshot?: Json | null
          status?: string
          total: number
          user_id: string
        }
        Update: {
          amounts?: Json | null
          created_at?: string
          id?: string
          payment_gateway?: string | null
          payment_id?: string | null
          promo_code?: string | null
          promo_snapshot?: Json | null
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          description: string | null
          download_url: string | null
          id: number
          image: string | null
          is_digital: boolean | null
          is_most_sold: boolean | null
          is_on_sale: boolean | null
          name: string
          price: number
          sale_percent: number | null
          sale_price: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          sku: string | null
          tag: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          download_url?: string | null
          id?: number
          image?: string | null
          is_digital?: boolean | null
          is_most_sold?: boolean | null
          is_on_sale?: boolean | null
          name: string
          price: number
          sale_percent?: number | null
          sale_price?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          sku?: string | null
          tag?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          download_url?: string | null
          id?: number
          image?: string | null
          is_digital?: boolean | null
          is_most_sold?: boolean | null
          is_on_sale?: boolean | null
          name?: string
          price?: number
          sale_percent?: number | null
          sale_price?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          sku?: string | null
          tag?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          company_name: string | null
          country: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          postal_code: string | null
          state_province_region: string | null
          vat_number: string | null
          email: string | null
          created_at: string | null
          updated_at: string | null
          role: string | null
          wallet_balance: number | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          postal_code?: string | null
          state_province_region?: string | null
          vat_number?: string | null
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
          role?: string | null
          wallet_balance?: number | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          postal_code?: string | null
          state_province_region?: string | null
          vat_number?: string | null
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
          role?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applies_to: string | null
          code: string
          created_at: string | null
          end_at: string | null
          id: string
          is_active: boolean | null
          min_subtotal: number | null
          per_user_limit: number | null
          product_ids: number[] | null
          start_at: string | null
          type: string
          usage_limit: number | null
          value: number
        }
        Insert: {
          applies_to?: string | null
          code: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          min_subtotal?: number | null
          per_user_limit?: number | null
          product_ids?: number[] | null
          start_at?: string | null
          type: string
          usage_limit?: number | null
          value: number
        }
        Update: {
          applies_to?: string | null
          code?: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          min_subtotal?: number | null
          per_user_limit?: number | null
          product_ids?: number[] | null
          start_at?: string | null
          type?: string
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          price_per_user: number
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          price_per_user: number
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          price_per_user?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      store_notices: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]
type SchemaName = Exclude<keyof Database, '__InternalSupabase'>; // Define SchemaName

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: SchemaName }, // Use SchemaName here
  TableName extends PublicTableNameOrOptions extends { schema: SchemaName }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: SchemaName }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: SchemaName }, // Use SchemaName here
  TableName extends PublicTableNameOrOptions extends { schema: SchemaName }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: SchemaName }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: SchemaName }, // Use SchemaName here
  TableName extends PublicTableNameOrOptions extends { schema: SchemaName }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: SchemaName }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: SchemaName }, // Use SchemaName here
  EnumName extends PublicEnumNameOrOptions extends { schema: SchemaName }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: SchemaName }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
