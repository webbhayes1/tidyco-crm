'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UnsavedChangesModal } from '../components/UnsavedChangesModal';

interface FormDirtyState {
  [formId: string]: boolean;
}

interface UnsavedChangesContextType {
  isDirty: boolean;
  registerForm: (formId: string) => void;
  unregisterForm: (formId: string) => void;
  markFormDirty: (formId: string, dirty: boolean) => void;
  confirmNavigation: (callback: () => void) => void;
  allowNavigation: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null);

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const [formStates, setFormStates] = useState<FormDirtyState>({});
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showModal, setShowModal] = useState(false);

  const isDirty = Object.values(formStates).some(Boolean);

  const registerForm = useCallback((formId: string) => {
    setFormStates(prev => ({ ...prev, [formId]: false }));
  }, []);

  const unregisterForm = useCallback((formId: string) => {
    setFormStates(prev => {
      const next = { ...prev };
      delete next[formId];
      return next;
    });
  }, []);

  const markFormDirty = useCallback((formId: string, dirty: boolean) => {
    setFormStates(prev => ({ ...prev, [formId]: dirty }));
  }, []);

  const confirmNavigation = useCallback((callback: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => callback);
      setShowModal(true);
    } else {
      callback();
    }
  }, [isDirty]);

  const allowNavigation = useCallback(() => {
    // Clear all dirty states
    setFormStates({});
  }, []);

  const handleStay = useCallback(() => {
    setPendingNavigation(null);
    setShowModal(false);
  }, []);

  const handleLeave = useCallback(() => {
    setShowModal(false);
    allowNavigation();
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation, allowNavigation]);

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        registerForm,
        unregisterForm,
        markFormDirty,
        confirmNavigation,
        allowNavigation,
      }}
    >
      {children}
      <UnsavedChangesModal
        isOpen={showModal}
        onStay={handleStay}
        onLeave={handleLeave}
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
