import type { StaticImageData } from 'next/image';

/* GMC Acadia */
import acadia1 from '@/assets/acadia-1.jpg';
import acadia2 from '@/assets/acadia-2.jpg';
import acadia3 from '@/assets/acadia-3.jpg';
import acadia4 from '@/assets/acadia-4.jpg';
import acadia5 from '@/assets/acadia-4.jpg';

/* Dodge Charger */
import charger1 from '@/assets/charger-1.jpg';
import charger2 from '@/assets/charger-2.jpg';
import charger3 from '@/assets/charger-3.jpg';
import charger4 from '@/assets/charger-4.jpg';

/* Buick Encore */
import encore1 from '@/assets/encore-1.jpg';
import encore2 from '@/assets/encore-2.jpg';
import encore3 from '@/assets/encore-3.jpg';
import encore4 from '@/assets/encore-4.jpg';

/* Chevy Malibu */
import malibu1 from '@/assets/malibu-1.jpg';
import malibu2 from '@/assets/malibu-2.jpg';
import malibu3 from '@/assets/malibu-3.jpg';
import malibu4 from '@/assets/malibu-4.jpg';

/* Cadillac XT4 */
import xt41 from '@/assets/xt4-1.jpg';
import xt42 from '@/assets/xt4-2.jpg';
import xt43 from '@/assets/xt4-3.jpg';
import xt44 from '@/assets/xt4-4.jpg';

export interface Car {
  id: string;
  stockNumber: string;
  name: string;
  price: number | 'Call';
  images: StaticImageData[];
}

export const cars: Car[] = [
  {
    id: '1',
    stockNumber: 'P48231',
    name: '2017 GMC ACADIA SLT-1',
    price: 'Call',
    images: [acadia1, acadia2, acadia3, acadia4],
  },

  {
    id: '2',
    stockNumber: 'P48302',
    name: '2020 DODGE CHARGER SXT',
    price: 16690,
    images: [charger1, charger2, charger3, charger4],
  },

  {
    id: '3',
    stockNumber: 'P47918',
    name: '2019 BUICK ENCORE SPORT TOURING',
    price: 'Call',
    images: [encore1, encore2, encore3, encore4],
  },

  {
    id: '4',
    stockNumber: 'P48544',
    name: '2023 CHEVROLET MALIBU 1LT',
    price: 16990,
    images: [malibu1, malibu2, malibu3, malibu4],
  },

  {
    id: '5',
    stockNumber: 'P48617',
    name: '2020 CADILLAC XT4 PREMIUM LUXURY',
    price: 17490,
    images: [xt41, xt42, xt43, xt44],
  },
];