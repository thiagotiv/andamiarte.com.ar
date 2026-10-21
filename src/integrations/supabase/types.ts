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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          seen_at: string | null
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          seen_at?: string | null
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          seen_at?: string | null
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_needs: {
        Row: {
          child_age: number | null
          needs: string
          schooling: string
          shifts: string
          supports: string
          user_id: string
          visibility?: string
        }
        Insert: {
          child_age?: number | null
          needs?: string
          schooling?: string
          shifts?: string
          supports?: string
          user_id: string
          visibility?: string
        }
        Update: {
          child_age?: number | null
          needs?: string
          schooling?: string
          shifts?: string
          supports?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_needs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_reviews: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_alerts: {
        Row: {
          levels: string[]
          tools: string[]
          updated_at: string
          user_id: string
          zones: string[]
        }
        Insert: {
          levels?: string[]
          tools?: string[]
          updated_at?: string
          user_id: string
          zones?: string[]
        }
        Update: {
          levels?: string[]
          tools?: string[]
          updated_at?: string
          user_id?: string
          zones?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "job_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          organization: string
          owner_id: string
          schedule: string
          skills: string[]
          title: string
          zone: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          organization: string
          owner_id: string
          schedule: string
          skills?: string[]
          title: string
          zone: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          organization?: string
          owner_id?: string
          schedule?: string
          skills?: string[]
          title?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          job_id: string | null
          link?: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          job_id?: string | null
          link?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          job_id?: string | null
          link?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          kind: string
          poll_data: Json | null
          tags: string[]
          likes_count: number
          comments_count: number
          shares_count: number
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          author_id: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          kind?: string
          poll_data?: Json | null
          tags?: string[]
          likes_count?: number
          comments_count?: number
          shares_count?: number
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          kind?: string
          poll_data?: Json | null
          tags?: string[]
          likes_count?: number
          comments_count?: number
          shares_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_avatar: string | null
          author_id: string
          author_name: string
          author_role: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_id: string
          author_name: string
          author_role?: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string
          author_name?: string
          author_role?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: []
      }
      post_shares: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          post_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          user_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available: boolean
          avatar_path: string | null
          billing: string
          bio: string
          contact: string
          cv_path: string | null
          dni?: string
          education: Json
          exact_location?: string
          experience: Json
          id: string
          institution_type: string
          name: string
          onboarded: boolean
          phone?: string
          privacy_settings?: Json
          public_profile: boolean
          skills: string[]
          verified: boolean
          years_experience: number
          zone: string
        }
        Insert: {
          available?: boolean
          avatar_path?: string | null
          billing?: string
          bio?: string
          contact?: string
          cv_path?: string | null
          dni?: string
          education?: Json
          exact_location?: string
          experience?: Json
          id: string
          institution_type?: string
          name?: string
          onboarded?: boolean
          phone?: string
          privacy_settings?: Json
          public_profile?: boolean
          skills?: string[]
          verified?: boolean
          years_experience?: number
          zone?: string
        }
        Update: {
          available?: boolean
          avatar_path?: string | null
          billing?: string
          bio?: string
          contact?: string
          cv_path?: string | null
          dni?: string
          education?: Json
          exact_location?: string
          experience?: Json
          id?: string
          institution_type?: string
          name?: string
          onboarded?: boolean
          phone?: string
          privacy_settings?: Json
          public_profile?: boolean
          skills?: string[]
          verified?: boolean
          years_experience?: number
          zone?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          author_id: string
          author_name: string
          author_role: string
          content: string
          created_at: string
          highlighted_skills: string[]
          id: string
          professional_id: string
          relationship_context: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string
          author_role?: string
          content: string
          created_at?: string
          highlighted_skills?: string[]
          id?: string
          professional_id: string
          relationship_context?: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string
          content?: string
          created_at?: string
          highlighted_skills?: string[]
          id?: string
          professional_id?: string
          relationship_context?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          viewer_id: string | null
          viewer_name: string | null
          viewer_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          viewer_id?: string | null
          viewer_name?: string | null
          viewer_role?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          viewer_id?: string | null
          viewer_name?: string | null
          viewer_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_appearances: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          query: string | null
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          query?: string | null
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          query?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_appearances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_profiles: {
        Row: {
          created_at: string
          owner_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          owner_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          owner_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_endorsements: {
        Row: {
          created_at: string
          endorser_id: string
          id: string
          profile_id: string
          skill: string
        }
        Insert: {
          created_at?: string
          endorser_id: string
          id?: string
          profile_id: string
          skill: string
        }
        Update: {
          created_at?: string
          endorser_id?: string
          id?: string
          profile_id?: string
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_endorsements_endorser_id_fkey"
            columns: ["endorser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_endorsements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { uid: string; wanted: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      list_professionals: {
        Args: never
        Returns: {
          available: boolean
          avatar_path: string | null
          billing: string
          bio: string
          contact: string
          cv_path: string | null
          dni?: string
          education: Json
          exact_location?: string
          experience: Json
          id: string
          institution_type: string
          name: string
          onboarded: boolean
          phone?: string
          privacy_settings?: Json
          public_profile: boolean
          skills: string[]
          verified: boolean
          years_experience: number
          zone: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "aie" | "centro" | "familia"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["aie", "centro", "familia"],
    },
  },
} as const
