import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Use the DATABASE_URL environment variable,   or a safe default string to prevent startup crashes
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mydb";

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
}

export const db = prisma;
