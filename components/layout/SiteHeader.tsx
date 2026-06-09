'use client';

import PremiumHeader from './PremiumHeader';

interface SiteHeaderProps {
  query?: string;
  onQueryChange?: (value: string) => void;
}

export default function SiteHeader({ query, onQueryChange }: SiteHeaderProps) {
  return <PremiumHeader query={query} onQueryChange={onQueryChange} />;
}
