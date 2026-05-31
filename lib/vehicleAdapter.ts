/**
 * vehicleAdapter.ts
 *
 * Maps the backend API DTO (lib/types.ts → Vehicle) to the shape that
 * VehicleDetail.tsx expects (types/vehicle.ts → Vehicle).
 *
 * Keep all field mapping logic here. The UI component never touches raw
 * API responses directly — if the backend schema changes, only update
 * this file.
 */

import type { Vehicle as ApiVehicle, VehicleListItem } from '@/lib/types';
import type {
  Vehicle as DetailVehicle,
  VehicleImage,
  DescriptionSection,
  SimilarVehicle,
} from '@/types/vehicle';

/* ─── Helpers ───────────────────────────────────────────────────────── */

/** "plug_in_hybrid" → "Plug In Hybrid" */
function fmtFuelType(raw: string | undefined | null): string {
  if (!raw) return '';

  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Convert raw image URLs to VehicleImage objects. */
function toVehicleImages(
  urls: string[] | undefined | null,
  title: string
): VehicleImage[] {
  if (!urls?.length) return [];

  return urls.map((url, i) => ({
    full: url,
    thumb: url,
    alt: `${title} – photo ${i + 1}`,
  }));
}

/** Wrap description into display sections. */
function toDescriptionSections(
  desc: string | null | undefined
): DescriptionSection[] {
  if (!desc?.trim()) return [];

  return [
    {
      level: 'h2',
      heading: 'About This Vehicle',
      paragraphs: [desc],
    },
  ];
}

/* ─── Adapter ───────────────────────────────────────────────────────── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function toImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export function mapSimilarVehicles(items: VehicleListItem[]): SimilarVehicle[] {
  return items.map(v => ({
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: '',
    stockNumber: v.stock_number ?? '',
    price: v.price_on_call ? null : parseFloat(v.price),
    image: toImageUrl(v.images?.[0] ?? null),
    imageAlt: v.title,
  }));
}

/**
 * Map backend API Vehicle → DetailVehicle
 */
export function mapBackendVehicleToDetailVehicle(v: ApiVehicle, similar: VehicleListItem[] = []): DetailVehicle {

  console.log("ADAPTER INPUT:", {
    stock_number: v.stock_number,
    engine: v.engine,
    drive: v.drive,
    fuel_economy: v.fuel_economy
  });

  const result = {
    id: v.id,
    title: v.title ?? "Vehicle",

    trim: undefined,
    stockNumber: v.stock_number ?? undefined,
    vin: v.vin ?? undefined,

    price: v.price_on_call
      ? undefined
      : (v.price ? parseFloat(v.price) : undefined),

    odometer: v.mileage ?? undefined,
    color: v.color ?? undefined,
    type: v.body_type ?? undefined,

    transmission: v.transmission
      ? v.transmission.charAt(0).toUpperCase() + v.transmission.slice(1)
      : undefined,

    engine: v.engine ?? undefined,
    drive: v.drive ?? undefined,

    fuel: fmtFuelType(v.fuel_type) || undefined,

    fuelEconomy: undefined, // ignore for now

    specs: v.features ?? [],
    images: toVehicleImages(v.images, v.title ?? "Vehicle"),
    descriptionSections: toDescriptionSections(v.description),
    similarVehicles: mapSimilarVehicles(similar),
  };

  console.log("ADAPTER OUTPUT:", result);

  return result;
}