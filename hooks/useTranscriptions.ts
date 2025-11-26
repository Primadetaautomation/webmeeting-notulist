/**
 * Transcriptions Hook for Vergader Notulist AI
 *
 * Provides CRUD operations for transcriptions with proper error handling,
 * loading states, and optimistic updates.
 *
 * @example
 * ```tsx
 * function TranscriptionsList() {
 *   const { transcriptions, loading, error, fetchTranscriptions, deleteTranscription } = useTranscriptions();
 *
 *   useEffect(() => {
 *     fetchTranscriptions();
 *   }, [fetchTranscriptions]);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <ul>
 *       {transcriptions.map(t => (
 *         <li key={t.id}>
 *           {t.title}
 *           <button onClick={() => deleteTranscription(t.id)}>Delete</button>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Transcription,
  CreateTranscriptionInput,
  UpdateTranscriptionInput,
  FetchTranscriptionsOptions,
  TranscriptionStatus,
  DatabaseError
} from '../types/database';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// Types
// ============================================================================

interface UseTranscriptionsReturn {
  transcriptions: Transcription[];
  loading: boolean;
  error: DatabaseError | null;
  fetchTranscriptions: (options?: FetchTranscriptionsOptions) => Promise<void>;
  getTranscription: (id: string) => Promise<Transcription | null>;
  createTranscription: (input: CreateTranscriptionInput) => Promise<Transcription>;
  updateTranscription: (id: string, input: UpdateTranscriptionInput) => Promise<Transcription>;
  deleteTranscription: (id: string) => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for managing user transcriptions
 *
 * @returns {UseTranscriptionsReturn} Transcription state and operations
 */
