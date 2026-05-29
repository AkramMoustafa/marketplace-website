"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/inventory", label: "Inventory" },
  { href: "/about", label: "About" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const opaque = !isHome || scrolled || mobileOpen;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${opaque
        ? "bg-[#0A0A0A]/96 backdrop-blur-md border-b border-[#C9A84C]/10 shadow-[0_2px_30px_rgba(0,0,0,.6)]"
        : "bg-transparent border-b border-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-18 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-7 h-7 border border-[#C9A84C] rotate-45 flex items-center justify-center transition-colors duration-300 group-hover:bg-[#C9A84C]">
              <span className="font-serif text-[10px] font-bold text-[#C9A84C] group-hover:text-black -rotate-45 transition-colors duration-300">
                LM
              </span>
            </div>
            <span className="font-serif text-white text-lg tracking-widest uppercase">
              RPM <span className="text-[#C9A84C]">MOTORS</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[11px] tracking-[0.18em] uppercase font-sans transition-colors duration-300 group ${pathname === link.href ? "text-[#C9A84C]" : "text-white/60 hover:text-white"
                  }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-[#C9A84C] transition-all duration-300 ${pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                />
              </Link>
            ))}
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-4">
            <Link
              href="/inventory"
              className="hidden md:inline-flex items-center border border-[#C9A84C]/60 text-[#C9A84C] text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 hover:bg-[#C9A84C] hover:text-black transition-all duration-300 font-sans"
            >
              View Inventory
            </Link>
            <button
              className="md:hidden text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="bg-[#0A0A0A] border-t border-[#C9A84C]/10 px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-[11px] tracking-[0.2em] uppercase font-sans transition-colors duration-200 ${pathname === link.href ? "text-[#C9A84C]" : "text-white/60 hover:text-white"
                }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/inventory"
            onClick={() => setMobileOpen(false)}
            className="mt-1 border border-[#C9A84C]/60 text-[#C9A84C] text-[10px] tracking-[0.18em] uppercase px-5 py-3 text-center hover:bg-[#C9A84C] hover:text-black transition-all duration-300 font-sans"
          >
            View Inventory
          </Link>
        </div>
      </div>
    </nav>
  );
}
