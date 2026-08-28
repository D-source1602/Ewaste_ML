/**
 * EcoCircuit — shared types.
 *
 * `erasableSyntaxOnly` is on, so no enums: unions and `const` objects only.
 * Every type here is consumed by at least two modules; anything used once
 * lives beside its component.
 */

/* ── Routing ──────────────────────────────────────────────────────────── */

export type Page =
  | 'login'
  | 'home'
  | 'submit'
  | 'results'
  | 'track'
  | 'impact'
  | 'business'
  | 'about';

/* ── Domain ───────────────────────────────────────────────────────────── */

export type DeviceType = 'Phone' | 'Laptop' | 'Tablet' | 'TV' | 'AC';

export type Condition = 'Like-new' | 'Good' | 'Used' | 'Damaged' | 'Broken';

export type Pathway = 'Resell' | 'Refurbish' | 'Recycle';

/** What the seller is offering when the device is a laptop. */
export type SellMode = 'whole' | 'component';

/** The salvageable part being sold on its own. */
export type ComponentType = 'HDD' | 'SSD' | 'RAM';

/**
 * Laptop-specific intake. Only present when `Submission.device === 'Laptop'`.
 * `sellMode` decides which half of the fields is meaningful: a whole-unit sale
 * carries processor/graphics, a component sale carries the memory/storage spec.
 */
export interface LaptopDetails {
  sellMode: SellMode;
  /** Whole-unit sale. */
  processor?: string;
  graphics?: string;
  /** Component sale. */
  componentType?: ComponentType;
  /** RAM type (DDR4…) or storage interface (NVMe, SATA…). */
  memoryType?: string;
  /** Capacity, e.g. "16 GB" / "512 GB". */
  capacity?: string;
}

/**
 * A completed intake from SubmitPage. Lifted into App state and handed to the
 * Results and Track pages so they describe the device the user actually chose,
 * rather than the static demo record.
 */
export interface Submission {
  device: DeviceType;
  brand: string;
  model: string;
  age: number;
  condition: Condition;
  /** Whether the manufacturer warranty has lapsed. */
  warrantyOver?: boolean;
  /** Present only for laptops — see LaptopDetails. */
  laptop?: LaptopDetails;
}

/* ── Icons ────────────────────────────────────────────────────────────── */

/**
 * The icon vocabulary. `ICON_PATHS` in `data/icons.ts` is typed as
 * `Record<IconName, string>`, so adding a name here without drawing it is a
 * compile error rather than a blank square at runtime.
 */
export type IconName =
  | 'ac'
  | 'arrow'
  | 'building'
  | 'camera'
  | 'chart'
  | 'check'
  | 'clock'
  | 'close'
  | 'coin'
  | 'cpu'
  | 'download'
  | 'external'
  | 'eye'
  | 'eye-off'
  | 'home'
  | 'info'
  | 'laptop'
  | 'leaf'
  | 'lock'
  | 'mail'
  | 'map'
  | 'menu'
  | 'phone'
  | 'plus'
  | 'qr'
  | 'recycle'
  | 'shield'
  | 'sparkle'
  | 'star'
  | 'tablet'
  | 'trending'
  | 'truck'
  | 'tv'
  | 'upload'
  | 'user'
  | 'world'
  | 'zap';

/* ── Content shapes ───────────────────────────────────────────────────── */

export interface Stat {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  /** Decimal places for the count-up. */
  decimals?: number;
}

export interface Feature {
  icon: IconName;
  title: string;
  body: string;
  /** Small technical attribution — the model or rule behind the feature. */
  tag: string;
  /** false → deterministic logic, not machine learning. Drives the honesty chip. */
  ai: boolean;
}

export interface Step {
  title: string;
  body: string;
}

export interface CompareRow {
  label: string;
  eco: string;
  attero: string;
  karo: string;
  recyclekaro: string;
}

export interface Partner {
  name: string;
  city: string;
  rating: number;
  note: string;
}

export interface TrackStep {
  title: string;
  body: string;
  /** Timestamp once reached, null while pending. */
  at: string | null;
}

export interface FeedEvent {
  text: string;
  at: string;
}

export interface MonthBar {
  month: string;
  resell: number;
  refurbish: number;
  recycle: number;
}

/** One recoverable material in the "urban mine" breakdown. Yields are kilograms
   recovered per tonne of end-of-life phones (published material-flow figures). */
export interface MaterialYield {
  name: string;
  /** Element symbol shown in the tile chip (Cu, Ag, Au, Pd). */
  symbol: string;
  /** Kilograms recoverable per tonne of phones. */
  perTonneKg: number;
  /** Bar / chip colour — a realistic metal tone. */
  colour: string;
  /** Where in the device the material sits. */
  note: string;
}

export interface EprRow {
  category: string;
  code: string;
  collected: number;
  target: number;
}

export interface BizDevice {
  id: string;
  name: string;
  date: string;
  value: string;
  status: string;
  pathway: Pathway;
}

export interface DataSource {
  name: string;
  body: string;
  meta: string;
}
