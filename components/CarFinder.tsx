'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import type { VehicleListItem, VehicleFilters } from '@/lib/types';

/* ─── Injected CSS (unchanged from original) ─────────────────────────────── */
const INJECTED_CSS = `
  .cf-option {
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }
  .cf-option:hover {
    border-color: #B22222 !important;
    transform: translateY(-2px);
  }
  .cf-btn {
    cursor: pointer;
    transition: background 0.18s ease, transform 0.13s ease;
  }
  .cf-btn:not(:disabled):hover {
    background: #9B1414 !important;
    transform: translateY(-1px);
  }
  .cf-btn:disabled { cursor: not-allowed; }
  .cf-ghost {
    cursor: pointer;
    transition: color 0.15s ease;
  }
  .cf-ghost:hover { color: #94a3b8 !important; }
  .cf-close {
    cursor: pointer;
    transition: color 0.15s ease, transform 0.15s ease;
  }
  .cf-close:hover { color: #e2e8f0 !important; transform: scale(1.15); }
  .cf-view-btn {
    cursor: pointer;
    display: block;
    text-decoration: none;
    text-align: center;
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .cf-view-btn:hover { background: #9B1414 !important; transform: translateY(-1px); }

  @keyframes cf-spin {
    to { transform: rotate(360deg); }
  }
  .cf-spinner {
    width: 48px; height: 48px;
    border: 3px solid #1e293b;
    border-top-color: #B22222;
    border-radius: 50%;
    animation: cf-spin 0.75s linear infinite;
  }

  @keyframes cf-hero-in {
    from { opacity: 0; transform: translateY(28px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes cf-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes cf-slide-right {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  .cf-result-header {
    opacity: 0;
    animation: cf-fade-up 0.35s ease 0s forwards;
  }
  .cf-hero-card {
    opacity: 0;
    animation: cf-hero-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
  }
  .cf-others-label {
    opacity: 0;
    animation: cf-fade-up 0.3s ease 0.52s forwards;
  }
  .cf-carousel-card { opacity: 0; }
  .cf-carousel-card:nth-child(1) { animation: cf-slide-right 0.38s ease 0.58s forwards; }
  .cf-carousel-card:nth-child(2) { animation: cf-slide-right 0.38s ease 0.70s forwards; }
  .cf-carousel-card:nth-child(3) { animation: cf-slide-right 0.38s ease 0.82s forwards; }
  .cf-carousel-card:nth-child(4) { animation: cf-slide-right 0.38s ease 0.94s forwards; }
  .cf-carousel-card:nth-child(5) { animation: cf-slide-right 0.38s ease 1.06s forwards; }

  .cf-carousel::-webkit-scrollbar { display: none; }
  .cf-carousel { scrollbar-width: none; -ms-overflow-style: none; }

  @media (max-width: 500px) {
    .cf-grid-3 { grid-template-columns: 1fr 1fr !important; }
  }
`;

/* ─── Quiz steps (unchanged) ─────────────────────────────────────────────── */
const STEPS = [
  {
    question: 'What are you looking for?',
    options:  ['Daily Driver', 'Family Car', 'Weekend Fun', 'Work & Hauling'],
    multi:    false,
  },
  {
    question: "What's your budget?",
    options:  ['Under $20k', '$20k–$35k', '$35k–$50k', '$50k+'],
    multi:    false,
  },
  {
    question: 'How many seats do you need?',
    options:  ['Just me', '2–4 people', '5+ people'],
    multi:    false,
  },
  {
    question: 'Must-haves?',
    options:  ['Great MPG', 'AWD/4WD', 'Latest Tech', 'Towing Power'],
    multi:    true,
  },
] as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatPrice(v: VehicleListItem): string {
  if (v.price_on_call) return 'Call for Price';
  const n = parseFloat(v.price);
  return isNaN(n) ? v.price : `$${n.toLocaleString()}`;
}

