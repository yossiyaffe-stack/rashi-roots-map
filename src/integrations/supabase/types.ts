export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      historical_events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          importance: Database["public"]["Enums"]["event_importance"]
          latitude: number | null
          longitude: number | null
          name: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          importance?: Database["public"]["Enums"]["event_importance"]
          latitude?: number | null
          longitude?: number | null
          name: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          importance?: Database["public"]["Enums"]["event_importance"]
          latitude?: number | null
          longitude?: number | null
          name?: string
          year?: number
        }
        Relationships: []
      }
      location_names: {
        Row: {
          created_at: string
          id: string
          is_preferred: boolean | null
          language: string
          name: string
          name_origin: string | null
          name_type: string
          normalized_name: string | null
          notes: string | null
          place_id: string
          script: string | null
          source: string | null
          updated_at: string
          valid_from: number | null
          valid_to: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          language: string
          name: string
          name_origin?: string | null
          name_type: string
          normalized_name?: string | null
          notes?: string | null
          place_id: string
          script?: string | null
          source?: string | null
          updated_at?: string
          valid_from?: number | null
          valid_to?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          language?: string
          name?: string
          name_origin?: string | null
          name_type?: string
          normalized_name?: string | null
          notes?: string | null
          place_id?: string
          script?: string | null
          source?: string | null
          updated_at?: string
          valid_from?: number | null
          valid_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "location_names_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          end_year: number | null
          historical_context: string | null
          id: string
          latitude: number
          location_name: string
          longitude: number
          reason: Database["public"]["Enums"]["location_reason"] | null
          scholar_id: string
          start_year: number | null
        }
        Insert: {
          created_at?: string
          end_year?: number | null
          historical_context?: string | null
          id?: string
          latitude: number
          location_name: string
          longitude: number
          reason?: Database["public"]["Enums"]["location_reason"] | null
          scholar_id: string
          start_year?: number | null
        }
        Update: {
          created_at?: string
          end_year?: number | null
          historical_context?: string | null
          id?: string
          latitude?: number
          location_name?: string
          longitude?: number
          reason?: Database["public"]["Enums"]["location_reason"] | null
          scholar_id?: string
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_scholar_id_fkey"
            columns: ["scholar_id"]
            isOneToOne: false
            referencedRelation: "scholars"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          created_at: string
          historical_context: string | null
          id: string
          importance: number | null
          is_archbishopric: boolean | null
          is_bishopric: boolean | null
          is_shum_city: boolean | null
          latitude: number
          location_type: string | null
          longitude: number
          medieval_region: string | null
          modern_country: string | null
          modern_name: string
          name_english: string
          name_hebrew: string | null
          name_historical: string | null
          notes: string | null
          significance_end_year: number | null
          significance_start_year: number | null
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          historical_context?: string | null
          id?: string
          importance?: number | null
          is_archbishopric?: boolean | null
          is_bishopric?: boolean | null
          is_shum_city?: boolean | null
          latitude: number
          location_type?: string | null
          longitude: number
          medieval_region?: string | null
          modern_country?: string | null
          modern_name: string
          name_english: string
          name_hebrew?: string | null
          name_historical?: string | null
          notes?: string | null
          significance_end_year?: number | null
          significance_start_year?: number | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          historical_context?: string | null
          id?: string
          importance?: number | null
          is_archbishopric?: boolean | null
          is_bishopric?: boolean | null
          is_shum_city?: boolean | null
          latitude?: number
          location_type?: string | null
          longitude?: number
          medieval_region?: string | null
          modern_country?: string | null
          modern_name?: string
          name_english?: string
          name_hebrew?: string | null
          name_historical?: string | null
          notes?: string | null
          significance_end_year?: number | null
          significance_start_year?: number | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string
          description: string | null
          educational_subtype:
            | Database["public"]["Enums"]["educational_subtype"]
            | null
          end_year: number | null
          family_subtype: Database["public"]["Enums"]["family_subtype"] | null
          from_scholar_id: string | null
          from_work_id: string | null
          id: string
          literary_subtype:
            | Database["public"]["Enums"]["literary_subtype"]
            | null
          start_year: number | null
          to_scholar_id: string | null
          to_work_id: string | null
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          educational_subtype?:
            | Database["public"]["Enums"]["educational_subtype"]
            | null
          end_year?: number | null
          family_subtype?: Database["public"]["Enums"]["family_subtype"] | null
          from_scholar_id?: string | null
          from_work_id?: string | null
          id?: string
          literary_subtype?:
            | Database["public"]["Enums"]["literary_subtype"]
            | null
          start_year?: number | null
          to_scholar_id?: string | null
          to_work_id?: string | null
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          educational_subtype?:
            | Database["public"]["Enums"]["educational_subtype"]
            | null
          end_year?: number | null
          family_subtype?: Database["public"]["Enums"]["family_subtype"] | null
          from_scholar_id?: string | null
          from_work_id?: string | null
          id?: string
          literary_subtype?:
            | Database["public"]["Enums"]["literary_subtype"]
            | null
          start_year?: number | null
          to_scholar_id?: string | null
          to_work_id?: string | null
          type?: Database["public"]["Enums"]["relationship_type"]
        }
        Relationships: [
          {
            foreignKeyName: "relationships_from_scholar_id_fkey"
            columns: ["from_scholar_id"]
            isOneToOne: false
            referencedRelation: "scholars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_from_work_id_fkey"
            columns: ["from_work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_scholar_id_fkey"
            columns: ["to_scholar_id"]
            isOneToOne: false
            referencedRelation: "scholars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_work_id_fkey"
            columns: ["to_work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      scholars: {
        Row: {
          bio: string | null
          birth_place: string | null
          birth_year: number | null
          created_at: string
          death_place: string | null
          death_year: number | null
          hebrew_name: string | null
          id: string
          image_url: string | null
          importance: number | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          period: string | null
          relationship_type: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          birth_place?: string | null
          birth_year?: number | null
          created_at?: string
          death_place?: string | null
          death_year?: number | null
          hebrew_name?: string | null
          id?: string
          image_url?: string | null
          importance?: number | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          period?: string | null
          relationship_type?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          birth_place?: string | null
          birth_year?: number | null
          created_at?: string
          death_place?: string | null
          death_year?: number | null
          hebrew_name?: string | null
          id?: string
          image_url?: string | null
          importance?: number | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          period?: string | null
          relationship_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      works: {
        Row: {
          created_at: string
          description: string | null
          hebrew_title: string | null
          id: string
          manuscript_id: string | null
          manuscript_url: string | null
          scholar_id: string
          title: string
          updated_at: string
          work_type: Database["public"]["Enums"]["work_type"]
          year_written: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hebrew_title?: string | null
          id?: string
          manuscript_id?: string | null
          manuscript_url?: string | null
          scholar_id: string
          title: string
          updated_at?: string
          work_type?: Database["public"]["Enums"]["work_type"]
          year_written?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hebrew_title?: string | null
          id?: string
          manuscript_id?: string | null
          manuscript_url?: string | null
          scholar_id?: string
          title?: string
          updated_at?: string
          work_type?: Database["public"]["Enums"]["work_type"]
          year_written?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "works_scholar_id_fkey"
            columns: ["scholar_id"]
            isOneToOne: false
            referencedRelation: "scholars"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      normalize_place_name: { Args: { input_name: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
      educational_subtype: "teacher" | "student" | "study_partner"
      event_importance: "critical" | "major" | "foundational" | "scholarly"
      family_subtype:
        | "parent"
        | "child"
        | "sibling"
        | "spouse"
        | "grandparent"
        | "grandchild"
      literary_subtype:
        | "supercommentary"
        | "explanation"
        | "debate"
        | "response"
        | "citation"
        | "translation"
      location_reason:
        | "birth"
        | "study"
        | "rabbinate"
        | "exile"
        | "refuge"
        | "travel"
        | "death"
      relationship_type: "family" | "educational" | "literary"
      work_type:
        | "commentary"
        | "responsa"
        | "talmud_commentary"
        | "halakha"
        | "philosophy"
        | "kabbalah"
        | "supercommentary"
        | "poetry"
        | "grammar"
        | "ethics"
        | "homiletics"
        | "other"
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
    Enums: {
      app_role: ["admin", "editor", "user"],
      educational_subtype: ["teacher", "student", "study_partner"],
      event_importance: ["critical", "major", "foundational", "scholarly"],
      family_subtype: [
        "parent",
        "child",
        "sibling",
        "spouse",
        "grandparent",
        "grandchild",
      ],
      literary_subtype: [
        "supercommentary",
        "explanation",
        "debate",
        "response",
        "citation",
        "translation",
      ],
      location_reason: [
        "birth",
        "study",
        "rabbinate",
        "exile",
        "refuge",
        "travel",
        "death",
      ],
      relationship_type: ["family", "educational", "literary"],
      work_type: [
        "commentary",
        "responsa",
        "talmud_commentary",
        "halakha",
        "philosophy",
        "kabbalah",
        "supercommentary",
        "poetry",
        "grammar",
        "ethics",
        "homiletics",
        "other",
      ],
    },
  },
} as const
