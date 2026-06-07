"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/icons";

/* ─── Scroll-reveal hook ─────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return ref;
}

/* ─── Data ────────────────────────────────────────────────────────────────── */
const quickLinks = [
  { href: "/inventory", label: "Inventory" },
  { href: "/financing", label: "Financing" },
  { href: "/trade-in",  label: "Trade In"  },
  { href: "/services",  label: "Services"  },
  { href: "/contact",   label: "Contact"   },
];

const socials = [
  { Icon: InstagramIcon, label: "Instagram", href: "#" },
  { Icon: FacebookIcon,  label: "Facebook",  href: "#" },
  { Icon: TikTokIcon,    label: "TikTok",    href: "#" },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function HomeFooter() {
  const footerRef = useReveal();

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — Main Footer
          3-column grid · bottom bar · social icons
      ══════════════════════════════════════════════════════════════════ */}
<footer
  ref={footerRef}
  className="footer-reveal mt-24 lg:mt-32"
  style={{ background: "#06060C" }}
>
        {/* Thin top divider */}
        <div
          aria-hidden
          className="h-px w-full"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />

<div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-5">

          {/* ── 3-Column Grid ─────────────────────────────────────────── */}
          <div
            className="
              grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 pb-10
            "
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >

            {/* COL 1 — Brand */}
            <div>
              <div className="mb-5">
                <h3 className="text-[2rem] font-black tracking-[6px] text-white leading-none">
                  NOVA
                </h3>
                <p
                  className="text-[10px] uppercase tracking-[8px] mt-1 font-bold"
                  style={{ color: "#B22222" }}
                >
                  MOTORS
                </p>
              </div>

              <p className="text-white/65 text-[13px] leading-relaxed mb-6 max-w-[240px]">
                Luxury vehicles curated for performance, comfort, and prestige.
              </p>

              {/* Social icons */}
              <div className="flex gap-2.5">
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="
                      w-9 h-9 flex items-center justify-center
                      rounded border border-white/10 text-white/70
                      hover:border-[#B22222]/55 hover:text-[#B22222]
                      hover:shadow-[0_0_14px_rgba(178,34,34,0.3)]
                      transition-all duration-300
                    "
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* COL 2 — Quick Links */}
            <div>
              <h4 className="text-[10px] font-bold text-white/70 tracking-[0.22em] uppercase mb-4">
                Quick Links
              </h4>

              {/* Orange accent rule */}
              <div
                className="h-px mb-5"
                style={{
                  background:
                    "linear-gradient(90deg, #B22222 0%, transparent 100%)",
                }}
              />

              <ul className="space-y-2.5">
                {quickLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="
                        text-white/70 text-[13px] font-sans tracking-wide
                        hover:text-[#B22222] transition-colors duration-300
                      "
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* COL 3 — Contact */}
            <div>
              <h4 className="text-[10px] font-bold text-white/70 tracking-[0.22em] uppercase mb-4">
                Contact
              </h4>

              {/* Orange accent rule */}
              <div
                className="h-px mb-5"
                style={{
                  background:
                    "linear-gradient(90deg, #B22222 0%, transparent 100%)",
                }}
              />

              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Phone
                    size={13}
                    className="shrink-0"
                    style={{ color: "#B22222" }}
                  />
                  <a
                    href="tel:+12125550199"
                    className="text-white/90 hover:text-white text-[13px] transition-colors duration-300"
                  >
                    +1 (212) 555-0199
                  </a>
                </li>

                <li className="flex items-center gap-3">
                  <Mail
                    size={13}
                    className="shrink-0"
                    style={{ color: "#B22222" }}
                  />
                  <a
                    href="mailto:hello@novamotors.com"
                    className="text-white/90 hover:text-white text-[13px] transition-colors duration-300"
                  >
                    hello@novamotors.com
                  </a>
                </li>

                <li className="flex items-start gap-3">
                  <MapPin
                    size={13}
                    className="mt-0.5 shrink-0"
                    style={{ color: "#B22222" }}
                  />
                  <span className="text-white/75 text-[13px] leading-relaxed">
                    425 Park Avenue
                    <br />
                    New York, NY 10022
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <Clock
                    size={13}
                    className="mt-0.5 shrink-0"
                    style={{ color: "#B22222" }}
                  />
                  <span className="text-white/90 text-[13px] leading-relaxed">
                    Mon – Sat: 9am – 7pm
                    <br />
                    Sun: 11am – 5pm
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Bottom Bar ────────────────────────────────────────────── */}
          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/70 text-[11px] tracking-widest uppercase font-sans">
              © 2026 Nova Motors. All Rights Reserved.
            </p>

            {/* Social mini icons */}
            <div className="flex items-center gap-3.5">
              {socials.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="
                    text-white/50 hover:text-[#B22222]
                    hover:drop-shadow-[0_0_6px_rgba(178,34,34,0.7)]
                    transition-all duration-300
                  "
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
