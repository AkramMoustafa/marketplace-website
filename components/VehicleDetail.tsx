'use client';

import { useState } from 'react';
import styles from './VehicleDetail.module.css';
import type {
  Vehicle,
  VehicleImage,
  DescriptionSection,
  SimilarVehicle,
} from '@/types/vehicle';

/* ═══════════════════════════════════════════════════════════════════
   Button icons
   ═══════════════════════════════════════════════════════════════════ */

const PhoneIcon = (): JSX.Element => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h2.5L7 7 5.25 8.06A9 9 0 0 0 8.94 11.75L10 10l4 1.5V14A1 1 0 0 1 13 15C6.37 15 2 10.63 2 4a1 1 0 0 1 1-1z"/>
  </svg>
);

const ChatIcon = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v3l4-3h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   Spec grid icons  (monoline 18 × 18)
   ═══════════════════════════════════════════════════════════════════ */

const OdometerIcon   = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M3 13.5a7 7 0 1 1 12 0"/>
    <path d="M9 9 5.5 6"/>
    <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
);

const FuelEconIcon   = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M9 15V9.5"/>
    <path d="M9 9.5C9 6 6 3.5 3.5 3c0 4 2 6.5 5.5 6.5z"/>
    <path d="M9 9.5C9 6 12 3.5 14.5 3c0 4-2 6.5-5.5 6.5z"/>
  </svg>
);

const TransmissionIcon = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <circle cx="9" cy="9" r="2.5"/>
    <path d="M9 2v4.5M9 11.5v4.5M2 9h4.5M11.5 9H16"/>
    <path d="M4.1 4.1l3.2 3.2M10.7 10.7l3.2 3.2M4.1 13.9l3.2-3.2M10.7 7.3l3.2-3.2"/>
  </svg>
);

const FuelTypeIcon   = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15.5V4.5A1 1 0 0 1 5 3.5h5a1 1 0 0 1 1 1v11"/>
    <path d="M4 9.5h7"/>
    <path d="M11 6.5h1a2 2 0 0 1 2 2V12a1 1 0 0 0 2 0V8l-2-2"/>
  </svg>
);

const BodyTypeIcon   = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12.5h14v2H2z"/>
    <path d="M2.5 12.5V10L5 7h8l2.5 3v2.5"/>
    <circle cx="5.5" cy="14" r="1"/>
    <circle cx="12.5" cy="14" r="1"/>
  </svg>
);

const ColorIcon      = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4">
    <circle cx="9" cy="9" r="7"/>
    <circle cx="9" cy="9" r="3" fill="currentColor" fillOpacity=".22" stroke="none"/>
  </svg>
);

const VinIcon        = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <rect x="2" y="4" width="14" height="10" rx="1.5"/>
    <path d="M5 8.5h8M5 11.5h5"/>
  </svg>
);

const StockIcon      = (): JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2.5H14a1 1 0 0 1 1 1V8l-6.5 6.5a1.5 1.5 0 0 1-2.12 0L3.12 11.24a1.5 1.5 0 0 1 0-2.12L10 2.5z"/>
    <circle cx="12" cy="5.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   Gallery
   ═══════════════════════════════════════════════════════════════════ */

interface GalleryProps {
  images: VehicleImage[];
  vehicleTitle: string;
}

