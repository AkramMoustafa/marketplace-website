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

import type { Vehicle as ApiVehicle } from '@/lib/types';
import type {
  Vehicle as DetailVehicle,
  VehicleImage,
  DescriptionSection,
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
function toVehicleImages(urls: string[] | undefined | null, title: string): VehicleImage[] {
  if (!urls?.length) return [];
  return urls.map((url, i) => ({
    full:  url,
    thumb: url,
    alt:   `${title} – photo ${i + 1}`,
  }));
}

/** Wrap a plain description string into a single DescriptionSection. */
function toDescriptionSections(desc: string | null | undefined): DescriptionSection[] {
  if (!desc?.trim()) return [];
  return [
    {
      level:      'h2',
      heading:    'About This Vehicle',
      paragraphs: [desc],
    },
  ];
}

/* ─── Adapter ───────────────────────────────────────────────────────── */

/**
 * Map a backend API Vehicle to the DetailVehicle shape.
 *
 * Usage:
 *   const detail = mapBackendVehicleToDetailVehicle(apiVehicle);
 *   return <VehicleDetail vehicle={detail} />;
 */
export function mapBackendVehicleToDetailVehicle(v: ApiVehicle): DetailVehicle {
  return {
    /* ── Always present ───────────────────────────────────── */
    id:    v.id,
    title: v.title ?? 'Vehicle',

    /* ── Identity / listing ───────────────────────────────── */
    trim:        undefined,                        // not in backend schema
    stockNumber: undefined,                        // not in backend schema
    vin:         v.vin     || undefined,

    /* ── Pricing ──────────────────────────────────────────── */
    price: v.price_on_call
      ? undefined                                  // sidebar shows "Call for Price"
      : (v.price ? parseFloat(v.price) : undefined),

    /* ── Vehicle info ─────────────────────────────────────── */
    odometer:     v.mileage   ?? undefined,
    color:        v.color     ?? undefined,
    type:         v.body_type ?? undefined,
    transmission: v.transmission
      ? v.transmission.charAt(0).toUpperCase() + v.transmission.slice(1)
      : undefined,
    engine:       undefined,                       // not in backend schema
    drive:        undefined,                       // not in backend schema
    fuel:         fmtFuelType(v.fuel_type) || undefined,
    fuelEconomy:  undefined,                       // not in backend schema

    /* ── Rich content ─────────────────────────────────────── */
    specs:              [],                        // not in backend schema
    images:             toVehicleImages(v.images, v.title ?? 'Vehicle'),
    descriptionSections: toDescriptionSections(v.description),
    similarVehicles:    [],                        // populated separately if needed
  };
}
