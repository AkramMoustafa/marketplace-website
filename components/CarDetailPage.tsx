'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface CarRec {
  name: string;
  tagline: string;
  price_range: string;
  why_it_fits: string;
}

const GALLERY_IMGS = [
  'https://placehold.co/800x500?text=Car+Photo',
  'https://placehold.co/800x500?text=Interior+View',
  'https://placehold.co/800x500?text=Side+Profile',
  'https://placehold.co/800x500?text=Rear+View',
];

const SPECS: { label: string; value: string }[] = [
  { label: 'Engine',       value: '2.5L 4-Cylinder'         },
  { label: 'Transmission', value: '8-Speed Automatic'       },
  { label: 'Drive Type',   value: 'Front-Wheel Drive'       },
  { label: 'Fuel Economy', value: '28 City / 35 Hwy MPG'    },
  { label: 'Color',        value: 'Midnight Black'           },
  { label: 'Mileage',      value: '34,200 miles'             },
];

const FEATURES = [
  'Bluetooth Connectivity',
  'Backup Camera',
  'Apple CarPlay / Android Auto',
  'Lane Departure Warning',
  'Heated Front Seats',
  'Sunroof / Moonroof',
  'Keyless Entry & Push-Button Start',
  'Adaptive Cruise Control',
  'USB-C Charging Ports',
  'Dual-Zone Climate Control',
  'LED Headlights',
  'Blind-Spot Monitoring',
];

const SIMILAR = [
  { name: '2022 Toyota Camry SE',    price: '$24,500', img: 'https://placehold.co/400x260?text=Similar+Vehicle' },
  { name: '2023 Honda Accord Sport', price: '$27,800', img: 'https://placehold.co/400x260?text=Similar+Vehicle' },
  { name: '2021 Nissan Altima SR',   price: '$21,900', img: 'https://placehold.co/400x260?text=Similar+Vehicle' },
];

