export interface Car {
  id: string;
  stockNumber: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: "Automatic" | "Manual";
  fuelType: "Gasoline" | "Diesel" | "Hybrid" | "Electric";
  price: number;
  color: string;
  location: string;
  status: "available" | "sold";
  description: string;
  features: string[];
  financing: string;
  images: string[];
}

export const cars: Car[] = [
  {
    id: "1",
    stockNumber: "LX-001",
    title: "2024 Mercedes-Benz S-Class",
    brand: "Mercedes-Benz",
    model: "S-Class",
    year: 2024,
    mileage: 1200,
    transmission: "Automatic",
    fuelType: "Hybrid",
    price: 128900,
    color: "Obsidian Black",
    location: "Downtown Showroom · New York",
    status: "available",
    description:
      "The pinnacle of automotive luxury, the 2024 Mercedes-Benz S-Class redefines what a luxury sedan can be. With its cutting-edge MBUX Hyperscreen and advanced air suspension, every journey becomes an event. This nearly-new example features the Executive Rear Seat Package and panoramic sliding sunroof.",
    features: [
      "MBUX Hyperscreen (56-inch display)",
      "Executive Rear Seat Package",
      "Burmester 4D Surround Sound",
      "Air Body Control suspension",
      "Night Vision Assist",
      "Augmented Reality Navigation",
      "Massage seats (front & rear)",
      "Head-Up Display",
      "Keyless-Go system",
      "Heated & ventilated seats",
    ],
    financing: "As low as $1,890/mo with approved credit. 0% APR available for qualified buyers for 24 months.",
    images: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&q=80",
    ],
  },
  {
    id: "2",
    stockNumber: "LX-002",
    title: "2023 BMW 7 Series",
    brand: "BMW",
    model: "7 Series",
    year: 2023,
    mileage: 8400,
    transmission: "Automatic",
    fuelType: "Hybrid",
    price: 109500,
    color: "Alpine White",
    location: "Westside Gallery · Los Angeles",
    status: "available",
    description:
      "The BMW 7 Series represents the ultimate expression of BMW's design philosophy and technological prowess. This 2023 model features the revolutionary Theatre Screen — a 31.3-inch 8K display for rear passengers — along with the iconic Swarovski crystal headlights. A genuine chauffeur-driven luxury experience.",
    features: [
      "Theatre Screen (31.3-inch 8K display)",
      "Swarovski crystal headlights",
      "Bowers & Wilkins Diamond Surround Sound",
      "Active comfort seats with Shiatsu massage",
      "Sky Lounge panoramic roof",
      "BMW Live Cockpit Professional",
      "Driving Assistant Professional",
      "Soft-close doors",
      "Four-zone climate control",
      "Wireless charging & Wi-Fi hotspot",
    ],
    financing: "Starting at $1,640/mo with 10% down. BMW Financial Services special rates available.",
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
      "https://images.unsplash.com/photo-1617531653332-bd46c16f4d68?w=1200&q=80",
      "https://images.unsplash.com/photo-1622194992356-b33a8a6a0a34?w=1200&q=80",
      "https://images.unsplash.com/photo-1543796076-c8a7e015a1e3?w=1200&q=80",
    ],
  },
  {
    id: "3",
    stockNumber: "LX-003",
    title: "2023 Rolls-Royce Ghost",
    brand: "Rolls-Royce",
    model: "Ghost",
    year: 2023,
    mileage: 3100,
    transmission: "Automatic",
    fuelType: "Gasoline",
    price: 389000,
    color: "Arctic White",
    location: "Flagship Lounge · Beverly Hills",
    status: "available",
    description:
      "Effortless everywhere — the Rolls-Royce Ghost is a masterpiece of post-opulent design. This example is finished in Arctic White over a bespoke Seashell leather interior with starlight headliner. The Gallery dashboard features a hand-crafted art installation unique to this vehicle, making it a true collector's piece.",
    features: [
      "Starlight Headliner (1,344 fiber-optic lights)",
      "Bespoke Gallery dashboard",
      "Seashell full-grain leather interior",
      "Flagbearer self-leveling hood ornament",
      "Whisper-quiet cabin acoustics",
      "Rear theatre configuration",
      "Night Vision camera system",
      "Satellite Aided Transmission",
      "Ambient lighting (27 colors)",
      "Champagne cooler & flute set",
    ],
    financing: "Private banking and bespoke financing solutions available. Contact our Financial Concierge.",
    images: [
      "https://images.unsplash.com/photo-1631295387526-d4c27d934e77?w=1200&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=80",
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200&q=80",
    ],
  },
  {
    id: "4",
    stockNumber: "LX-004",
    title: "2024 Porsche 911 Turbo S",
    brand: "Porsche",
    model: "911 Turbo S",
    year: 2024,
    mileage: 580,
    transmission: "Automatic",
    fuelType: "Gasoline",
    price: 232400,
    color: "Guards Red",
    location: "Performance Center · Miami",
    status: "available",
    description:
      "The 911 Turbo S is the apex predator of the sports car world, now even more refined. This Guards Red example is optioned with the Lightweight Sport Package, carbon ceramic brakes, and the Sport Chrono Package. With 650 horsepower and a 2.6-second 0-60 time, it is the ultimate daily driver.",
    features: [
      "650 hp twin-turbo flat-six engine",
      "Sport Chrono Package with Porsche Track Precision App",
      "Carbon ceramic composite brakes",
      "Lightweight Sport Package",
      "Porsche Active Suspension Management",
      "Rear-axle steering",
      "LED matrix headlights",
      "Bose Surround Sound system",
      "Sport Design steering wheel",
      "Porsche Communication Management (PCM)",
    ],
    financing: "Porsche Financial Services: 36-month lease from $3,290/mo. Purchase financing from 4.9% APR.",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=80",
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200&q=80",
      "https://images.unsplash.com/photo-1572441713132-c542fc4fe282?w=1200&q=80",
    ],
  },
  {
    id: "5",
    stockNumber: "LX-005",
    title: "2022 Bentley Continental GT",
    brand: "Bentley",
    model: "Continental GT",
    year: 2022,
    mileage: 14200,
    transmission: "Automatic",
    fuelType: "Gasoline",
    price: 248000,
    color: "Verdant",
    location: "Grand Avenue · Chicago",
    status: "available",
    description:
      "The Bentley Continental GT is the definitive grand tourer — a car that blends hand-crafted luxury with genuine performance. This stunning Verdant example features the Mulliner Driving Specification with diamond-knurled controls and a rotating dashboard. The 6.0L W12 engine delivers effortless 626 horsepower.",
    features: [
      "6.0L W12 twin-turbocharged engine (626 hp)",
      "Mulliner Driving Specification",
      "Rotating Dashboard (3 configurations)",
      "Diamond-knurled controls",
      "Naim for Bentley audio system",
      "Three-chamber air suspension",
      "Bentley Dynamic Ride (48V anti-roll)",
      "Dual-veneer wood interior panels",
      "Heated & ventilated front/rear seats",
      "Panoramic glass sunroof",
    ],
    financing: "Bentley Financial Services tailored solutions. Ask about our 60-month fixed-rate program.",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80",
      "https://images.unsplash.com/photo-1541443131876-2ed280526551?w=1200&q=80",
    ],
  },
  {
    id: "6",
    stockNumber: "LX-006",
    title: "2023 Lamborghini Huracán",
    brand: "Lamborghini",
    model: "Huracán EVO",
    year: 2023,
    mileage: 2800,
    transmission: "Automatic",
    fuelType: "Gasoline",
    price: 298500,
    color: "Arancio Borealis",
    location: "Performance Center · Miami",
    status: "sold",
    description:
      "The Huracán EVO represents the natural evolution of the most successful V10-powered Lamborghini ever built. In stunning Arancio Borealis orange, this example features the full Sensonum audio system, magnetic suspension, and carbon ceramic brakes. A true Italian masterpiece that commands every road.",
    features: [
      "5.2L naturally-aspirated V10 (640 hp)",
      "Lamborghini Dinamica Veicolo Integrata (LDVI)",
      "Carbon ceramic brakes",
      "Magnetic suspension",
      "Sensonum premium audio system",
      "Full carbon fiber interior package",
      "Forged composite wheels",
      "Rear-wheel steering",
      "Launch control system",
      "Carbon fiber roof panel",
    ],
    financing: "Sold — vehicle no longer available for purchase.",
    images: [
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200&q=80",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=80",
      "https://images.unsplash.com/photo-1570733577524-3a047079e80d?w=1200&q=80",
      "https://images.unsplash.com/photo-1518987048-93e29699e79a?w=1200&q=80",
    ],
  },
  {
    id: "7",
    stockNumber: "LX-007",
    title: "2022 Aston Martin DB11",
    brand: "Aston Martin",
    model: "DB11",
    year: 2022,
    mileage: 9600,
    transmission: "Automatic",
    fuelType: "Gasoline",
    price: 198000,
    color: "Cinnabar Orange",
    location: "Heritage Gallery · London District, NYC",
    status: "available",
    description:
      "With its stunning aeroblade technology and twin-turbocharged V12, the Aston Martin DB11 is the quintessential British grand tourer. This Cinnabar Orange example is optioned with the full Premium Audio Package and contrast stitching throughout. It is the perfect marriage of art and engineering.",
    features: [
      "5.2L twin-turbo V12 (630 hp)",
      "Aeroblade invisible rear wing",
      "Premium Bang & Olufsen audio",
      "Adaptive Damping System",
      "Aston Martin Emotion Control Unit",
      "Full leather Alcantara interior",
      "Driver Display with custom themes",
      "Heated & ventilated seats",
      "Electric power-folding mirrors",
      "Keyless entry & start",
    ],
    financing: "36-month lease from $2,890/mo. Finance from 5.4% APR with Aston Martin Financial Services.",
    images: [
      "https://images.unsplash.com/photo-1574023278400-dfc81d20f4b1?w=1200&q=80",
      "https://images.unsplash.com/photo-1547744152-14d985cb937f?w=1200&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80",
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=1200&q=80",
    ],
  },
  {
    id: "8",
    stockNumber: "LX-008",
    title: "2021 Ferrari Roma",
    brand: "Ferrari",
    model: "Roma",
    year: 2021,
    mileage: 5200,
    transmission: "Automatic",
    fuelType: "Gasoline",
    price: 275000,
    color: "Rosso Portofino",
    location: "Flagship Lounge · Beverly Hills",
    status: "available",
    description:
      "The Ferrari Roma captures the carefree, pleasurable lifestyle of 1950s and 1960s Rome's Dolce Vita in a thoroughly modern package. In iconic Rosso Portofino, this example features the full Leather Interior Pack and Daytona-style racing seats. The 3.9L twin-turbo V8 delivers 612 horsepower with an operatic soundtrack.",
    features: [
      "3.9L twin-turbo V8 (612 hp)",
      "8-speed dual-clutch F1 transmission",
      "Daytona-style racing seats",
      "Ferrari Integrated Boost Injector",
      "Side Slip Control 6.1",
      "16-speaker Hi-Fi sound system",
      "Manettino driving mode selector",
      "Full leather interior pack",
      "Carbon fiber interior accents",
      "Apple CarPlay integration",
    ],
    financing: "Ferrari Approved Programme financing available. Contact our specialists for bespoke solutions.",
    images: [
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=1200&q=80",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80",
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&q=80",
    ],
  },
];

export function getCarById(id: string): Car | undefined {
  return cars.find((car) => car.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("en-US").format(mileage) + " mi";
}
