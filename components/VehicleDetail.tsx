'use client';

import { useState } from 'react';
import styles from './VehicleDetail.module.css';
import SiteHeader from '@/components/layout/SiteHeader';
import { bookAppointment, submitVehicleInquiry } from '@/lib/api';
import type {
  Vehicle,
  VehicleImage,
  DescriptionSection,
  SimilarVehicle,
} from '@/types/vehicle';

/* ─── Gallery ───────────────────────────────────────────────────── */
interface GalleryProps {
  images: VehicleImage[];
  vehicleTitle: string;
}

function Gallery({ images: imagesProp, vehicleTitle }: GalleryProps) {
  const images = imagesProp ?? [];
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const imageUrl = (path: string) => {
    if (!path) return '';

    if (path.startsWith('http')) return path;

    return `${API_URL}${path}`;
  };

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
        <div className={styles.galleryMain}>
          No photos available
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>

      {/* MAIN IMAGE */}
      <div className={styles.galleryMain}>
        <img
          src={imageUrl(images[currentIndex].full)}
          alt={`${vehicleTitle} – photo ${currentIndex + 1}`}
        />

        <div className={styles.galleryCounter}>
          📷 {currentIndex + 1} / {images.length}
        </div>

        <button
          className={`${styles.galleryArrow} ${styles.galleryArrowLeft}`}
          onClick={goPrev}
        >
          ‹
        </button>

        <button
          className={`${styles.galleryArrow} ${styles.galleryArrowRight}`}
          onClick={goNext}
        >
          ›
        </button>
      </div>

      {/* THUMBNAILS */}
      <div className={styles.galleryThumbs}>
        {images.map((img, i) => (
          <img
            key={img.thumb}
            src={imageUrl(img.thumb)}
            alt={img.alt}
            className={`${styles.galleryThumb} ${
              i === currentIndex
                ? styles.galleryThumbActive
                : ''
            }`}
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

/* ─── Contact Dealer Modal ──────────────────────────────────────── */
function ContactDealerModal({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState("Hi, I'm interested in this vehicle and would like more information.");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitVehicleInquiry(vehicleId, { name, email, phone: phone || undefined, message });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {success ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✓</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Message Sent!</h3>
            <p className="text-slate-500 text-sm mb-4">A dealer representative will be in touch with you shortly.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-black text-white font-black text-sm rounded-lg">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">Contact Dealer</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-black resize-none" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-black text-white font-black text-sm uppercase tracking-wide rounded-lg hover:bg-slate-800 transition disabled:opacity-60">
                {loading ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Appointment Modal ─────────────────────────────────────────── */
function AppointmentModal({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await bookAppointment({ vehicle_id: vehicleId, service_type: 'test_drive', appointment_date: date, phone, notes });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {success ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✓</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Test Drive Confirmed!</h3>
            <p className="text-slate-500 text-sm mb-4">Your test drive appointment is confirmed. See you soon!</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-[#B22222] text-black font-black text-sm rounded-lg">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">Book a Test Drive</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Preferred Date & Time</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B22222]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(555) 000-0000"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B22222]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any specific requests…"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B22222] resize-none" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-black text-sm uppercase tracking-wide rounded-lg hover:bg-[#B22222] hover:text-black transition disabled:opacity-60">
                {loading ? 'Booking…' : 'Confirm Appointment'}
              </button>
            </form>
          </>
        )}
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

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

interface SidebarProps {
  vehicle: Vehicle;
}
function Sidebar({ vehicle }: SidebarProps) {
  const [apptOpen, setApptOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const formattedPrice = vehicle.price != null
    ? `$${vehicle.price.toLocaleString()}`
    : 'Call for Price';

  return (
    <aside className={styles.detailSidebar}>
      <div className="bg-white rounded-[24px] overflow-hidden border border-[#e4e8ec] shadow-[0_10px_28px_rgba(0,0,0,.05)]">

        {/* VEHICLE TITLE */}
        <div className="px-8 pt-8 pb-7 border-b border-[#edf0f3] text-center">
          <p className="text-[28px] font-black uppercase leading-[0.95] tracking-[-0.03em] text-[#111]">
            {vehicle.title}
          </p>

          <p className="mt-2 text-sm text-[#666] uppercase font-semibold">
            {vehicle.trim ?? ''}
          </p>

          <p className="mt-2 text-[15px] text-[#8d939a]">
            {(vehicle.odometer ?? 0).toLocaleString()} miles
          </p>
        </div>

        {/* PRICE */}
        <div className="px-8 py-6 border-b border-[#edf0f3] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#a2aab3] leading-tight">
              Advertised
            </p>
            <p className="text-[11px] font-bold uppercase text-[#a2aab3] leading-tight">
              Price
            </p>
          </div>

          <p className="text-[32px] font-black tracking-[-0.03em] text-[#111]">
            {formattedPrice}
          </p>
        </div>

        {/* CTA BUTTONS */}
        <div className="p-6 space-y-3">

          {/* PRIMARY */}
          <button onClick={() => setContactOpen(true)}
            className="w-full bg-black text-white rounded-[18px] py-4 px-6 font-black uppercase text-[15px] flex items-center justify-center gap-5">
            <div className="w-[44px] h-[44px] rounded-full border border-white flex items-center justify-center">
              <HeartIcon />
            </div>

            CONTACT DEALER
          </button>

          <button onClick={() => setApptOpen(true)}
            className="w-full border border-[#d8d8d8] rounded-[18px] py-4 px-6 flex items-center justify-center gap-5 font-extrabold uppercase text-[15px] text-[#222]">
            <div className="w-[44px] h-[44px] rounded-full border border-[#d8d8d8] flex items-center justify-center">
              <CalendarIcon />
            </div>
            SCHEDULE TEST DRIVE
          </button>

        </div>

        {apptOpen && <AppointmentModal vehicleId={vehicle.id} onClose={() => setApptOpen(false)} />}
        {contactOpen && <ContactDealerModal vehicleId={vehicle.id} onClose={() => setContactOpen(false)} />}


        {/* CALL OR TEXT */}
        <div className="border-t border-[#edf0f3] p-8 text-center">

          <p className="text-[20px] font-semibold text-[#222]">
            Call or Text
          </p>

          <a
            href="tel:3132517447"
            className="block mt-4 text-[30px] font-black tracking-tight text-[#111]"
          >
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
                <a href={`/vehicle-detail?id=${v.id}`} className={styles.carCardBtn}>View Details</a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Constants ─────────────────────────────────────────────────── */

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
    { label: 'Fuel Economy', value: vehicle.fuelEconomy ?? '—' },
  ];

  return (
    <div className={styles.root}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <SiteHeader />

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