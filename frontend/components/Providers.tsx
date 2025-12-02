'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import QueryProvider from '@/lib/providers/QueryProvider';
import LoadingOverlay from './LoadingOverlay';
import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SessionProvider>
        <QueryProvider>
          {children}
          <LoadingOverlay />
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
