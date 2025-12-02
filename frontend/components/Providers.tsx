'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import QueryProvider from '@/lib/providers/QueryProvider';
import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SessionProvider>
        <QueryProvider>{children}</QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
