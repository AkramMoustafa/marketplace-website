import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const INVENTORY = {
  suv: [
    { year: 2024, make: 'Toyota', model: 'RAV4', price: '$32,500', mileage: '0 mi', status: 'In Stock', color: 'Midnight Black' },
    { year: 2024, make: 'Honda', model: 'CR-V', price: '$31,000', mileage: '0 mi', status: 'In Stock', color: 'Sonic Silver' },
    { year: 2023, make: 'Ford', model: 'Explorer', price: '$44,995', mileage: '8,200 mi', status: 'Certified Pre-Owned', color: 'Oxford White' },
    { year: 2024, make: 'Hyundai', model: 'Tucson', price: '$28,400', mileage: '0 mi', status: 'In Stock', color: 'Phantom Black' },
  ],
  sedan: [
    { year: 2024, make: 'Toyota', model: 'Camry', price: '$28,995', mileage: '0 mi', status: 'In Stock', color: 'Midnight Black' },
    { year: 2024, make: 'Honda', model: 'Accord', price: '$27,500', mileage: '0 mi', status: 'In Stock', color: 'Lunar Silver' },
    { year: 2024, make: 'BMW', model: '3 Series', price: '$46,900', mileage: '0 mi', status: 'In Stock', color: 'Alpine White' },
    { year: 2023, make: 'Mazda', model: 'Mazda6', price: '$24,800', mileage: '5,100 mi', status: 'Certified Pre-Owned', color: 'Machine Gray' },
    { year: 2024, make: 'Hyundai', model: 'Sonata', price: '$25,000', mileage: '0 mi', status: 'In Stock', color: 'Shimmering Silver' },
  ],
  truck: [
    { year: 2024, make: 'Ford', model: 'F-150', price: '$42,500', mileage: '0 mi', status: 'In Stock', color: 'Atlas Blue' },
    { year: 2024, make: 'Chevrolet', model: 'Silverado 1500', price: '$40,200', mileage: '0 mi', status: 'In Stock', color: 'Summit White' },
    { year: 2023, make: 'RAM', model: '1500', price: '$38,995', mileage: '12,000 mi', status: 'Certified Pre-Owned', color: 'Granite Crystal' },
    { year: 2024, make: 'Toyota', model: 'Tundra', price: '$47,000', mileage: '0 mi', status: 'In Stock', color: 'Super White' },
  ],
  electric: [
    { year: 2024, make: 'Tesla', model: 'Model 3', price: '$40,240', mileage: '0 mi', status: 'Order Available', range: '358 mi' },
    { year: 2024, make: 'Tesla', model: 'Model Y', price: '$45,990', mileage: '0 mi', status: 'Order Available', range: '330 mi' },
    { year: 2024, make: 'Ford', model: 'Mustang Mach-E', price: '$42,995', mileage: '0 mi', status: 'In Stock', range: '312 mi' },
    { year: 2024, make: 'Hyundai', model: 'IONIQ 6', price: '$38,615', mileage: '0 mi', status: 'In Stock', range: '361 mi' },
    { year: 2024, make: 'Chevrolet', model: 'Equinox EV', price: '$34,995', mileage: '0 mi', status: 'Coming Soon', range: '319 mi' },
  ],
};

export const checkInventoryTool = tool(
  async ({ type }) => {
    const normalised = type.toLowerCase().replace(/s$/, '');
    const key = normalised === 'electric vehicle' || normalised === 'ev' ? 'electric' : normalised;
    const cars = INVENTORY[key];

    if (!cars) {
      const available = Object.keys(INVENTORY).join(', ');
      return JSON.stringify({
        found: false,
        message: `I don't have inventory data for "${type}". Available categories: ${available}.`,
      });
    }

    const list = cars.map(c =>
      `• ${c.year} ${c.make} ${c.model} — ${c.price} | ${c.status}${c.range ? ` | Range: ${c.range}` : ''}`
    ).join('\n');

    return JSON.stringify({
      found: true,
      count: cars.length,
      type: key,
      vehicles: cars,
      message: `Here are our available ${type}s:\n${list}\n\nWould you like more details on any of these or schedule a test drive?`,
    });
  },
  {
    name: 'check_inventory',
    description: 'Check available vehicle inventory by type. Use when a customer wants to browse or see what vehicles are available.',
    schema: z.object({
      type: z.string().describe('Vehicle type: "SUV", "sedan", "truck", or "electric"'),
    }),
  }
);
