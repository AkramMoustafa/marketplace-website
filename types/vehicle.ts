/* ─────────────────────────────────────────────────────────────────
   Vehicle type definitions — used by VehicleDetail component.
   All fields except `id` and `title` are optional so the component
   stays stable when the backend omits them.

   Field alignment with lib/types.ts (backend DTO):
     stockNumber  ← stock_number
     odometer     ← mileage
     type         ← body_type
     fuel         ← fuel_type  (formatted)
     fuelEconomy  ← fuel_economy  (free-form string, e.g. "16 city / 23 hwy")
     specs        ← features  (string[])
   ───────────────────────────────────────────────────────────────── */

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
  /* Required — always present */
  id: string;
  title: string;

  /* Optional — backend may omit any of these */
  trim?: string;
  price?: number;
  vin?: string;
  stockNumber?: string;
  odometer?: number;
  color?: string;
  type?: string;
  transmission?: string;
  engine?: string;
  drive?: string;
  fuel?: string;
  /** Free-form string as entered by admin, e.g. "16 city / 23 highway". */
  fuelEconomy?: string;
  specs?: string[];
  images?: VehicleImage[];
  descriptionSections?: DescriptionSection[];
  similarVehicles?: SimilarVehicle[];
}
