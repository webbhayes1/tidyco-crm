'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { UnsavedChangesModal } from '../components/UnsavedChangesModal';
import { DraftSaveModal } from '../components/DraftSaveModal';

type FormType = 'edit' | 'draft';

interface FormState {
  dirty: boolean;
  type: FormType;
  entityType?: string;
  onSaveDraft?: () => void;
}

interface FormStates {
  [formId: string]: FormState;
}

interface UnsavedChangesContextType {
  isDirty: boolean;
  registerForm: (formId: string, type?: FormType, entityType?: string, onSaveDraft?: () => void) => void;
  unregisterForm: (formId: string) => void;
  updateFormCallback: (formId: string, onSaveDraft: () => void) => void;
  markFormDirty: (formId: string, dirty: boolean) => void;
  confirmNavigation: (callback: () => void) => void;
  allowNavigation: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const [formStates, setFormStates] = useState<FormStates>({});
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [activeDraftForm, setActiveDraftForm] = useState<{ entityType: string; onSaveDraft?: () => void } | null>(null);

  // Use ref to always access latest formStates (avoids stale closure in confirmNavigation)
  // IMPORTANT: This ref is updated synchronously within state setters, not in an effect,
  // to avoid race conditions with the popstate handler
  const formStatesRef = useRef<FormStates>({});

  const isDirty = Object.values(formStates).some(state => state.dirty);

  // Get the first dirty draft form (uses ref for latest state)
  const getDirtyDraftForm = useCallback(() => {
    const states = formStatesRef.current;
    const entry = Object.entries(states).find(([, state]) => state.dirty && state.type === 'draft');
    return entry ? entry[1] : null;
  }, []);

  // Check if any edit form is dirty (uses ref for latest state)
  const checkHasEditDirty = useCallback(() => {
    const states = formStatesRef.current;
    return Object.values(states).some(state => state.dirty && state.type === 'edit');
  }, []);

  // Check if any form is dirty (uses ref for latest state)
  const checkIsDirty = useCallback(() => {
    const states = formStatesRef.current;
    return Object.values(states).some(state => state.dirty);
  }, []);

  const registerForm = useCallback((formId: string, type: FormType = 'edit', entityType?: string, onSaveDraft?: () => void) => {
    setFormStates(prev => {
      const next = {
        ...prev,
        [formId]: { dirty: false, type, entityType, onSaveDraft }
      };
      formStatesRef.current = next; // Update ref synchronously
      return next;
    });
  }, []);

  const unregisterForm = useCallback((formId: string) => {
    setFormStates(prev => {
      const next = { ...prev };
      delete next[formId];
      formStatesRef.current = next; // Update ref synchronously
      return next;
    });
  }, []);

  const markFormDirty = useCallback((formId: string, dirty: boolean) => {
    setFormStates(prev => {
      if (!prev[formId]) return prev;
      const next = {
        ...prev,
        [formId]: { ...prev[formId], dirty }
      };
      formStatesRef.current = next; // Update ref synchronously
      return next;
    });
  }, []);

  const updateFormCallback = useCallback((formId: string, onSaveDraft: () => void) => {
    setFormStates(prev => {
      if (!prev[formId]) return prev;
      const next = {
        ...prev,
        [formId]: { ...prev[formId], onSaveDraft }
      };
      formStatesRef.current = next; // Update ref synchronously
      return next;
    });
  }, []);

  const confirmNavigation = useCallback((callback: () => void) => {
    // Use ref-based checks to always get latest state
    if (!checkIsDirty()) {
      callback();
      return;
    }

    setPendingNavigation(() => callback);

    // Check for dirty draft forms first
    const draftForm = getDirtyDraftForm();
    if (draftForm) {
      setActiveDraftForm({
        entityType: draftForm.entityType || 'item',
        onSaveDraft: draftForm.onSaveDraft
      });
      setShowDraftModal(true);
      return;
    }

    // Otherwise show edit modal
    if (checkHasEditDirty()) {
      setShowEditModal(true);
    }
  }, [checkIsDirty, getDirtyDraftForm, checkHasEditDirty]);

  const allowNavigation = useCallback(() => {
    formStatesRef.current = {}; // Update ref synchronously
    setFormStates({});
  }, []);

  // Edit modal handlers
  const handleEditStay = useCallback(() => {
    setPendingNavigation(null);
    setShowEditModal(false);
  }, []);

  const handleEditLeave = useCallback(() => {
    setShowEditModal(false);
    allowNavigation();
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation, allowNavigation]);

  // Draft modal handlers
  const handleDraftStay = useCallback(() => {
    setPendingNavigation(null);
    setShowDraftModal(false);
    setActiveDraftForm(null);
  }, []);

  const handleDraftDiscard = useCallback(() => {
    setShowDraftModal(false);
    setActiveDraftForm(null);
    allowNavigation();
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation, allowNavigation]);

  const handleDraftSave = useCallback(() => {
    // Call the save draft callback if provided
    if (activeDraftForm?.onSaveDraft) {
      activeDraftForm.onSaveDraft();
    }
    setShowDraftModal(false);
    setActiveDraftForm(null);
    allowNavigation();
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [activeDraftForm, pendingNavigation, allowNavigation]);

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        registerForm,
        unregisterForm,
        updateFormCallback,
        markFormDirty,
        confirmNavigation,
        allowNavigation,
      }}
    >
      {children}
      <UnsavedChangesModal
        isOpen={showEditModal}
        onStay={handleEditStay}
        onLeave={handleEditLeave}
      />
      <DraftSaveModal
        isOpen={showDraftModal}
        entityType={activeDraftForm?.entityType || 'item'}
        onStay={handleDraftStay}
        onDiscard={handleDraftDiscard}
        onSaveDraft={handleDraftSave}
      />
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChangesContext() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChangesContext must be used within UnsavedChangesProvider');
  }
  return context;
}
