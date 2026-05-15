import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-[#C9A84C]/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 border border-[#C9A84C] rotate-45 flex items-center justify-center shrink-0">
                <span className="text-[#C9A84C] font-serif text-[8px] font-bold -rotate-45">LM</span>
              </div>
              <span className="font-serif text-white text-base tracking-widest uppercase">
                Luxury<span className="text-[#C9A84C]">Motors</span>
              </span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed font-sans mb-7">
              Curating the world&apos;s most extraordinary automobiles since 1998. Excellence is not a feature — it is our standard.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: FacebookIcon, label: "Facebook" },
                { Icon: InstagramIcon, label: "Instagram" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 border border-white/10 flex items-center justify-center text-white/35 hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all duration-300"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-serif text-white/80 text-xs tracking-[0.2em] uppercase mb-5">Navigation</h4>
            <div className="thin-divider mb-5" />
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/inventory", label: "Inventory" },
                { href: "/about", label: "About Us" },
                { href: "/admin", label: "Admin Portal" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-[#C9A84C] text-sm font-sans tracking-wide transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h4 className="font-serif text-white/80 text-xs tracking-[0.2em] uppercase mb-5">Our Brands</h4>
            <div className="thin-divider mb-5" />
            <ul className="space-y-3">
              {["Mercedes-Benz","BMW","Rolls-Royce","Porsche","Bentley","Ferrari"].map((brand) => (
                <li key={brand}>
                  <Link
                    href={`/inventory?brand=${brand}`}
                    className="text-white/40 hover:text-[#C9A84C] text-sm font-sans tracking-wide transition-colors duration-300"
                  >
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-white/80 text-xs tracking-[0.2em] uppercase mb-5">Contact</h4>
            <div className="thin-divider mb-5" />
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={14} className="text-[#C9A84C] mt-0.5 shrink-0" />
                <span className="text-white/40 text-sm font-sans leading-relaxed">
                  425 Park Avenue<br />New York, NY 10022
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={14} className="text-[#C9A84C] shrink-0" />
                <a href="tel:+12125550199" className="text-white/40 hover:text-[#C9A84C] text-sm font-sans transition-colors duration-300">
                  +1 (212) 555-0199
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={14} className="text-[#C9A84C] shrink-0" />
                <a href="mailto:hello@luxurymotors.com" className="text-white/40 hover:text-[#C9A84C] text-sm font-sans transition-colors duration-300">
                  hello@luxurymotors.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="thin-divider mt-14 mb-7" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/20 text-xs font-sans tracking-widest uppercase">
            © 2024 Luxury Motors. All Rights Reserved.
          </p>
          <p className="text-white/15 text-xs font-sans">
            Privacy Policy · Terms of Service · Cookie Policy
          </p>
        </div>
      </div>
    </footer>
  );
}
