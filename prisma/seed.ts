import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const initialCars = [
  {
    stockNumber: "P48231",
    name: "2017 GMC ACADIA SLT-1",
    make: "GMC",
    year: 2017,
    price: null, // null represents 'Call'
    images: ["/assets/acadia-1.jpg", "/assets/acadia-2.jpg", "/assets/acadia-3.jpg", "/assets/acadia-4.jpg"],
    status: "available",
  },
  {
    stockNumber: "P48302",
    name: "2020 DODGE CHARGER SXT",
    make: "Dodge",
    year: 2020,
    price: 16690,
    images: ["/assets/charger-1.jpg", "/assets/charger-2.jpg", "/assets/charger-3.jpg", "/assets/charger-4.jpg"],
    status: "available",
  },
  {
    stockNumber: "P47918",
    name: "2019 BUICK ENCORE SPORT TOURING",
    make: "Buick",
    year: 2019,
    price: null, // null represents 'Call'
    images: ["/assets/encore-1.jpg", "/assets/encore-2.jpg", "/assets/encore-3.jpg", "/assets/encore-4.jpg"],
    status: "available",
  },
  {
    stockNumber: "P48544",
    name: "2023 CHEVROLET MALIBU 1LT",
    make: "Chevrolet",
    year: 2023,
    price: 16990,
    images: ["/assets/malibu-1.jpg", "/assets/malibu-2.jpg", "/assets/malibu-3.jpg", "/assets/malibu-4.jpg"],
    status: "available",
  },
  {
    stockNumber: "P48617",
    name: "2020 CADILLAC XT4 PREMIUM LUXURY",
    make: "Cadillac",
    year: 2020,
    price: 17490,
    images: ["/assets/xt4-1.jpg", "/assets/xt4-2.jpg", "/assets/xt4-3.jpg", "/assets/xt4-4.jpg"],
    status: "available",
  },
];

async function main() {
  console.log("Seeding database...");
  
  // Clear existing cars to prevent unique stockNumber key constraint errors
  await prisma.car.deleteMany();

  for (const car of initialCars) {
    await prisma.car.create({
      data: car,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
