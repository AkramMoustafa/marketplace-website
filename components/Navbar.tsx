"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/inventory", label: "Inventory" },
  { href: "/about", label: "About" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-white">
        <div className="bg-white border-b border-white">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-14 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3 bg-white">
              <Search size={18} className="text-black" />
              <input
                type="text"
                placeholder="Search inventory"
                className="bg-white text-black placeholder:text-black outline-none text-sm w-64"
              />
            </div>

            <div className="hidden md:flex items-center gap-8 bg-white">
              <Link href="/inventory" className="text-sm text-black">
                Inventory
              </Link>
              <Link href="/about" className="text-sm text-black">
                About
              </Link>
              <Link href="/admin" className="text-sm text-black">
                Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between bg-white">
            <Link href="/" className="text-black font-black text-3xl tracking-tight">
              NOVA MOTORS
            </Link>

            <nav className="hidden lg:flex items-center gap-12 bg-white">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${
                    pathname === link.href ? "text-black" : "text-black"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <button
              className="lg:hidden text-black bg-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-white transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-20 px-6 flex items-center justify-between bg-white border-b border-white">
          <span className="text-black font-black text-2xl">NOVA MOTORS</span>

          <button
            onClick={() => setMobileOpen(false)}
            className="text-black bg-white"
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
        </div>

        <div className="p-8 flex flex-col bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-5 text-2xl text-black bg-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}