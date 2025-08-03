export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ad_impressions: {
        Row: {
          ad_id: string
          clicked: boolean | null
          created_at: string
          id: string
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          ad_id: string
          clicked?: boolean | null
          created_at?: string
          id?: string
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          clicked?: boolean | null
          created_at?: string
          id?: string
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          ad_type: string
          budget: number | null
          click_url: string
          clicks: number | null
          content: string | null
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number | null
          is_active: boolean | null
          spent: number | null
          start_date: string
          target_audience: Json | null
          title: string
        }
        Insert: {
          ad_type: string
          budget?: number | null
          click_url: string
          clicks?: number | null
          content?: string | null
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          spent?: number | null
          start_date: string
          target_audience?: Json | null
          title: string
        }
        Update: {
          ad_type?: string
          budget?: number | null
          click_url?: string
          clicks?: number | null
          content?: string | null
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          spent?: number | null
          start_date?: string
          target_audience?: Json | null
          title?: string
        }
        Relationships: []
      }
      ai_explanation_requests: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          explanation_generated: string | null
          id: string
          terms_explained: string[]
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          explanation_generated?: string | null
          id?: string
          terms_explained: string[]
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          explanation_generated?: string | null
          id?: string
          terms_explained?: string[]
          user_id?: string
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
          folder_name: string | null
          id: string
          notes: string | null
          post_id: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          folder_name?: string | null
          id?: string
          notes?: string | null
          post_id?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          folder_name?: string | null
          id?: string
          notes?: string | null
          post_id?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      code_snippets: {
        Row: {
          code: string
          created_at: string
          description: string | null
          fork_from: string | null
          id: string
          is_public: boolean | null
          language: string
          like_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          fork_from?: string | null
          id?: string
          is_public?: boolean | null
          language: string
          like_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          fork_from?: string | null
          id?: string
          is_public?: boolean | null
          language?: string
          like_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
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
      collaboration_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string | null
          metadata: Json | null
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "collaboration_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_participants: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          space_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          space_id?: string
          user_id?: string
        }
        Relationships: []
      }
      collaboration_room_participants: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string
          left_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string
          left_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string
          left_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "collaboration_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          max_participants: number | null
          name: string
          password_hash: string | null
          room_type: string
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name: string
          password_hash?: string | null
          room_type: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          name?: string
          password_hash?: string | null
          room_type?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      collaboration_spaces: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          max_participants: number | null
          project_url: string | null
          status: string | null
          title: string
          tools_used: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          max_participants?: number | null
          project_url?: string | null
          status?: string | null
          title: string
          tools_used?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          max_participants?: number | null
          project_url?: string | null
          status?: string | null
          title?: string
          tools_used?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          anonymous_author_id: string | null
          anonymous_author_name: string | null
          article_id: string | null
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          is_edited: boolean | null
          is_hidden: boolean | null
          like_count: number | null
          parent_id: string | null
          post_id: string | null
          updated_at: string | null
        }
        Insert: {
          anonymous_author_id?: string | null
          anonymous_author_name?: string | null
          article_id?: string | null
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_edited?: boolean | null
          is_hidden?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string | null
        }
        Update: {
          anonymous_author_id?: string | null
          anonymous_author_name?: string | null
          article_id?: string | null
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_edited?: boolean | null
          is_hidden?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_article"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_parent_comment"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          anonymous_author_id: string | null
          anonymous_author_name: string | null
          author_id: string | null
          comment_count: number | null
          content: string
          content_simplified: string | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          is_featured: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          tags: string[] | null
          title: string
          tools_used: string[] | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          anonymous_author_id?: string | null
          anonymous_author_name?: string | null
          author_id?: string | null
          comment_count?: number | null
          content: string
          content_simplified?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          tags?: string[] | null
          title: string
          tools_used?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          anonymous_author_id?: string | null
          anonymous_author_name?: string | null
          author_id?: string | null
          comment_count?: number | null
          content?: string
          content_simplified?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          tags?: string[] | null
          title?: string
          tools_used?: string[] | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_history: {
        Row: {
          changes: Json
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          changes: Json
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          changes?: Json
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      learning_paths: {
        Row: {
          created_at: string
          current_step: number | null
          id: string
          progress_data: Json | null
          technology: string
          total_steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number | null
          id?: string
          progress_data?: Json | null
          technology: string
          total_steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number | null
          id?: string
          progress_data?: Json | null
          technology?: string
          total_steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          progress_percentage: number | null
          rating: number | null
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          rating?: number | null
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          rating?: number | null
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "learning_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          estimated_duration: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          rating: number | null
          rating_count: number | null
          resource_type: string
          tags: string[] | null
          thumbnail: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          rating?: number | null
          rating_count?: number | null
          resource_type: string
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          rating?: number | null
          rating_count?: number | null
          resource_type?: string
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          article_id: string | null
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_article"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comment"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string
          experience_years: number | null
          expertise_areas: string[]
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          rating: number | null
          total_sessions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          expertise_areas: string[]
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          rating?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          expertise_areas?: string[]
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          rating?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentoring_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          matched_at: string | null
          mentee_id: string
          mentor_id: string | null
          skill_level: string | null
          status: string | null
          topic: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          matched_at?: string | null
          mentee_id: string
          mentor_id?: string | null
          skill_level?: string | null
          status?: string | null
          topic: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          matched_at?: string | null
          mentee_id?: string
          mentor_id?: string | null
          skill_level?: string | null
          status?: string | null
          topic?: string
        }
        Relationships: []
      }
      mentoring_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_url: string | null
          mentee_rating: number | null
          mentor_rating: number | null
          notes: string | null
          request_id: string
          session_date: string
          session_type: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          mentee_rating?: number | null
          mentor_rating?: number | null
          notes?: string | null
          request_id: string
          session_date: string
          session_type?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          mentee_rating?: number | null
          mentor_rating?: number | null
          notes?: string | null
          request_id?: string
          session_date?: string
          session_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentoring_sessions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "mentoring_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author: string | null
          content: string
          content_simplified: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          is_hidden: boolean | null
          like_count: number | null
          published_at: string | null
          source_url: string
          summary: string
          tags: string[] | null
          thumbnail: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author?: string | null
          content: string
          content_simplified?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_hidden?: boolean | null
          like_count?: number | null
          published_at?: string | null
          source_url: string
          summary: string
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author?: string | null
          content?: string
          content_simplified?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_hidden?: boolean | null
          like_count?: number | null
          published_at?: string | null
          source_url?: string
          summary?: string
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_providers: {
        Row: {
          configuration: Json | null
          country_codes: string[]
          created_at: string | null
          currencies: string[]
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          payment_types: string[]
        }
        Insert: {
          configuration?: Json | null
          country_codes: string[]
          created_at?: string | null
          currencies: string[]
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          payment_types: string[]
        }
        Update: {
          configuration?: Json | null
          country_codes?: string[]
          created_at?: string | null
          currencies?: string[]
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          payment_types?: string[]
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          country_code: string
          created_at: string | null
          currency: string
          id: string
          payment_method: string | null
          payment_provider: string
          provider_transaction_id: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          country_code?: string
          created_at?: string | null
          currency?: string
          id?: string
          payment_method?: string | null
          payment_provider: string
          provider_transaction_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          country_code?: string
          created_at?: string | null
          currency?: string
          id?: string
          payment_method?: string | null
          payment_provider?: string
          provider_transaction_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          article_id: string | null
          auto_hidden: boolean | null
          comment_id: string | null
          created_at: string
          id: string
          moderator_notes: string | null
          post_id: string | null
          reason: string
          report_details: Json | null
          report_type: string | null
          reported_user_id: string | null
          reporter_id: string | null
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          article_id?: string | null
          auto_hidden?: boolean | null
          comment_id?: string | null
          created_at?: string
          id?: string
          moderator_notes?: string | null
          post_id?: string | null
          reason: string
          report_details?: Json | null
          report_type?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          article_id?: string | null
          auto_hidden?: boolean | null
          comment_id?: string | null
          created_at?: string
          id?: string
          moderator_notes?: string | null
          post_id?: string | null
          reason?: string
          report_details?: Json | null
          report_type?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seo_metadata: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          page_url: string
          schema_markup: Json | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_url: string
          schema_markup?: Json | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_url?: string
          schema_markup?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      social_shares: {
        Row: {
          content_id: string
          content_type: string
          id: string
          platform: string
          share_count: number | null
          share_url: string | null
          shared_at: string
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          platform: string
          share_count?: number | null
          share_url?: string | null
          shared_at?: string
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          platform?: string
          share_count?: number | null
          share_url?: string | null
          shared_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          price_yearly: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          cancel_at_period_end: boolean | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_id: string | null
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cancel_at_period_end?: boolean | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          provider: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cancel_at_period_end?: boolean | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_follows: {
        Row: {
          created_at: string
          id: string
          tag_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_name?: string
          user_id?: string
        }
        Relationships: []
      }
      tech_glossary: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          definition: string
          difficulty_level: number | null
          explanation_detailed: string | null
          explanation_simple: string | null
          id: string
          is_active: boolean | null
          related_terms: string[] | null
          term: string
          updated_at: string
          usage_examples: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          definition: string
          difficulty_level?: number | null
          explanation_detailed?: string | null
          explanation_simple?: string | null
          id?: string
          is_active?: boolean | null
          related_terms?: string[] | null
          term: string
          updated_at?: string
          usage_examples?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          definition?: string
          difficulty_level?: number | null
          explanation_detailed?: string | null
          explanation_simple?: string | null
          id?: string
          is_active?: boolean | null
          related_terms?: string[] | null
          term?: string
          updated_at?: string
          usage_examples?: Json | null
        }
        Relationships: []
      }
      term_detection_history: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          detected_terms: string[]
          id: string
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          detected_terms: string[]
          id?: string
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          detected_terms?: string[]
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tool_comparisons: {
        Row: {
          category: string
          features: Json | null
          id: string
          last_updated: string
          price_per_month: number | null
          tool_name: string
          user_ratings: Json | null
        }
        Insert: {
          category: string
          features?: Json | null
          id?: string
          last_updated?: string
          price_per_month?: number | null
          tool_name: string
          user_ratings?: Json | null
        }
        Update: {
          category?: string
          features?: Json | null
          id?: string
          last_updated?: string
          price_per_month?: number | null
          tool_name?: string
          user_ratings?: Json | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          field_name: string
          id: string
          is_auto_generated: boolean | null
          language_code: string
          translated_text: string
          translation_quality: number | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          field_name: string
          id?: string
          is_auto_generated?: boolean | null
          language_code: string
          translated_text: string
          translation_quality?: number | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          field_name?: string
          id?: string
          is_auto_generated?: boolean | null
          language_code?: string
          translated_text?: string
          translation_quality?: number | null
        }
        Relationships: []
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
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          interaction_data: Json | null
          interaction_type: string
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          anonymous_mode_default: boolean | null
          content_mode: string | null
          created_at: string
          email_notifications: boolean | null
          id: string
          language: string | null
          push_notifications: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anonymous_mode_default?: boolean | null
          content_mode?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anonymous_mode_default?: boolean | null
          content_mode?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          push_notifications?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          github_username: string | null
          id: string
          twitter_username: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          github_username?: string | null
          id?: string
          twitter_username?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          github_username?: string | null
          id?: string
          twitter_username?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          refresh_token: string | null
          session_token: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          refresh_token?: string | null
          session_token: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          refresh_token?: string | null
          session_token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          payment_provider: string
          plan_id: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          start_date: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_provider: string
          plan_id?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_provider?: string
          plan_id?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_themes: {
        Row: {
          animations_enabled: boolean | null
          created_at: string
          custom_colors: Json | null
          font_family: string | null
          font_size: string | null
          id: string
          layout_density: string | null
          theme_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          animations_enabled?: boolean | null
          created_at?: string
          custom_colors?: Json | null
          font_family?: string | null
          font_size?: string | null
          id?: string
          layout_density?: string | null
          theme_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          animations_enabled?: boolean | null
          created_at?: string
          custom_colors?: Json | null
          font_family?: string | null
          font_size?: string | null
          id?: string
          layout_density?: string | null
          theme_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          github_username: string | null
          id: string
          nickname: string
          provider: string
          twitter_username: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          github_username?: string | null
          id: string
          nickname: string
          provider: string
          twitter_username?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          github_username?: string | null
          id?: string
          nickname?: string
          provider?: string
          twitter_username?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
