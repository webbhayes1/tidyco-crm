'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useUnsavedChangesContext } from '../contexts/UnsavedChangesContext';

interface UseUnsavedChangesOptions<T> {
  formId: string;
  formData: T;
  initialData: T;
  enabled?: boolean;
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
}: UseUnsavedChangesOptions<T>): UseUnsavedChangesReturn {
  const { registerForm, unregisterForm, markFormDirty, isDirty: contextIsDirty, confirmNavigation, allowNavigation } = useUnsavedChangesContext();
  const initialDataRef = useRef(initialData);
  const formIdRef = useRef(formId);

  // Register form on mount, unregister on unmount
  useEffect(() => {
    if (!enabled) return;

    registerForm(formId);
    formIdRef.current = formId;

    return () => {
      unregisterForm(formIdRef.current);
    };
  }, [formId, enabled, registerForm, unregisterForm]);

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

  // Handle browser back/forward buttons
  const pathname = usePathname();
  const hasAddedHistoryState = useRef(false);
  const isNavigatingBack = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // When form becomes dirty, push a history state to intercept back button
    if (contextIsDirty && !hasAddedHistoryState.current) {
      window.history.pushState({ unsavedChanges: true, path: pathname }, '');
      hasAddedHistoryState.current = true;
    }

    // When form becomes clean, reset the flag
    if (!contextIsDirty) {
      hasAddedHistoryState.current = false;
    }
  }, [contextIsDirty, enabled, pathname]);

  useEffect(() => {
    if (!enabled) return;

    const handlePopState = () => {
      // If we're already handling a confirmed navigation, let it through
      if (isNavigatingBack.current) {
        isNavigatingBack.current = false;
        return;
      }

      // If form is dirty and user pressed back
      if (contextIsDirty) {
        // Push the state back to prevent navigation
        window.history.pushState({ unsavedChanges: true, path: pathname }, '');

        // Show confirmation via context
        confirmNavigation(() => {
          isNavigatingBack.current = true;
          allowNavigation();
          // Go back twice: once for the state we just pushed, once for the actual back
          window.history.go(-2);
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [contextIsDirty, enabled, pathname, confirmNavigation, allowNavigation]);

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
