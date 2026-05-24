'use client';

/**
 * app/providers.tsx
 *
 * Single explicit client boundary for all root-level providers.
 *
 * WHY THIS FILE EXISTS:
 * app/layout.tsx is a Server Component. If you import a Client Component
 * (like AuthProvider) directly into layout.tsx, Next.js attaches the
 * entire client module graph of that component to the root layout chunk.
 * Any change to lib/api.ts, lib/types.ts, or lib/auth-context.tsx then
 * invalidates the layout chunk and triggers a chunk reload race in dev.
 *
 * By putting all providers here:
 *   - layout.tsx stays a pure Server Component with minimal imports
 *   - this file is the one and only client boundary at the root level
 *   - webpack treats this as a separate chunk, not part of layout.js
 *   - HMR changes to providers/api/auth never touch the layout chunk
 */

import { AuthProvider } from '@/lib/auth-context';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
