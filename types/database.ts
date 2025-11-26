/**
 * Database Types for Vergader Notulist AI
 *
 * Comprehensive TypeScript types for Supabase tables and relations.
 * These types ensure type safety across the application.
 */

import type { User as SupabaseUser } from '@supabase/supabase-js';

// ============================================================================
// User Types
// ============================================================================

/**
 * Extended user profile stored in the profiles table
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Complete user type combining Supabase auth user with profile
 */
export interface User extends SupabaseUser {
  profile?: UserProfile;
}

// ============================================================================
// Transcription Types
// ============================================================================

/**
 * Status of a transcription
 */
export enum TranscriptionStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Action items extracted from the transcription
 */
export interface ActionItem {
  id: string;
  description: string;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
}

/**
 * Main transcription record stored in the database
 */
export interface Transcription {
  id: string;
  user_id: string;
  title: string;
  transcript_text: string;
  summary: string | null;
  action_items: ActionItem[] | null;
  audio_duration_seconds: number | null;
  language: string;
  status: TranscriptionStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new transcription
 */
export interface CreateTranscriptionInput {
  title: string;
  transcript_text: string;
  audio_duration_seconds?: number;
  language?: string;
}

/**
 * Input type for updating an existing transcription
 */
export interface UpdateTranscriptionInput {
  title?: string;
  transcript_text?: string;
  summary?: string;
  action_items?: ActionItem[];
  status?: TranscriptionStatus;
  error_message?: string;
}

// ============================================================================
// Database Response Types
// ============================================================================

/**
 * Generic database response wrapper
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ============================================================================
// Query Options
// ============================================================================

/**
 * Options for fetching transcriptions
 */
export interface FetchTranscriptionsOptions {
  page?: number;
  page_size?: number;
  order_by?: 'created_at' | 'updated_at' | 'title';
  order_direction?: 'asc' | 'desc';
  status_filter?: TranscriptionStatus;
  search_query?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Auth error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid TranscriptionStatus
 */
export function isTranscriptionStatus(value: unknown): value is TranscriptionStatus {
  return Object.values(TranscriptionStatus).includes(value as TranscriptionStatus);
}

/**
 * Type guard to check if a value is a Transcription
 */
export function isTranscription(value: unknown): value is Transcription {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'user_id' in value &&
    'transcript_text' in value
  );
}
