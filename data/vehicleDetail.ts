import type { Vehicle } from '@/types/vehicle';

const BASE_FULL  = 'https://cdn.gma.to/fit-in/720x540/filters:quality(85):no_upscale()/data/nzM/i/rykwa/';
const BASE_THUMB = 'https://cdn.gma.to/fit-in/160x120/filters:quality(70)/data/nzM/i/rykwa/';
const CARD_IMG   = 'https://cdn.gma.to/fit-in/360x270/filters:quality(80):no_upscale()/data/nzM/i/rykwa/6a0742cf278c4_1_qzmjAnOB.jpg';

const filenames = [
  '6a0742cf278c4_1_qzmjAnOB.jpg',
  '6a0742cf27a42_2.jpg',
  '6a0742cf27b6d_3.jpg',
  '6a0742cf27c80_4.jpg',
  '6a0742cf27d8d_5.jpg',
  '6a0742cf27e94_6.jpg',
  '6a0742cf27fc1_7.jpg',
  '6a0742cf280cd_8.jpg',
];

export const kiaSoul2020: Vehicle = {
  id: 'kia-soul-2020-6425',
  title: '2020 Kia Soul',
  trim: 'LX Wagon 4D',
  price: 8799,
  vin: 'KNDJ23AU9L7118674',
  stockNumber: '6425',
  odometer: 133672,
  color: 'Orange',
  type: 'Wagon',
  transmission: 'Automatic, I-VT',
  engine: '4-Cyl, 2.0 Liter',
  drive: 'FWD',
  fuel: 'Gas',
  fuelEconomy: { city: 27, highway: 33 },

  specs: [
    'ABS (4-Wheel)',
    'AM/FM Stereo',
    'Air Conditioning',
    'Backup Camera',
    'Bluetooth Wireless',
    'CD/MP3 (Single Disc)',
    'Dual Air Bags',
    'Electronic Stability Control',
    'F&R Head Curtain Air Bags',
    'Hill Start Assist Control',
    'Keyless Entry',
    'Power Door Locks',
    'Power Steering',
    'Power Windows',
    'Side Air Bags',
    'Steel Wheels',
    'Tilt & Telescoping Wheel',
    'Traction Control',
  ],

  images: filenames.map((filename, i) => ({
    full:  BASE_FULL  + filename,
    thumb: BASE_THUMB + filename,
    alt:   `2020 Kia Soul – photo ${i + 1}`,
  })),

  descriptionSections: [
    {
      level: 'h2',
      heading: '2020 Kia Soul LX — A Practical Urban Companion',
      paragraphs: [
        `Welcome to Empire Auto Sales, where we're proud to present this clean, one-owner
        2020 Kia Soul LX Wagon. With its distinctive boxy silhouette, generous cargo space,
        and class-above interior, the Soul has been one of the best-selling urban crossovers
        in America — and this example in striking <strong>Orange</strong> shows exactly why.
        At just <strong>$8,799</strong>, it represents outstanding value in today's market.`,

        `This Soul carries <strong>133,672 miles</strong> and is priced accordingly to give
        you maximum bang for your budget. A thorough inspection confirms it drives as smooth
        as it looks — brakes are solid, tires have good tread, and the interior is clean
        with no major wear.`,
      ],
    },
    {
      level: 'h2',
      heading: 'Performance & Engine',
      paragraphs: [
        `Under the hood sits Kia's proven <strong>2.0-liter inline-4 engine</strong> paired
        to a smooth <strong>Intelligent Variable Transmission (I-VT)</strong>. This
        combination delivers a responsive, efficient driving experience well-suited to city
        commuting and highway cruising alike. With an EPA-estimated
        <strong>27 MPG city / 33 MPG highway</strong>, fuel costs stay low — a genuine
        advantage when gas prices stay elevated.`,

        `Front-wheel drive (FWD) keeps the handling predictable and maintenance costs
        manageable. Whether navigating downtown Detroit or heading out on I-94, the Soul LX
        offers a composed, confidence-inspiring ride.`,
      ],
    },
    {
      level: 'h2',
      heading: 'Features & Interior',
      paragraphs: [
        `Don't let the "LX" base trim fool you — the 2020 Soul LX ships with a genuinely
        impressive feature set for its price point. You'll enjoy:`,

        `<strong>Technology:</strong> Bluetooth hands-free calling and audio streaming,
        AM/FM/CD audio system, power windows, power door locks, and keyless entry make
        everyday commuting a connected experience.`,

        `<strong>Safety:</strong> Kia equips the Soul LX with 4-wheel ABS, electronic
        stability control, traction control, front and rear side-curtain air bags, dual
        front air bags, side-impact air bags, hill start assist control, and a backup
        camera. These aren't optional extras — they're standard, giving you real peace of
        mind.`,

        `<strong>Comfort:</strong> Air conditioning, tilt-and-telescoping steering wheel,
        and power steering ensure the cabin stays pleasant on even the longest drives. The
        Soul's tall roofline means excellent headroom for all passengers, and the rear seat
        folds flat to open up substantial cargo capacity.`,
      ],
    },
    {
      level: 'h2',
      heading: 'Reliability & Ownership',
      paragraphs: [
        `The 2020 Kia Soul consistently earns strong marks from consumer reliability surveys.
        The I-VT transmission is simpler than a traditional automatic, which translates to
        fewer long-term maintenance concerns. Kia's reputation for build quality has
        improved dramatically over the past decade, and this generation Soul reflects that
        progress with tight panel gaps and a cabin that holds up well over time.`,

        `Routine maintenance items — oil changes, filters, brakes — are inexpensive and
        parts are widely available at any auto parts store or Kia dealer in the metro
        Detroit area.`,
      ],
    },
    {
      level: 'h2',
      heading: 'Why Buy From Empire Auto Sales?',
      paragraphs: [
        `At <strong>Empire Auto Sales</strong> on East 8 Mile, we've been serving Detroit
        and the surrounding communities for years. Here's what sets us apart:`,

        `<strong>No-pressure sales:</strong> Our team is here to answer questions, not push
        you into a decision. Take your time, ask for a test drive, and walk away if it
        isn't right — we'll still be here.`,

        `<strong>Transparent pricing:</strong> The advertised price is the price. No hidden
        fees added at the finance table. We show you every number upfront so there are no
        surprises.`,

        `<strong>Quality inspections:</strong> Every vehicle we put on our lot goes through
        a multi-point inspection before it's listed. If something needs attention, we either
        fix it or disclose it — period.`,

        `<strong>Community roots:</strong> We're a local, independent dealership. When you
        buy from Empire, you're supporting a Detroit business and getting a team that
        genuinely cares about your satisfaction long after you drive off the lot.`,
      ],
    },
    {
      level: 'h2',
      heading: 'Financing',
      paragraphs: [
        `We work with multiple lenders to find you competitive financing regardless of your
        credit history. First-time buyers, recent graduates, past credit challenges — we've
        helped customers in every situation. Down payments start as low as possible, and
        monthly payments can be structured to fit your budget. Use the
        <strong>GET FINANCING</strong> button to submit a quick, no-obligation application
        and get a decision fast.`,

        `Prefer to pay cash or bring your own financing? No problem — we accept all forms of
        payment and can have you in and out in under an hour.`,
      ],
    },
    {
      level: 'h3',
      heading: 'Frequently Asked Questions',
      paragraphs: [],
    },
    {
      level: 'h3',
      heading: 'Q: Is this vehicle still available?',
      paragraphs: [
        `A: Inventory moves quickly at Empire Auto Sales. The best way to confirm
        availability is to call us at <strong>(313) 251-7447</strong> or send us a text
        using the button above. We'll respond immediately during business hours.`,
      ],
    },
    {
      level: 'h3',
      heading: 'Q: Can I take it for a test drive?',
      paragraphs: [
        `A: Absolutely — test drives are always welcome. Just bring a valid driver's license
        and stop by our lot at 2940 East 8 Mile, Detroit, MI 48234. No appointment needed,
        though calling ahead ensures the vehicle is ready and waiting for you.`,
      ],
    },
    {
      level: 'h3',
      heading: 'Q: Do you accept trade-ins?',
      paragraphs: [
        `A: Yes, we accept trade-ins on all makes and models. Our appraisers will evaluate
        your vehicle and give you a fair offer that can be applied directly toward the
        purchase of this Soul — reducing the amount you need to finance.`,
      ],
    },
    {
      level: 'h3',
      heading: 'Q: What is the actual condition of the vehicle?',
      paragraphs: [
        `A: Used vehicles have history and we never claim otherwise. This Soul shows normal
        wear consistent with its mileage. The exterior paint is in good condition with
        minor surface imperfections typical of a vehicle this age. The interior is clean.
        We encourage every buyer to schedule an independent pre-purchase inspection —
        we'll happily accommodate a visit to any licensed mechanic of your choice.`,
      ],
    },
    {
      level: 'h3',
      heading: 'Q: Does it come with a warranty?',
      paragraphs: [
        `A: This vehicle is sold as-is per Michigan law, as is customary for independent
        used car dealers. However, extended service contracts (warranties) are available for
        purchase and can be rolled into your financing. Ask our team for details on coverage
        options and pricing at the time of your visit.`,
      ],
    },
  ],

  similarVehicles: [
    {
      id: 'gmc-terrain-2020-231959',
      year: 2020,
      make: 'GMC',
      model: 'Terrain',
      trim: 'SLE Sport Utility 4D',
      stockNumber: '231959',
      price: 15295,
      image: CARD_IMG,
      imageAlt: '2020 GMC Terrain',
    },
    {
      id: 'chevrolet-traverse-2020-6079',
      year: 2020,
      make: 'Chevrolet',
      model: 'Traverse',
      trim: 'LT Sport Utility 4D',
      stockNumber: '6079',
      price: 17990,
      image: CARD_IMG,
      imageAlt: '2020 Chevrolet Traverse',
    },
    {
      id: 'chevrolet-malibu-2020-6289',
      year: 2020,
      make: 'Chevrolet',
      model: 'Malibu',
      trim: 'LT Sedan 4D',
      stockNumber: '6289',
      price: null,
      image: CARD_IMG,
      imageAlt: '2020 Chevrolet Malibu',
    },
  ],
};