/** Derive 2-3 personalized match tags from quiz answers + vehicle data */
function matchTags(
  v: VehicleListItem,
  budget: string,
  mustHaves: string[],
): string[] {
  const tags: string[] = [];
  const price = parseFloat(v.price);

  // Budget fit
  if (!isNaN(price)) {
    if (budget === 'Under $20k'  && price < 20_000)                    tags.push('Within Budget');
    if (budget === '$20k–$35k'   && price >= 20_000 && price < 35_000) tags.push('Within Budget');
    if (budget === '$35k–$50k'   && price >= 35_000 && price < 50_000) tags.push('Within Budget');
    if (budget === '$50k+'       && price >= 50_000)                    tags.push('Premium');
  }

  // Must-have matches
  if (mustHaves.includes('Great MPG') && (v.fuel_type === 'hybrid' || v.fuel_type === 'electric')) {
    tags.push('Fuel Efficient');
  }
  if (mustHaves.includes('Great MPG') && v.fuel_type === 'electric') tags.push('Zero Emissions');
  if (v.featured) tags.push('Staff Pick');
  if (v.mileage < 20_000) tags.push('Low Mileage');

  // Always show availability
  tags.push('Available Now');

  // Deduplicate without spread-Set (TS target compatibility)
  const seen = new Set<string>();
  return tags.filter(t => { if (seen.has(t)) return false; seen.add(t); return true; }).slice(0, 3);
}

type Phase = 'quiz' | 'loading' | 'results';

interface CarFinderProps {
  isOpen:  boolean;
  onClose: () => void;
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CarFinder({ isOpen, onClose }: CarFinderProps) {
  const router = useRouter();

  const [phase,   setPhase]   = useState<Phase>('quiz');
  const [step,    setStep]    = useState(0);
  const [singles, setSingles] = useState(['', '', '']);
  const [multi,   setMulti]   = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [matches, setMatches] = useState<VehicleListItem[]>([]);
  const [relaxed, setRelaxed] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [show,   setShow]   = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = INJECTED_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      const t = setTimeout(() => setAnimIn(true), 10);
      return () => clearTimeout(t);
    } else {
      setAnimIn(false);
      const t = setTimeout(() => setShow(false), 370);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── Transition helper ───────────────────────────────────────────────── */
  const transit = (fn: () => void) => {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 230);
  };

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const goBack  = () => { if (step > 0) transit(() => setStep(s => s - 1)); };
  const goNext  = () => {
    if (step < 3) {
      transit(() => setStep(s => s + 1));
    } else {
      transit(() => { setPhase('loading'); void fetchMatches(); });
    }
  };
  const reset = () =>
    transit(() => {
      setPhase('quiz'); setStep(0);
      setSingles(['', '', '']); setMulti([]);
      setMatches([]); setError(null); setRelaxed(false);
    });

  /* ── Answer helpers ──────────────────────────────────────────────────── */
  const selectSingle = (val: string) =>
    setSingles(p => { const n = [...p]; n[step] = val; return n; });
  const toggleMulti  = (val: string) =>
    setMulti(p => p.includes(val) ? p.filter(v => v !== val) : [...p, val]);

  const canProceed = step === 3 || singles[step] !== '';

  /* ── Real inventory fetch ────────────────────────────────────────────── */
  const fetchMatches = async () => {
    try {
      // ── Map quiz answers → API filters ──────────────────────────────
      const filters: VehicleFilters = { page_size: 12 };

      // Budget → price range
      const budget = singles[1];
      if (budget === 'Under $20k')  { filters.price_max = 20_000; }
      else if (budget === '$20k–$35k') { filters.price_min = 20_000; filters.price_max = 35_000; }
      else if (budget === '$35k–$50k') { filters.price_min = 35_000; filters.price_max = 50_000; }
      else if (budget === '$50k+')  { filters.price_min = 50_000; }

      // Must-haves → fuel type
      if (multi.includes('Great MPG')) filters.fuel_type = 'hybrid';

      // Use case → body_type search hint
      const useCase = singles[0];
      if (useCase === 'Family Car')    filters.search = 'SUV';
      if (useCase === 'Work & Hauling') filters.search = 'truck';

      let data = await api.getVehicles(filters);
      let wasRelaxed = false;

      // Relax 1: remove fuel_type / search if 0 results
      if (data.items.length === 0 && (filters.fuel_type || filters.search)) {
        const relaxedFilters: VehicleFilters = { ...filters };
        delete relaxedFilters.fuel_type;
        delete relaxedFilters.search;
        data = await api.getVehicles(relaxedFilters);
        wasRelaxed = true;
      }

      // Relax 2: remove price range too
      if (data.items.length === 0) {
        data = await api.getVehicles({ page_size: 12 });
        wasRelaxed = true;
      }

      setMatches(data.items.slice(0, 6));
      setRelaxed(wasRelaxed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      transit(() => setPhase('results'));
    }
  };

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const pct    = phase === 'quiz' ? Math.round(((step + 1) / 4) * 100) : 100;
  const sFade: React.CSSProperties = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 0.22s ease, transform 0.22s ease',
  };

