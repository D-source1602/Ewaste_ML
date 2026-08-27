/**
 * EcoCircuit — product content.
 *
 * Every number, label and claim the UI renders lives here so the pages stay
 * presentational and the copy can be reviewed in one place. Figures are the
 * ones the original build shipped with; sources are listed on the About page.
 */

import type {
  BizDevice,
  CompareRow,
  ComponentType,
  Condition,
  DataSource,
  DeviceType,
  EprRow,
  Feature,
  FeedEvent,
  IconName,
  MonthBar,
  MaterialYield,
  Partner,
  Stat,
  Step,
  TrackStep,
} from '../types';

/* ══════════════════════════════════════════════════════════════════════════
   BRAND
   ══════════════════════════════════════════════════════════════════════════ */

export const BRAND = {
  name: 'EcoCircuit',
  tagline: 'Highest-value exit routing for Indian e-waste',
  mission: 'Every device deserves its highest-value exit.',
  year: 2026,
} as const;

/** Words cycled through the hero headline slot. */
export const HERO_WORDS = [
  'highest value',
  'certified hands',
  'the formal chain',
  'full traceability',
] as const;

/* ══════════════════════════════════════════════════════════════════════════
   HOME
   ══════════════════════════════════════════════════════════════════════════ */

export const HOME_STATS: Stat[] = [
  { value: 1397000, label: 'MT e-waste generated in India, FY25' },
  { value: 3, suffix: 'rd', label: 'Largest e-waste producer globally' },
  { value: 30, suffix: '%', label: 'Still handled by the informal sector' },
  { value: 70, suffix: '%', label: 'EPR collection target for FY26' },
];

export const FEATURES: Feature[] = [
  {
    icon: 'camera',
    title: 'Condition detection',
    body: 'One photo is scored against a set of condition prompts. The model returns a label and a confidence figure — never a silent guess.',
    tag: 'CLIP zero-shot classifier',
    ai: true,
  },
  {
    icon: 'coin',
    title: 'Value prediction',
    body: 'Brand, model, age and detected condition feed a regressor trained on resale listings to produce a realistic resale band.',
    tag: 'Random Forest regressor',
    ai: true,
  },
  {
    icon: 'map',
    title: 'Pathway routing',
    body: 'Resell, refurbish or recycle is decided by a published scoring rule over value, condition and residual life. Auditable, not learned.',
    tag: 'Deterministic scoring rule',
    ai: false,
  },
  {
    icon: 'shield',
    title: 'EPR compliance',
    body: 'Every routed device is tagged to its E-Waste Rules 2022 category so bulk consumers can evidence collection against target.',
    tag: 'E-Waste Rules 2022 schedule',
    ai: false,
  },
  {
    icon: 'building',
    title: 'Partner matching',
    body: 'Certified recyclers are ranked on distance, category authorisation, capacity and settlement history. Weights are visible.',
    tag: 'Weighted ranking',
    ai: false,
  },
  {
    icon: 'qr',
    title: 'Track & trace',
    body: 'A QR handoff records custody at pickup and at processing, so the chain from doorstep to dismantler is verifiable end to end.',
    tag: 'Custody ledger',
    ai: false,
  },
  {
    icon: 'lock',
    title: 'Certified data wipe',
    body: 'Every data-bearing device gets a sanitization method mapped to NIST 800-88 and a certificate issued with the payout — so data fear stops blocking reuse.',
    tag: 'NIST SP 800-88 Rev. 2',
    ai: false,
  },
];

export const HOW_STEPS: Step[] = [
  {
    title: 'Describe the device',
    body: 'Pick a category, add brand, model and age, then drop in a single photo. Sixty seconds, no account needed to get a number.',
  },
  {
    title: 'Get a routed valuation',
    body: 'Condition is read from the photo, value is predicted from comparable listings, and the pathway rule picks the highest-value exit.',
  },
  {
    title: 'Hand off and track',
    body: 'Accept a matched certified recycler, scan the QR at pickup, and follow custody through to processing with a downloadable trail.',
  },
];

export const TICKER: string[] = [
  '13.97 lakh MT e-waste, FY25',
  '3rd largest producer globally',
  '322 certified recyclers on record',
  '30% still in the informal sector',
  'EPR target 70% for FY26',
  '60-second device valuation',
];

