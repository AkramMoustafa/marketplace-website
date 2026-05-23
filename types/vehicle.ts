/* ─────────────────────────────────────────────────────────────────
   Vehicle type definitions — used by VehicleDetail component
   ───────────────────────────────────────────────────────────────── */

export interface FuelEconomy {
  city: number;
  highway: number;
}

export interface VehicleImage {
  full: string;
  thumb: string;
  alt: string;
}

/**
 * One visual block in the "About This Vehicle" prose section.
 * Paragraphs may contain safe inline HTML such as <strong> tags.
 */
export interface DescriptionSection {
  heading: string;
  /** Rendered heading level */
  level: 'h2' | 'h3';
  /** Empty array is valid (heading-only block, e.g. "FAQs" divider). */
  paragraphs: string[];
}

export interface SimilarVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  stockNumber: string;
  /** null renders as "Call for Price" */
  price: number | null;
  image: string;
  imageAlt: string;
}

export interface Vehicle {
  id: string;
  title: string;
  trim: string;
  price: number;
  vin: string;
  stockNumber: string;
  odometer: number;
  color: string;
  type: string;
  transmission: string;
  engine: string;
  drive: string;
  fuel: string;
  fuelEconomy: FuelEconomy;
  specs: string[];
  images: VehicleImage[];
  descriptionSections: DescriptionSection[];
  similarVehicles: SimilarVehicle[];
}
