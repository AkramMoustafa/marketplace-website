'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'HOME',      href: '/'         },
  { label: 'INVENTORY', href: '/inventory' },
  { label: 'CONTACT',   href: '/contact'   },
  { label: 'REVIEWS',   href: '/reviews'   },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-slate-950">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex flex-wrap items-center">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={label} className="relative">
                <Link
                  href={href}
                  className={`
                    relative group block px-4 py-[14px]
                    text-xs font-bold tracking-[1px]
                    transition-colors duration-200
                    ${active ? 'text-[#B22222]' : 'text-slate-300 hover:text-[#B22222]'}
                  `}
                >
                  {active && (
                    <span className="absolute inset-0 bg-[#B22222]/[0.07]" aria-hidden />
                  )}
                  <span className="relative z-10">{label}</span>
                  <span
                    className={`
                      absolute bottom-0 left-0 h-[2px] rounded-full bg-[#B22222]
                      transition-all duration-300 ease-out
                      ${active ? 'w-full' : 'w-0 group-hover:w-full'}
                    `}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
