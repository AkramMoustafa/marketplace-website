const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000';

// Maps user-facing type → query params for /api/vehicles
const TYPE_MAP = {
  suv:      { search: 'SUV' },
  sedan:    { search: 'Sedan' },
  truck:    { search: 'Truck' },
  electric: { fuel_type: 'electric' },
  hybrid:   { fuel_type: 'hybrid' },
  coupe:    { search: 'Coupe' },
  convertible: { search: 'Convertible' },
  van:      { search: 'Van' },
  minivan:  { search: 'Minivan' },
};

export const definition = {
  type: 'function',
  function: {
    name: 'check_inventory',
    description: 'Browse real available inventory filtered by vehicle type.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Vehicle category: "SUV", "sedan", "truck", "electric", "hybrid", "coupe"' },
      },
      required: ['type'],
    },
  },
};

export async function handler({ type }) {
  const key = type.toLowerCase().replace(/s$/, '');
  const queryMap = TYPE_MAP[key];

  if (!queryMap) {
    return { found: false, message: `I can search for SUVs, sedans, trucks, electric, or hybrid vehicles. Which would you like?` };
  }

  const params = new URLSearchParams({ status: 'available', page_size: '6', ...queryMap });
  const res = await fetch(`${FASTAPI}/api/vehicles?${params}`);
  if (!res.ok) throw new Error('Could not reach inventory system');

  const data = await res.json();
  const vehicles = data.items ?? [];

  if (!vehicles.length) {
    return { found: false, message: `We don't have any ${type}s in stock right now. I can notify you when one arrives — want to leave your info?` };
  }

  const list = vehicles.map(v => {
    const price = v.price_on_call ? 'Call for price' : `$${parseFloat(v.price).toLocaleString()}`;
    return `• ${v.year} ${v.make} ${v.model}${v.color ? ` (${v.color})` : ''} — ${price} | ${v.mileage.toLocaleString()} mi | ${v.status}`;
  }).join('\n');

  return {
    found: true,
    count: vehicles.length,
    vehicles: vehicles.map(v => ({
      id: v.id,
      title: v.title,
      year: v.year,
      make: v.make,
      model: v.model,
      price: v.price_on_call ? 'Call for price' : `$${parseFloat(v.price).toLocaleString()}`,
      mileage: `${v.mileage.toLocaleString()} mi`,
      status: v.status,
      color: v.color,
    })),
    message: `Here are our available ${type}s (${vehicles.length} found):\n\n${list}\n\nWant details on any of these or to schedule a test drive?`,
  };
}
