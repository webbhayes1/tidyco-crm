'use client';

import { ReactNode } from 'react';
import { UnsavedChangesProvider } from '../contexts/UnsavedChangesContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <UnsavedChangesProvider>
      {children}
    </UnsavedChangesProvider>
  );
}
