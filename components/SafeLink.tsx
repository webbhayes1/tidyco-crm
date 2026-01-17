'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, MouseEvent } from 'react';
import { useUnsavedChangesContext } from '../contexts/UnsavedChangesContext';

type LinkProps = ComponentProps<typeof Link>;

interface SafeLinkProps extends LinkProps {
  children: React.ReactNode;
}

export function SafeLink({ href, children, onClick, ...props }: SafeLinkProps) {
  const { isDirty, confirmNavigation } = useUnsavedChangesContext();
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }

    // If already prevented, don't do anything
    if (e.defaultPrevented) return;

    // If form is dirty, intercept navigation
    if (isDirty) {
      e.preventDefault();
      const targetHref = typeof href === 'string' ? href : href.pathname || '/';
      confirmNavigation(() => {
        router.push(targetHref);
      });
    }
    // If not dirty, let Link handle navigation normally
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