const INJECTED_CSS = `
  .cdp-thumb {
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 6px;
    overflow: hidden;
    opacity: 0.6;
    transition: opacity 0.15s, border-color 0.15s;
    background: none;
    padding: 0;
  }
  .cdp-thumb:hover { opacity: 0.85; }
  .cdp-thumb.cdp-thumb-active { opacity: 1; border-color: #3b82f6; }

  .cdp-btn-primary {
    cursor: pointer;
    transition: background 0.15s, transform 0.12s;
  }
  .cdp-btn-primary:hover { background: #2563eb !important; transform: translateY(-1px); }

  .cdp-btn-secondary {
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.12s;
  }
  .cdp-btn-secondary:hover {
    background: rgba(59,130,246,0.18) !important;
    border-color: #60a5fa !important;
    transform: translateY(-1px);
  }

  .cdp-spec-card { transition: border-color 0.15s; }
  .cdp-spec-card:hover { border-color: rgba(59,130,246,0.4) !important; }

  .cdp-similar-card { transition: border-color 0.15s, transform 0.18s; }
  .cdp-similar-card:hover { border-color: rgba(59,130,246,0.4) !important; transform: translateY(-4px); }

  .cdp-similar-btn {
    cursor: pointer;
    transition: background 0.15s;
  }
  .cdp-similar-btn:hover { background: #2563eb !important; }

  @keyframes cdp-spin {
    to { transform: rotate(360deg); }
  }
  .cdp-spinner {
    width: 30px; height: 30px;
    border: 2px solid rgba(59,130,246,0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: cdp-spin 0.7s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  @keyframes cdp-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cdp-desc-text { animation: cdp-fade-in 0.35s ease forwards; }

  /* Responsive breakpoints */
  @media (max-width: 900px) {
    .cdp-spec-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 768px) {
    .cdp-hero-layout  { flex-direction: column !important; }
    .cdp-gallery-col  { width: 100% !important; }
    .cdp-detail-col   { width: 100% !important; }
    .cdp-feat-grid    { grid-template-columns: 1fr !important; }
    .cdp-similar-grid { grid-template-columns: 1fr !important; }
    .cdp-cta-row      { flex-direction: column !important; }
  }
  @media (max-width: 480px) {
    .cdp-spec-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ─────────────────────────────────────────────────────────────── */

export default function CarDetailPage({ car }: { car: CarRec | null }) {
  const [activeImg,   setActiveImg]   = useState(0);
  const [description, setDescription] = useState<string[] | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [descError,   setDescError]   = useState<string | null>(null);

  /* Inject scoped CSS once */
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = INJECTED_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  /* Fetch AI description whenever car changes */
  useEffect(() => {
    if (!car) return;
    setDescLoading(true);
    setDescription(null);
    setDescError(null);

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const prompt =
      `Write a 3-paragraph sales description for a ${car.name} at a premium car dealership.\n` +
      `Vehicle tagline: "${car.tagline}"\n` +
      `Key selling points: ${car.why_it_fits}\n` +
      `Price range: ${car.price_range}\n\n` +
      `Each paragraph should be 2-3 sentences. Tone: enthusiastic and professional. ` +
      `Focus on performance, comfort, technology, value, and lifestyle fit. ` +
      `Plain text only — no bullet points, no headers. Separate paragraphs with a blank line.`;

    fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:      'gpt-4o',
        max_tokens: 600,
        messages: [
          {
            role:    'system',
            content: 'You are a professional automotive copywriter. Write compelling, accurate, enthusiastic sales descriptions.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })
      .then(r => r.json() as Promise<{
        choices?: { message: { content: string } }[];
        error?:   { message: string };
      }>)
      .then(data => {
        if (data.error) throw new Error(data.error.message);
        const text = data.choices?.[0]?.message?.content?.trim() ?? '';
        setDescription(text.split(/\n\n+/).filter(Boolean));
      })
      .catch((err: Error) => {
        setDescError(err.message || 'Failed to generate description.');
      })
      .finally(() => setDescLoading(false));
  }, [car]);

  /* ── Empty state ─────────────────────────────────────────────── */
  if (!car) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0a0f1e',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            16,
        fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color:          '#e2e8f0',
      }}>
        <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>No vehicle data found.</p>
        <Link href="/" style={{ color: '#3b82f6', fontSize: '0.9rem', textDecoration: 'none' }}>
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight:  '100vh',
      background: '#0a0f1e',
      color:      '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position:             'sticky',
        top:                  0,
        zIndex:               100,
        background:           'rgba(10,15,30,0.92)',
        backdropFilter:       'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom:         '1px solid rgba(255,255,255,0.06)',
        padding:              '14px 28px',
        display:              'flex',
        alignItems:           'center',
        justifyContent:       'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '4px' }}>NOVA</span>
          <span style={{ color: '#FF5500', fontSize: '0.58rem', fontWeight: 800, letterSpacing: '5px', textTransform: 'uppercase' }}>
            MOTORS
          </span>
        </Link>
        <Link href="/" style={{
          color:          '#64748b',
          fontSize:       '0.85rem',
          textDecoration: 'none',
          display:        'flex',
          alignItems:     'center',
          gap:            4,
          transition:     'color 0.15s',
        }}>
          ← Back to Inventory
        </Link>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 24px 0' }}>

        {/* ══════════════════════════════════════════════════════════
            HERO: Gallery (left) + Details (right)
        ══════════════════════════════════════════════════════════ */}
        <div className="cdp-hero-layout" style={{ display: 'flex', gap: 40, alignItems: 'flex-start', marginBottom: 60 }}>

          {/* LEFT ── Gallery */}
          <div className="cdp-gallery-col" style={{ width: '55%', flexShrink: 0 }}>

            {/* Main image */}
            <div style={{
              borderRadius: 14,
              overflow:     'hidden',
              marginBottom: 10,
              background:   '#111827',
              border:       '1px solid rgba(255,255,255,0.06)',
              lineHeight:   0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GALLERY_IMGS[activeImg]}
                alt={`${car.name} — view ${activeImg + 1}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Thumbnail strip */}
            <div style={{ display: 'flex', gap: 8 }}>
              {GALLERY_IMGS.map((src, i) => (
                <button
                  key={i}
                  className={`cdp-thumb${activeImg === i ? ' cdp-thumb-active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Photo ${i + 1}`}
                  style={{ flex: 1 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{ width: '100%', height: 62, objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT ── Details */}
          <div className="cdp-detail-col" style={{ flex: 1, minWidth: 0 }}>

            {/* AI badge */}
            <span style={{
              display:       'inline-block',
              padding:       '4px 12px',
              borderRadius:  20,
              background:    'rgba(59,130,246,0.12)',
              border:        '1px solid rgba(59,130,246,0.25)',
              color:         '#60a5fa',
              fontSize:      '0.7rem',
              fontWeight:    700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom:  12,
            }}>
              AI Recommended
            </span>

            {/* Car name */}
            <h1 style={{
              fontSize:      'clamp(1.5rem, 3vw, 2.1rem)',
              fontWeight:    900,
              lineHeight:    1.1,
              letterSpacing: '-0.025em',
              color:         '#f1f5f9',
              margin:        '0 0 6px',
            }}>
              {car.name}
            </h1>

            {/* Tagline */}
            <p style={{
              color:        '#94a3b8',
              fontSize:     '0.9rem',
              fontStyle:    'italic',
              lineHeight:   1.55,
              margin:       '0 0 22px',
            }}>
              {car.tagline}
            </p>

            {/* Price badge */}
            <div style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          10,
              padding:      '10px 18px',
              borderRadius: 10,
              background:   'rgba(255,85,0,0.08)',
              border:       '1px solid rgba(255,85,0,0.28)',
              marginBottom: 22,
            }}>
              <span style={{
                fontSize:      '0.65rem',
                fontWeight:    700,
                color:         '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Price Range
              </span>
              <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{
                fontSize:      '1.5rem',
                fontWeight:    900,
                color:         '#FF5500',
                letterSpacing: '-0.02em',
                lineHeight:    1,
              }}>
                {car.price_range}
              </span>
            </div>

            {/* Why it fits */}
            <p style={{
              color:      '#64748b',
              fontSize:   '0.875rem',
              lineHeight: 1.75,
              margin:     '0 0 28px',
            }}>
              {car.why_it_fits}
            </p>

            {/* CTA buttons */}
            <div className="cdp-cta-row" style={{ display: 'flex', gap: 12 }}>
              <button
                className="cdp-btn-primary"
                style={{
                  flex:          1,
                  padding:       '14px 18px',
                  borderRadius:  10,
                  border:        'none',
                  background:    '#3b82f6',
                  color:         '#fff',
                  fontSize:      '0.88rem',
                  fontWeight:    700,
                  letterSpacing: '0.02em',
                }}
              >
                Request More Info
              </button>
              <button
                className="cdp-btn-secondary"
                style={{
                  flex:          1,
                  padding:       '14px 18px',
                  borderRadius:  10,
                  border:        '1px solid rgba(59,130,246,0.3)',
                  background:    'rgba(59,130,246,0.06)',
                  color:         '#60a5fa',
                  fontSize:      '0.88rem',
                  fontWeight:    700,
                  letterSpacing: '0.02em',
                }}
              >
                Schedule Test Drive
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SPECS GRID
        ══════════════════════════════════════════════════════════ */}
        <Section title="Vehicle Specs">
          <div className="cdp-spec-grid" style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 12,
          }}>
            {SPECS.map(spec => (
              <div
                key={spec.label}
                className="cdp-spec-card"
                style={{
                  padding:      '18px 20px',
                  borderRadius: 10,
                  background:   '#111827',
                  border:       '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p style={{
                  fontSize:      '0.62rem',
                  fontWeight:    700,
                  color:         '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  margin:        '0 0 7px',
                }}>
                  {spec.label}
                </p>
                <p style={{ fontSize: '0.98rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                  {spec.value}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            AI DESCRIPTION
        ══════════════════════════════════════════════════════════ */}
        <Section title="About This Vehicle">
          <div style={{
            padding:    '28px 32px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0d1f3c 0%, #0f172a 100%)',
            border:     '1px solid rgba(255,255,255,0.06)',
            minHeight:  100,
          }}>
            {descLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="cdp-spinner" />
                <span style={{ color: '#475569', fontSize: '0.875rem' }}>Generating description…</span>
              </div>
            )}

            {descError && !descLoading && (
              <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>
                ⚠️ {descError}
              </p>
            )}

            {description && !descLoading && (
              <div className="cdp-desc-text" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {description.map((para, i) => (
                  <p key={i} style={{
                    fontSize:   '0.95rem',
                    color:      i === 0 ? '#cbd5e1' : '#94a3b8',
                    lineHeight: 1.85,
                    margin:     0,
                  }}>
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            FEATURES CHECKLIST
        ══════════════════════════════════════════════════════════ */}
        <Section title="Features & Equipment">
          <div
            className="cdp-feat-grid"
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap:                 '12px 40px',
            }}
          >
            {FEATURES.map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width:          22,
                  height:         22,
                  borderRadius:   '50%',
                  background:     'rgba(59,130,246,0.1)',
                  border:         '1px solid rgba(59,130,246,0.28)',
                  display:        'inline-flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  flexShrink:     0,
                  fontSize:       '0.58rem',
                  color:          '#3b82f6',
                  fontWeight:     900,
                }}>
                  ✓
                </span>
                <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════
            SIMILAR VEHICLES
        ══════════════════════════════════════════════════════════ */}
        <Section title="Similar Vehicles">
          <div
            className="cdp-similar-grid"
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 18,
            }}
          >
            {SIMILAR.map(v => (
              <div
                key={v.name}
                className="cdp-similar-card"
                style={{
                  borderRadius: 12,
                  overflow:     'hidden',
                  background:   '#111827',
                  border:       '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.img}
                  alt={v.name}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div style={{ padding: '16px' }}>
                  <p style={{
                    fontSize:  '0.9rem',
                    fontWeight: 700,
                    color:      '#f1f5f9',
                    margin:     '0 0 4px',
                    lineHeight: 1.3,
                  }}>
                    {v.name}
                  </p>
                  <p style={{
                    fontSize:   '1.15rem',
                    fontWeight: 900,
                    color:      '#FF5500',
                    margin:     '0 0 14px',
                  }}>
                    {v.price}
                  </p>
                  <button
                    className="cdp-similar-btn"
                    style={{
                      width:         '100%',
                      padding:       '10px',
                      borderRadius:  7,
                      border:        'none',
                      background:    '#3b82f6',
                      color:         '#fff',
                      fontSize:      '0.8rem',
                      fontWeight:    700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{
        marginTop:   80,
        background:  '#020817',
        borderTop:   '1px solid rgba(255,255,255,0.05)',
        padding:     '44px 24px',
        textAlign:   'center',
      }}>
        <p style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '5px', color: '#fff', margin: '0 0 4px' }}>
          NOVA
        </p>
        <p style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '7px', color: '#FF5500', textTransform: 'uppercase', margin: 0 }}>
          MOTORS
        </p>
      </footer>

    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          14,
        marginBottom: 22,
      }}>
        <h2 style={{
          fontSize:      '1.25rem',
          fontWeight:    800,
          color:         '#f1f5f9',
          letterSpacing: '-0.015em',
          margin:        0,
          whiteSpace:    'nowrap',
        }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      {children}
    </section>
  );
}