function Gallery({ images: imagesProp, vehicleTitle }: GalleryProps) {
  const images = imagesProp ?? [];                    // guard: never undefined
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const goNext = (): void => {
    if (!images.length) return;                       // guard: no modulo-by-zero
    setCurrentIndex((i) => (i + 1) % images.length);
  };

  const goPrev = (): void => {
    if (!images.length) return;                       // guard: no modulo-by-zero
    setCurrentIndex((i) =>
      i === 0 ? images.length - 1 : i - 1
    );
  };

  /* No images — render a neutral placeholder so the page never crashes */
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

      {/* Main photo — safe: images.length > 0 guaranteed above */}
      <div className={styles.galleryMain}>
        <img
          src={images[currentIndex].full}
          alt={`${vehicleTitle} – photo ${currentIndex + 1}`}
        />

        {/* Counter pill */}
        <div className={styles.galleryCounter}>
          📷 {currentIndex + 1} / {images.length}
        </div>

        {/* Navigation arrows */}
        <button
          className={`${styles.galleryArrow} ${styles.galleryArrowLeft}`}
          onClick={goPrev}
          aria-label="Previous photo"
        >
          ‹
        </button>
        <button
          className={`${styles.galleryArrow} ${styles.galleryArrowRight}`}
          onClick={goNext}
          aria-label="Next photo"
        >
          ›
        </button>
      </div>

      {/* Scrollable thumbnail strip */}
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

/* ═══════════════════════════════════════════════════════════════════
   VehicleDescription
   ═══════════════════════════════════════════════════════════════════ */

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
                /* Content comes from our own controlled data file — safe. */
                <p key={j} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Sidebar
   ═══════════════════════════════════════════════════════════════════ */

interface SidebarProps {
  vehicle: Vehicle;
}

type SidebarIcon = () => JSX.Element;

interface SpecItem {
  Icon:  SidebarIcon;
  value: string;
  label: string;
  mono?: boolean;
}

function Sidebar({ vehicle }: SidebarProps) {
  const formattedPrice = `$${vehicle.price.toLocaleString()}`;

  const gridSpecs: SpecItem[] = [
    { Icon: OdometerIcon,     value: `${vehicle.odometer.toLocaleString()} mi`,                          label: 'Mileage'        },
    { Icon: FuelEconIcon,     value: `${vehicle.fuelEconomy.city} / ${vehicle.fuelEconomy.highway} MPG`, label: 'Fuel Economy'   },
    { Icon: TransmissionIcon, value: vehicle.transmission,                                               label: 'Transmission'   },
    { Icon: FuelTypeIcon,     value: vehicle.fuel,                                                       label: 'Fuel Type'      },
    { Icon: BodyTypeIcon,     value: vehicle.type,                                                       label: 'Body Type'      },
    { Icon: ColorIcon,        value: vehicle.color,                                                      label: 'Exterior Color' },
  ];

  const fullSpecs: SpecItem[] = [
    { Icon: VinIcon,   value: vehicle.vin,               label: 'VIN',          mono: true },
    { Icon: StockIcon, value: `#${vehicle.stockNumber}`,  label: 'Stock Number'             },
  ];

  return (
    <aside className={styles.detailSidebar}>

      {/* ── Floating card ──────────────────────────────────────────
          Layout width + sticky handled by styles.detailSidebar (CSS module).
          Everything inside is Tailwind-only. No page-level changes.
          ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] shadow-[0_4px_28px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">

        {/* ── 1. Badge + Price + Financing pill ──────────────── */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">

          {/* Brush-stroke availability badge — orange, slightly tilted */}
          <div className="mb-4">
            <span
              className="inline-block bg-[#f97316] text-white text-[10px] font-black
                         uppercase tracking-[2.5px] px-3 py-[5px] rounded shadow-sm
                         -rotate-1 select-none"
            >
              ● AVAILABLE NOW
            </span>
          </div>

          {/* Price */}
          <p className="text-[50px] font-black text-[#111] tracking-[-2px] leading-none mb-1">
            {formattedPrice}
          </p>
          <p className="text-sm text-gray-400 mb-5">Ready to drive today</p>

          {/* Financing banner — dark rounded pill with gradient */}
          <button
            className="w-full flex items-center justify-between gap-3
                       bg-gradient-to-r from-[#111] to-[#1d1d1d]
                       rounded-2xl px-4 py-3 shadow-md group
                       hover:from-[#1a1a1a] hover:to-[#282828] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">🏦</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Financing options available
              </span>
            </div>
            <span
              className="text-[#f97316] font-black text-lg leading-none
                         group-hover:translate-x-0.5 transition-transform"
            >
              →
            </span>
          </button>
        </div>

        {/* ── 4 & 5. CTA buttons ─────────────────────────────── */}
        <div className="px-5 py-5 flex flex-col gap-3 border-b border-gray-100">

          {/* Primary — CALL (orange gradient, full width) */}
          <button
            className="w-full flex items-center justify-center gap-2.5
                       bg-gradient-to-r from-[#f97316] to-[#ea580c]
                       text-white font-black text-sm uppercase tracking-widest
                       py-4 rounded-xl
                       shadow-[0_4px_15px_rgba(249,115,22,0.28)]
                       hover:shadow-[0_6px_22px_rgba(249,115,22,0.42)]
                       hover:-translate-y-px active:scale-[.98]
                       transition-all duration-150"
          >
            <PhoneIcon />
            Call Us — (313) 251-7447
          </button>

          {/* Secondary row — outlined, equal width */}
          <div className="flex gap-2.5">
            <button
              className="flex-1 flex items-center justify-center gap-2
                         border-2 border-gray-200 bg-white text-gray-700
                         font-bold text-[11px] uppercase tracking-wide
                         py-3 rounded-xl
                         hover:border-gray-400 hover:text-gray-900
                         transition-colors"
            >
              <ChatIcon />
              Text Us
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2
                         border-2 border-gray-200 bg-white text-gray-700
                         font-bold text-[11px] uppercase tracking-wide
                         py-3 rounded-xl
                         hover:border-gray-400 hover:text-gray-900
                         transition-colors"
            >
              <span className="text-[#f97316] font-black text-sm leading-none">$</span>
              Finance
            </button>
          </div>
        </div>

        {/* ── 6 & 7. Spec grid with // section header ────────── */}
        <div className="px-5 pt-5 pb-6">

          {/* Section header: // VEHICLE SPECS */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#f97316] font-black text-xs leading-none">//</span>
            <span className="text-[9px] font-black uppercase tracking-[3px] text-gray-400">
              Vehicle Specs
            </span>
            <div className="flex-1 h-px bg-gray-100 ml-1" />
          </div>

          {/* 2-column spec grid */}
          <div className="grid grid-cols-2 gap-2">

            {gridSpecs.map(({ Icon, value, label }) => (
              <div
                key={label}
                className="bg-gray-50 border border-gray-100 rounded-xl p-3
                           flex flex-col gap-0.5"
              >
                <span className="text-gray-300 flex items-center mb-1.5">
                  <Icon />
                </span>
                <span className="text-[13px] font-bold text-[#111] leading-snug">
                  {value}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-gray-400">
                  {label}
                </span>
              </div>
            ))}

            {/* Full-width rows — VIN + Stock # */}
            {fullSpecs.map(({ Icon, value, label, mono }) => (
              <div
                key={label}
                className="col-span-2 flex items-center gap-3
                           bg-gray-50 border border-gray-100 rounded-xl
                           px-3.5 py-3"
              >
                <span className="text-gray-300 flex items-center shrink-0">
                  <Icon />
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className={`font-bold text-[#111] leading-snug break-all
                      ${mono
                        ? 'font-mono text-[11px] tracking-[0.5px] text-gray-500'
                        : 'text-[13px]'
                      }`}
                  >
                    {value}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-gray-400">
                    {label}
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SimilarVehicles
   ═══════════════════════════════════════════════════════════════════ */

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
            const priceDisplay =
              v.price === null ? 'Call for Price' : `$${v.price.toLocaleString()}`;
            const priceClass =
              v.price === null
                ? `${styles.carCardPrice} ${styles.call}`
                : styles.carCardPrice;
            return (
              <div key={v.id} className={styles.carCard}>
                <img className={styles.carCardImg} src={v.image} alt={v.imageAlt} />
                <div className={styles.carCardBody}>
                  <p className={styles.carCardYear}>{v.year}</p>
                  <p className={styles.carCardTitle}>
                    {v.make.toUpperCase()} {v.model.toUpperCase()}
                  </p>
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

/* ═══════════════════════════════════════════════════════════════════
   VehicleDetail — main page export
   ═══════════════════════════════════════════════════════════════════ */

interface VehicleDetailProps {
  vehicle: Vehicle;
}

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
    links: [
      'Apply for Financing',
      'Current Specials',
      'Sell / Trade-In',
      'Service Department',
      'Contact Us',
      'Customer Reviews',
    ],
  },
];

export default function VehicleDetail({ vehicle }: VehicleDetailProps) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const handleMenuToggle = (): void => setMenuOpen((prev) => !prev);

  return (
    <div className={styles.root}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header>
        <div className={styles.topBar}>
          <div className={styles.address}>
            <i className={styles.icon}>📍</i>
            <span>2940 EAST 8 MILE &nbsp;|&nbsp; DETROIT, MI 48234</span>
          </div>
          <div className={styles.phone}>
            <i className={styles.icon}>📞</i>
            <a href="tel:3132517447">(313) 251-7447</a>
          </div>
        </div>

        <nav className={styles.navBar}>
          <a href="/" className={styles.navLogo}>
            <span className={styles.logoMain}>EMPIRE AUTO</span>
            <span className={styles.logoSub}>SALES&nbsp;•&nbsp;DETROIT, MI</span>
          </a>

          <button
            className={styles.navToggle}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={handleMenuToggle}
          >
            <span /><span /><span />
          </button>

          <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
            {NAV_LINKS.map(({ label, active }) => (
              <a
                key={label}
                href="#"
                className={active ? styles.active : undefined}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <div className={styles.breadcrumb}>
        <div className={styles.container}>
          <a href="#">Home</a>
          <span>›</span>
          <a href="#">Used Cars</a>
          <span>›</span>
          {vehicle.title}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className={styles.container}>
        <div className={styles.vehicleHero}>
          <h1 className={styles.vehicleHeroTitle}>{vehicle.title.toUpperCase()}</h1>
          <p className={styles.vehicleHeroTrim}>{vehicle.trim}</p>
        </div>

        <div className={styles.detailLayout}>
          <div className={styles.detailMain}>
            <Gallery images={vehicle.images} vehicleTitle={vehicle.title} />
            <VehicleDescription sections={vehicle.descriptionSections} />

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Features &amp; Equipment</h2>
              <ul className={styles.specsGrid}>
                {vehicle.specs.map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
              </ul>
            </div>
          </div>

          <Sidebar vehicle={vehicle} />
        </div>
      </div>

      {/* ── Similar Vehicles ────────────────────────────────────── */}
      <SimilarVehicles vehicles={vehicle.similarVehicles} />

      {/* ── Footer ──────────────────────────────────────────────── */}
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
          <div className={styles.footerAddress}>
            2940 East 8 Mile &nbsp;|&nbsp; Detroit, MI 48234
          </div>
          <div className={styles.footerPhone}>(313) 251-7447</div>
          <div className={styles.footerCopy}>
            &copy; 2026 EMPIRE AUTO SALES. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
