// Static inventory — replace with API fetch when backend is ready.
// Component interfaces depend only on the Car type below, not on this file.

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  bodyStyle: string;
  engine: string;
  description: string;
  features: string[];
  images: string[]; // absolute URLs or /uploads/… paths; empty = show placeholder
}

export const cars: Car[] = [
  {
    id: 'bmw-m3-2023',
    make: 'BMW',
    model: 'M3 Competition',
    year: 2023,
    price: 89500,
    mileage: 5200,
    exteriorColor: 'Brooklyn Grey Metallic',
    interiorColor: 'Merino Leather / Black',
    vin: 'WBS43AY06PCM12345',
    transmission: '8-Speed M DCT',
    drivetrain: 'RWD',
    fuelType: 'Gasoline',
    bodyStyle: 'Sedan',
    engine: '3.0L Twin-Turbo I6 — 503 hp',
    description: [
      "This immaculate 2023 BMW M3 Competition is a true driver's machine with only 5,200 miles on the odometer. Finished in the exclusive Brooklyn Grey Metallic, this is one of the sharpest M3s currently available.",
      "Powered by BMW's legendary S58 3.0L Twin-Turbocharged inline-six producing 503 horsepower, paired with the lightning-quick 8-speed M DCT transmission. The result is 0–60 mph in just 3.8 seconds with an exhaust note that is unmistakably M.",
      "The interior is finished in full Merino leather with contrast stitching, carbon fibre trim, and the M-specific instrument cluster. One owner. No accidents. Clean Carfax. All service records on file.",
    ].join('\n\n'),
    features: [
      "M Driver's Package",
      'Harman Kardon Surround Sound',
      'Carbon Fibre Interior Trim',
      'Heated & Cooled Front Seats',
      'Head-Up Display',
      'Apple CarPlay & Android Auto',
      'M Adaptive Suspension',
      'Parking Assistant Plus',
      'Lane Departure Warning',
      'Blind Spot Detection',
      'Active Exhaust System',
      'M Carbon Ceramic Brakes',
      'Adaptive LED Headlights',
      'Wireless Charging',
      'Gesture Control',
      'Backup Camera',
    ],
    images: [],
  },

  {
    id: 'tesla-model3-2021',
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2021,
    price: 38500,
    mileage: 28400,
    exteriorColor: 'Pearl White Multi-Coat',
    interiorColor: 'All-Black',
    vin: '5YJ3E1EA9MF123456',
    transmission: 'Single-Speed Fixed Gear',
    drivetrain: 'AWD — Dual Motor',
    fuelType: 'Electric',
    bodyStyle: 'Sedan',
    engine: 'Dual Motor Electric — 358 mi range',
    description: [
      'This stunning 2021 Tesla Model 3 Long Range AWD delivers the perfect blend of technology, performance, and sustainability. With 28,400 miles and a spotless history, it represents exceptional value in today\'s market.',
      'The Dual Motor AWD configuration launches this Model 3 to 60 mph in just 4.2 seconds while returning an EPA-estimated 358 miles of range per charge — more than enough for daily commuting and long-distance travel alike.',
      'The minimalist all-black interior revolves around the iconic 15" touchscreen. Full Autopilot, over-the-air updates, and Supercharger network access make ownership genuinely effortless. Still under Tesla\'s 8-year/150,000-mile battery warranty.',
    ].join('\n\n'),
    features: [
      'Full Self-Driving Capability',
      'Autopilot',
      '15" Touchscreen',
      'Over-the-Air Software Updates',
      'Panoramic Glass Roof',
      'Supercharger Network Access',
      'Premium Audio — 14 Speakers',
      'Wireless Phone Charging',
      'Heated Front & Rear Seats',
      'Auto-Dimming Mirrors',
      'Sentry Mode',
      'Dog Mode & Camp Mode',
      'Live Navigation with Traffic',
      'Regenerative Braking',
      'Remote Climate Control',
      'Backup Camera',
    ],
    images: [],
  },

  {
    id: 'toyota-camry-2016',
    make: 'Toyota',
    model: 'Camry SE',
    year: 2016,
    price: 16995,
    mileage: 68200,
    exteriorColor: 'Midnight Black Metallic',
    interiorColor: 'Ivory',
    vin: '4T1BF1FK8GU123456',
    transmission: '6-Speed Automatic',
    drivetrain: 'FWD',
    fuelType: 'Gasoline',
    bodyStyle: 'Sedan',
    engine: '2.5L 4-Cylinder — 178 hp',
    description: [
      'This well-maintained 2016 Toyota Camry SE represents outstanding value and proven Japanese reliability. With 68,200 miles and a clean single-owner history, this Camry has decades of dependable driving left.',
      'The Midnight Black Metallic exterior is sharp and timeless, while the Ivory interior remains in excellent condition. The SE trim adds sport-tuned suspension, chrome exhaust tips, and a more dynamic appearance over the base model.',
      "Toyota's proven 2.5L four-cylinder returns up to 33 MPG highway. Fresh full service completed, new tyres, brakes at 70%. All records available on request.",
    ].join('\n\n'),
    features: [
      'Toyota Safety Sense',
      'Pre-Collision System',
      'Lane Departure Alert',
      'Automatic High Beams',
      'Backup Camera',
      'Bluetooth Connectivity',
      'Keyless Entry',
      'Push-Button Start',
      'Dual-Zone Climate Control',
      'Heated Front Seats',
      'Sport-Tuned Suspension',
      'LED Daytime Running Lights',
      '7" Touchscreen Display',
      'USB & Aux Input',
      'Remote Start',
      'Apple CarPlay Compatible',
    ],
    images: [],
  },
];

export function getCarById(id: string): Car | undefined {
  return cars.find(c => c.id === id);
}

export function getRelatedCars(currentId: string, count = 3): Car[] {
  return cars.filter(c => c.id !== currentId).slice(0, count);
}