export const PARTNER_NAMES: string[] = [
  'Attero',
  'Karo Sambhav',
  'Namo eWaste',
  'Cerebra Green',
  'RecycleKaro',
];

export const COMPARISON: CompareRow[] = [
  {
    label: 'Photo-based condition scoring',
    eco: 'Yes',
    attero: 'No',
    karo: 'No',
    recyclekaro: 'No',
  },
  {
    label: 'Value shown before pickup',
    eco: 'Yes',
    attero: 'Quote on request',
    karo: 'No',
    recyclekaro: 'Quote on request',
  },
  {
    label: 'Resell / refurbish / recycle split',
    eco: 'All three',
    attero: 'Recycle',
    karo: 'Recycle',
    recyclekaro: 'Recycle',
  },
  {
    label: 'EPR evidence for bulk consumers',
    eco: 'Per-device',
    attero: 'Per-consignment',
    karo: 'Per-consignment',
    recyclekaro: 'Per-consignment',
  },
  {
    label: 'Custody trail to dismantler',
    eco: 'QR, two checkpoints',
    attero: 'Manifest',
    karo: 'Manifest',
    recyclekaro: 'Manifest',
  },
  {
    label: 'Per-device data-wipe certificate',
    eco: 'Yes, NIST 800-88',
    attero: 'On request',
    karo: 'No',
    recyclekaro: 'On request',
  },
  {
    label: 'Multi-recycler marketplace',
    eco: 'Yes',
    attero: 'Own network',
    karo: 'Own network',
    recyclekaro: 'Own network',
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   SUBMIT
   ══════════════════════════════════════════════════════════════════════════ */

export const SUBMIT_STEPS: string[] = ['Device type', 'Details', 'Photo', 'Analysing'];

export const DEVICE_TYPES: { type: DeviceType; icon: IconName; hint: string }[] = [
  { type: 'Phone', icon: 'phone', hint: 'ITEW2' },
  { type: 'Laptop', icon: 'laptop', hint: 'ITEW1' },
  { type: 'Tablet', icon: 'tablet', hint: 'ITEW2' },
  { type: 'TV', icon: 'tv', hint: 'CEEW1' },
  { type: 'AC', icon: 'ac', hint: 'CEEW2' },
];

/** Maps each device category to its E-Waste Rules 2022 filing code and the
   full label shown on the valuation and custody records. Keyed off the same
   `DeviceType` union the intake flow writes, so a new device type is a compile
   error here until it is classified. */
export const CATEGORY_BY_DEVICE: Record<DeviceType, { code: string; label: string }> = {
  Phone: { code: 'ITEW2', label: 'ITEW2 — small IT & telecom equipment' },
  Laptop: { code: 'ITEW1', label: 'ITEW1 — large IT & telecom equipment' },
  Tablet: { code: 'ITEW2', label: 'ITEW2 — small IT & telecom equipment' },
  TV: { code: 'CEEW1', label: 'CEEW1 — consumer electronics & displays' },
  AC: { code: 'CEEW2', label: 'CEEW2 — large consumer appliances' },
};

/** Brand options per device category, so the dropdown only offers makers who
   actually sell that category. Keyed off `DeviceType`, so adding a device type
   is a compile error here until its brand list is supplied. Each list ends in
   'Other' as the catch-all. Tablet reuses the phone/IT makers. */
export const BRANDS_BY_DEVICE: Record<DeviceType, string[]> = {
  Phone: [
    'Samsung',
    'Apple',
    'OnePlus',
    'Xiaomi',
    'Redmi',
    'Realme',
    'Vivo',
    'Oppo',
    'iQOO',
    'Motorola',
    'Google',
    'Nothing',
    'Poco',
    'Infinix',
    'Tecno',
    'Nokia',
    'Honor',
    'Asus',
    'Other',
  ],
  Laptop: [
    'Dell',
    'HP',
    'Lenovo',
    'Asus',
    'Acer',
    'Apple',
    'MSI',
    'Samsung',
    'Microsoft',
    'LG',
    'Huawei',
    'Gigabyte',
    'Razer',
    'Toshiba',
    'Infinix',
    'Other',
  ],
  Tablet: [
    'Apple',
    'Samsung',
    'Lenovo',
    'Xiaomi',
    'Realme',
    'OnePlus',
    'Huawei',
    'Microsoft',
    'Honor',
    'Acer',
    'Asus',
    'Other',
  ],
  TV: [
    'Samsung',
    'LG',
    'Sony',
    'Xiaomi',
    'OnePlus',
    'TCL',
    'Panasonic',
    'Vu',
    'Hisense',
    'Toshiba',
    'Realme',
    'Acer',
    'Philips',
    'Haier',
    'Thomson',
    'Other',
  ],
  AC: [
    'Voltas',
    'LG',
    'Samsung',
    'Daikin',
    'Blue Star',
    'Hitachi',
    'Panasonic',
    'Carrier',
    'Whirlpool',
    'Godrej',
    'Lloyd',
    'Haier',
    'Mitsubishi Electric',
    'O General',
    'Sanyo',
    'Other',
  ],
};

export const CONDITIONS: Condition[] = [
  'Like-new',
  'Good',
  'Used',
  'Damaged',
  'Broken',
];

/* ── Laptop sub-intake options ─────────────────────────────────────────────
   When the category is Laptop, the seller chooses between offering the whole
   unit or a single salvageable part. These drive the conditional fields in
   step 2 and are typed against the unions in types.ts. */

export const COMPONENT_TYPES: ComponentType[] = ['SSD', 'HDD', 'RAM'];

/** Storage interface options (for SSD / HDD component sales). */
export const STORAGE_TYPES: string[] = [
  'NVMe',
  'SATA',
  'M.2 SATA',
  'mSATA',
  'IDE / PATA',
  'Other',
];

/** RAM generation options (for RAM component sales). */
export const RAM_TYPES: string[] = [
  'DDR5',
  'DDR4',
  'DDR3',
  'DDR2',
  'LPDDR5',
  'LPDDR4',
  'Other',
];

/** Capacity presets shared by storage and memory. */
export const CAPACITIES: string[] = [
  '4 GB',
  '8 GB',
  '16 GB',
  '32 GB',
  '64 GB',
  '128 GB',
  '256 GB',
  '512 GB',
  '1 TB',
  '2 TB',
  'Other',
];

/** Phase labels for the flux progress bar on the analysing step. */
export const ANALYSING_PHASES: string[] = [
  'Reading condition from photo',
  'Running value prediction',
  'Matching certified partners',
];

/* ══════════════════════════════════════════════════════════════════════════
   RESULTS
   ══════════════════════════════════════════════════════════════════════════ */

export const RESULT = {
  deviceId: 'ECO-2026-A7F3',
  device: 'Samsung Galaxy S21',
  category: 'ITEW2 — small IT & telecom equipment',
  condition: 'Good',
  confidence: 89,
  age: '3 years',
  resale: 14200,
  refurbScore: 0.82,
  material: 3400,
  recommended: 'Resell',
  platformFee: 710,
  payout: 13490,
} as const;

export const RESULT_PARTNERS: Partner[] = [
  {
    name: 'Attero Recycling',
    city: 'Noida, UP',
    rating: 4.8,
    note: 'CPCB authorised · ITEW1, ITEW2, CEEW1',
  },
  {
    name: 'Karo Sambhav',
    city: 'New Delhi',
    rating: 4.6,
    note: 'PRO · aggregation across 14 states',
  },
  {
    name: 'Namo eWaste',
    city: 'Mumbai, MH',
    rating: 4.5,
    note: 'CPCB authorised · ITEW2, CEEW2',
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   TRACK
   ══════════════════════════════════════════════════════════════════════════ */

export const TRACK_STEPS: TrackStep[] = [
  {
    title: 'Submitted',
    body: 'Device details and photo received, condition scored.',
    at: 'Aug 22, 10:14 AM',
  },
  {
    title: 'Matched',
    body: 'Attero Recycling accepted the consignment at the quoted band.',
    at: 'Aug 22, 10:15 AM',
  },
  {
    title: 'Picked up',
    body: 'Courier scans the QR at your door to open custody.',
    at: null,
  },
  {
    title: 'Processed',
    body: 'Dismantler confirms intake and issues the recovery record.',
    at: null,
  },
];

/**
 * QR preview bit matrix. Hardcoded on purpose — generating it with
 * `Math.random()` during render would re-roll the code on every paint.
 */
export const QR_MATRIX: number[][] = [
  [1, 0, 1, 1, 0, 1],
  [0, 1, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [0, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 1],
];

/* ══════════════════════════════════════════════════════════════════════════
   IMPACT
   ══════════════════════════════════════════════════════════════════════════ */

export const IMPACT_STATS: Stat[] = [
  { value: 4821, label: 'Devices routed to certified handlers' },
  { value: 31480, suffix: ' kg', label: 'E-waste diverted from the informal chain' },
  { value: 629600, suffix: ' kg', label: 'CO₂e avoided against landfill baseline' },
  { value: 6842000, prefix: '₹', label: 'Value returned to device owners' },
];

export const IMPACT_FEED: FeedEvent[] = [
  { text: 'Laptop routed to refurbish · Pune → Attero Recycling', at: '2 min ago' },
  { text: 'Phone resold · ₹11,900 released to owner', at: '9 min ago' },
  { text: 'AC unit collected · CEEW2 logged against EPR target', at: '24 min ago' },
  { text: 'Bulk consignment of 38 monitors matched · Karo Sambhav', at: '1 hr ago' },
  { text: 'Tablet recycled · 0.41 kg copper recovered', at: '2 hr ago' },
  { text: 'TV picked up · custody opened at doorstep scan', at: '3 hr ago' },
];

export const IMPACT_MONTHS: MonthBar[] = [
  { month: 'Mar', resell: 42, refurbish: 28, recycle: 30 },
  { month: 'Apr', resell: 55, refurbish: 25, recycle: 20 },
  { month: 'May', resell: 48, refurbish: 32, recycle: 20 },
  { month: 'Jun', resell: 60, refurbish: 22, recycle: 18 },
  { month: 'Jul', resell: 71, refurbish: 19, recycle: 10 },
  { month: 'Aug', resell: 63, refurbish: 24, recycle: 13 },
];

/* ── Urban mine ──────────────────────────────────────────────────────────────
   Recoverable-material yields per tonne of end-of-life phones, from published
   material-flow analysis (≈128 kg copper, 3.63 kg silver, 0.347 kg gold and
   0.15 kg palladium per tonne). The point they make: a tonne of phones carries
   far more gold than a tonne of mined ore (~5–20 g), so routed devices are a
   richer "ore" than the ground — the case for recovery over landfill. */

export const URBAN_MINE: MaterialYield[] = [
  { name: 'Copper', symbol: 'Cu', perTonneKg: 128, colour: '#d98a4b', note: 'Wiring, boards and connectors' },
  { name: 'Silver', symbol: 'Ag', perTonneKg: 3.63, colour: '#c8d2d6', note: 'Contacts and solder joints' },
  { name: 'Gold', symbol: 'Au', perTonneKg: 0.347, colour: '#e6c15a', note: 'Bonding wires and plating' },
  { name: 'Palladium', symbol: 'Pd', perTonneKg: 0.15, colour: '#9fb8c9', note: 'Multilayer capacitors' },
];

/** Routed mass the recovery totals are modelled from, in tonnes — the diverted
   mass on the headline stat (31,480 kg). */
export const URBAN_MINE_TONNES = 31.48;

/** Ore grade for context: grams of gold per tonne of typical mined ore. */
export const ORE_GOLD_G_PER_TONNE = { low: 5, high: 20 };

/* ══════════════════════════════════════════════════════════════════════════
   BUSINESS
   ══════════════════════════════════════════════════════════════════════════ */

export const BUSINESS = {
  company: 'TechCorp India Pvt. Ltd.',
  gstin: '07AABCT1234F1Z5',
  seats: 'Bulk consumer · 1,200 employees',
  commission: 8340,
  eprMet: 87,
  materialRecovered: 284,
} as const;

export const BUSINESS_TABS: { id: string; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'epr', label: 'EPR' },
  { id: 'history', label: 'History' },
  { id: 'upload', label: 'Bulk upload' },
];

export const BUSINESS_DEVICES: BizDevice[] = [
  {
    id: 'ECO-2026-B119',
    name: 'Dell Latitude 5420 ×12',
    date: 'Aug 21, 2026',
    value: '₹1,84,000',
    status: 'Processed',
    pathway: 'Refurbish',
  },
  {
    id: 'ECO-2026-B104',
    name: 'HP EliteDisplay E243 ×38',
    date: 'Aug 18, 2026',
    value: '₹92,400',
    status: 'In transit',
    pathway: 'Resell',
  },
  {
    id: 'ECO-2026-A981',
    name: 'Lenovo ThinkCentre M720 ×9',
    date: 'Aug 12, 2026',
    value: '₹41,300',
    status: 'Processed',
    pathway: 'Recycle',
  },
  {
    id: 'ECO-2026-A877',
    name: 'Voltas 1.5T split AC ×4',
    date: 'Aug 04, 2026',
    value: '₹28,600',
    status: 'Processed',
    pathway: 'Recycle',
  },
];

export const EPR_ROWS: EprRow[] = [
  { category: 'IT & telecom, small', code: 'ITEW2', collected: 92, target: 70 },
  { category: 'IT & telecom, large', code: 'ITEW1', collected: 74, target: 70 },
  { category: 'Displays & monitors', code: 'CEEW1', collected: 68, target: 70 },
  { category: 'Air conditioners', code: 'CEEW2', collected: 51, target: 50 },
  { category: 'Large appliances', code: 'LIW', collected: 38, target: 40 },
];

/** Share of routed devices by pathway, in percent. */
export const PATHWAY_SPLIT: { pathway: string; pct: number; colour: string }[] = [
  { pathway: 'Resell', pct: 45, colour: 'var(--leaf)' },
  { pathway: 'Refurbish', pct: 30, colour: 'var(--mint)' },
  { pathway: 'Recycle', pct: 25, colour: 'var(--teal)' },
];

/* ══════════════════════════════════════════════════════════════════════════
   ABOUT
   ══════════════════════════════════════════════════════════════════════════ */

export const PROBLEM_STATS: Stat[] = [
  { value: 1397000, suffix: ' MT', label: 'Generated in FY25 and still climbing' },
  { value: 3, suffix: 'rd', label: 'India’s global rank as a producer' },
  { value: 30, suffix: '%', label: 'Processed outside the formal chain' },
  { value: 322, label: 'Authorised recyclers to route into' },
];

export const AI_YES: string[] = [
  'Condition detection — a CLIP zero-shot classifier scores one photo against condition prompts and returns a confidence figure.',
  'Value prediction — a Random Forest regressor trained on resale listings maps brand, model, age and condition to a resale band.',
];

export const AI_NO: string[] = [
  'Pathway routing — a published scoring rule over value, condition and residual life. Same inputs, same output, every time.',
  'Partner ranking — a weighted sum of distance, category authorisation, capacity and settlement history. No model, no black box.',
];

export const DATA_SOURCES: DataSource[] = [
  {
    name: 'CPCB Annual Report',
    body: 'National generation and collection figures by category, plus the authorised recycler register.',
    meta: 'Central Pollution Control Board · FY25',
  },
  {
    name: 'Global E-waste Monitor',
    body: 'Cross-country generation, per-capita figures and formal collection rates used for benchmarking.',
    meta: 'UNITAR / ITU · 2024 edition',
  },
  {
    name: 'E-Waste (Management) Rules',
    body: 'Category schedule, EPR target trajectory and the producer obligations the compliance view maps to.',
    meta: 'MoEFCC · 2022, as amended',
  },
];

export const TARGET_PARTNERS: { name: string; note: string }[] = [
  { name: 'Attero', note: 'Integrated recycler, Roorkee & Noida — metals recovery' },
  { name: 'Karo Sambhav', note: 'Producer responsibility organisation, pan-India aggregation' },
  { name: 'Namo eWaste', note: 'Authorised dismantler, Faridabad & Mumbai' },
  { name: 'Cerebra Green', note: 'Bengaluru — refurbishment and IT asset disposal' },
];
