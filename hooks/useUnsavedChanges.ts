'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
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
  const { registerForm, unregisterForm, updateFormCallback, markFormDirty, isDirty: contextIsDirty, confirmNavigation, allowNavigation } = useUnsavedChangesContext();
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

  // Handle browser back/forward buttons
  const pathname = usePathname();
  const isHandlingNavigation = useRef(false);
  const formDataRef = useRef(formData);
  const confirmNavigationRef = useRef(confirmNavigation);
  const allowNavigationRef = useRef(allowNavigation);

  // Keep refs in sync (synchronously where possible)
  formDataRef.current = formData;
  confirmNavigationRef.current = confirmNavigation;
  allowNavigationRef.current = allowNavigation;

  // Push a guard history state on mount and whenever we're on a form page
  useEffect(() => {
    if (!enabled) return;

    // Always push a guard state so we can intercept back button
    window.history.pushState({ formGuard: true, path: pathname }, '');

    return () => {
      // Don't clean up history state - browser handles it
    };
  }, [enabled, pathname]);

  // Handle popstate (back/forward button)
  useEffect(() => {
    if (!enabled) return;

    const handlePopState = (event: PopStateEvent) => {
      // If we're in the middle of a confirmed navigation, let it through
      if (isHandlingNavigation.current) {
        isHandlingNavigation.current = false;
        return;
      }

      // Check if form is dirty
      const isDirty = isFormDirty(formDataRef.current, initialDataRef.current);

      if (isDirty) {
        // Prevent the navigation by pushing state back
        window.history.pushState({ formGuard: true, path: pathname }, '');

        // Show confirmation modal
        confirmNavigationRef.current(() => {
          isHandlingNavigation.current = true;
          allowNavigationRef.current();
          // Go back twice: once for the guard state we just pushed, once for actual back
          window.history.go(-2);
        });
      }
      // If not dirty, let the navigation happen naturally
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled, pathname]);

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
