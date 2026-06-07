import VehicleDetail from '@/components/VehicleDetail';
import { getVehicle, getSimilarVehicles } from '@/lib/api';
import { mapBackendVehicleToDetailVehicle } from '@/lib/vehicleAdapter';

// Opt this route out of static generation and Next.js Data Cache so every
// request fetches a fresh vehicle from FastAPI.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function VehicleDetailPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams.id ?? '1';

  let vehicle;

  try {
    const [apiVehicle, similar] = await Promise.all([
      getVehicle(id),
      getSimilarVehicles(id).catch(() => []),
    ]);

    console.log('========== RAW API VEHICLE ==========');
    console.log(apiVehicle);
    console.log('stock_number:', apiVehicle?.stock_number);
    console.log('engine:', apiVehicle?.engine);
    console.log('drive:', apiVehicle?.drive);
    console.log('fuel_economy:', apiVehicle?.fuel_economy);

    vehicle = mapBackendVehicleToDetailVehicle(apiVehicle, similar);

    console.log('========== MAPPED VEHICLE ==========');
    console.log(vehicle);
    console.log('stockNumber:', vehicle?.stockNumber);
    console.log('engine:', vehicle?.engine);
    console.log('drive:', vehicle?.drive);
    console.log('fuelEconomy:', vehicle?.fuelEconomy);

  } catch (err) {
    console.error('VEHICLE DETAIL ERROR:', err);

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f7fa',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p
            style={{
              color: '#888',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {err instanceof Error
              ? err.message
              : 'Vehicle not found'}
          </p>

          <a
            href="/inventory"
            style={{
              color: '#B22222',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ← Back to Inventory
          </a>
        </div>
      </div>
    );
  }

  return <VehicleDetail vehicle={vehicle} />;
}