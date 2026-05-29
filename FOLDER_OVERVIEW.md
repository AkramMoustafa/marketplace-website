# 📂 Project Folder Directory Overview ("Quick Hits")

This is a quick reference guide explaining the role of each directory in this Next.js + Prisma project.

---

### 📂 `app/`
The heart of your application's routing and pages (utilizing Next.js **App Router**).
* 📁 `about/` — The "About Us" page route.
* 📁 `admin/` — The Dashboard and admin portal routes for inventory management.
* 📁 `inventory/` — The inventory browse, listing, and filtering routes.
* 📁 `fonts/` — Custom typography files.
* 📄 `layout.tsx` — Global root wrapper, HTML structure, global styles injection, and SEO metadata.
* 📄 `page.tsx` — The main home page of the website.
* 📄 `globals.css` — Global CSS configuration and Tailwind styles.

---

### 📂 `components/`
Modular, reusable UI blocks that make up your pages. Keeping these separate from the page routing logic keeps the codebase clean.
* 📄 `CarCard.tsx` — Individual car listing cards (slideshow, stock info, and CTA).
* 📄 `Navbar.tsx` & `Header.tsx` — Main brand layouts and page navigations.
* 📄 `Footer.tsx` — Bottom informational layout.
* 📄 `AdminClientDashboard.tsx` & `AdminSidebar.tsx` — Interface layouts for the admin portal.

---

### 📂 `lib/`
Houses helper functions, backend clients, database interfaces, and mock dataset sources.
* 📄 `db.ts` — The global Prisma database client (instantiated with a PostgreSQL connection pool).
* 📄 `data.ts` — Queries, TypeScript types, and default car inventory mock data.

---

### 📂 `prisma/`
The backend data layer and database configuration.
* 📄 `schema.prisma` — The data model representing your PostgreSQL database tables (e.g. `Car` model).
* 📄 `seed.ts` — The script that populates the database with initial vehicle records when starting from scratch.

---

### 📂 `public/`
Static assets served directly to the client's browser.
* 📁 `assets/` — Images of the cars listed on the marketplace (`acadia-1.jpg`, `charger-2.jpg`, etc.) served publicly via URL.
* 📄 `favicon.ico` — The browser tab shortcut icon.

---

### 📂 Internal / Compiled Folders (Safe to ignore)
* 📁 `.next/` — Compiled production build outputs and caching folder generated automatically by Next.js.
* 📁 `node_modules/` — Installed local third-party npm package dependencies.
* 📁 `.git/` — Project version control directory.
