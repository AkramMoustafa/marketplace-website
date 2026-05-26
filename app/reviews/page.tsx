'use client';

import { useState, useEffect } from 'react';
import SiteHeader from '@/components/layout/SiteHeader';
import * as api from '@/lib/api';
import type { PublicReview } from '@/lib/types';

/* ─── Car images pool (Unsplash, cycles per card index) ─────────────── */
const CAR_IMAGES = [
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80&auto=format&fit=crop', // BMW dark
  'https://images.unsplash.com/photo-1617469767408-d6f2bfc21d77?w=600&q=80&auto=format&fit=crop', // Mercedes white
  'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&q=80&auto=format&fit=crop', // Audi grey
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80&auto=format&fit=crop', // Porsche
  'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80&auto=format&fit=crop', // Lexus
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80&auto=format&fit=crop', // Supercar
];

function getCarImage(index: number) {
  return CAR_IMAGES[index % CAR_IMAGES.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

type FormState = {
  name: string;
  email: string;
  rating: number;
  title: string;
  review_text: string;
};
const EMPTY: FormState = { name: '', email: '', rating: 0, title: '', review_text: '' };

/* ─── Star display (read-only) ─────────────────────────────────────── */
function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < rating ? '#FF5500' : '#e2e8f0'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Star picker ───────────────────────────────────────────────────── */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1;
          return (
            <button key={n} type="button"
              onClick={() => onChange(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none transition-transform hover:scale-110">
              <svg width="32" height="32" viewBox="0 0 24 24"
                fill={n <= (hovered || value) ? '#FF5500' : 'none'}
                stroke={n <= (hovered || value) ? '#FF5500' : '#cbd5e1'}
                strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-1">Click to rate</p>
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────────────────────────── */
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['#1e40af', '#065f46', '#7c2d12', '#4c1d95', '#164e63', '#713f12'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 relative"
      style={{ width: size, height: size, backgroundColor: color }}>
      {initials}
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF5500] border-2 border-white flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Review card ───────────────────────────────────────────────────── */
function ReviewCard({ review, index }: { review: PublicReview; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="
      bg-white rounded-3xl border border-slate-200 overflow-hidden
      flex flex-col h-full shadow-sm
      hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
    ">
      {/* Card image */}
      <div className="w-full h-52 bg-slate-100 overflow-hidden relative flex-shrink-0">
        {!imgError ? (
          <img
            src={getCarImage(index)}
            alt="Nova Motors customer vehicle"
            className="w-full h-full object-cover transition duration-500 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback gradient if image fails */
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Nova Motors badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-xl">
            <div className="text-white font-black text-base leading-none">NOVA</div>
            <div className="text-white/60 text-[9px] tracking-[3px] mt-0.5">MOTORS</div>
          </div>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Reviewer row */}
        <div className="flex items-center gap-3">
          <Avatar name={review.title} size={40} />
          <div className="min-w-0">
            <p className="text-slate-900 font-bold text-sm truncate">{review.title}</p>
            <p className="text-[#FF5500] text-xs font-bold uppercase tracking-wide">Verified Buyer</p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <StarDisplay rating={review.rating} size={13} />
          </div>
        </div>

        {/* Review body */}
        <p className="text-slate-600 text-sm leading-7 flex-1 min-h-[80px] line-clamp-4">
          {review.body}
        </p>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-slate-400 text-xs pt-2 border-t border-slate-100">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(review.created_at)}
        </div>
      </div>
    </div>
  );
}

/* ─── Stats bar ─────────────────────────────────────────────────────── */
function RatingBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#FF5500] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-400 w-7 text-right flex-shrink-0">{pct}%</span>
    </div>
  );
}

/* ─── Review form ───────────────────────────────────────────────────── */
function ReviewForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const set = (k: keyof FormState, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (form.rating === 0) e.rating = 'Please select a rating.';
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.review_text.trim()) e.review_text = 'Review is required.';
    else if (form.review_text.trim().length < 10) e.review_text = 'At least 10 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerErr('');
    try {
      await api.submitPublicReview({
        customer_id: null,
        vehicle_id: null,
        rating: form.rating,
        title: form.name.trim(),
        body: form.review_text.trim(),
      });
      setSubmitted(true);
      setForm(EMPTY);
      onSuccess();
    } catch (err) {
      setServerErr(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (err?: string) => [
    'w-full px-4 py-3 rounded-xl border text-sm text-slate-900 bg-white transition',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2',
    err
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-[#FF5500] focus:ring-[#FF5500]/10',
  ].join(' ');

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-[#FF5500]/10 border border-[#FF5500]/20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#FF5500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-slate-900 font-black text-2xl mb-2">Thank You!</h3>
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          Your review has been submitted and is pending approval.
        </p>
        <button onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-bold text-[#FF5500] hover:underline">
          Submit another review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Your Name <span className="text-[#FF5500]">*</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <input type="text" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Enter your full name"
              className={`${inputCls(errors.name)} pl-10`} />
          </div>
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email <span className="text-slate-400 font-normal text-xs">(optional)</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
            <input type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="Enter your email"
              className={`${inputCls()} pl-10`} />
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Rating <span className="text-[#FF5500]">*</span>
          </label>
          <StarPicker value={form.rating} onChange={n => set('rating', n)} />
          {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Review Title <span className="text-[#FF5500]">*</span>
          </label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <input type="text" value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Summarize your experience"
              className={`${inputCls(errors.title)} pl-10`} />
          </div>
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>
      </div>

      {/* Row 3 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Your Review <span className="text-[#FF5500]">*</span>
        </label>
        <div className="relative">
          <svg className="absolute left-3.5 top-3.5 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <textarea rows={5} value={form.review_text}
            onChange={e => set('review_text', e.target.value)}
            placeholder="Tell us about your experience with Nova Motors..."
            className={`${inputCls(errors.review_text)} pl-10 resize-none`} />
        </div>
        {errors.review_text && <p className="mt-1 text-xs text-red-500">{errors.review_text}</p>}
      </div>

      {serverErr && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {serverErr}
        </p>
      )}

      <button type="submit" disabled={submitting}
        className={[
          'w-full py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2',
          'transition-all hover:opacity-90 active:scale-[0.99]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          submitting ? 'bg-slate-400' : 'bg-[#FF5500]',
        ].join(' ')}>
        {submitting ? (
          'Submitting…'
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Submit Review
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Reviews are moderated before publishing to ensure quality and authenticity.
      </p>
    </form>
  );
}

/* ─── Carousel ──────────────────────────────────────────────────────── */
function ReviewCarousel({ reviews }: { reviews: PublicReview[] }) {
  const [current, setCurrent] = useState(0);
  const perPage = 3;
  const total = Math.ceil(reviews.length / perPage);

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(total - 1, c + 1));

  const startIndex = current * perPage;
  const visible = reviews.slice(startIndex, startIndex + perPage);

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-[#FF5500]/20 bg-[#FF5500]/[0.06]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm font-semibold">No reviews yet</p>
        <p className="text-slate-400 text-xs mt-1">Be the first to share your experience.</p>
      </div>
    );
  }

  return (
    <div className="relative px-6">
      {/* Prev arrow */}
      {current > 0 && (
        <button onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:border-[#FF5500] hover:text-[#FF5500] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {current < total - 1 && (
        <button onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:border-[#FF5500] hover:text-[#FF5500] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((r, i) => (
          <ReviewCard key={r.id} review={r} index={startIndex + i} />
        ))}
      </div>

      {/* Dot pagination */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: total }).map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={[
                'rounded-full transition-all duration-200',
                i === current
                  ? 'w-6 h-2.5 bg-[#FF5500]'
                  : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400',
              ].join(' ')} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    try {
      const data = await api.getPublicReviews();
      setReviews(data.items);
    } catch { /* silently handled */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadReviews(); }, []);

  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  const pctRecommend = reviews.length
    ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
    : 0;

  const starCounts = [5, 4, 3, 2, 1].map(s => ({
    label: `${s} Star${s > 1 ? 's' : ''}`,
    pct: reviews.length
      ? Math.round((reviews.filter(r => r.rating === s).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative bg-white overflow-hidden border-b border-slate-100">
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #FF5500 40%, #FF5500 60%, transparent)',
            boxShadow: '0 0 16px 2px rgba(255,85,0,0.35)',
          }}
        />
        <div className="max-w-4xl mx-auto px-5 py-16 text-center">
          <p className="text-[10px] font-black uppercase tracking-[5px] text-[#FF5500] mb-3">
            Customer Reviews
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            What Drivers Are Saying
          </h1>
          <p className="mt-4 text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Real experiences from our valued customers who found their perfect ride with Nova Motors.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 lg:px-10">

        {/* ── STATS ROW ────────────────────────────────────────────────── */}
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-10 border-b border-slate-100">
            {/* Average rating */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-start gap-2">
              <p className="text-5xl font-black text-slate-900">{avgRating.toFixed(1)}</p>
              <StarDisplay rating={Math.round(avgRating)} size={18} />
              <p className="text-xs text-slate-400 mt-1">Average Rating</p>
            </div>

            {/* Verified reviews */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-start justify-center gap-2">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5500" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <p className="text-3xl font-black text-slate-900">{reviews.length}</p>
              </div>
              <p className="text-xs text-slate-400">Verified Reviews</p>
            </div>

            {/* Recommend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-start justify-center gap-2">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5500" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                <p className="text-3xl font-black text-slate-900">{pctRecommend}%</p>
              </div>
              <p className="text-xs text-slate-400">Recommend Us</p>
            </div>

            {/* Star breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center gap-2">
              {starCounts.map(({ label, pct }) => (
                <RatingBar key={label} label={label} pct={pct} />
              ))}
            </div>
          </div>
        )}

        {/* ── REVIEWS CAROUSEL ─────────────────────────────────────────── */}
        <div className="py-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-3xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <ReviewCarousel reviews={reviews} />
          )}
        </div>

        {/* ── REVIEW FORM ──────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 py-14 pb-20">
          <div className="text-center mb-10">
            <div className="h-[3px] w-10 bg-[#FF5500] rounded-full mx-auto mb-4" />
            <h2 className="text-3xl font-black text-slate-900">Share Your Experience</h2>
            <p className="text-slate-400 text-sm mt-2">
              Your feedback helps us improve and helps others make the right choice.
            </p>
          </div>
          <ReviewForm onSuccess={loadReviews} />
        </div>

      </div>
    </div>
  );
}