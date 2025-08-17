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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookmark_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          article_id: string | null
          created_at: string
          folder_name: string
          id: string
          notes: string | null
          post_id: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          folder_name?: string
          id?: string
          notes?: string | null
          post_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          folder_name?: string
          id?: string
          notes?: string | null
          post_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      code_snippets: {
        Row: {
          code: string
          created_at: string
          description: string | null
          fork_from: string | null
          id: string
          is_public: boolean
          language: string
          like_count: number
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          fork_from?: string | null
          id?: string
          is_public?: boolean
          language?: string
          like_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          fork_from?: string | null
          id?: string
          is_public?: boolean
          language?: string
          like_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "code_snippets_fork_from_fkey"
            columns: ["fork_from"]
            isOneToOne: false
            referencedRelation: "code_snippets"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          content: string
          content_simplified: boolean | null
          created_at: string
          id: string
          is_hidden: boolean | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          content: string
          content_simplified?: boolean | null
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          content_simplified?: boolean | null
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_quality_evaluations: {
        Row: {
          auto_hidden: boolean | null
          content_id: string
          content_type: string
          created_at: string
          credibility_score: number
          developer_level: string
          id: string
          overall_score: number
          quality_issues: string[] | null
          recommended_tags: string[] | null
          relevance_score: number
          technical_depth: number
          trending_potential: number
        }
        Insert: {
          auto_hidden?: boolean | null
          content_id: string
          content_type: string
          created_at?: string
          credibility_score: number
          developer_level: string
          id?: string
          overall_score: number
          quality_issues?: string[] | null
          recommended_tags?: string[] | null
          relevance_score: number
          technical_depth: number
          trending_potential: number
        }
        Update: {
          auto_hidden?: boolean | null
          content_id?: string
          content_type?: string
          created_at?: string
          credibility_score?: number
          developer_level?: string
          id?: string
          overall_score?: number
          quality_issues?: string[] | null
          recommended_tags?: string[] | null
          relevance_score?: number
          technical_depth?: number
          trending_potential?: number
        }
        Relationships: []
      }
      content_simplifications: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          original_summary: string | null
          original_title: string
          reading_level: string
          simplification_notes: string[] | null
          simplified_summary: string | null
          simplified_title: string
          target_level: string | null
          technical_terms_explained: Json | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          original_summary?: string | null
          original_title: string
          reading_level: string
          simplification_notes?: string[] | null
          simplified_summary?: string | null
          simplified_title: string
          target_level?: string | null
          technical_terms_explained?: Json | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          original_summary?: string | null
          original_title?: string
          reading_level?: string
          simplification_notes?: string[] | null
          simplified_summary?: string | null
          simplified_title?: string
          target_level?: string | null
          technical_terms_explained?: Json | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          author: string | null
          author_id: string
          comment_count: number
          content: string
          content_simplified: boolean | null
          created_at: string
          id: string
          is_featured: boolean
          is_hidden: boolean | null
          like_count: number
          published_at: string | null
          source_url: string | null
          summary: string | null
          tags: Json | null
          thumbnail: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author?: string | null
          author_id: string
          comment_count?: number
          content: string
          content_simplified?: boolean | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean | null
          like_count?: number
          published_at?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: Json | null
          thumbnail?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author?: string | null
          author_id?: string
          comment_count?: number
          content?: string
          content_simplified?: boolean | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_hidden?: boolean | null
          like_count?: number
          published_at?: string | null
          source_url?: string | null
          summary?: string | null
          tags?: Json | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_scores: {
        Row: {
          calculated_at: string
          content_id: string
          content_type: string
          engagement_score: number
          id: string
          quality_score: number
          recency_score: number
          trending_score: number
          velocity_score: number
        }
        Insert: {
          calculated_at?: string
          content_id: string
          content_type: string
          engagement_score: number
          id?: string
          quality_score: number
          recency_score: number
          trending_score: number
          velocity_score: number
        }
        Update: {
          calculated_at?: string
          content_id?: string
          content_type?: string
          engagement_score?: number
          id?: string
          quality_score?: number
          recency_score?: number
          trending_score?: number
          velocity_score?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          is_deleted: boolean
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          id: string
          user_id: string
          expertise_areas: string[]
          years_experience: number
          available: boolean
          hourly_rate: number | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expertise_areas: string[]
          years_experience: number
          available?: boolean
          hourly_rate?: number | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expertise_areas?: string[]
          years_experience?: number
          available?: boolean
          hourly_rate?: number | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: string
          status: string
          created_at: string
          expires_at: string | null
          payment_provider: string | null
          provider_subscription_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: string
          status: string
          created_at?: string
          expires_at?: string | null
          payment_provider?: string | null
          provider_subscription_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: string
          status?: string
          created_at?: string
          expires_at?: string | null
          payment_provider?: string | null
          provider_subscription_id?: string | null
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          target_id: string | null
          target_type: string | null
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          target_id?: string | null
          target_type?: string | null
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          target_id?: string | null
          target_type?: string | null
          data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_tag_follows: {
        Row: {
          id: string
          user_id: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tag: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tag?: string
          created_at?: string
        }
        Relationships: []
      }
      social_shares: {
        Row: {
          id: string
          user_id: string
          content_id: string
          content_type: string
          platform: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: string
          platform: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: string
          platform?: string
          created_at?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          id: string
          user_id: string
          content_id: string
          content_type: string
          interaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          content_type: string
          interaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          content_type?: string
          interaction_type?: string
          created_at?: string
        }
        Relationships: []
      }
      tag_follows: {
        Row: {
          id: string
          user_id: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tag_name?: string
          created_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      payment_providers: {
        Row: {
          id: string
          name: string
          display_name: string
          country_codes: string[]
          currencies: string[]
          payment_types: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          country_codes: string[]
          currencies: string[]
          payment_types: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          country_codes?: string[]
          currencies?: string[]
          payment_types?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string
          price_monthly: number
          price_yearly: number
          features: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price_monthly: number
          price_yearly: number
          features: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price_monthly?: number
          price_yearly?: number
          features?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          content_mode: string
          email_notifications: boolean
          push_notifications: boolean
          anonymous_mode_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          language?: string
          content_mode?: string
          email_notifications?: boolean
          push_notifications?: boolean
          anonymous_mode_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          language?: string
          content_mode?: string
          email_notifications?: boolean
          push_notifications?: boolean
          anonymous_mode_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          badge_name: string
          badge_description: string
          badge_icon: string
          earned_at: string
          points: number
          category: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          badge_name: string
          badge_description: string
          badge_icon: string
          earned_at?: string
          points: number
          category: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          badge_name?: string
          badge_description?: string
          badge_icon?: string
          earned_at?: string
          points?: number
          category?: string
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          id: string
          user_id: string
          level: number
          experience_points: number
          badges: string[]
          achievements: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level?: number
          experience_points?: number
          badges?: string[]
          achievements?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: number
          experience_points?: number
          badges?: string[]
          achievements?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          id: string
          nickname: string | null
          profile_image_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          id: string
          nickname?: string | null
          profile_image_url?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          nickname?: string | null
          profile_image_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles: {
        Row: {
          created_at: string | null
          id: string | null
          nickname: string | null
          profile_image_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          nickname?: string | null
          profile_image_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          nickname?: string | null
          profile_image_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      increment_view_count: {
        Args: { content_id: string; content_type: string }
        Returns: number
      }
      is_admin: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { event_type: string; metadata?: Json; target_user_id?: string }
        Returns: undefined
      }
      verify_admin_action: {
        Args: { action_description: string }
        Returns: boolean
      }
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
