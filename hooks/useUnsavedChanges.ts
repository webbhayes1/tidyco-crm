'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUnsavedChangesContext } from '../contexts/UnsavedChangesContext';

interface UseUnsavedChangesOptions<T> {
  formId: string;
  formData: T;
  initialData: T;
  enabled?: boolean;
  formType?: 'edit' | 'draft';
  entityType?: string;
  onSaveDraft?: () => void;
}

interface UseUnsavedChangesReturn {
  isDirty: boolean;
  markClean: () => void;
}

// Normalize values for comparison (handle empty strings, undefined, null, arrays)
function normalizeForComparison(obj: unknown): string {
  return JSON.stringify(obj, (_, value) => {
    // Treat empty strings, undefined, null as equivalent
    if (value === '' || value === undefined) return null;
    // Sort arrays for consistent comparison
    if (Array.isArray(value)) return [...value].sort();
    return value;
  });
}

function isFormDirty<T>(current: T, initial: T): boolean {
  return normalizeForComparison(current) !== normalizeForComparison(initial);
}

export function useUnsavedChanges<T>({
  formId,
  formData,
  initialData,
  enabled = true,
  formType = 'edit',
  entityType,
  onSaveDraft,
}: UseUnsavedChangesOptions<T>): UseUnsavedChangesReturn {
  const { registerForm, unregisterForm, updateFormCallback, markFormDirty, isDirty: contextIsDirty } = useUnsavedChangesContext();
  const initialDataRef = useRef(initialData);
  const formIdRef = useRef(formId);
  const onSaveDraftRef = useRef(onSaveDraft);

  // Keep onSaveDraft ref current
  useEffect(() => {
    onSaveDraftRef.current = onSaveDraft;
  }, [onSaveDraft]);

  // Create a stable wrapper that always calls the latest onSaveDraft
  const stableSaveDraft = useCallback(() => {
    onSaveDraftRef.current?.();
  }, []);

  // Register form on mount, unregister on unmount
  useEffect(() => {
    if (!enabled) return;

    registerForm(formId, formType, entityType, stableSaveDraft);
    formIdRef.current = formId;

    return () => {
      unregisterForm(formIdRef.current);
    };
  }, [formId, enabled, formType, entityType, registerForm, unregisterForm, stableSaveDraft]);

  // Update the callback when onSaveDraft changes (the ref is updated, but we need to notify context)
  useEffect(() => {
    if (!enabled || !onSaveDraft) return;
    updateFormCallback(formId, stableSaveDraft);
  }, [formId, enabled, onSaveDraft, updateFormCallback, stableSaveDraft]);

  // Update dirty state when formData changes
  useEffect(() => {
    if (!enabled) return;

    const dirty = isFormDirty(formData, initialDataRef.current);
    markFormDirty(formId, dirty);
  }, [formData, formId, enabled, markFormDirty]);

  // Handle beforeunload for browser refresh/close
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (contextIsDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [contextIsDirty, enabled]);

  // Note: Browser back/forward button handling is now done at the context level
  // in UnsavedChangesContext.tsx to ensure it's always active

  const markClean = useCallback(() => {
    markFormDirty(formIdRef.current, false);
    // Update the initial data ref so future comparisons use the new baseline
    initialDataRef.current = formData as T;
  }, [formData, markFormDirty]);

  const localIsDirty = enabled ? isFormDirty(formData, initialDataRef.current) : false;

  return {
    isDirty: localIsDirty,
    markClean,
  };
}
