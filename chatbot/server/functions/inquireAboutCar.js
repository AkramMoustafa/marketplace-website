const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000';
const BASE_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export const definition = {
  type: 'function',
  function: {
    name: 'inquire_about_car',
    description: 'Look up a specific vehicle by make and model from real inventory. Returns price, mileage, features, availability.',
    parameters: {
      type: 'object',
      properties: {
        make:  { type: 'string', description: 'Manufacturer (e.g. Toyota, Honda, Ford)' },
        model: { type: 'string', description: 'Model name (e.g. Camry, Civic, F-150)' },
        year:  { type: 'number', description: 'Model year (optional)' },
      },
      required: ['make', 'model'],
    },
  },
};

export async function handler({ make, model, year }) {
  const params = new URLSearchParams({ make, model, status: 'available', page_size: '5' });
  if (year) params.set('year_min', String(year)), params.set('year_max', String(year));

  const res = await fetch(`${FASTAPI}/api/vehicles?${params}`);
  if (!res.ok) throw new Error('Could not reach inventory system');

  const data = await res.json();
  const vehicles = data.items ?? [];

  if (!vehicles.length) {
    return {
      found: false,
      message: `We don't currently have a ${year ?? ''} ${make} ${model} in stock. I can check similar options or have someone contact you — which would you prefer?`,
    };
  }

  const v = vehicles[0];
  const price = v.price_on_call ? 'Call for price' : `$${parseFloat(v.price).toLocaleString()}`;
  const features = v.features?.slice(0, 4).join(', ') || 'Contact us for full feature list';
  const img = v.images?.[0] ? `${BASE_URL}${v.images[0]}` : null;

  return {
    found: true,
    id: v.id,
    title: v.title,
    price,
    mileage: `${v.mileage.toLocaleString()} mi`,
    status: v.status,
    color: v.color,
    transmission: v.transmission,
    fuel_type: v.fuel_type,
    engine: v.engine,
    features,
    image: img,
    message: `The ${v.title} is priced at ${price} with ${v.mileage.toLocaleString()} miles and is currently ${v.status}. ${v.engine ? `Engine: ${v.engine}. ` : ''}Key features: ${features}.`,
  };
}
