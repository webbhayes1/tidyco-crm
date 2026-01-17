'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useUnsavedChangesContext } from '../contexts/UnsavedChangesContext';

export function useSafeRouter() {
  const router = useRouter();
  const { isDirty, confirmNavigation, allowNavigation } = useUnsavedChangesContext();

  const push = useCallback((href: string) => {
    if (isDirty) {
      confirmNavigation(() => {
        allowNavigation();
        router.push(href);
      });
    } else {
      router.push(href);
    }
  }, [isDirty, confirmNavigation, allowNavigation, router]);

  const replace = useCallback((href: string) => {
    if (isDirty) {
      confirmNavigation(() => {
        allowNavigation();
        router.replace(href);
      });
    } else {
      router.replace(href);
    }
  }, [isDirty, confirmNavigation, allowNavigation, router]);

  const back = useCallback(() => {
    if (isDirty) {
      confirmNavigation(() => {
        allowNavigation();
        router.back();
      });
    } else {
      router.back();
    }
  }, [isDirty, confirmNavigation, allowNavigation, router]);

  return {
    ...router,
    push,
    replace,
    back,
  };
}
