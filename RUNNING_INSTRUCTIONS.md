# Running the Marketplace Website Project

This project is built using **Next.js** (App Router), which integrates both the **frontend** (user interface, components) and the **backend** (Prisma ORM, database client, PostgreSQL connection, and server actions/data fetching) into a single, unified codebase.

Follow the instructions below to get both the frontend and backend running on your local machine.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
1. **Node.js** (v18.x or higher recommended)
2. **npm** (comes packaged with Node.js)
3. **PostgreSQL** database (running locally or hosted)

---

## 🛠️ Step 1: Clone & Install Dependencies

1. Navigate to the project root directory:
   ```bash
   cd c:\Users\abdul\Desktop\marketplace-website
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

---

## 🗄️ Step 2: Database Configuration (Backend)

The project uses **Prisma** to communicate with a **PostgreSQL** database.

1. **Configure Environment Variables**:
   In the root directory, you will find a `.env` file. Open it and update the `DATABASE_URL` with your PostgreSQL database credentials:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"
   ```
   *Example:*
   ```env
   DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/marketplace_db?schema=public"
   ```

2. **Push the Schema to Database**:
   Run the following command to sync your Prisma schema (`prisma/schema.prisma`) with your database. This will automatically create the necessary database tables (such as the `Car` table):
   ```bash
   npx prisma db push
   ```

3. **Seed the Database**:
   Populate your database with the mock car listings by running the seed script:
   ```bash
   npx prisma db seed
   ```
   *(Alternatively, run `npx tsx prisma/seed.ts` if your environment requires direct typescript execution).*

---

## 🚀 Step 3: Run the Development Server (Frontend & Backend)

Since Next.js runs both the frontend interface and backend server-side operations together, starting the development server starts both at once.

1. **Start the Dev Server**:
   ```bash
   npm run dev
   ```

2. **Access the Web App**:
   Open your browser and navigate to:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🏗️ Production Build

To build the application for production deployment:

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Start the Production Server**:
   ```bash
   npm run start
   ```

---

## 📂 Project Structure Overview

- 🖥️ **Frontend / Pages**:
  - `app/` - Next.js page routes, layouts, and views.
  - `components/` - Reusable React UI elements (buttons, cards, layout structures).
  - `assets/` / `public/` - Static assets, images, and brand files.

- ⚙️ **Backend / Database Layer**:
  - `prisma/schema.prisma` - The PostgreSQL database schema definition.
  - `prisma/seed.ts` - Scripts to seed the database with initial items.
  - `lib/db.ts` - Database client initializer utilizing Prisma and Postgres connection pools.
  - `lib/data.ts` - Data fetching logic and queries to the database.
