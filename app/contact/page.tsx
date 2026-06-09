'use client';

import { useState } from 'react';
import SiteHeader from '@/components/layout/SiteHeader';
import HomeFooter from '@/components/HomeFooter';
import * as api from '@/lib/api';
import { MapPin, Phone, Clock, Mail, CheckCircle } from 'lucide-react';

const HOURS = [
  { day: 'Monday – Friday', hours: '9:00 AM – 7:00 PM' },
  { day: 'Saturday',        hours: '9:00 AM – 5:00 PM' },
  { day: 'Sunday',          hours: 'Closed'             },
];

const SUBJECTS = [
  'General Inquiry',
  'Vehicle Availability',
  'Pricing & Financing',
  'Schedule a Test Drive',
  'Trade-In Valuation',
  'Service & Maintenance',
  'Other',
];

type FormState = {
  name: string; email: string; phone: string;
  subject: string; message: string;
};

const EMPTY: FormState = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactPage() {
  const [form, setForm]     = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.submitContact({
        name:    form.name,
        email:   form.email,
        phone:   form.phone || undefined,
        subject: form.subject,
        message: form.message,
      });
      setSuccess(true);
      setForm(EMPTY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* ── Page hero ── */}
      <div className="bg-slate-900 py-12 px-5">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[4px] text-[#B22222] mb-2">
            Get in Touch
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Contact Nova Motors
          </h1>
          <p className="mt-3 text-slate-400 text-sm max-w-xl">
            Have a question about a vehicle, financing, or scheduling a visit?
            We&apos;re here to help — reach out and we&apos;ll get back to you promptly.
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Left: info cards ── */}
        <div className="space-y-5">

          {/* Address */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#B22222]/10 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-[#B22222]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Location</p>
                <p className="text-sm font-bold text-slate-900 leading-snug">
                  2940 East 8 Mile Road<br />Detroit, MI 48234
                </p>
                <a
                  href="https://maps.google.com/?q=2940+East+8+Mile+Road+Detroit+MI+48234"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-bold text-[#B22222] hover:underline"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#B22222]/10 flex items-center justify-center shrink-0">
                <Phone size={18} className="text-[#B22222]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Phone</p>
                <a
                  href="tel:3132517447"
                  className="text-sm font-bold text-slate-900 hover:text-[#B22222] transition-colors"
                >
                  (313) 251-7447
                </a>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#B22222]/10 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-[#B22222]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-1">Email</p>
                <a
                  href="mailto:info@novamotors.com"
                  className="text-sm font-bold text-slate-900 hover:text-[#B22222] transition-colors"
                >
                  info@novamotors.com
                </a>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#B22222]/10 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-[#B22222]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 mb-3">Hours</p>
                <div className="space-y-1.5">
                  {HOURS.map(({ day, hours }) => (
                    <div key={day} className="flex items-center justify-between gap-4 text-xs">
                      <span className="text-slate-500">{day}</span>
                      <span className={`font-bold ${hours === 'Closed' ? 'text-slate-400' : 'text-slate-900'}`}>
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: contact form ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

            {success ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                <h2 className="text-xl font-black text-slate-900 mb-2">Message Sent!</h2>
                <p className="text-slate-500 text-sm max-w-sm">
                  Thanks for reaching out. A member of our team will get back to you as soon as possible.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-6 px-6 py-2.5 rounded-full bg-[#B22222] text-black text-xs font-black uppercase tracking-wide hover:opacity-90 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Send Us a Message</h2>
                  <p className="text-xs text-slate-400 mt-1">We typically respond within one business day.</p>
                </div>

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-1.5">
                      Full Name <span className="text-[#B22222]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#B22222] focus:ring-2 focus:ring-[#B22222]/20 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-1.5">
                      Email Address <span className="text-[#B22222]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#B22222] focus:ring-2 focus:ring-[#B22222]/20 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Phone + Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-1.5">
                      Phone <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="(313) 000-0000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#B22222] focus:ring-2 focus:ring-[#B22222]/20 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-1.5">
                      Subject <span className="text-[#B22222]">*</span>
                    </label>
                    <select
                      required
                      value={form.subject}
                      onChange={e => set('subject', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-[#B22222] focus:ring-2 focus:ring-[#B22222]/20 focus:bg-white transition"
                    >
                      <option value="" disabled>Select a subject…</option>
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[2px] text-slate-500 mb-1.5">
                    Message <span className="text-[#B22222]">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    placeholder="Tell us how we can help…"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#B22222] focus:ring-2 focus:ring-[#B22222]/20 focus:bg-white transition resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full bg-[#B22222] text-black text-sm font-black uppercase tracking-[1.5px] hover:opacity-90 hover:-translate-y-px hover:shadow-md hover:shadow-[#B22222]/20 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}
