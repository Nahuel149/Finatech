import { useCallback, useRef, useEffect } from 'react';
import { useTransactionDraft } from './useTransactionDraft';

interface UseAutoSaveDraftOptions {
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
  // Optional custom save function; defaults to draft save
  save?: (data: any) => Promise<any>;
}

interface UseAutoSaveDraftReturn {
  autoSave: (data: any) => void;
  forceSave: (data: any) => Promise<boolean>;
  isSaving: boolean;
  lastSaveTime: number | null;
  hasUnsavedChanges: boolean;
}

export const useAutoSaveDraft = (
  options: UseAutoSaveDraftOptions = {}
): UseAutoSaveDraftReturn => {
  const { debounceMs = 60000, onSaveSuccess, onSaveError, save } = options;
  const { saveDraft } = useTransactionDraft();
  const persist = save ?? saveDraft;
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef<number | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const lastDataRef = useRef<any>(null);

  // Auto save function with debouncing
  const autoSave = useCallback((data: any) => {
    // Mark that we have unsaved changes
    hasUnsavedChangesRef.current = true;
    lastDataRef.current = data;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      if (!isSavingRef.current && hasUnsavedChangesRef.current) {
        try {
          isSavingRef.current = true;
          await persist(data);
          lastSaveTimeRef.current = Date.now();
          hasUnsavedChangesRef.current = false;
          onSaveSuccess?.();
        } catch (error) {
          console.error('Auto-save failed:', error);
          onSaveError?.(error);
        } finally {
          isSavingRef.current = false;
        }
      }
    }, debounceMs);
  }, [persist, debounceMs, onSaveSuccess, onSaveError]);

  // Force save function for immediate saving (used by Continuar button)
  const forceSave = useCallback(async (data: any): Promise<boolean> => {
    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // If already saving, wait for it to complete
    if (isSavingRef.current) {
      return new Promise((resolve) => {
        const checkSaving = () => {
          if (!isSavingRef.current) {
            resolve(!hasUnsavedChangesRef.current);
          } else {
            setTimeout(checkSaving, 50);
          }
        };
        checkSaving();
      });
    }

    // If no unsaved changes, return true immediately
    if (!hasUnsavedChangesRef.current) {
      return true;
    }

    try {
      isSavingRef.current = true;
      await persist(data);
      lastSaveTimeRef.current = Date.now();
      hasUnsavedChangesRef.current = false;
      onSaveSuccess?.();
      return true;
    } catch (error) {
      console.error('Force save failed:', error);
      onSaveError?.(error);
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [persist, onSaveSuccess, onSaveError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    autoSave,
    forceSave,
    isSaving: isSavingRef.current,
    lastSaveTime: lastSaveTimeRef.current,
    hasUnsavedChanges: hasUnsavedChangesRef.current,
  };
};