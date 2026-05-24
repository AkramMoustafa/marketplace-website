'use client';

import { useState } from 'react';
import styles from './VehicleDetail.module.css';
import type {
  Vehicle,
  VehicleImage,
  DescriptionSection,
  SimilarVehicle,
} from '@/types/vehicle';

/* ─── Shared icons ──────────────────────────────────────────────── */
const PhoneIcon = (): JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 17 17" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h2.5L7 7 5.25 8.06A9 9 0 0 0 8.94 11.75L10 10l4 1.5V14A1 1 0 0 1 13 15C6.37 15 2 10.63 2 4a1 1 0 0 1 1-1z"/>
  </svg>
);

const PinIcon = (): JSX.Element => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const ChatIcon = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v3l4-3h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
  </svg>
);

/* ─── Gallery ───────────────────────────────────────────────────── */
interface GalleryProps {
  images: VehicleImage[];
  vehicleTitle: string;
}

function Gallery({ images: imagesProp, vehicleTitle }: GalleryProps) {
  const images = imagesProp ?? [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const goNext = (): void => {
    if (!images.length) return;
    setCurrentIndex((i) => (i + 1) % images.length);
  };

  const goPrev = (): void => {
    if (!images.length) return;
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  if (!images.length) {
    return (
      <div className={styles.gallery}>
        <div className={styles.galleryMain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#888', fontSize: 14 }}>No photos available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <img src={images[currentIndex].full} alt={`${vehicleTitle} – photo ${currentIndex + 1}`} />
        <div className={styles.galleryCounter}>📷 {currentIndex + 1} / {images.length}</div>
        <button className={`${styles.galleryArrow} ${styles.galleryArrowLeft}`} onClick={goPrev} aria-label="Previous photo">‹</button>
        <button className={`${styles.galleryArrow} ${styles.galleryArrowRight}`} onClick={goNext} aria-label="Next photo">›</button>
      </div>
      <div className={styles.galleryThumbs}>
        {images.map((img, i) => (
          <img
            key={img.thumb}
            src={img.thumb}
            alt={img.alt}
            className={`${styles.galleryThumb} ${i === currentIndex ? styles.galleryThumbActive : ''}`}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Description ───────────────────────────────────────────────── */
interface VehicleDescriptionProps {
  sections: DescriptionSection[];
}

function VehicleDescription({ sections }: VehicleDescriptionProps) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>About This Vehicle</h2>
      <div className={styles.desc}>
        {sections.map((section, i) => {
          const HeadingTag = section.level;
          return (
            <div key={i}>
              <HeadingTag>{section.heading}</HeadingTag>
              {section.paragraphs.map((html, j) => (
                <p key={j} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Sidebar ───────────────────────────────────────────────────── */
const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-7-4.35-9-8.5C1.2 8.3 3.4 5 7 5c2 0 3.2 1 5 3 1.8-2 3-3 5-3 3.6 0 5.8 3.3 4 7.5C19 16.65 12 21 12 21z"/>
  </svg>
);

const ApprovalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9"/>
    <path d="M8 12l2.5 2.5L16 9"/>
  </svg>
);

const CarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 16h14l-1-5H6l-1 5z"/>
    <circle cx="7" cy="17" r="1.5"/>
    <circle cx="17" cy="17" r="1.5"/>
    <path d="M8 11l2-4h4l2 4"/>
  </svg>
);

interface SidebarProps {
  vehicle: Vehicle;
}

function Sidebar({ vehicle }: SidebarProps) {
  const formattedPrice = vehicle.price != null
    ? `$${vehicle.price.toLocaleString()}`
    : 'Call for Price';

  return (
    <aside className={styles.detailSidebar}>
      <div className="bg-white rounded-[24px] overflow-hidden border border-[#d9e0e6] shadow-[0_14px_40px_rgba(0,0,0,.08)]">

        {/* VEHICLE TITLE */}
        <div className="px-8 pt-8 pb-7 border-b border-[#edf0f3] text-center">
          <p className="text-[20px] font-black uppercase tracking-tight leading-snug">
     
          </p>
          <p className="mt-1 text-sm text-[#555] uppercase font-medium">{vehicle.trim ?? ''}</p>
          <p className="mt-1 text-sm text-[#888]">{(vehicle.odometer ?? 0).toLocaleString()} miles</p>
        </div>

        {/* PRICE */}
        <div className="px-8 py-6 border-b border-[#edf0f3] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#9aa4ae] leading-tight">Advertised</p>
            <p className="text-[11px] font-bold uppercase text-[#9aa4ae] leading-tight">Price</p>
          </div>
          <p className="text-[28px] font-black tracking-tight">{formattedPrice}</p>
        </div>

        {/* CTA BUTTONS */}
        <div className="p-6 space-y-3">
          <button className="w-full bg-black text-white rounded-xl py-5 px-6 font-black uppercase text-[15px] flex items-center justify-center gap-5">
            <div className="w-[44px] h-[44px] rounded-full border-2 border-white flex items-center justify-center">
              <HeartIcon />
            </div>
            I WANT THIS CAR
          </button>

          <button className="w-full border-2 border-black rounded-xl py-5 px-6 flex items-center justify-center gap-5 font-black uppercase text-[15px]">
            <div className="w-[44px] h-[44px] rounded-full border-2 border-black flex items-center justify-center">
              <ApprovalIcon />
            </div>
            GET ME PRE-APPROVED
          </button>

          <button className="w-full border-2 border-black rounded-xl py-5 px-6 flex items-center justify-center gap-5 font-black uppercase text-[15px]">
            <div className="w-[44px] h-[44px] rounded-full border-2 border-black flex items-center justify-center">
              <CarIcon />
            </div>
            CHECK AVAILABILITY
          </button>
        </div>

        {/* ESTIMATE PAYMENT */}
        <div className="mx-6 mb-6 p-6 rounded-2xl bg-[#2d678f] text-white flex items-center justify-between">
          <div>
            <p className="text-[20px] font-bold">Estimate payment</p>
            <p className="mt-1 text-sm opacity-90">No impact to your credit score</p>
          </div>
          <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4 C8 4 4 9 4 14 C4 20 9 24 14 24" stroke="#e32" strokeWidth="3" strokeLinecap="round"/>
              <path d="M14 4 C20 4 24 9 24 14" stroke="#e32" strokeWidth="3" strokeLinecap="round"/>
              <path d="M18 10 L24 14 L18 18" fill="#e32"/>
            </svg>
          </div>
        </div>

        {/* CALL OR TEXT */}
        <div className="border-t border-[#edf0f3] p-8 text-center">
          <p className="text-[20px] font-semibold">Call or Text</p>
          <a href="tel:3132517447" className="block mt-4 text-[32px] font-black">
            (313) 251-7447
          </a>
        </div>

      </div>
    </aside>
  );
}

/* ─── Similar Vehicles ──────────────────────────────────────────── */
interface SimilarVehiclesProps {
  vehicles: SimilarVehicle[];
}

function SimilarVehicles({ vehicles }: SimilarVehiclesProps) {
  return (
    <section className={styles.similar}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Similar Vehicles You May Like</h2>
        <div className={styles.similarGrid}>
          {vehicles.map((v) => {
            const priceDisplay = v.price === null ? 'Call for Price' : `$${v.price.toLocaleString()}`;
            const priceClass = v.price === null
              ? `${styles.carCardPrice} ${styles.call}`
              : styles.carCardPrice;
            return (
              <div key={v.id} className={styles.carCard}>
                <img className={styles.carCardImg} src={v.image} alt={v.imageAlt} />
                <div className={styles.carCardBody}>
                  <p className={styles.carCardYear}>{v.year}</p>
                  <p className={styles.carCardTitle}>{v.make.toUpperCase()} {v.model.toUpperCase()}</p>
                  <p className={styles.carCardTrim}>{v.trim}</p>
                  <div className={styles.carCardMeta}>
                    <span className={styles.carCardStock}>Stock #{v.stockNumber}</span>
                    <span className={priceClass}>{priceDisplay}</span>
                  </div>
                </div>
                <a href="#" className={styles.carCardBtn}>View Details</a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Constants ─────────────────────────────────────────────────── */
const NAV_LINKS: { label: string; active?: true }[] = [
  { label: 'Home' },
  { label: 'Inventory', active: true },
  { label: 'Financing' },
  { label: 'Sell / Trade' },
  { label: 'Service' },
  { label: 'Contact Us' },
  { label: 'Reviews' },
];

const FOOTER_COLUMNS: { heading: string; links: string[] }[] = [
  {
    heading: 'Shop by Body Style',
    links: ['Sedans', 'SUVs & Crossovers', 'Trucks', 'Wagons', 'Coupes', 'Minivans'],
  },
  {
    heading: 'Popular Used Makes',
    links: ['Chevrolet', 'Ford', 'GMC', 'Honda', 'Kia', 'Toyota'],
  },
  {
    heading: 'Specials & Finance',
    links: ['Apply for Financing', 'Current Specials', 'Sell / Trade-In', 'Service Department', 'Contact Us', 'Customer Reviews'],
  },
];

/* ─── VehicleDetail (page root) ─────────────────────────────────── */
interface VehicleDetailProps {
  vehicle: Vehicle;
}

export default function VehicleDetail({ vehicle }: VehicleDetailProps) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const leftSpecs: { label: string; value: string; mono?: boolean }[] = [
    { label: 'VIN',            value: vehicle.vin            ?? '—', mono: true },
    { label: 'Stock #',        value: vehicle.stockNumber    ? `#${vehicle.stockNumber}` : '—' },
    { label: 'Odometer',       value: `${(vehicle.odometer ?? 0).toLocaleString()} mi`         },
    { label: 'Exterior Color', value: vehicle.color          ?? '—'                            },
    { label: 'Body Type',      value: vehicle.type           ?? '—'                            },
  ];

  const rightSpecs: { label: string; value: string }[] = [
    { label: 'Transmission', value: vehicle.transmission ?? '—'                                                              },
    { label: 'Engine',       value: vehicle.engine       ?? '—'                                                              },
    { label: 'Drive',        value: vehicle.drive        ?? '—'                                                              },
    { label: 'Fuel',         value: vehicle.fuel         ?? '—'                                                              },
    { label: 'Fuel Economy', value: vehicle.fuelEconomy
        ? `${vehicle.fuelEconomy.city} / ${vehicle.fuelEconomy.highway} MPG`
        : '—'
    },
  ];

  return (
    <div className={styles.root}>

{/* ── HEADER ────────────────────────────────────────────────── */}
<header>

  {/* ── TRUST BAR ── */}
  <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e' }}>
    <div
      className="flex items-center justify-between px-5 h-10"
      style={{ maxWidth: 1200, margin: '0 auto' }}
    >
      {/* Left — open status + trust signals */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-gray-400">Open Today · 9AM – 7PM</span>
        </div>
        <span className="hidden sm:block w-px h-3 bg-gray-800" />
        <span className="hidden sm:block text-[11px] text-gray-600">
          No-Pressure Sales &nbsp;·&nbsp; Transparent Pricing &nbsp;·&nbsp; Financing Available
        </span>
      </div>

      {/* Right — location + phone */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-600">
          <PinIcon />
          Detroit, MI 48234
        </div>
        <span className="hidden sm:block w-px h-3 bg-gray-800" />
        <a
          href="tel:3132517447"
          className="flex items-center gap-1.5 text-[11px] font-bold transition-colors"
          style={{ color: '#f97316' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fb923c')}
          onMouseLeave={e => (e.currentTarget.style.color = '#f97316')}
        >
          <PhoneIcon />
          (313) 251-7447
        </a>
      </div>
    </div>
  </div>

  {/* ── MAIN HEADER ── */}
  <div className={styles.headerMain}>

    {/* Logo */}
    <div className={styles.headerLogo}>
      <img src="/logo.png" alt="Empire Auto" />
    </div>

    {/* Search */}
    <div className={styles.headerRight}>
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search by year, make, model, VIN, stock..."
        />
        <button type="button">
          🔍
        </button>
      </div>
    </div>

  </div>

  {/* ── NAVIGATION ── */}
  <nav className={styles.navBar}>
    <div className={styles.navLinks}>
      {NAV_LINKS.map(({ label, active }) => (
        <a
          key={label}
          href="#"
          className={active ? styles.active : ""}
        >
          {label}
        </a>
      ))}
    </div>
  </nav>

</header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div style={{ background: '#eef3f7', paddingTop: '40px', paddingBottom: '60px' }}>
        <div className={styles.container}>

          <div className={styles.breadcrumb}>
            <a href="#">HOME</a>
            <span>/</span>
            <a href="#">USED CARS</a>
            <span>/</span>
            <span>{vehicle.title.toUpperCase()}</span>
          </div>

          <div className={styles.vehicleHero}>
          </div>

          <div className={styles.detailLayout}>
            <div className={styles.detailMain}>

              <Gallery images={vehicle.images ?? []} vehicleTitle={vehicle.title} />

              <div className="mt-4 rounded-[20px] bg-white p-7" style={{ boxShadow: '0 12px 40px rgba(0,0,0,.06)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[3px] mb-4" style={{ color: '#f97316' }}>
                  About This Vehicle
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#555', maxWidth: '60ch' }}>
                  Experience comfort, reliability and everyday practicality with this {vehicle.title}.
                  Clean styling, practical features and strong performance make it an excellent choice
                  for daily driving.
                </p>
              </div>

              <div className="mt-12">
                <div className="space-y-10">

                  <section>
                    <h2 className="text-[22px] font-medium uppercase tracking-wide mb-5 text-[#2f2f2f]">Basics</h2>
                    <div className="bg-white overflow-hidden rounded-[16px]" style={{ border: '1px solid #d7dde3', boxShadow: '0 6px 20px rgba(0,0,0,.04)' }}>
                      {leftSpecs.map(({ label, value }, idx) => (
                        <div key={label} className="grid md:grid-cols-[220px_1fr] grid-cols-1 px-5 py-4 items-center"
                          style={{ borderBottom: idx < leftSpecs.length - 1 ? '1px solid #e7e7e7' : 'none' }}>
                          <span className="font-semibold text-[15px] text-black">{label}:</span>
                          <span className="font-bold text-[15px] text-black">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-[22px] font-medium uppercase tracking-wide mb-5 text-[#2f2f2f]">Performance</h2>
                    <div className="bg-white border border-[#d8d8d8] overflow-hidden">
                      {rightSpecs.map(({ label, value }, idx) => (
                        <div key={label} className="grid md:grid-cols-[220px_1fr] grid-cols-1 px-5 py-4 items-center"
                          style={{ borderBottom: idx < rightSpecs.length - 1 ? '1px solid #e7e7e7' : 'none' }}>
                          <span className="font-semibold text-[15px] text-black">{label}:</span>
                          <span className="font-bold text-[15px] text-black">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              </div>

              <VehicleDescription sections={vehicle.descriptionSections ?? []} />

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Features &amp; Equipment</h2>
                <ul className={styles.specsGrid}>
                  {(vehicle.specs ?? []).map((spec) => (
                    <li key={spec}>{spec}</li>
                  ))}
                </ul>
              </div>

            </div>

            <Sidebar vehicle={vehicle} />
          </div>
        </div>
      </div>

      <SimilarVehicles vehicles={vehicle.similarVehicles ?? []} />

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={`${styles.footerTop} ${styles.container}`}>
          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <div key={heading} className={styles.footerCol}>
              <h4>{heading}</h4>
              <ul>
                {links.map((link) => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerLogo}>Empire Auto Sales</div>
          <div className={styles.footerAddress}>2940 East 8 Mile &nbsp;|&nbsp; Detroit, MI 48234</div>
          <div className={styles.footerPhone}>(313) 251-7447</div>
          <div className={styles.footerCopy}>&copy; 2026 EMPIRE AUTO SALES. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
}