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
      activity_feed: {
        Row: {
          activity_type: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          subtext: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          subtext?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          subtext?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_likes: {
        Row: {
          activity_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_likes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          criteria: Json
          description: string
          icon_name: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          criteria: Json
          description: string
          icon_name: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon_name?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      book_genres: {
        Row: {
          book_id: string
          created_at: string
          genre_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          genre_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          genre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_genres_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      book_guides: {
        Row: {
          book_id: string
          created_at: string
          discussion_guide: Json | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          discussion_guide?: Json | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          discussion_guide?: Json | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_guides_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_literary_chromosomes: {
        Row: {
          book_id: string
          chromosome_data: Json
          chromosome_key: string
          created_at: string
          generated_at: string | null
          id: string
          published_at: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          book_id: string
          chromosome_data: Json
          chromosome_key: string
          created_at?: string
          generated_at?: string | null
          id?: string
          published_at?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          book_id?: string
          chromosome_data?: Json
          chromosome_key?: string
          created_at?: string
          generated_at?: string | null
          id?: string
          published_at?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_literary_chromosomes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_notes: {
        Row: {
          book_id: string
          chapter: string | null
          content: string
          created_at: string
          id: string
          is_highlighted: boolean
          is_private: boolean | null
          page_number: number | null
          resolved_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter?: string | null
          content: string
          created_at?: string
          id?: string
          is_highlighted?: boolean
          is_private?: boolean | null
          page_number?: number | null
          resolved_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: string | null
          content?: string
          created_at?: string
          id?: string
          is_highlighted?: boolean
          is_private?: boolean | null
          page_number?: number | null
          resolved_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_notes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          author_id: string | null
          created_at: string
          description: string | null
          experience: string | null
          external_ids: Json | null
          first_publication_year: number | null
          genre: string | null
          id: string
          original_language: string | null
          original_title: string | null
          preferred_edition_id: string | null
          rating_avg: number | null
          sinopsis_data: Json | null
          title: string
          title_normalized: string | null
          total_interactions: number | null
        }
        Insert: {
          author?: string | null
          author_id?: string | null
          created_at?: string
          description?: string | null
          experience?: string | null
          external_ids?: Json | null
          first_publication_year?: number | null
          genre?: string | null
          id?: string
          original_language?: string | null
          original_title?: string | null
          preferred_edition_id?: string | null
          rating_avg?: number | null
          sinopsis_data?: Json | null
          title: string
          title_normalized?: string | null
          total_interactions?: number | null
        }
        Update: {
          author?: string | null
          author_id?: string | null
          created_at?: string
          description?: string | null
          experience?: string | null
          external_ids?: Json | null
          first_publication_year?: number | null
          genre?: string | null
          id?: string
          original_language?: string | null
          original_title?: string | null
          preferred_edition_id?: string | null
          rating_avg?: number | null
          sinopsis_data?: Json | null
          title?: string
          title_normalized?: string | null
          total_interactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_preferred_edition_fk"
            columns: ["preferred_edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          reward_badge_image_url: string | null
          reward_badge_name: string | null
          rules: string | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          reward_badge_image_url?: string | null
          reward_badge_name?: string | null
          rules?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          reward_badge_image_url?: string | null
          reward_badge_name?: string | null
          rules?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      club_book_reviews: {
        Row: {
          book_id: string
          club_book_id: string
          club_id: string
          conclusion: string
          created_at: string
          highlight: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          club_book_id: string
          club_id: string
          conclusion?: string
          created_at?: string
          highlight?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          club_book_id?: string
          club_id?: string
          conclusion?: string
          created_at?: string
          highlight?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_book_reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_book_reviews_club_book_id_fkey"
            columns: ["club_book_id"]
            isOneToOne: false
            referencedRelation: "club_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_book_reviews_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_book_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_books: {
        Row: {
          book_id: string
          checkpoints: Json | null
          club_id: string
          cover_url: string | null
          created_at: string
          discussion_schedule: string | null
          id: string
          pace_config: Json | null
          pregunta_apertura: string | null
          start_date: string | null
          status: string | null
          target_date: string | null
        }
        Insert: {
          book_id: string
          checkpoints?: Json | null
          club_id: string
          cover_url?: string | null
          created_at?: string
          discussion_schedule?: string | null
          id?: string
          pace_config?: Json | null
          pregunta_apertura?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
        }
        Update: {
          book_id?: string
          checkpoints?: Json | null
          club_id?: string
          cover_url?: string | null
          created_at?: string
          discussion_schedule?: string | null
          id?: string
          pace_config?: Json | null
          pregunta_apertura?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_books_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_calendar_events: {
        Row: {
          book_id: string | null
          checkpoint_index: number | null
          club_id: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: string
          format: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          checkpoint_index?: number | null
          club_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          format?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          checkpoint_index?: number | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          format?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_calendar_events_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_calendar_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_checkpoint_emotions: {
        Row: {
          book_id: string
          checkpoint_index: number
          club_book_id: string
          club_id: string
          created_at: string
          emotion: string
          id: string
          intensity: number
          is_note_public: boolean
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          checkpoint_index: number
          club_book_id: string
          club_id: string
          created_at?: string
          emotion: string
          id?: string
          intensity?: number
          is_note_public?: boolean
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          checkpoint_index?: number
          club_book_id?: string
          club_id?: string
          created_at?: string
          emotion?: string
          id?: string
          intensity?: number
          is_note_public?: boolean
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_checkpoint_emotions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_checkpoint_emotions_club_book_id_fkey"
            columns: ["club_book_id"]
            isOneToOne: false
            referencedRelation: "club_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_checkpoint_emotions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_checkpoint_emotions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_member_responsibilities: {
        Row: {
          assigned_by: string | null
          club_id: string
          created_at: string
          id: string
          responsibility: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          club_id: string
          created_at?: string
          id?: string
          responsibility: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          club_id?: string
          created_at?: string
          id?: string
          responsibility?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_member_responsibilities_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_responsibilities_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_responsibilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          benefit_redemption_id: string | null
          club_id: string
          id: string
          join_source: string | null
          joined_at: string | null
          price_paid_cents: number | null
          role: string | null
          user_id: string
        }
        Insert: {
          benefit_redemption_id?: string | null
          club_id: string
          id?: string
          join_source?: string | null
          joined_at?: string | null
          price_paid_cents?: number | null
          role?: string | null
          user_id: string
        }
        Update: {
          benefit_redemption_id?: string | null
          club_id?: string
          id?: string
          join_source?: string | null
          joined_at?: string | null
          price_paid_cents?: number | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_benefit_redemption_id_fkey"
            columns: ["benefit_redemption_id"]
            isOneToOne: false
            referencedRelation: "founder_benefit_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_posts: {
        Row: {
          checkpoint_index: number | null
          club_id: string
          content: string
          created_at: string | null
          event_date: string | null
          event_duration_minutes: number | null
          event_format: string | null
          event_location: string | null
          id: string
          is_announcement: boolean | null
          is_pinned: boolean | null
          is_spoiler: boolean | null
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checkpoint_index?: number | null
          club_id: string
          content: string
          created_at?: string | null
          event_date?: string | null
          event_duration_minutes?: number | null
          event_format?: string | null
          event_location?: string | null
          id?: string
          is_announcement?: boolean | null
          is_pinned?: boolean | null
          is_spoiler?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checkpoint_index?: number | null
          club_id?: string
          content?: string
          created_at?: string | null
          event_date?: string | null
          event_duration_minutes?: number | null
          event_format?: string | null
          event_location?: string | null
          id?: string
          is_announcement?: boolean | null
          is_pinned?: boolean | null
          is_spoiler?: boolean | null
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_posts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "club_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_report_events: {
        Row: {
          actor_id: string
          club_id: string
          created_at: string
          id: string
          note: string | null
          report_id: string
          status: string
        }
        Insert: {
          actor_id: string
          club_id: string
          created_at?: string
          id?: string
          note?: string | null
          report_id: string
          status: string
        }
        Update: {
          actor_id?: string
          club_id?: string
          created_at?: string
          id?: string
          note?: string | null
          report_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_report_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_report_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_report_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "club_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      club_reports: {
        Row: {
          club_id: string
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          club_id: string
          created_at?: string
          details: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_voice_messages: {
        Row: {
          audio_path: string | null
          checkpoint_index: number | null
          club_book_id: string | null
          club_id: string
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          is_archived: boolean
          is_pinned: boolean
          mime_type: string
          title: string | null
          transcript: string | null
          transcript_status: string
          updated_at: string
          upload_status: string
          user_id: string
        }
        Insert: {
          audio_path?: string | null
          checkpoint_index?: number | null
          club_book_id?: string | null
          club_id: string
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          mime_type: string
          title?: string | null
          transcript?: string | null
          transcript_status?: string
          updated_at?: string
          upload_status?: string
          user_id: string
        }
        Update: {
          audio_path?: string | null
          checkpoint_index?: number | null
          club_book_id?: string | null
          club_id?: string
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          mime_type?: string
          title?: string | null
          transcript?: string | null
          transcript_status?: string
          updated_at?: string
          upload_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_voice_messages_club_book_id_fkey"
            columns: ["club_book_id"]
            isOneToOne: false
            referencedRelation: "club_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_voice_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_voice_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          cover_url: string | null
          created_at: string
          currency: string | null
          description: string | null
          destacado: boolean
          id: string
          invite_code: string | null
          is_archived: boolean | null
          is_official: boolean | null
          join_code: string | null
          name: string
          organization_id: string | null
          owner_id: string
          portada: boolean
          price: number | null
          rules: Json | null
          slug: string | null
          tags: string[] | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destacado?: boolean
          id?: string
          invite_code?: string | null
          is_archived?: boolean | null
          is_official?: boolean | null
          join_code?: string | null
          name: string
          organization_id?: string | null
          owner_id: string
          portada?: boolean
          price?: number | null
          rules?: Json | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destacado?: boolean
          id?: string
          invite_code?: string | null
          is_archived?: boolean | null
          is_official?: boolean | null
          join_code?: string | null
          name?: string
          organization_id?: string | null
          owner_id?: string
          portada?: boolean
          price?: number | null
          rules?: Json | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          message: string
          name: string
          source: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          source?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          source?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      curated_collection_books: {
        Row: {
          book_id: string
          collection_id: string
          created_at: string
          display_order: number
          id: string
          updated_at: string
        }
        Insert: {
          book_id: string
          collection_id: string
          created_at?: string
          display_order: number
          id?: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          collection_id?: string
          created_at?: string
          display_order?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curated_collection_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curated_collection_books_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "curated_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_collections: {
        Row: {
          color_theme: string
          created_at: string
          description: string
          display_order: number
          icon: string
          id: string
          name: string
          slug: string
          tag_line: string
          updated_at: string
        }
        Insert: {
          color_theme: string
          created_at?: string
          description: string
          display_order: number
          icon: string
          id?: string
          name: string
          slug: string
          tag_line: string
          updated_at?: string
        }
        Update: {
          color_theme?: string
          created_at?: string
          description?: string
          display_order?: number
          icon?: string
          id?: string
          name?: string
          slug?: string
          tag_line?: string
          updated_at?: string
        }
        Relationships: []
      }
      edition_review_queue: {
        Row: {
          candidates: Json
          created_at: string
          edition_id: string
          id: string
          reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          candidates: Json
          created_at?: string
          edition_id: string
          id?: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          candidates?: Json
          created_at?: string
          edition_id?: string
          id?: string
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "edition_review_queue_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          binding: string | null
          book_id: string
          cover_resolution: number | null
          cover_url: string | null
          created_at: string
          edition_label: string | null
          external_ids: Json
          format: string | null
          id: string
          is_abridged: boolean
          isbn: string | null
          isbn13: string | null
          language: string
          page_count: number | null
          publication_year: number | null
          published_date: string | null
          publisher: string | null
          quality_score: number | null
          raw_payload: Json | null
          source: string
          source_id: string | null
          source_payload: Json | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          binding?: string | null
          book_id: string
          cover_resolution?: number | null
          cover_url?: string | null
          created_at?: string
          edition_label?: string | null
          external_ids?: Json
          format?: string | null
          id?: string
          is_abridged?: boolean
          isbn?: string | null
          isbn13?: string | null
          language: string
          page_count?: number | null
          publication_year?: number | null
          published_date?: string | null
          publisher?: string | null
          quality_score?: number | null
          raw_payload?: Json | null
          source: string
          source_id?: string | null
          source_payload?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          binding?: string | null
          book_id?: string
          cover_resolution?: number | null
          cover_url?: string | null
          created_at?: string
          edition_label?: string | null
          external_ids?: Json
          format?: string | null
          id?: string
          is_abridged?: boolean
          isbn?: string | null
          isbn13?: string | null
          language?: string
          page_count?: number | null
          publication_year?: number | null
          published_date?: string | null
          publisher?: string | null
          quality_score?: number | null
          raw_payload?: Json | null
          source?: string
          source_id?: string | null
          source_payload?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_benefit_redemptions: {
        Row: {
          benefit_type: string
          club_id: string
          created_at: string
          founder_membership_id: string | null
          id: string
          official_club_id: string | null
          redeemed_at: string
          user_id: string
        }
        Insert: {
          benefit_type?: string
          club_id: string
          created_at?: string
          founder_membership_id?: string | null
          id?: string
          official_club_id?: string | null
          redeemed_at?: string
          user_id: string
        }
        Update: {
          benefit_type?: string
          club_id?: string
          created_at?: string
          founder_membership_id?: string | null
          id?: string
          official_club_id?: string | null
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_benefit_redemptions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_benefit_redemptions_founder_membership_id_fkey"
            columns: ["founder_membership_id"]
            isOneToOne: false
            referencedRelation: "founder_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_benefit_redemptions_official_club_id_fkey"
            columns: ["official_club_id"]
            isOneToOne: false
            referencedRelation: "official_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_benefit_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_memberships: {
        Row: {
          benefits: Json
          billing_period: string | null
          founder_number: number
          id: string
          joined_at: string
          newsletter_opt_in: boolean
          requested_plan: string | null
          signup_intent: string | null
          signup_source: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: Json
          billing_period?: string | null
          founder_number?: number
          id?: string
          joined_at?: string
          newsletter_opt_in?: boolean
          requested_plan?: string | null
          signup_intent?: string | null
          signup_source?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits?: Json
          billing_period?: string | null
          founder_number?: number
          id?: string
          joined_at?: string
          newsletter_opt_in?: boolean
          requested_plan?: string | null
          signup_intent?: string | null
          signup_source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      gift_events: {
        Row: {
          created_at: string
          event_date: string
          id: string
          is_recurring: boolean
          name: string
          recipient_id: string
          remind_days_before: number | null
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          is_recurring?: boolean
          name: string
          recipient_id: string
          remind_days_before?: number | null
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          is_recurring?: boolean
          name?: string
          recipient_id?: string
          remind_days_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "gift_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_ideas: {
        Row: {
          author: string | null
          book_id: string | null
          cover_url: string | null
          created_at: string
          gift_status: string
          id: string
          is_purchased: boolean
          is_secret: boolean
          price: number | null
          private_note: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          author?: string | null
          book_id?: string | null
          cover_url?: string | null
          created_at?: string
          gift_status?: string
          id?: string
          is_purchased?: boolean
          is_secret?: boolean
          price?: number | null
          private_note?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          author?: string | null
          book_id?: string | null
          cover_url?: string | null
          created_at?: string
          gift_status?: string
          id?: string
          is_purchased?: boolean
          is_secret?: boolean
          price?: number | null
          private_note?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_ideas_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "gift_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_recipients: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          relation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          relation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          relation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_books_canvas: {
        Row: {
          author_id: string | null
          description: string | null
          genre: string | null
          image_url: string | null
          isbn: string | null
          isbn13: string | null
          num_pages: string | null
          publisher: string | null
          title: string | null
        }
        Insert: {
          author_id?: string | null
          description?: string | null
          genre?: string | null
          image_url?: string | null
          isbn?: string | null
          isbn13?: string | null
          num_pages?: string | null
          publisher?: string | null
          title?: string | null
        }
        Update: {
          author_id?: string | null
          description?: string | null
          genre?: string | null
          image_url?: string | null
          isbn?: string | null
          isbn13?: string | null
          num_pages?: string | null
          publisher?: string | null
          title?: string | null
        }
        Relationships: []
      }
      list_items: {
        Row: {
          added_at: string
          book_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          book_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string
          book_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      official_clubs: {
        Row: {
          book_data: Json | null
          book_isbn: string
          created_at: string | null
          currency: string
          description: string
          display_order: number
          id: string
          is_featured: boolean | null
          name: string
          price_cents: number
          slug: string
          start_date: string
          theme_color: string
          theme_icon: string
          updated_at: string | null
        }
        Insert: {
          book_data?: Json | null
          book_isbn: string
          created_at?: string | null
          currency?: string
          description: string
          display_order: number
          id?: string
          is_featured?: boolean | null
          name: string
          price_cents?: number
          slug: string
          start_date?: string
          theme_color: string
          theme_icon: string
          updated_at?: string | null
        }
        Update: {
          book_data?: Json | null
          book_isbn?: string
          created_at?: string | null
          currency?: string
          description?: string
          display_order?: number
          id?: string
          is_featured?: boolean | null
          name?: string
          price_cents?: number
          slug?: string
          start_date?: string
          theme_color?: string
          theme_icon?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          fulfilled_at: string | null
          id: string
          metadata: Json
          plan_period: string | null
          product_type: string
          provider: string
          provider_capture_id: string | null
          provider_order_id: string | null
          reference_id: string
          resource_kind: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          fulfilled_at?: string | null
          id?: string
          metadata?: Json
          plan_period?: string | null
          product_type: string
          provider?: string
          provider_capture_id?: string | null
          provider_order_id?: string | null
          reference_id: string
          resource_kind?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          fulfilled_at?: string | null
          id?: string
          metadata?: Json
          plan_period?: string | null
          product_type?: string
          provider?: string
          provider_capture_id?: string | null
          provider_order_id?: string | null
          reference_id?: string
          resource_kind?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_events: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: string
          format: string
          id: string
          location: string | null
          location_id: string | null
          organization_id: string
          starts_at: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          format?: string
          id?: string
          location?: string | null
          location_id?: string | null
          organization_id: string
          starts_at: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          format?: string
          id?: string
          location?: string | null
          location_id?: string | null
          organization_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "organization_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_primary: boolean
          lat: number | null
          lng: number | null
          name: string
          organization_id: string
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          organization_id: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          organization_id?: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          billing_period: string | null
          created_at: string
          current_period_end: string | null
          external_ref: string | null
          id: string
          metadata: Json
          organization_id: string
          provider: string
          provider_plan_id: string | null
          provider_subscription_id: string | null
          started_at: string
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          provider?: string
          provider_plan_id?: string | null
          provider_subscription_id?: string | null
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          provider?: string
          provider_plan_id?: string | null
          provider_subscription_id?: string | null
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          brand_color: string | null
          buy_link_template: string | null
          city: string | null
          contact_email: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          region: string | null
          slug: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          buy_link_template?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          region?: string | null
          slug: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          buy_link_template?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          region?: string | null
          slug?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed_at: string
          provider: string
          resource_type: string | null
        }
        Insert: {
          event_type: string
          id: string
          payload?: Json
          processed_at?: string
          provider?: string
          resource_type?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          provider?: string
          resource_type?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          book_id: string | null
          created_at: string
          id: string
          poll_id: string
          text: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          id?: string
          poll_id: string
          text: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          id?: string
          poll_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          is_open: boolean | null
          question: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          is_open?: boolean | null
          question: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          is_open?: boolean | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "club_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_color: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          engagement_elements: Json | null
          favorite_genres: Json | null
          full_name: string | null
          goals: Json | null
          id: string
          location: string | null
          notification_settings: Json | null
          onboarding_completed: boolean | null
          privacy_settings: Json | null
          pronouns: string | null
          reader_type: string | null
          reading_format_preference: string | null
          role: string | null
          spoiler_preference: boolean | null
          story_complexity_preference: number | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_color?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          engagement_elements?: Json | null
          favorite_genres?: Json | null
          full_name?: string | null
          goals?: Json | null
          id: string
          location?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean | null
          privacy_settings?: Json | null
          pronouns?: string | null
          reader_type?: string | null
          reading_format_preference?: string | null
          role?: string | null
          spoiler_preference?: boolean | null
          story_complexity_preference?: number | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_color?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          engagement_elements?: Json | null
          favorite_genres?: Json | null
          full_name?: string | null
          goals?: Json | null
          id?: string
          location?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean | null
          privacy_settings?: Json | null
          pronouns?: string | null
          reader_type?: string | null
          reading_format_preference?: string | null
          role?: string | null
          spoiler_preference?: boolean | null
          story_complexity_preference?: number | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_id: string
          created_at: string
          duration_seconds: number | null
          edition_id: string | null
          end_time: string | null
          id: string
          marked_finished: boolean
          pages_read: number | null
          start_time: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          duration_seconds?: number | null
          edition_id?: string | null
          end_time?: string | null
          id?: string
          marked_finished?: boolean
          pages_read?: number | null
          start_time: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          duration_seconds?: number | null
          edition_id?: string | null
          end_time?: string | null
          id?: string
          marked_finished?: boolean
          pages_read?: number | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sessions_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reactions: {
        Row: {
          created_at: string
          reaction_type: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reaction_type?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          reaction_type?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reactions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          book_id: string
          contains_spoilers: boolean
          content: string | null
          created_at: string
          emotional_tone: string | null
          id: string
          pace: string | null
          rating: number | null
          recommended_for: string | null
          tags: string[]
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          contains_spoilers?: boolean
          content?: string | null
          created_at?: string
          emotional_tone?: string | null
          id?: string
          pace?: string | null
          rating?: number | null
          recommended_for?: string | null
          tags?: string[]
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          contains_spoilers?: boolean
          content?: string | null
          created_at?: string
          emotional_tone?: string | null
          id?: string
          pace?: string | null
          rating?: number | null
          recommended_for?: string | null
          tags?: string[]
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          product_type: string | null
          provider: string
          provider_payment_id: string | null
          provider_subscription_id: string | null
          reference_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          product_type?: string | null
          provider?: string
          provider_payment_id?: string | null
          provider_subscription_id?: string | null
          reference_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          product_type?: string | null
          provider?: string
          provider_payment_id?: string | null
          provider_subscription_id?: string | null
          reference_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_book_emotions: {
        Row: {
          book_id: string
          created_at: string
          current_page: number | null
          emotion: string
          id: string
          intensity: number
          note: string | null
          reading_session_id: string | null
          updated_at: string
          user_book_id: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          current_page?: number | null
          emotion: string
          id?: string
          intensity?: number
          note?: string | null
          reading_session_id?: string | null
          updated_at?: string
          user_book_id?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          current_page?: number | null
          emotion?: string
          id?: string
          intensity?: number
          note?: string | null
          reading_session_id?: string | null
          updated_at?: string
          user_book_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_book_emotions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_book_emotions_reading_session_id_fkey"
            columns: ["reading_session_id"]
            isOneToOne: false
            referencedRelation: "reading_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_book_emotions_user_book_id_fkey"
            columns: ["user_book_id"]
            isOneToOne: false
            referencedRelation: "user_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_book_emotions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_book_resource_access: {
        Row: {
          access_source: string
          book_id: string
          created_at: string
          expires_at: string | null
          granted_at: string
          id: string
          metadata: Json
          purchased_at: string | null
          resource_kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_source?: string
          book_id: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          metadata?: Json
          purchased_at?: string | null
          resource_kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_source?: string
          book_id?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          metadata?: Json
          purchased_at?: string | null
          resource_kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_book_resource_access_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_book_resource_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_books: {
        Row: {
          audio_total_seconds: number | null
          book_id: string
          created_at: string
          current_page: number | null
          edition_id: string | null
          finish_date: string | null
          format: string | null
          id: string
          progress_percent: number | null
          rating: number | null
          review: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["reading_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_total_seconds?: number | null
          book_id: string
          created_at?: string
          current_page?: number | null
          edition_id?: string | null
          finish_date?: string | null
          format?: string | null
          id?: string
          progress_percent?: number | null
          rating?: number | null
          review?: string | null
          start_date?: string | null
          status: Database["public"]["Enums"]["reading_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_total_seconds?: number | null
          book_id?: string
          created_at?: string
          current_page?: number | null
          edition_id?: string | null
          finish_date?: string | null
          format?: string | null
          id?: string
          progress_percent?: number | null
          rating?: number | null
          review?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["reading_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          external_ref: string | null
          id: string
          period: string | null
          plan: string
          provider: string
          provider_plan_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          period?: string | null
          plan: string
          provider?: string
          provider_plan_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          period?: string | null
          plan?: string
          provider?: string
          provider_plan_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_candidates: {
        Row: {
          author: string | null
          confidence: number | null
          cover_url: string | null
          created_at: string
          id: string
          isbn: string | null
          notes: string | null
          photo_url: string | null
          price: number | null
          priority: string
          source: string
          status: string
          title: string
          updated_at: string
          user_id: string
          wishlist_id: string
        }
        Insert: {
          author?: string | null
          confidence?: number | null
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          notes?: string | null
          photo_url?: string | null
          price?: number | null
          priority?: string
          source: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          wishlist_id: string
        }
        Update: {
          author?: string | null
          confidence?: number | null
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          notes?: string | null
          photo_url?: string | null
          price?: number | null
          priority?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_candidates_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          author: string | null
          book_id: string | null
          cover_url: string | null
          created_at: string
          crowdfunding_collected: number | null
          crowdfunding_target: number | null
          dedication: Json | null
          id: string
          price: number | null
          priority: string
          private_note: string | null
          reserved_by: string | null
          reserved_by_user_id: string | null
          status: string
          title: string
          updated_at: string
          wishlist_id: string
        }
        Insert: {
          author?: string | null
          book_id?: string | null
          cover_url?: string | null
          created_at?: string
          crowdfunding_collected?: number | null
          crowdfunding_target?: number | null
          dedication?: Json | null
          id?: string
          price?: number | null
          priority?: string
          private_note?: string | null
          reserved_by?: string | null
          reserved_by_user_id?: string | null
          status?: string
          title: string
          updated_at?: string
          wishlist_id: string
        }
        Update: {
          author?: string | null
          book_id?: string | null
          cover_url?: string | null
          created_at?: string
          crowdfunding_collected?: number | null
          crowdfunding_target?: number | null
          dedication?: Json | null
          id?: string
          price?: number | null
          priority?: string
          private_note?: string | null
          reserved_by?: string | null
          reserved_by_user_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          name: string
          privacy: string
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          name: string
          privacy?: string
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          name?: string
          privacy?: string
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_update_books_enrichment: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      bulk_update_by_micro_batches: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      check_user_badges: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      find_book_candidates_for_edition: {
        Args: {
          p_title: string
          p_author_id: string
          p_similarity_threshold?: number
          p_max_results?: number
        }
        Returns: {
          book_id: string
          title: string
          title_normalized: string
          author_id: string
          similarity: number
          is_exact: boolean
        }[]
      }
      find_books_by_experience: {
        Args: { p_experience_label: string; p_genres: Json; p_limit?: number }
        Returns: {
          book_id: string
          score: number
        }[]
      }
      get_founder_membership_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          founder_count: number
          available_spots: number
          waitlist_count: number
        }[]
      }
      get_public_profile_summary: {
        Args: { profile_username: string }
        Returns: Json
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_club_admin_or_moderator: {
        Args: { target_club_id: string }
        Returns: boolean
      }
      normalize_title: {
        Args: { p_title: string }
        Returns: string
      }
      redeem_founder_free_official_club: {
        Args: { target_club_id: string }
        Returns: {
          club_id: string
          redemption_id: string
          already_member: boolean
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      wordelia_slugify: {
        Args: { value: string }
        Returns: string
      }
    }
    Enums: {
      reading_status: "WANT_TO_READ" | "READING" | "READ" | "DNF" | "PAUSED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      reading_status: ["WANT_TO_READ", "READING", "READ", "DNF", "PAUSED"],
    },
  },
} as const
