'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CarDetailPage, { type CarRec } from '@/components/CarDetailPage';

export default function CarDetailRoute() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [car,   setCar]   = useState<CarRec | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) { setReady(true); return; }
    const stored = sessionStorage.getItem(`car:${id}`);
    if (stored) {
      try { setCar(JSON.parse(stored) as CarRec); } catch { /* ignore */ }
    }
    setReady(true);
  }, [id]);

  if (!ready) return (
    <div style={{
      minHeight:      '100vh',
      background:     '#0a0f1e',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width:        40,
        height:       40,
        border:       '3px solid #1e293b',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation:    '_spin 0.75s linear infinite',
      }} />
    </div>
  );

  return <CarDetailPage car={car} />;
}
