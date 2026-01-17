'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DraftSaveOptions<T> {
  key: string;
  data: T;
  enabled?: boolean;
  debounceMs?: number;
}

interface DraftSaveReturn<T> {
  hasDraft: boolean;
  draftData: T | null;
  restoreDraft: () => void;
  clearDraft: () => void;
  saveDraft: () => void;
}

function getStorageKey(key: string): string {
  return `tidyco_draft_${key}`;
}

export function useDraftSave<T>({
  key,
  data,
  enabled = true,
  debounceMs = 1000,
}: DraftSaveOptions<T>): DraftSaveReturn<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<T | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const storageKey = getStorageKey(key);
  const dataRef = useRef(data);

  // Keep dataRef current for event handlers
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if draft is less than 24 hours old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setDraftData(parsed.data);
          setHasDraft(true);
        } else {
          // Draft is too old, remove it
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.error('Error reading draft:', e);
    }
  }, [storageKey, enabled]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      try {
        const toStore = {
          data,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(toStore));
      } catch (e) {
        console.error('Error saving draft:', e);
      }
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [data, storageKey, debounceMs, enabled]);

  // Note: Auto-save on unmount removed - forms now prompt user to save draft

  // Save draft immediately (e.g., before navigation)
  const saveDraft = useCallback(() => {
    if (!enabled) return;
    try {
      const toStore = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  }, [data, storageKey, enabled]);

  // Restore draft data
  const restoreDraft = useCallback(() => {
    if (draftData) {
      setHasDraft(false);
    }
  }, [draftData]);

  // Clear draft from storage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setDraftData(null);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  }, [storageKey]);

  return {
    hasDraft,
    draftData,
    restoreDraft,
    clearDraft,
    saveDraft,
  };
}