export function useTranscriptions(): UseTranscriptionsReturn {
  const { user } = useAuth();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);
  const [lastFetchOptions, setLastFetchOptions] = useState<FetchTranscriptionsOptions>({});

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle database errors with user-friendly messages
   */
  const handleError = useCallback((err: unknown, operation: string): never => {
    console.error(`[useTranscriptions] ${operation} error:`, err);

    const message = err instanceof Error ? err.message : 'Er is een onbekende fout opgetreden';
    const dbError = new DatabaseError(
      `Fout bij ${operation}: ${message}`,
      undefined,
      err
    );

    setError(dbError);
    throw dbError;
  }, []);

  /**
   * Fetch transcriptions from the database
   */
  const fetchTranscriptions = useCallback(
    async (options: FetchTranscriptionsOptions = {}) => {
      if (!supabase) {
        console.warn('[useTranscriptions] Supabase niet geconfigureerd');
        return;
      }

      if (!user) {
        console.warn('[useTranscriptions] Geen gebruiker ingelogd');
        setTranscriptions([]);
        return;
      }

      setLoading(true);
      setError(null);
      setLastFetchOptions(options);

      try {
        const {
          page = 0,
          page_size = 50,
          order_by = 'created_at',
          order_direction = 'desc',
          status_filter,
          search_query
        } = options;

        // Build query
        let query = supabase
          .from('transcriptions')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        // Apply filters
        if (status_filter) {
          query = query.eq('status', status_filter);
        }

        if (search_query) {
          query = query.or(
            `title.ilike.%${search_query}%,transcript_text.ilike.%${search_query}%`
          );
        }

        // Apply ordering and pagination
        query = query
          .order(order_by, { ascending: order_direction === 'asc' })
          .range(page * page_size, (page + 1) * page_size - 1);

        const { data, error: fetchError } = await query;

        if (fetchError) {
          handleError(fetchError, 'ophalen transcripties');
        }

        setTranscriptions(data || []);
      } catch (err) {
        if (err instanceof DatabaseError) {
          throw err;
        }
        handleError(err, 'ophalen transcripties');
      } finally {
        setLoading(false);
      }
    },
    [user, handleError]
  );

  /**
   * Get a single transcription by ID
   */
  const getTranscription = useCallback(
    async (id: string): Promise<Transcription | null> => {
      if (!supabase) {
        throw new DatabaseError('Supabase niet geconfigureerd');
      }

      if (!user) {
        throw new DatabaseError('Geen gebruiker ingelogd');
      }

      if (!id) {
        throw new DatabaseError('Transcriptie ID is verplicht');
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('transcriptions')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          // Handle "not found" gracefully
          if (fetchError.code === 'PGRST116') {
            return null;
          }
          handleError(fetchError, 'ophalen transcriptie');
        }

        return data;
      } catch (err) {
        if (err instanceof DatabaseError) {
          throw err;
        }
        handleError(err, 'ophalen transcriptie');
      } finally {
        setLoading(false);
      }
    },
    [user, handleError]
  );

  /**
   * Create a new transcription
   */
  const createTranscription = useCallback(
    async (input: CreateTranscriptionInput): Promise<Transcription> => {
      if (!supabase) {
        throw new DatabaseError('Supabase niet geconfigureerd');
      }

      if (!user) {
        throw new DatabaseError('Geen gebruiker ingelogd');
      }

      // Input validation (E-5: Fail fast)
      if (!input.title?.trim()) {
        throw new DatabaseError('Titel is verplicht');
      }

      if (!input.transcript_text?.trim()) {
        throw new DatabaseError('Transcript tekst is verplicht');
      }

      setLoading(true);
      setError(null);

      try {
        const transcriptionData = {
          user_id: user.id,
          title: input.title.trim(),
          transcript_text: input.transcript_text.trim(),
          audio_duration_seconds: input.audio_duration_seconds || null,
          language: input.language || 'nl',
          status: TranscriptionStatus.COMPLETED,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error: insertError } = await supabase
          .from('transcriptions')
          .insert(transcriptionData)
          .select()
          .single();

        if (insertError) {
          handleError(insertError, 'aanmaken transcriptie');
        }

        // Optimistic update: add to local state
        setTranscriptions((prev) => [data, ...prev]);

        return data;
      } catch (err) {
        if (err instanceof DatabaseError) {
          throw err;
        }
        handleError(err, 'aanmaken transcriptie');
      } finally {
        setLoading(false);
      }
    },
    [user, handleError]
  );

  /**
   * Update an existing transcription
   */
  const updateTranscription = useCallback(
    async (id: string, input: UpdateTranscriptionInput): Promise<Transcription> => {
      if (!supabase) {
        throw new DatabaseError('Supabase niet geconfigureerd');
      }

      if (!user) {
        throw new DatabaseError('Geen gebruiker ingelogd');
      }

      if (!id) {
        throw new DatabaseError('Transcriptie ID is verplicht');
      }

      setLoading(true);
      setError(null);

      try {
        const updateData = {
          ...input,
          updated_at: new Date().toISOString()
        };

        const { data, error: updateError } = await supabase
          .from('transcriptions')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          handleError(updateError, 'bijwerken transcriptie');
        }

        // Optimistic update: update in local state
        setTranscriptions((prev) =>
          prev.map((t) => (t.id === id ? data : t))
        );

        return data;
      } catch (err) {
        if (err instanceof DatabaseError) {
          throw err;
        }
        handleError(err, 'bijwerken transcriptie');
      } finally {
        setLoading(false);
      }
    },
    [user, handleError]
  );

  /**
   * Delete a transcription
   */
  const deleteTranscription = useCallback(
    async (id: string): Promise<void> => {
      if (!supabase) {
        throw new DatabaseError('Supabase niet geconfigureerd');
      }

      if (!user) {
        throw new DatabaseError('Geen gebruiker ingelogd');
      }

      if (!id) {
        throw new DatabaseError('Transcriptie ID is verplicht');
      }

      setLoading(true);
      setError(null);

      // Optimistic update: remove from local state
      const previousTranscriptions = [...transcriptions];
      setTranscriptions((prev) => prev.filter((t) => t.id !== id));

      try {
        const { error: deleteError } = await supabase
          .from('transcriptions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) {
          // Rollback optimistic update
          setTranscriptions(previousTranscriptions);
          handleError(deleteError, 'verwijderen transcriptie');
        }
      } catch (err) {
        // Rollback optimistic update
        setTranscriptions(previousTranscriptions);

        if (err instanceof DatabaseError) {
          throw err;
        }
        handleError(err, 'verwijderen transcriptie');
      } finally {
        setLoading(false);
      }
    },
    [user, transcriptions, handleError]
  );

  /**
   * Refetch transcriptions with last used options
   */
  const refetch = useCallback(async () => {
    await fetchTranscriptions(lastFetchOptions);
  }, [fetchTranscriptions, lastFetchOptions]);

  /**
   * Auto-fetch on mount if user is logged in
   */
  useEffect(() => {
    if (user) {
      fetchTranscriptions();
    }
  }, [user]); // Only depend on user, not fetchTranscriptions to avoid infinite loop

  return {
    transcriptions,
    loading,
    error,
    fetchTranscriptions,
    getTranscription,
    createTranscription,
    updateTranscription,
    deleteTranscription,
    clearError,
    refetch
  };
}

// ============================================================================
// Single Transcription Hook
// ============================================================================

/**
 * Hook for managing a single transcription
 *
 * @param id - Transcription ID
 * @returns Single transcription state and operations
 */
export function useTranscription(id: string) {
  const { user } = useAuth();
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  const handleError = useCallback((err: unknown, operation: string): never => {
    console.error(`[useTranscription] ${operation} error:`, err);

    const message = err instanceof Error ? err.message : 'Er is een onbekende fout opgetreden';
    const dbError = new DatabaseError(
      `Fout bij ${operation}: ${message}`,
      undefined,
      err
    );

    setError(dbError);
    throw dbError;
  }, []);

  const fetchTranscription = useCallback(async () => {
    if (!supabase || !user || !id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setTranscription(null);
          return;
        }
        handleError(fetchError, 'ophalen transcriptie');
      }

      setTranscription(data);
    } catch (err) {
      if (err instanceof DatabaseError) {
        throw err;
      }
      handleError(err, 'ophalen transcriptie');
    } finally {
      setLoading(false);
    }
  }, [id, user, handleError]);

  useEffect(() => {
    fetchTranscription();
  }, [fetchTranscription]);

  return {
    transcription,
    loading,
    error,
    refetch: fetchTranscription
  };
}
