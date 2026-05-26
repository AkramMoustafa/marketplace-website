'use client';

/**
 * Backwards-compatible shim.
 * The homepage imports this component with `query` / `onQueryChange` props.
 * All real markup lives in components/layout/SiteHeader.tsx.
 */

import SiteHeader from './layout/SiteHeader';

interface HeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export default function Header({ query, onQueryChange }: HeaderProps) {
  return <SiteHeader query={query} onQueryChange={onQueryChange} />;
}
