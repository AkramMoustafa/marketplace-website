const NAV_LINKS = [
  'HOME', 'INVENTORY', 'FINANCING', 'PRE-APPROVAL',
  'TRADE-IN', 'SERVICE', 'CONTACT', 'REVIEWS', 'ESPAÑOL',
];

export default function NavBar() {
  return (
    <nav className="bg-slate-950">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex flex-wrap items-center">
          {NAV_LINKS.map((link, i) => {
            const active = i === 0;
            return (
              <li key={link} className="relative">
                <a
                  href="#"
                  className={`
                    relative group block px-4 py-[14px]
                    text-xs font-bold tracking-[1px]
                    transition-colors duration-200
                    ${active ? 'text-[#FF5500]' : 'text-slate-300 hover:text-[#FF5500]'}
                  `}
                >
                  {/* Active: very soft amber tint behind text */}
                  {active && (
                    <span className="absolute inset-0 bg-[#FF5500]/[0.07]" aria-hidden />
                  )}

                  <span className="relative z-10">{link}</span>

                  {/* Bottom accent line */}
                  <span
                    className={`
                      absolute bottom-0 left-0 h-[2px] rounded-full bg-[#FF5500]
                      transition-all duration-300 ease-out
                      ${active ? 'w-full' : 'w-0 group-hover:w-full'}
                    `}
                    aria-hidden
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
