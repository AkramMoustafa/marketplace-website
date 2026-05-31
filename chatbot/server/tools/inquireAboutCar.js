import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const MOCK_INVENTORY = {
  'toyota camry': {
    make: 'Toyota', model: 'Camry', year: 2024, price: 28995, mileage: 0,
    availability: 'In Stock', color: 'Midnight Black',
    features: ['Apple CarPlay', 'Android Auto', 'Lane Departure Warning', 'Adaptive Cruise Control', 'Heated Front Seats'],
    mpg: '28 city / 39 hwy', engine: '2.5L 4-Cylinder', transmission: 'Automatic',
  },
  'honda civic': {
    make: 'Honda', model: 'Civic', year: 2024, price: 24500, mileage: 0,
    availability: 'In Stock', color: 'Sonic Gray Pearl',
    features: ['Honda Sensing', 'Wireless CarPlay', 'Sunroof', 'Blind Spot Monitoring', 'Heated Seats'],
    mpg: '31 city / 40 hwy', engine: '1.5L Turbo 4-Cylinder', transmission: 'CVT',
  },
  'ford f-150': {
    make: 'Ford', model: 'F-150', year: 2024, price: 42500, mileage: 0,
    availability: 'In Stock', color: 'Atlas Blue',
    features: ['Pro Power Onboard', 'SYNC 4A', '360° Camera', 'Trailer Backup Assist', 'Remote Start'],
    mpg: '20 city / 26 hwy', engine: '3.5L EcoBoost V6', transmission: '10-Speed Automatic',
  },
  'tesla model 3': {
    make: 'Tesla', model: 'Model 3', year: 2024, price: 40240, mileage: 0,
    availability: 'Order Available', color: 'Pearl White',
    features: ['Autopilot', '15" Touchscreen', 'Over-the-Air Updates', 'Full Self-Driving Ready', 'Premium Audio'],
    range: '358 miles', engine: 'Dual Motor Electric', transmission: 'Single-Speed',
  },
  'bmw 3 series': {
    make: 'BMW', model: '3 Series', year: 2024, price: 46900, mileage: 0,
    availability: 'In Stock', color: 'Alpine White',
    features: ['iDrive 8', 'Gesture Control', 'Harman Kardon Audio', 'Parking Assistant', 'Head-Up Display'],
    mpg: '26 city / 36 hwy', engine: '2.0L TwinPower Turbo', transmission: '8-Speed Steptronic',
  },
};

export const inquireAboutCarTool = tool(
  async ({ make, model, year }) => {
    const key = `${make} ${model}`.toLowerCase();
    const car = MOCK_INVENTORY[key];

    if (!car) {
      return JSON.stringify({
        found: false,
        message: `We don't currently have detailed info on a ${year ?? ''} ${make} ${model} in our system, but we may be able to source one. Would you like me to connect you with our team?`,
      });
    }

    const priceFormatted = `$${car.price.toLocaleString()}`;
    return JSON.stringify({
      found: true,
      ...car,
      price: priceFormatted,
      message: `Here's the info on the ${car.year} ${car.make} ${car.model}: Price: ${priceFormatted} | Status: ${car.availability} | Engine: ${car.engine} | Transmission: ${car.transmission} | Features: ${car.features.join(', ')}`,
    });
  },
  {
    name: 'inquire_about_car',
    description: 'Get details about a specific car including price, mileage, availability, and features.',
    schema: z.object({
      make: z.string().describe('Car manufacturer (e.g. Toyota, Honda, Ford)'),
      model: z.string().describe('Car model (e.g. Camry, Civic, F-150)'),
      year: z.number().optional().describe('Model year (e.g. 2024)'),
    }),
  }
);