  /* ══════════════════════════════════════════════════════════════════════
     PHASE RENDERERS
  ══════════════════════════════════════════════════════════════════════ */
  const renderContent = () => {

    /* ── Loading ── */
    if (phase === 'loading') return (
      <div>
        <ProgressBar pct={100} stepLabel="Searching Inventory…" />
        <div style={{ textAlign: 'center', padding: '52px 0' }}>
          <div className="cf-spinner" style={{ margin: '0 auto 28px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Finding your perfect match…
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Scanning live inventory for your preferences
          </p>
        </div>
      </div>
    );

    /* ── Results ── */
    if (phase === 'results') {

      /* Error state */
      if (error) return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <ProgressBar pct={100} stepLabel="Error" />
          <p style={{ color: '#f87171', marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.5 }}>
            ⚠️ {error}
          </p>
          <button className="cf-btn" onClick={reset}
            style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#B22222', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
            Try Again
          </button>
        </div>
      );

      /* Empty state */
      if (matches.length === 0) return (
        <div>
          <ProgressBar pct={100} stepLabel="Results" />
          <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px' }}>
              No exact matches right now
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24 }}>
              Our inventory is constantly updated. Browse all available vehicles or check back soon.
            </p>
            <a
              href="/inventory"
              onClick={onClose}
              className="cf-view-btn"
              style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 10, background: '#B22222', color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}
            >
              Browse All Inventory →
            </a>
          </div>
          <button className="cf-ghost" onClick={reset}
            style={{ width: '100%', padding: '11px', border: '1px solid #1e293b', borderRadius: 10, background: 'transparent', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
            ↩ Start Over
          </button>
        </div>
      );

      const [hero, ...others] = matches;
      const heroTags  = matchTags(hero, singles[1], multi);
      const heroImage = hero.images?.[0] ? api.getImageUrl(hero.images[0]) : null;

      return (
        <div>
          {/* Header */}
          <div className="cf-result-header">
            <ProgressBar pct={100} stepLabel={`${matches.length} Vehicle${matches.length !== 1 ? 's' : ''} Found`} />
            {relaxed && (
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 14, textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 12px' }}>
                💡 We broadened the search to show you the best available options.
              </p>
            )}
          </div>

          {/* ── Hero vehicle card ── */}
          <div
            className="cf-hero-card"
            style={{
              borderRadius: 16,
              border:       '1px solid rgba(255,255,255,0.09)',
              overflow:     'hidden',
              marginBottom: 16,
              background:   'linear-gradient(135deg, #0d1f3c 0%, #0f172a 55%, #080e1e 100%)',
              boxShadow:    '0 8px 40px rgba(0,0,0,0.55)',
            }}
          >
            {/* Vehicle image */}
            {heroImage ? (
              <div style={{ width: '100%', height: 180, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <img src={heroImage} alt={hero.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,31,60,0.7) 0%, transparent 50%)' }} />
                {/* Best Match badge on image */}
                <span style={{
                  position:      'absolute',
                  top:           12,
                  left:          12,
                  display:       'inline-flex',
                  alignItems:    'center',
                  gap:           5,
                  padding:       '5px 11px',
                  borderRadius:  20,
                  background:    'rgba(34,197,94,0.15)',
                  border:        '1px solid rgba(34,197,94,0.35)',
                  color:         '#4ade80',
                  fontSize:      '0.7rem',
                  fontWeight:    800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(6px)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  Best Match
                </span>
              </div>
            ) : (
              /* Placeholder if no image */
              <div style={{ width: '100%', height: 120, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 4v3h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
            )}

            {/* Card body */}
            <div style={{ padding: '18px 20px 20px', position: 'relative', zIndex: 1 }}>
              {/* Year Make Model */}
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.1, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                {hero.year} {hero.make} {hero.model}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 10px', fontStyle: 'italic' }}>
                {hero.title}
              </p>

              {/* Price + Mileage row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#B22222', letterSpacing: '-0.01em' }}>
                  {formatPrice(hero)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  {hero.mileage.toLocaleString()} mi
                </span>
                {hero.color && (
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>· {hero.color}</span>
                )}
              </div>

              {/* Fit tags */}
              {heroTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {heroTags.map((tag, i) => (
                    <span key={i} style={{
                      display:       'inline-flex',
                      alignItems:    'center',
                      gap:           4,
                      padding:       '3px 10px',
                      borderRadius:  20,
                      background:    'rgba(34,197,94,0.08)',
                      border:        '1px solid rgba(34,197,94,0.2)',
                      color:         '#4ade80',
                      fontSize:      '0.72rem',
                      fontWeight:    700,
                    }}>
                      <span>✓</span> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <button
                className="cf-view-btn"
                onClick={() => { onClose(); router.push(`/vehicle-detail?id=${hero.id}`); }}
                style={{
                  width:         '100%',
                  padding:       '13px 20px',
                  borderRadius:  10,
                  border:        'none',
                  background:    '#B22222',
                  color:         '#fff',
                  fontSize:      '0.9rem',
                  fontWeight:    800,
                  letterSpacing: '0.04em',
                  cursor:        'pointer',
                }}
              >
                View This Vehicle →
              </button>
            </div>
          </div>

          {/* ── Other matches ── */}
          {others.length > 0 && (
            <>
              <p className="cf-others-label" style={{
                fontSize:      '0.62rem',
                fontWeight:    800,
                color:         '#475569',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom:  10,
              }}>
                More Matches
              </p>

              <div className="cf-carousel" style={{
                display:        'flex',
                overflowX:      'auto',
                gap:            10,
                paddingBottom:  6,
                marginBottom:   18,
                scrollSnapType: 'x mandatory',
              }}>
                {others.map((v, i) => {
                  const thumb = v.images?.[0] ? api.getImageUrl(v.images[0]) : null;
                  const tags  = matchTags(v, singles[1], multi);
                  return (
                    <div
                      key={v.id}
                      className="cf-carousel-card"
                      style={{
                        flexShrink:      0,
                        width:           200,
                        background:      '#111827',
                        borderRadius:    12,
                        border:          '1px solid rgba(255,255,255,0.06)',
                        scrollSnapAlign: 'start',
                        display:         'flex',
                        flexDirection:   'column',
                        overflow:        'hidden',
                      }}
                    >
                      {/* Thumbnail */}
                      {thumb ? (
                        <div style={{ width: '100%', height: 100, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={thumb} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: 70, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                            <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 4v3h-7V8z" />
                          </svg>
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 800, lineHeight: 1.2, margin: '0 0 3px', color: '#f1f5f9' }}>
                          {v.year} {v.make} {v.model}
                        </p>
                        <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#B22222', margin: '0 0 6px' }}>
                          {formatPrice(v)}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: '#475569', margin: '0 0 8px' }}>
                          {v.mileage.toLocaleString()} mi
                        </p>

                        {/* Compact tags */}
                        {tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                            {tags.slice(0, 2).map((tag, j) => (
                              <span key={j} style={{
                                padding:      '2px 7px',
                                borderRadius: 4,
                                background:   'rgba(255,255,255,0.04)',
                                border:       '1px solid rgba(255,255,255,0.07)',
                                color:        '#94a3b8',
                                fontSize:     '0.64rem',
                                fontWeight:   600,
                              }}>{tag}</span>
                            ))}
                          </div>
                        )}

                        <button
                          className="cf-view-btn"
                          onClick={() => { onClose(); router.push(`/vehicle-detail?id=${v.id}`); }}
                          style={{
                            marginTop:    'auto',
                            width:        '100%',
                            padding:      '8px',
                            borderRadius: 7,
                            border:       'none',
                            background:   '#B22222',
                            color:        '#fff',
                            fontSize:     '0.72rem',
                            fontWeight:   700,
                          }}
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer actions */}
          <a
            href="/inventory"
            onClick={onClose}
            style={{
              display:       'block',
              textAlign:     'center',
              padding:       '12px',
              borderRadius:  10,
              border:        '1px solid rgba(178,34,34,0.25)',
              color:         '#B22222',
              fontSize:      '0.85rem',
              fontWeight:    700,
              textDecoration:'none',
              marginBottom:  8,
              transition:    'background 0.15s',
            }}
          >
            Browse All Inventory
          </a>
          <button className="cf-ghost" onClick={reset}
            style={{ width: '100%', padding: '11px', border: '1px solid #1e293b', borderRadius: 10, background: 'transparent', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
            ↩ Start Over
          </button>
        </div>
      );
    }

    /* ── Quiz ── */
    const { question, options, multi: isMulti } = STEPS[step];
    return (
      <div style={sFade}>
        <ProgressBar pct={pct} stepLabel={`Step ${step + 1} of 4`} />

        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.2, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {question}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 22px', minHeight: 18 }}>
          {isMulti ? 'Select all that apply — skip if flexible' : 'Choose one'}
        </p>

        <div
          className={options.length === 3 ? 'cf-grid-3' : ''}
          style={{
            display:             'grid',
            gridTemplateColumns: options.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap:                 10,
            marginBottom:        28,
          }}
        >
          {options.map(opt => {
            const sel = isMulti ? multi.includes(opt) : singles[step] === opt;
            return (
              <button
                key={opt}
                className="cf-option"
                onClick={() => isMulti ? toggleMulti(opt) : selectSingle(opt)}
                style={{
                  padding:      '17px 14px',
                  borderRadius: 12,
                  border:       `2px solid ${sel ? '#B22222' : '#1e293b'}`,
                  background:   sel ? 'rgba(178,34,34,0.12)' : '#0a0f1e',
                  color:        sel ? '#fed7aa' : '#cbd5e1',
                  fontSize:     '0.92rem',
                  fontWeight:   sel ? 700 : 500,
                  textAlign:    'left',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  lineHeight:   1.3,
                }}
              >
                <span style={{
                  width:          18,
                  height:         18,
                  flexShrink:     0,
                  borderRadius:   isMulti ? 4 : '50%',
                  border:         `2px solid ${sel ? '#B22222' : '#334155'}`,
                  background:     sel ? '#B22222' : 'transparent',
                  display:        'inline-flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  transition:     'border-color 0.15s, background 0.15s',
                }}>
                  {sel && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4L3 6.5L7 1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        <button
          className="cf-btn"
          onClick={goNext}
          disabled={!canProceed}
          style={{
            width:         '100%',
            padding:       '16px',
            borderRadius:  12,
            border:        'none',
            background:    canProceed ? '#B22222' : '#1e293b',
            color:         canProceed ? '#fff' : '#475569',
            fontSize:      '1rem',
            fontWeight:    700,
            letterSpacing: '0.025em',
            marginBottom:  step > 0 ? 8 : 0,
          }}
        >
          {step < 3 ? 'Continue →' : '✦ Find My Perfect Car'}
        </button>

        {step > 0 && (
          <button className="cf-ghost" onClick={goBack}
            style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
            ← Back
          </button>
        )}
      </div>
    );
  };

  if (!show) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position:             'fixed',
        inset:                0,
        zIndex:               9999,
        display:              'flex',
        alignItems:           'center',
        justifyContent:       'center',
        padding:              '24px 16px',
        background:           `rgba(2, 6, 23, ${animIn ? 0.75 : 0})`,
        backdropFilter:       `blur(${animIn ? 12 : 0}px)`,
        WebkitBackdropFilter: `blur(${animIn ? 12 : 0}px)`,
        transition:           'background 350ms ease-out, backdrop-filter 350ms ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:        '100%',
          maxWidth:     680,
          maxHeight:    '90vh',
          overflowY:    'auto',
          background:   '#0f172a',
          borderRadius: 20,
          padding:      '40px 36px 36px',
          border:       '1px solid rgba(255,255,255,0.07)',
          boxShadow:    '0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(178,34,34,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
          fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color:        '#fff',
          boxSizing:    'border-box',
          position:     'relative',
          opacity:      animIn ? 1 : 0,
          transform:    animIn ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(12px)',
          transition:   'opacity 350ms ease-out, transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <button
          className="cf-close"
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#475569', fontSize: '1.1rem', padding: '4px 8px', lineHeight: 1 }}
        >
          ✕
        </button>

        {renderContent()}
      </div>
    </div>
  );
}

/* ─── ProgressBar ────────────────────────────────────────────────────────── */
function ProgressBar({ pct, stepLabel }: { pct: number; stepLabel: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#475569', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {stepLabel}
        </span>
        <span style={{ color: '#B22222', fontSize: '0.68rem', fontWeight: 700 }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height:       '100%',
          width:        `${pct}%`,
          background:   'linear-gradient(90deg, #8B1A1A, #B22222)',
          borderRadius: 2,
          transition:   'width 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}
