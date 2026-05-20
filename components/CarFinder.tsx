'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const INJECTED_CSS = `
  .cf-option {
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
  }
  .cf-option:hover {
    border-color: #3b82f6 !important;
    transform: translateY(-2px);
  }
  .cf-btn {
    cursor: pointer;
    transition: background 0.18s ease, transform 0.13s ease;
  }
  .cf-btn:not(:disabled):hover {
    background: #2563eb !important;
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
  .cf-view-btn:hover { background: #e64d00 !important; transform: translateY(-1px); }
  .cf-save-btn {
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
  }
  .cf-save-btn:hover:not(.cf-saved) { border-color: #64748b !important; color: #e2e8f0 !important; }
  .cf-saved { border-color: rgba(34,197,94,0.5) !important; color: #4ade80 !important; background: rgba(34,197,94,0.08) !important; }
  .cf-learn-btn {
    cursor: pointer;
    display: block;
    text-align: center;
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .cf-learn-btn:hover { background: #2563eb !important; transform: translateY(-1px); }

  @keyframes cf-spin {
    to { transform: rotate(360deg); }
  }
  .cf-spinner {
    width: 48px; height: 48px;
    border: 3px solid #1e293b;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: cf-spin 0.75s linear infinite;
  }

  /* Result reveal animations */
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

  .cf-carousel::-webkit-scrollbar { display: none; }
  .cf-carousel { scrollbar-width: none; -ms-overflow-style: none; }

  @media (max-width: 500px) {
    .cf-grid-3 { grid-template-columns: 1fr 1fr !important; }
  }
`;

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Rec {
  name:        string;
  tagline:     string;
  price_range: string;
  why_it_fits: string;
  match_score: number;
  fit_tags:    string[];
}

type Phase = 'quiz' | 'loading' | 'results';

/* ─── Quiz data ──────────────────────────────────────────────────────────── */
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

/* ─── Component ──────────────────────────────────────────────────────────── */
interface CarFinderProps {
  isOpen:  boolean;
  onClose: () => void;
}

export default function CarFinder({ isOpen, onClose }: CarFinderProps) {
  const router = useRouter();
  const [phase,     setPhase]     = useState<Phase>('quiz');
  const [step,      setStep]      = useState(0);
  const [singles,   setSingles]   = useState(['', '', '']);
  const [multi,     setMulti]     = useState<string[]>([]);
  const [visible,   setVisible]   = useState(true);
  const [results,   setResults]   = useState<Rec[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const [savedRecs, setSavedRecs] = useState<number[]>([]);

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
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── Transition helper (quiz step fades) ─────────────────────────────── */
  const transit = (fn: () => void) => {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 230);
  };

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const goBack = () => { if (step > 0) transit(() => setStep(s => s - 1)); };

  const goNext = () => {
    if (step < 3) {
      transit(() => setStep(s => s + 1));
    } else {
      transit(() => { setPhase('loading'); void fetchRecs(); });
    }
  };

  const reset = () =>
    transit(() => {
      setPhase('quiz');
      setStep(0);
      setSingles(['', '', '']);
      setMulti([]);
      setResults([]);
      setError(null);
      setSavedRecs([]);
    });

  /* ── Answer helpers ──────────────────────────────────────────────────── */
  const selectSingle = (val: string) =>
    setSingles(p => { const n = [...p]; n[step] = val; return n; });

  const toggleMulti = (val: string) =>
    setMulti(p => p.includes(val) ? p.filter(v => v !== val) : [...p, val]);

  const toggleSave = (i: number) =>
    setSavedRecs(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  const learnMore = (rec: Rec) => {
    const id = rec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    sessionStorage.setItem(`car:${id}`, JSON.stringify({
      name:        rec.name,
      tagline:     rec.tagline,
      price_range: rec.price_range,
      why_it_fits: rec.why_it_fits,
    }));
    onClose();
    router.push(`/car/${id}`);
  };

  const canProceed = step === 3 || singles[step] !== '';

  /* ── OpenAI fetch ────────────────────────────────────────────────────── */
  const fetchRecs = async () => {
    const apiKey    = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const mustHaves = multi.length ? multi.join(', ') : 'no specific must-haves';

    const userPrompt = `Help me find the perfect car. My preferences:
• Use case:  ${singles[0]}
• Budget:    ${singles[1]}
• Seats:     ${singles[2]}
• Must-have: ${mustHaves}

Return ONLY a valid JSON array of exactly 3 recommendations ordered best-match first. No markdown, no extra text:
[
  {
    "name":        "Year Make Model Trim",
    "tagline":     "One compelling line about this car",
    "price_range": "$16,000 – $18,500",
    "why_it_fits": "2-3 sentences on why this fits the user's needs",
    "match_score": 95,
    "fit_tags":    ["Daily Driver", "Under Budget", "Fuel Efficient", "Low Maintenance"]
  }
]
Rules: match_score 70–99 descending across results. fit_tags: 3–4 short labels (2–4 words each).`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:      'gpt-4o',
          max_tokens: 1200,
          messages: [
            { role: 'system', content: 'You are a car-buying expert. Respond only with a valid JSON array. No markdown, no extra text whatsoever.' },
            { role: 'user',   content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
      }

      const data = await res.json() as { choices: { message: { content: string } }[] };
      const raw  = data.choices[0].message.content.trim();
      const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      setResults(JSON.parse(json) as Rec[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      transit(() => setPhase('results'));
    }
  };

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const pct   = phase === 'quiz' ? Math.round(((step + 1) / 4) * 100) : 100;
  const sFade: React.CSSProperties = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 0.22s ease, transform 0.22s ease',
  };

  /* ═══════════════════════════════════════════════════════════════════════
     PHASE RENDERERS
     Results uses CSS animations (not sFade) so reveals stagger correctly.
  ═══════════════════════════════════════════════════════════════════════ */
  const renderContent = () => {

    /* ── Loading ── */
    if (phase === 'loading') return (
      <div>
        <ProgressBar pct={100} stepLabel="Analyzing…" />
        <div style={{ textAlign: 'center', padding: '52px 0' }}>
          <div className="cf-spinner" style={{ margin: '0 auto 28px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Finding your perfect match…
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Our AI is analyzing your preferences
          </p>
        </div>
      </div>
    );

    /* ── Results ── */
    if (phase === 'results') {
      if (error) return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <ProgressBar pct={100} stepLabel="Error" />
          <p style={{ color: '#f87171', marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.5 }}>
            ⚠️ {error}
          </p>
          <button
            className="cf-btn"
            onClick={reset}
            style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}
          >
            Try Again
          </button>
        </div>
      );

      const [hero, ...others] = results;

      return (
        <div>
          {/* Header label */}
          <div className="cf-result-header">
            <ProgressBar pct={100} stepLabel="Your Perfect Match" />
          </div>

          {/* ── Hero spotlight card ── */}
          {hero && (
            <div
              className="cf-hero-card"
              style={{
                position:     'relative',
                background:   'linear-gradient(135deg, #0d1f3c 0%, #0f172a 55%, #080e1e 100%)',
                borderRadius: 16,
                padding:      '26px 24px 22px',
                border:       '1px solid rgba(255,255,255,0.09)',
                boxShadow:    '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
                marginBottom: 22,
                overflow:     'hidden',
              }}
            >
              {/* Ambient glow */}
              <div style={{
                position:      'absolute',
                top:           -80,
                right:         -80,
                width:         240,
                height:        240,
                borderRadius:  '50%',
                background:    'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position:      'absolute',
                bottom:        -40,
                left:          -40,
                width:         160,
                height:        160,
                borderRadius:  '50%',
                background:    'radial-gradient(circle, rgba(255,85,0,0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Match badge + Save */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, position: 'relative', zIndex: 1 }}>
                <span style={{
                  display:       'inline-flex',
                  alignItems:    'center',
                  gap:           5,
                  padding:       '5px 11px',
                  borderRadius:  20,
                  background:    'rgba(34,197,94,0.12)',
                  border:        '1px solid rgba(34,197,94,0.28)',
                  color:         '#4ade80',
                  fontSize:      '0.72rem',
                  fontWeight:    800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  {hero.match_score ?? 95}% Match
                </span>

                <button
                  className={`cf-save-btn${savedRecs.includes(0) ? ' cf-saved' : ''}`}
                  onClick={() => toggleSave(0)}
                  style={{
                    display:      'inline-flex',
                    alignItems:   'center',
                    gap:          5,
                    padding:      '5px 12px',
                    borderRadius: 20,
                    background:   'transparent',
                    border:       '1px solid #1e293b',
                    color:        '#64748b',
                    fontSize:     '0.72rem',
                    fontWeight:   700,
                  }}
                >
                  {savedRecs.includes(0) ? '✓ Saved' : '♡ Save'}
                </button>
              </div>

              {/* Name */}
              <h2 style={{
                fontSize:      '1.65rem',
                fontWeight:    900,
                lineHeight:    1.1,
                margin:        '0 0 5px',
                letterSpacing: '-0.025em',
                position:      'relative',
                zIndex:        1,
              }}>
                {hero.name}
              </h2>

              {/* Tagline */}
              <p style={{ color: '#60a5fa', fontStyle: 'italic', fontSize: '0.88rem', margin: '0 0 12px', position: 'relative', zIndex: 1 }}>
                {hero.tagline}
              </p>

              {/* Price */}
              <p style={{
                fontSize:      '1.3rem',
                fontWeight:    800,
                color:         '#FF5500',
                margin:        '0 0 20px',
                letterSpacing: '-0.01em',
                position:      'relative',
                zIndex:        1,
              }}>
                {hero.price_range}
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16, position: 'relative', zIndex: 1 }} />

              {/* Fit tags — 2-column grid */}
              {(hero.fit_tags?.length ?? 0) > 0 && (
                <div style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap:                 '8px 20px',
                  marginBottom:        18,
                  position:            'relative',
                  zIndex:              1,
                }}>
                  {hero.fit_tags.map((tag, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width:          16,
                        height:         16,
                        borderRadius:   '50%',
                        background:     'rgba(34,197,94,0.12)',
                        border:         '1px solid rgba(34,197,94,0.3)',
                        display:        'inline-flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                        fontSize:       '0.5rem',
                        color:          '#4ade80',
                      }}>✓</span>
                      <span style={{ fontSize: '0.83rem', color: '#cbd5e1', fontWeight: 500 }}>{tag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Why it fits */}
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.7, margin: '0 0 22px', position: 'relative', zIndex: 1 }}>
                {hero.why_it_fits}
              </p>

              {/* CTA */}
              <button
                className="cf-learn-btn"
                onClick={() => learnMore(hero)}
                style={{
                  width:         '100%',
                  padding:       '14px 20px',
                  borderRadius:  10,
                  border:        'none',
                  background:    '#3b82f6',
                  color:         '#fff',
                  fontSize:      '0.9rem',
                  fontWeight:    800,
                  letterSpacing: '0.04em',
                  position:      'relative',
                  zIndex:        1,
                }}
              >
                Learn More →
              </button>
            </div>
          )}

          {/* ── Other matches carousel ── */}
          {others.length > 0 && (
            <>
              <p
                className="cf-others-label"
                style={{
                  fontSize:      '0.62rem',
                  fontWeight:    800,
                  color:         '#475569',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom:  10,
                }}
              >
                Other Matches
              </p>

              <div
                className="cf-carousel"
                style={{
                  display:        'flex',
                  overflowX:      'auto',
                  gap:            10,
                  paddingBottom:  6,
                  marginBottom:   22,
                  scrollSnapType: 'x mandatory',
                }}
              >
                {others.map((rec, i) => {
                  const idx     = i + 1;
                  const isSaved = savedRecs.includes(idx);
                  return (
                    <div
                      key={i}
                      className="cf-carousel-card"
                      style={{
                        flexShrink:      0,
                        width:           210,
                        background:      '#111827',
                        borderRadius:    12,
                        padding:         '16px',
                        border:          '1px solid rgba(255,255,255,0.06)',
                        scrollSnapAlign: 'start',
                        display:         'flex',
                        flexDirection:   'column',
                        gap:             0,
                      }}
                    >
                      {/* Score badge */}
                      <span style={{
                        display:      'inline-block',
                        padding:      '3px 8px',
                        borderRadius: 20,
                        background:   'rgba(59,130,246,0.1)',
                        border:       '1px solid rgba(59,130,246,0.22)',
                        color:        '#60a5fa',
                        fontSize:     '0.64rem',
                        fontWeight:   800,
                        marginBottom: 10,
                        letterSpacing: '0.04em',
                        alignSelf:    'flex-start',
                      }}>
                        {rec.match_score ?? (88 - i * 7)}% Match
                      </span>

                      {/* Name */}
                      <p style={{ fontSize: '0.94rem', fontWeight: 800, lineHeight: 1.2, margin: '0 0 4px', color: '#f1f5f9' }}>
                        {rec.name}
                      </p>

                      {/* Tagline */}
                      <p style={{ fontSize: '0.73rem', color: '#60a5fa', fontStyle: 'italic', margin: '0 0 8px', lineHeight: 1.4 }}>
                        {rec.tagline}
                      </p>

                      {/* Price */}
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FF5500', margin: '0 0 10px' }}>
                        {rec.price_range}
                      </p>

                      {/* Compact fit tags */}
                      {(rec.fit_tags?.length ?? 0) > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                          {rec.fit_tags.slice(0, 2).map((tag, j) => (
                            <span key={j} style={{
                              padding:      '2px 7px',
                              borderRadius: 4,
                              background:   'rgba(255,255,255,0.04)',
                              border:       '1px solid rgba(255,255,255,0.07)',
                              color:        '#94a3b8',
                              fontSize:     '0.64rem',
                              fontWeight:   600,
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Save + Learn More */}
                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          className="cf-learn-btn"
                          onClick={() => learnMore(rec)}
                          style={{
                            width:         '100%',
                            padding:       '8px',
                            borderRadius:  7,
                            border:        'none',
                            background:    '#3b82f6',
                            color:         '#fff',
                            fontSize:      '0.72rem',
                            fontWeight:    700,
                          }}
                        >
                          Learn More →
                        </button>
                        <button
                          className={`cf-save-btn${isSaved ? ' cf-saved' : ''}`}
                          onClick={() => toggleSave(idx)}
                          style={{
                            width:        '100%',
                            padding:      '6px',
                            borderRadius: 7,
                            background:   'transparent',
                            border:       '1px solid rgba(255,255,255,0.07)',
                            color:        '#64748b',
                            fontSize:     '0.68rem',
                            fontWeight:   700,
                          }}
                        >
                          {isSaved ? '✓ Saved' : '♡ Save'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Start over */}
          <button
            className="cf-ghost"
            onClick={reset}
            style={{ width: '100%', padding: '11px', border: '1px solid #1e293b', borderRadius: 10, background: 'transparent', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}
          >
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
                  border:       `2px solid ${sel ? '#3b82f6' : '#1e293b'}`,
                  background:   sel ? 'rgba(59,130,246,0.13)' : '#0a0f1e',
                  color:        sel ? '#bfdbfe' : '#cbd5e1',
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
                  border:         `2px solid ${sel ? '#3b82f6' : '#334155'}`,
                  background:     sel ? '#3b82f6' : 'transparent',
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
            background:    canProceed ? '#3b82f6' : '#1e293b',
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
          <button
            className="cf-ghost"
            onClick={goBack}
            style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}
          >
            ← Back
          </button>
        )}
      </div>
    );
  };

  if (!show) return null;

  return (
    /* Backdrop */
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
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:        '100%',
          maxWidth:     736,
          maxHeight:    '90vh',
          overflowY:    'auto',
          background:   '#0f172a',
          borderRadius: 20,
          padding:      '40px 36px 36px',
          border:       '1px solid rgba(255,255,255,0.07)',
          boxShadow:    '0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
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
        <span style={{ color: '#3b82f6', fontSize: '0.68rem', fontWeight: 700 }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height:       '100%',
          width:        `${pct}%`,
          background:   'linear-gradient(90deg, #1d4ed8, #3b82f6)',
          borderRadius: 2,
          transition:   'width 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}
