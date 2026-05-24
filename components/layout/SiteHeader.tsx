'use client';

import TopTrustBar from './TopTrustBar';
import MainHeader from './MainHeader';
import NavBar from './NavBar';

interface SiteHeaderProps {
  /** Controlled search value — pass from page state when live filtering is needed. */
  query?: string;
  /** Search change handler — omit on pages that don't need live filtering. */
  onQueryChange?: (value: string) => void;
}

/**
 * Single-source-of-truth site header.
 *
 * Usage (with live search, e.g. homepage):
 *   <SiteHeader query={query} onQueryChange={setQuery} />
 *
 * Usage (static, e.g. vehicle detail, future pages):
 *   <SiteHeader />
 */
export default function SiteHeader({ query, onQueryChange }: SiteHeaderProps) {
  return (
    <>
      <TopTrustBar />
      <MainHeader query={query} onQueryChange={onQueryChange} />
      <NavBar />
    </>
  );
}
